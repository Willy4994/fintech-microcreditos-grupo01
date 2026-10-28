import type { PoolClient } from "pg";

import { pool } from "../persistencia/conexion.js";
import { verificarIntegridad } from "./verificarIntegridad.js";
import { validarEventos } from "./validarEventos.js";
import { validarReferencias } from "./validarReferencias.js";
import { leerDatosCanonicos } from "./leerDatosCanonicos.js";

type Evento = {
  seq: number;
  tipo: "CLIENTE" | "DESEMBOLSO" | "PAGO";
  [campo: string]: unknown;
};

function texto(evento: Evento, campo: string): string {
  const valor = evento[campo];

  if (typeof valor !== "string") {
    throw new Error(`Evento ${evento.seq}: campo ${campo} inválido.`);
  }

  return valor;
}

function entero(evento: Evento, campo: string): number {
  const valor = evento[campo];

  if (typeof valor !== "number" || !Number.isSafeInteger(valor)) {
    throw new Error(`Evento ${evento.seq}: campo ${campo} inválido.`);
  }

  return valor;
}

function booleano(evento: Evento, campo: string): boolean {
  const valor = evento[campo];

  if (typeof valor !== "boolean") {
    throw new Error(`Evento ${evento.seq}: campo ${campo} inválido.`);
  }

  return valor;
}

async function insertarPoliticas(
  cliente: PoolClient,
  politicas: Record<string, unknown>
): Promise<void> {
  const version = politicas.version;
  const moneda = politicas.moneda;
  const baseConteo = politicas.base_conteo;

  await cliente.query(
    `INSERT INTO configuracion_financiera
       (version, moneda, base_conteo, parametros)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [
      version,
      moneda,
      baseConteo,
      JSON.stringify(politicas),
    ]
  );

  const catalogo = politicas.politicas_mora as Record<
    string,
    Record<string, unknown>
  >;

  for (const [idPolitica, politica] of Object.entries(catalogo)) {
    const vigencia = politica.vigencia_otorgamiento as {
      desde?: string;
      hasta?: string;
    };

    await cliente.query(
      `INSERT INTO politicas_mora
         (id_politica, nombre, tipo, vigencia_desde,
          vigencia_hasta, configuracion)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        idPolitica,
        politica.nombre,
        politica.tipo,
        vigencia.desde ?? null,
        vigencia.hasta ?? null,
        JSON.stringify(politica),
      ]
    );
  }
}

async function seleccionarPolitica(
  cliente: PoolClient,
  fecha: string
): Promise<string> {
  const resultado = await cliente.query<{ id_politica: string }>(
    `SELECT id_politica
       FROM politicas_mora
      WHERE (vigencia_desde IS NULL OR vigencia_desde <= $1::date)
        AND (vigencia_hasta IS NULL OR vigencia_hasta >= $1::date)`,
    [fecha]
  );

  if (resultado.rows.length !== 1) {
    throw new Error(
      `Se esperaba una política de mora para ${fecha}; ` +
      `se encontraron ${resultado.rows.length}.`
    );
  }

  return resultado.rows[0]!.id_politica;
}

export async function cargarDatosCanonicos(): Promise<void> {
  console.log("CRÉDITO VECINO - CARGA CANÓNICA");
  console.log("--------------------------------");

  // Validaciones previas a cualquier modificación.
  const integridad = await verificarIntegridad();
  await validarEventos();
  await validarReferencias();

  const datos = await leerDatosCanonicos();

  console.log("SHA-256: VERIFICADO");
  console.log("Eventos validados:", datos.eventos.length);

  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    // Evitar cargas simultáneas del mismo proceso.
    await cliente.query(
      "SELECT pg_advisory_xact_lock($1)",
      [370037]
    );

    const cargaExistente = await cliente.query(
      `SELECT id_carga, sha256_calculado
         FROM cargas_canonicas
        LIMIT 1`
    );

    if (cargaExistente.rows.length > 0) {
      const huellaAnterior =
        cargaExistente.rows[0].sha256_calculado;

      if (huellaAnterior !== integridad.sha256Calculado) {
        throw new Error(
          "Ya existe una carga con una huella SHA-256 diferente."
        );
      }

      await cliente.query("COMMIT");

      console.log("La carga canónica ya existe.");
      console.log("No se duplicaron registros.");
      return;
    }

    // Registrar la carga.
    const carga = await cliente.query<{ id_carga: string }>(
      `INSERT INTO cargas_canonicas
         (nombre_archivo, sha256_esperado,
          sha256_calculado, verificado)
       VALUES ($1, $2, $3, $4)
       RETURNING id_carga`,
      [
        integridad.archivo,
        integridad.sha256Esperado,
        integridad.sha256Calculado,
        integridad.verificado,
      ]
    );

    const idCarga = carga.rows[0]!.id_carga;

    // Conservar todos los eventos originales.
    for (const evento of datos.eventos) {
      await cliente.query(
        `INSERT INTO eventos_canonicos
           (seq, tipo, datos, id_carga)
         VALUES ($1, $2, $3::jsonb, $4)`,
        [
          evento.seq,
          evento.tipo,
          JSON.stringify(evento),
          idCarga,
        ]
      );
    }

    // Cargar políticas y configuración financiera.
    await insertarPoliticas(
      cliente,
      datos.politicas as Record<string, unknown>
    );

    // Cargar asesores.
    for (const asesor of datos.asesores) {
      await cliente.query(
        `INSERT INTO asesores
           (id_asesor, nombre_completo)
         VALUES ($1, $2)`,
        [asesor.id_asesor, asesor.nombre_completo]
      );
    }

    // Reproducir los eventos en orden.
    let clientesInsertados = 0;
    let creditosInsertados = 0;
    let pagosInsertados = 0;
    let pagosDuplicados = 0;

    for (const evento of datos.eventos as Evento[]) {
      switch (evento.tipo) {
        case "CLIENTE": {
          await cliente.query(
            `INSERT INTO clientes
               (id_cliente, nombre_completo, dpi,
                telefono, municipio, fecha_alta)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              texto(evento, "id_cliente"),
              texto(evento, "nombre_completo"),
              texto(evento, "dpi"),
              texto(evento, "telefono"),
              texto(evento, "municipio"),
              texto(evento, "fecha_alta"),
            ]
          );

          clientesInsertados++;
          break;
        }

        case "DESEMBOLSO": {
          const fecha = texto(evento, "fecha");
          const idPolitica = await seleccionarPolitica(
            cliente,
            fecha
          );

          await cliente.query(
            `INSERT INTO creditos
               (id_credito, id_cliente, id_asesor,
                id_politica, fecha_desembolso,
                capital_centavos, plazo_meses,
                tna_bps, reestructurado)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              texto(evento, "id_credito"),
              texto(evento, "id_cliente"),
              texto(evento, "id_asesor"),
              idPolitica,
              fecha,
              entero(evento, "capital_centavos"),
              entero(evento, "plazo_meses"),
              entero(evento, "tna_bps"),
              booleano(evento, "reestructurado"),
            ]
          );

          creditosInsertados++;
          break;
        }

        case "PAGO": {
          const resultado = await cliente.query(
            `INSERT INTO pagos
               (clave_idempotencia, id_credito,
                fecha, monto_centavos, canal, seq_evento)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (clave_idempotencia)
             DO NOTHING
             RETURNING id_pago`,
            [
              texto(evento, "clave_idempotencia"),
              texto(evento, "id_credito"),
              texto(evento, "fecha"),
              entero(evento, "monto_centavos"),
              texto(evento, "canal"),
              evento.seq,
            ]
          );

          if (resultado.rowCount === 1) {
            pagosInsertados++;
          } else {
            pagosDuplicados++;
          }

          break;
        }
      }
    }

    // Comprobar los resultados antes de confirmar.
    if (
      clientesInsertados !== 60 ||
      creditosInsertados !== 75 ||
      pagosInsertados !== 226 ||
      pagosDuplicados !== 2
    ) {
      throw new Error(
        "Las cantidades insertadas no coinciden con el contrato canónico."
      );
    }

    await cliente.query("COMMIT");

    console.log("Carga completada correctamente.");
    console.log("Clientes:", clientesInsertados);
    console.log("Créditos:", creditosInsertados);
    console.log("Pagos únicos:", pagosInsertados);
    console.log("Pagos duplicados ignorados:", pagosDuplicados);
    console.log("Eventos originales conservados:", datos.eventos.length);
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}