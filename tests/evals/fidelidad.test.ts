import { describe, it, expect, vi } from "vitest";
import {
  dinero,
  parametrosDePregunta,
  presentarFinanzas,
  type Evidencia,
} from "../../src/asistente/PresentacionFinanciera.js";
import {
  evaluarRespuesta,
  CASOS_EVALUACION,
} from "../../src/asistente/Evaluacion.js";
import {
  ServicioAsistente,
  type ModeloChat,
} from "../../src/asistente/ServicioAsistente.js";
const cierre = {
  desde: "2026-10-31",
  hasta: "2026-10-31",
  desembolsos_centavos: 4100000,
  recuperaciones: {
    gastos_centavos: 0,
    interes_moratorio_centavos: 1693,
    interes_corriente_centavos: 716289,
    capital_centavos: 2937468,
    total_centavos: 3655450,
  },
};
const evidencia: Evidencia = {
  herramienta: "consultar_cierre",
  parametros: { desde: "2026-10-31", hasta: "2026-10-31" },
  resultado: { content: [{ type: "text", text: JSON.stringify(cierre) }] },
};
describe("Regresiones de fidelidad detectadas en el eval real", () => {
  it("presenta centavos en quetzales sin perder precisión ni cambiar la unidad", () => {
    expect(dinero(4100000)).toBe("Q41,000.00");
    expect(dinero(1)).toBe("Q0.01");
    expect(dinero(-101)).toBe("-Q1.01");
    expect(dinero(9007199254740991)).toBe("Q90,071,992,547,409.91");
    expect(() => dinero(1.5)).toThrow();
  });
  it("G-3 corrige el período mensual que propuso el modelo para un cierre diario", () => {
    expect(
      parametrosDePregunta(
        "consultar_cierre",
        { desde: "2026-10-01", hasta: "2026-10-31" },
        "Dame el cierre del 31 de octubre de 2026",
        "2026-10-31",
      ),
    ).toEqual({ desde: "2026-10-31", hasta: "2026-10-31" });
  });
  it("distingue el mes solicitado, rangos ISO y años bisiestos", () => {
    expect(
      parametrosDePregunta(
        "consultar_cierre",
        {},
        "Cierre mensual de febrero de 2024",
        "2026-10-31",
      ),
    ).toEqual({ desde: "2024-02-01", hasta: "2024-02-29" });
    expect(
      parametrosDePregunta(
        "consultar_cierre",
        {},
        "Cierre de 2026-09-10 a 2026-10-15",
        "2026-10-31",
      ),
    ).toEqual({ desde: "2026-09-10", hasta: "2026-10-15" });
  });
  it("G-7 conserva el corte futuro y G-6-30 conserva el corte de sesión", () => {
    expect(
      parametrosDePregunta(
        "explicar_mora",
        { fecha: "2026-10-31" },
        "Cuota 2 al 24 de enero de 2027",
        "2026-10-31",
      ).fecha,
    ).toBe("2027-01-24");
    expect(
      parametrosDePregunta(
        "consultar_vencimientos",
        { fecha: "2027-01-01", dias: 7 },
        "¿Y en los próximos 30?",
        "2026-10-31",
      ),
    ).toEqual({ fecha: "2026-10-31", dias: 30 });
  });
  it("no transforma el mes de otorgamiento de una política en el corte financiero", () => {
    expect(
      parametrosDePregunta(
        "buscar_politicas",
        { fecha: "2026-08-01" },
        "Crédito de agosto de 2026",
        "2026-10-31",
      ).fecha,
    ).toBe("2026-10-31");
  });
  it("G-5 distingue capital pendiente de pagado y usa la base real sin fórmula inventada", () => {
    const e: Evidencia = {
      herramienta: "explicar_mora",
      parametros: { id: "CV-2026-0030", fecha: "2026-10-31" },
      resultado: {
        numero: 3,
        fecha_vencimiento: "2026-08-27",
        dias_atraso: 65,
        tramo: "MORA_3",
        capital_programado_centavos: 16402,
        capital_centavos: 16402,
        capital_pagado_centavos: 0,
        base_conteo: "Actual/360",
        desglose_mora: [],
        mora_generada_centavos: 711,
        interes_moratorio_centavos: 711,
        gastos_centavos: 0,
        interes_corriente_centavos: 2058,
        total_exigible_centavos: 19171,
      },
    };
    const texto = presentarFinanzas([e]);
    expect(texto).toContain("capital pendiente: Q164.02");
    expect(texto).toContain("Capital pagado: Q0.00");
    expect(texto).toContain("Actual/360");
    expect(texto).not.toContain("365");
  });
  it("los evals detectan fecha incorrecta y unidades falsas aunque el enrutamiento sea correcto", () => {
    const caso = CASOS_EVALUACION.find((c) => c.id === "G-3")!;
    expect(
      evaluarRespuesta(
        caso,
        presentarFinanzas([evidencia]),
        [evidencia],
        [evidencia],
      ).aprobado,
    ).toBe(true);
    expect(
      evaluarRespuesta(
        caso,
        "Desembolsos: 41,000 centavos.",
        [evidencia],
        [evidencia],
      ).aprobado,
    ).toBe(false);
    expect(
      evaluarRespuesta(
        caso,
        presentarFinanzas([evidencia]),
        [
          {
            ...evidencia,
            parametros: { desde: "2026-10-01", hasta: "2026-10-31" },
          },
        ],
        [evidencia],
      ).aprobado,
    ).toBe(false);
  });
  it("G-8 rechaza citar una política nueva para un otorgamiento de agosto", () => {
    const caso = CASOS_EVALUACION.find((c) => c.id === "G-8")!;
    const e: Evidencia = {
      herramienta: "buscar_politicas",
      parametros: { fecha: "2026-10-31" },
      resultado: [{ id: "POL-2026-10:1" }],
    };
    expect(
      evaluarRespuesta(caso, "24 % base 360 [POL-2026-10:1]", [e], []).aprobado,
    ).toBe(false);
  });
  it("el servicio ignora la redacción financiera inventada del LLM y envía parámetros corregidos a MCP", async () => {
    const ejecutar = vi.fn().mockResolvedValue(evidencia.resultado);
    let paso = 0;
    const modelo: ModeloChat = {
      responder: async () =>
        ++paso === 1
          ? {
              role: "assistant",
              content: "",
              tool_calls: [
                {
                  function: {
                    name: "consultar_cierre",
                    arguments: { desde: "2026-10-01", hasta: "2026-10-31" },
                  },
                },
              ],
            }
          : {
              role: "assistant",
              content: "Desembolsos: 41,000 centavos y base de 365 días.",
            },
    };
    const s = new ServicioAsistente(
      {
        herramientas: async () => [
          { name: "consultar_cierre", inputSchema: {} },
        ],
        ejecutar,
      },
      modelo,
    );
    const r = await s.conversar(
      "Dame el cierre del 31 de octubre de 2026",
      "2026-10-31",
    );
    expect(ejecutar).toHaveBeenCalledWith("consultar_cierre", {
      desde: "2026-10-31",
      hasta: "2026-10-31",
    });
    expect(r.respuesta).toContain("Desembolsos: Q41,000.00");
    expect(r.respuesta).not.toContain("centavos");
    expect(r.respuesta).not.toContain("365");
  });
  it("no entrega una respuesta de éxito si MCP devolvió un error", async () => {
    const s = new ServicioAsistente(
      {
        herramientas: async () => [
          { name: "consultar_cartera", inputSchema: {} },
        ],
        ejecutar: async () => ({
          isError: true,
          content: [{ type: "text", text: "SQL no disponible" }],
        }),
      },
      {
        responder: async () => ({
          role: "assistant",
          content: "",
          tool_calls: [
            {
              function: {
                name: "consultar_cartera",
                arguments: { fecha: "2026-10-31" },
              },
            },
          ],
        }),
      },
    );
    await expect(s.conversar("Cartera", "2026-10-31")).rejects.toMatchObject({
      codigo: "ERROR_HERRAMIENTA",
    });
  });
});
