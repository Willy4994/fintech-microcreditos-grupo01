import { describe, it, expect, vi } from "vitest";
import { crearCatalogo } from "../src/infraestructura/mcp/catalogo.js";
import { ConsultasGerenciales } from "../src/aplicacion/servicios/ConsultasGerenciales.js";
import { OperacionesPg } from "../src/aplicacion/servicios/OperacionesPg.js";
import { ServicioRag } from "../src/rag/ServicioRag.js";
import { leerDatosCanonicos } from "../src/infraestructura/carga-canonica/leerDatosCanonicos.js";
import type { DatosCartera } from "../src/aplicacion/puertos/DatosCartera.js";
async function datos(): Promise<DatosCartera> {
  const d = await leerDatosCanonicos();
  return {
    creditos: d.eventos
      .filter((e) => e.tipo === "DESEMBOLSO")
      .map((e) => ({
        id_credito: String(e.id_credito),
        id_cliente: String(e.id_cliente),
        id_asesor: String(e.id_asesor),
        id_politica:
          String(e.fecha) < "2026-10-01" ? "POL-2024-01" : "POL-2026-10",
        fecha_desembolso: String(e.fecha),
        capital_centavos: Number(e.capital_centavos),
        plazo_meses: Number(e.plazo_meses),
        tna_bps: Number(e.tna_bps),
        reestructurado: Boolean(e.reestructurado),
      })),
    pagos: d.eventos
      .filter((e) => e.tipo === "PAGO")
      .map((e) => ({
        id_pago: String(e.seq),
        clave_idempotencia: String(e.clave_idempotencia),
        id_credito: String(e.id_credito),
        fecha: String(e.fecha),
        monto_centavos: Number(e.monto_centavos),
        canal: String(e.canal),
        orden: e.seq,
      })),
    politicas: Object.entries(d.politicas.politicas_mora).map(
      ([id_politica, configuracion]) => ({ id_politica, configuracion }),
    ),
    configuracion: {
      moneda: "GTQ",
      base_conteo: "Actual/360",
      parametros: d.politicas as DatosCartera["configuracion"]["parametros"],
    },
  };
}
describe("Contrato MCP contra los casos de uso con datos canónicos", () => {
  it("MCP cartera entrega exactamente el mismo resultado del caso de uso", async () => {
    const d = await datos();
    const c = new ConsultasGerenciales({ leer: async () => d });
    const h = crearCatalogo(c).find((h) => h.nombre === "consultar_cartera")!;
    expect(await h.ejecutar(h.schema.parse({ fecha: "2026-10-31" }))).toEqual(
      await c.cartera("2026-10-31"),
    );
  });
  it("G-7 recibe corte futuro y devuelve tramos reales de cuota 2", async () => {
    const d = await datos();
    const c = new ConsultasGerenciales({ leer: async () => d });
    const h = crearCatalogo(c).find((h) => h.nombre === "explicar_mora")!;
    const r = await h.ejecutar(
      h.schema.parse({ id: "CV-2026-0410", cuota: 2, fecha: "2027-01-24" }),
    );
    expect(r).toMatchObject({
      numero: 2,
      dias_atraso: 45,
      interes_moratorio_centavos: 1814,
    });
  });
  it("no expone aprobar/rechazar; toda consulta financiera exige fecha", () => {
    for (const h of crearCatalogo()) {
      expect(h.nombre).not.toMatch(/aprobar|rechazar|decidir/);
      expect(() => h.schema.parse({})).toThrow();
    }
  });
});
