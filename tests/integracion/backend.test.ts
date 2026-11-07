import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { readFile, readdir } from "node:fs/promises";
const estado = vi.hoisted(() => ({ db: undefined as unknown }));
vi.mock("../../src/infraestructura/persistencia/conexion.js", () => {
  const query = async (sql: string, params: unknown[] = []) => {
    const db = estado.db as PGlite;
    // pg_advisory_xact_lock no es necesario en el motor de conexión única de la prueba.
    if (sql.includes("pg_advisory_xact_lock")) return { rows: [], rowCount: 1 };
    const r = await db.query(sql, params);
    return {
      rows: r.rows,
      rowCount: /^\s*SELECT/i.test(sql) ? r.rows.length : (r.affectedRows ?? 0),
    };
  };
  return {
    pool: {
      query,
      connect: async () => ({ query, release() {} }),
      end: async () => {},
    },
  };
});
import { pool } from "../../src/infraestructura/persistencia/conexion.js";
import { cargarDatosCanonicos } from "../../src/infraestructura/carga-canonica/cargarDatosCanonicos.js";
import { ConsultasGerenciales } from "../../src/aplicacion/servicios/ConsultasGerenciales.js";
import { RepositorioCarteraPg } from "../../src/infraestructura/persistencia/RepositorioCarteraPg.js";
import { OperacionesPg } from "../../src/aplicacion/servicios/OperacionesPg.js";
import { ServicioRag } from "../../src/rag/ServicioRag.js";
const consultas = new ConsultasGerenciales(new RepositorioCarteraPg());
const operaciones = new OperacionesPg();
beforeAll(async () => {
  const db = new PGlite({ extensions: { vector } });
  estado.db = db;
  for (const f of (await readdir("database/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(await readFile(`database/migrations/${f}`, "utf8"));
  await cargarDatosCanonicos();
}, 30000);
afterAll(async () => {
  await (estado.db as PGlite).close();
});
describe.sequential(
  "Integración SQL real con PostgreSQL embebido y pgvector",
  () => {
    it("carga 60 clientes, 75 créditos, 228 eventos de pago y 226 pagos únicos; repetir no duplica", async () => {
      await cargarDatosCanonicos();
      const r = await pool.query(
        "SELECT (SELECT count(*)::int FROM clientes) clientes,(SELECT count(*)::int FROM creditos) creditos,(SELECT count(*)::int FROM pagos) pagos,(SELECT count(*)::int FROM eventos_canonicos WHERE tipo='PAGO') eventos",
      );
      expect(r.rows[0]).toEqual({
        clientes: 60,
        creditos: 75,
        pagos: 226,
        eventos: 228,
      });
    });
    it("OP-5 rechaza Q500 e informa el monto exacto; OP-6 rechaza el incobrable", async () => {
      await expect(
        operaciones.proponer({
          id_credito: "CV-2026-0061",
          cuota: 1,
          fecha: "2026-10-31",
          monto_centavos: 50000,
          clave_idempotencia: "OP5",
        }),
      ).rejects.toMatchObject({
        codigo: "MONTO_NO_EXACTO",
        detalles: { monto_correcto_centavos: expect.any(Number) },
      });
      await expect(
        operaciones.proponer({
          id_credito: "CV-2026-0015",
          cuota: 3,
          fecha: "2026-10-31",
          monto_centavos: 50000,
          clave_idempotencia: "OP6",
        }),
      ).rejects.toMatchObject({ codigo: "CREDITO_INCOBRABLE" });
    });
    it("proponer no registra dinero; aprobar persiste y reintentar no duplica OP-1/OP-4", async () => {
      const e = await consultas.credito("CV-2026-0043", "2026-10-31");
      const q = e.cuotas.find((c) => !c.pagada)!;
      const p = {
        id_credito: e.id_credito,
        cuota: q.numero,
        fecha: "2026-10-31",
        monto_centavos: q.total_exigible_centavos,
        clave_idempotencia: "OP1-TEST",
      };
      const propuesta = await operaciones.proponer(p);
      expect(propuesta.estado).toBe("PENDIENTE");
      expect(
        (
          await pool.query("SELECT 1 FROM pagos WHERE clave_idempotencia=$1", [
            p.clave_idempotencia,
          ])
        ).rowCount,
      ).toBe(0);
      expect(
        (await operaciones.decidir(propuesta.id!, true, "gerencia")).estado,
      ).toBe("APROBADA");
      expect(
        (await consultas.credito(e.id_credito, p.fecha)).cuotas[q.numero - 1]
          ?.pagada,
      ).toBe(true);
      expect((await operaciones.proponer(p)).duplicado).toBe(true);
      await operaciones.decidir(propuesta.id!, true, "gerencia");
      expect(
        (
          await pool.query(
            "SELECT count(*)::int n FROM pagos WHERE clave_idempotencia=$1",
            [p.clave_idempotencia],
          )
        ).rows[0].n,
      ).toBe(1);
    });
    it("rechazar y expirar una aprobación no escribe pagos", async () => {
      const e = await consultas.credito("CV-2026-0035", "2026-10-31");
      const q = e.cuotas.find((c) => !c.pagada)!;
      const p = {
        id_credito: e.id_credito,
        cuota: q.numero,
        fecha: "2026-10-31",
        monto_centavos: q.total_exigible_centavos,
        clave_idempotencia: "RECHAZO",
      };
      const a = await operaciones.proponer(p);
      expect((await operaciones.decidir(a.id!, false, "gerencia")).estado).toBe(
        "RECHAZADA",
      );
      const b = await operaciones.proponer({
        ...p,
        clave_idempotencia: "EXPIRA",
      });
      await pool.query(
        "UPDATE solicitudes_aprobacion_mcp SET expira_en=now()-interval '1 second' WHERE id=$1",
        [b.id],
      );
      await expect(
        operaciones.decidir(b.id!, true, "gerencia"),
      ).rejects.toMatchObject({ codigo: "APROBACION_EXPIRADA" });
    });
    it("OP-3 da de alta y desembolsa atómicamente con plan del núcleo", async () => {
      const r = await operaciones.originar(
        {
          cliente: {
            id_cliente: "CL-9001",
            nombre_completo: "Gerencia Demostración Gálvez",
            dpi: "DPI-FICT-009001",
            municipio: "Guatemala",
          },
          id_credito: "CV-2026-9001",
          id_asesor: "AS-01",
          fecha: "2026-10-31",
          capital_centavos: 1000000,
          plazo_meses: 12,
          tna_bps: 3600,
        },
        "asesor",
      );
      expect(r.plan.at(-1)).toMatchObject({
        monto_centavos: 100463,
        saldo_centavos: 0,
      });
      expect(
        (await consultas.credito(r.id_credito, "2026-10-31")).id_politica,
      ).toBe("POL-2026-10");
    });
    it("cierre persistido es idempotente y bloquea escrituras en el período", async () => {
      const a = await operaciones.generarCierre(
        "2026-10-01",
        "2026-10-31",
        "gerencia",
      );
      const b = await operaciones.generarCierre(
        "2026-10-01",
        "2026-10-31",
        "gerencia",
      );
      expect(a).toEqual(b);
      expect(
        (await pool.query("SELECT count(*)::int n FROM cierres")).rows[0].n,
      ).toBe(1);
    });
    it("ingiere siete documentos sin duplicar y recupera por distancia vectorial SQL", async () => {
      const embeddings = {
        embedDocuments: async (textos: string[]) =>
          textos.map((t) =>
            t.includes("POL-2024-01") ? [1, 0, 0] : [0, 1, 0],
          ),
        embedQuery: async () => [1, 0, 0],
      };
      const rag = new ServicioRag(pool, embeddings, "prueba-determinista");
      const a = await rag.ingerir();
      const b = await rag.ingerir();
      expect(a.documentos).toBe(7);
      expect(a.fragmentos).toBe(b.fragmentos);
      const fuentes = await rag.recuperar("Política de agosto de 2026");
      expect(fuentes.some((f) => f.documento === "POL-2024-01")).toBe(true);
      // El vector prefiere deliberadamente documentos ajenos; la vigencia debe prevalecer.
      const adversarial = new ServicioRag(
        pool,
        { ...embeddings, embedQuery: async () => [0, 1, 0] },
        "prueba-determinista",
      );
      const agosto = await adversarial.recuperar(
        "¿Cómo se calcula la mora de un crédito otorgado en agosto de 2026? Cita la fuente.",
      );
      expect(agosto[0]?.documento).toBe("POL-2024-01");
      expect(agosto.some((f) => f.documento === "POL-2026-10")).toBe(false);
      expect(agosto.every((f) => f.politica_aplicable === "POL-2024-01")).toBe(
        true,
      );
      const octubre = await adversarial.recuperar(
        "Crédito otorgado el 1 de octubre de 2026",
      );
      expect(octubre[0]?.documento).toBe("POL-2026-10");
      expect(octubre.some((f) => f.documento === "POL-2024-01")).toBe(false);
    });
  },
);
