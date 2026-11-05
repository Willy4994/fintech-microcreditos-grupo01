import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pool } from "../../infraestructura/persistencia/conexion.js";
import { RepositorioCarteraPg } from "../../infraestructura/persistencia/RepositorioCarteraPg.js";
import { reconstruir, cierre, simular } from "./MotorCartera.js";
import { ErrorAplicacion, exigir, fechaSchema, idSchema } from "../errores.js";
export const propuestaSchema = z
  .object({
    id_credito: idSchema,
    cuota: z.number().int().positive(),
    fecha: fechaSchema,
    monto_centavos: z.number().int().positive().safe(),
    clave_idempotencia: idSchema,
  })
  .strict();
export type PropuestaPago = z.infer<typeof propuestaSchema>;
export const originacionSchema = z
  .object({
    cliente: z
      .object({
        id_cliente: idSchema,
        nombre_completo: z.string().trim().min(3).max(200),
        dpi: idSchema,
        telefono: z.string().max(30).default(""),
        municipio: z.string().min(1).max(100),
      })
      .strict(),
    id_credito: idSchema,
    id_asesor: idSchema,
    fecha: fechaSchema,
    capital_centavos: z.number().int().min(100000).max(2500000),
    plazo_meses: z.number().int().min(3).max(24),
    tna_bps: z.number().int().min(1).max(10000),
  })
  .strict();
async function validarPago(p: PropuestaPago, repo: RepositorioCarteraPg) {
  const estado = reconstruir(await repo.leer(), p.id_credito, p.fecha);
  if (estado.estado === "INCOBRABLE")
    throw new ErrorAplicacion(
      "CREDITO_INCOBRABLE",
      "El crédito es incobrable",
      409,
    );
  const cuota = exigir(
    estado.cuotas.find((c) => c.numero === p.cuota),
    "Cuota inexistente",
  );
  if (cuota.pagada)
    throw new ErrorAplicacion("CUOTA_PAGADA", "La cuota ya está pagada", 409);
  if (cuota.fecha_vencimiento > p.fecha)
    throw new ErrorAplicacion(
      "CUOTA_NO_EXIGIBLE",
      "La cuota aún no vence",
      409,
    );
  const primera = estado.cuotas.find(
    (c) => !c.pagada && c.fecha_vencimiento <= p.fecha,
  );
  if (primera?.numero !== p.cuota)
    throw new ErrorAplicacion(
      "ORDEN_CUOTAS",
      "Debe pagar primero la cuota pendiente más antigua",
      409,
      { cuota: primera?.numero },
    );
  if (cuota.total_exigible_centavos !== p.monto_centavos)
    throw new ErrorAplicacion(
      "MONTO_NO_EXACTO",
      "El monto debe coincidir con la deuda exacta de la cuota",
      409,
      { monto_correcto_centavos: cuota.total_exigible_centavos, cuota },
    );
  return cuota;
}
export class OperacionesPg {
  async proponer(entrada: unknown) {
    const p = propuestaSchema.parse(entrada);
    const existente = await pool.query(
      "SELECT * FROM pagos WHERE clave_idempotencia=$1",
      [p.clave_idempotencia],
    );
    if (existente.rows[0]) {
      const anterior = existente.rows[0] as {
        id_credito: string;
        fecha: Date;
        monto_centavos: string;
      };
      if (
        anterior.id_credito !== p.id_credito ||
        anterior.fecha.toISOString().slice(0, 10) !== p.fecha ||
        Number(anterior.monto_centavos) !== p.monto_centavos
      )
        throw new ErrorAplicacion(
          "CONFLICTO_IDEMPOTENCIA",
          "Clave utilizada con otros parámetros",
          409,
        );
      return {
        estado: "YA_REGISTRADO",
        duplicado: true,
        clave_idempotencia: p.clave_idempotencia,
      };
    }
    const desglose = await validarPago(p, new RepositorioCarteraPg());
    const id = randomUUID();
    await pool.query(
      `INSERT INTO solicitudes_aprobacion_mcp(id,operacion,parametros,motivo) VALUES($1,'REGISTRAR_PAGO',$2::jsonb,'Confirmación humana requerida')`,
      [id, JSON.stringify(p)],
    );
    return {
      id,
      estado: "PENDIENTE",
      parametros: p,
      desglose,
      expira_en_minutos: 15,
    };
  }
  // Solo se invoca desde el adaptador humano; NO se registra como herramienta MCP.
  async decidir(id: string, aprobar: boolean, actor: string) {
    idSchema.parse(id);
    idSchema.parse(actor);
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      // Serializa mutaciones para que la lectura del estado y la aplicación sean atómicas.
      await db.query("SELECT pg_advisory_xact_lock(370038)");
      const r = await db.query(
        "SELECT *,expira_en>now() vigente FROM solicitudes_aprobacion_mcp WHERE id=$1 FOR UPDATE",
        [id],
      );
      const s = exigir(
        r.rows[0] as
          | {
              estado: string;
              vigente: boolean;
              parametros: unknown;
              resultado: unknown;
            }
          | undefined,
        "Aprobación inexistente",
      );
      if (s.estado !== "PENDIENTE") {
        await db.query("COMMIT");
        return { estado: s.estado, resultado: s.resultado };
      }
      if (!s.vigente)
        throw new ErrorAplicacion(
          "APROBACION_EXPIRADA",
          "Solicite una propuesta nueva",
          409,
        );
      const p = propuestaSchema.parse(s.parametros);
      let resultado: unknown = { registrado: false };
      if (aprobar) {
        const previo = await db.query(
          "SELECT id_credito,monto_centavos,to_char(fecha,'YYYY-MM-DD') fecha FROM pagos WHERE clave_idempotencia=$1",
          [p.clave_idempotencia],
        );
        if (previo.rows[0]) {
          const v = previo.rows[0] as {
            id_credito: string;
            monto_centavos: string;
            fecha: string;
          };
          if (
            v.id_credito !== p.id_credito ||
            Number(v.monto_centavos) !== p.monto_centavos ||
            v.fecha !== p.fecha
          )
            throw new ErrorAplicacion(
              "CONFLICTO_IDEMPOTENCIA",
              "Clave utilizada con otros parámetros",
              409,
            );
          resultado = { registrado: true, duplicado: true };
        } else {
          const posterior = await db.query(
            "SELECT 1 FROM pagos WHERE id_credito=$1 AND fecha>$2::date LIMIT 1",
            [p.id_credito, p.fecha],
          );
          if (posterior.rowCount)
            throw new ErrorAplicacion(
              "PAGO_RETROACTIVO",
              "No se permiten pagos anteriores a otros ya registrados",
              409,
            );
          const cerrado = await db.query(
            "SELECT 1 FROM cierres WHERE hasta >= $1::date LIMIT 1",
            [p.fecha],
          );
          if (cerrado.rowCount)
            throw new ErrorAplicacion(
              "PERIODO_CERRADO",
              "El período está cerrado",
              409,
            );
          const desglose = await validarPago(p, new RepositorioCarteraPg(db));
          await db.query(
            "INSERT INTO pagos(clave_idempotencia,id_credito,fecha,monto_centavos,canal,numero_cuota) VALUES($1,$2,$3,$4,'asistente',$5)",
            [
              p.clave_idempotencia,
              p.id_credito,
              p.fecha,
              p.monto_centavos,
              p.cuota,
            ],
          );
          resultado = { registrado: true, duplicado: false, desglose };
        }
      }
      const estado = aprobar ? "APROBADA" : "RECHAZADA";
      await db.query(
        "UPDATE solicitudes_aprobacion_mcp SET estado=$2,autorizado_por=$3,fecha_decision=now(),resultado=$4::jsonb WHERE id=$1",
        [id, estado, actor, JSON.stringify(resultado)],
      );
      await db.query(
        "INSERT INTO auditoria_aprobaciones_mcp(id_solicitud,accion,responsable) VALUES($1,$2,$3)",
        [id, estado, actor],
      );
      await db.query(
        "INSERT INTO auditoria_operaciones(operacion,recurso,actor,datos) VALUES($1,$2,$3,$4::jsonb)",
        ["DECIDIR_PAGO", id, actor, JSON.stringify({ estado, resultado })],
      );
      await db.query("COMMIT");
      return { estado, resultado };
    } catch (e) {
      await db.query("ROLLBACK");
      throw e;
    } finally {
      db.release();
    }
  }
  async originar(entrada: unknown, actor: string) {
    const p = originacionSchema.parse(entrada);
    const plan = simular(p.capital_centavos, p.tna_bps, p.plazo_meses, p.fecha);
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      await db.query("SELECT pg_advisory_xact_lock(370038)");
      if (
        (
          await db.query(
            "SELECT 1 FROM cierres WHERE hasta >= $1::date LIMIT 1",
            [p.fecha],
          )
        ).rowCount
      )
        throw new ErrorAplicacion(
          "PERIODO_CERRADO",
          "El período está cerrado",
          409,
        );
      const politica = await db.query(
        `SELECT id_politica FROM politicas_mora WHERE (vigencia_desde IS NULL OR vigencia_desde<=$1::date) AND (vigencia_hasta IS NULL OR vigencia_hasta>=$1::date)`,
        [p.fecha],
      );
      if (politica.rows.length !== 1)
        throw new ErrorAplicacion(
          "POLITICA_INVALIDA",
          "No existe una política única para la fecha",
          409,
        );
      await db.query(
        "INSERT INTO clientes(id_cliente,nombre_completo,dpi,telefono,municipio,fecha_alta) VALUES($1,$2,$3,$4,$5,$6)",
        [
          p.cliente.id_cliente,
          p.cliente.nombre_completo,
          p.cliente.dpi,
          p.cliente.telefono,
          p.cliente.municipio,
          p.fecha,
        ],
      );
      await db.query(
        "INSERT INTO creditos(id_credito,id_cliente,id_asesor,id_politica,fecha_desembolso,capital_centavos,plazo_meses,tna_bps) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          p.id_credito,
          p.cliente.id_cliente,
          p.id_asesor,
          politica.rows[0].id_politica,
          p.fecha,
          p.capital_centavos,
          p.plazo_meses,
          p.tna_bps,
        ],
      );
      await db.query(
        "INSERT INTO auditoria_operaciones(operacion,recurso,actor,datos) VALUES('ORIGINAR',$1,$2,$3::jsonb)",
        [
          p.id_credito,
          actor,
          JSON.stringify({
            capital_centavos: p.capital_centavos,
            fecha: p.fecha,
          }),
        ],
      );
      await db.query("COMMIT");
      return { id_credito: p.id_credito, estado: "VIGENTE", plan };
    } catch (e) {
      await db.query("ROLLBACK");
      throw e;
    } finally {
      db.release();
    }
  }
  async generarCierre(desde: string, hasta: string, actor: string) {
    fechaSchema.parse(desde);
    fechaSchema.parse(hasta);
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      await db.query("SELECT pg_advisory_xact_lock(370038)");
      const anterior = await db.query(
        "SELECT resultado FROM cierres WHERE desde=$1 AND hasta=$2",
        [desde, hasta],
      );
      if (anterior.rows[0]) {
        await db.query("COMMIT");
        return anterior.rows[0].resultado as unknown;
      }
      const resultado = cierre(
        await new RepositorioCarteraPg(db).leer(),
        desde,
        hasta,
      );
      await db.query(
        "INSERT INTO cierres(desde,hasta,resultado) VALUES($1,$2,$3::jsonb)",
        [desde, hasta, JSON.stringify(resultado)],
      );
      await db.query(
        "INSERT INTO auditoria_operaciones(operacion,recurso,actor,datos) VALUES('CIERRE',$1,$2,$3::jsonb)",
        [`${desde}/${hasta}`, actor, JSON.stringify(resultado)],
      );
      await db.query("COMMIT");
      return resultado;
    } catch (e) {
      await db.query("ROLLBACK");
      throw e;
    } finally {
      db.release();
    }
  }
}
