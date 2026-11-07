import { describe, it, expect } from "vitest";
import {
  periodoOtorgamiento,
  seleccionarPolitica,
} from "../src/rag/VigenciaPolitica.js";
const politicas = [
  { id_politica: "antigua", desde: null, hasta: "2026-09-30" },
  { id_politica: "nueva", desde: "2026-10-01", hasta: null },
];
describe("Vigencia de políticas en recuperación RAG", () => {
  it("extrae mes otorgado sin usar la fecha de corte", () => {
    expect(
      periodoOtorgamiento(
        "¿Cómo se calcula la mora de un crédito otorgado en agosto de 2026? Cita la fuente.",
      ),
    ).toEqual({ desde: "2026-08-01", hasta: "2026-08-31" });
  });
  it.each([
    ["2026-09-30", "antigua"],
    ["2026-10-01", "nueva"],
  ])("respeta el límite %s", (fecha, id) => {
    const p = periodoOtorgamiento(`Crédito otorgado el ${fecha}`)!;
    expect(seleccionarPolitica(p, politicas)).toBe(id);
  });
  it("acepta fecha española completa y meses bisiestos", () => {
    expect(
      periodoOtorgamiento("Crédito desembolsado el 15 de agosto de 2026"),
    ).toEqual({ desde: "2026-08-15", hasta: "2026-08-15" });
    expect(
      periodoOtorgamiento("Crédito otorgado en febrero de 2024")?.hasta,
    ).toBe("2024-02-29");
  });
  it("no confunde una consulta general con fecha de otorgamiento", () => {
    expect(
      periodoOtorgamiento("Cartera al 31 de octubre de 2026"),
    ).toBeUndefined();
  });
  it("pide precisión si cambian las políticas dentro del mes", () => {
    expect(() =>
      seleccionarPolitica({ desde: "2026-10-01", hasta: "2026-10-31" }, [
        { id_politica: "A", desde: null, hasta: "2026-10-15" },
        { id_politica: "B", desde: "2026-10-16", hasta: null },
      ]),
    ).toThrow("fecha exacta");
  });
  it("detecta solapamientos en vez de elegir la primera política", () => {
    expect(() =>
      seleccionarPolitica({ desde: "2026-10-01", hasta: "2026-10-01" }, [
        { id_politica: "A", desde: null, hasta: null },
        { id_politica: "B", desde: null, hasta: null },
      ]),
    ).toThrow();
  });
});

import { ServicioAsistente } from "../src/asistente/ServicioAsistente.js";
it("rechaza una política de otra vigencia aunque el fragmento citado exista", async () => {
  let paso = 0;
  const s = new ServicioAsistente(
    {
      herramientas: async () => [{ name: "buscar_politicas", inputSchema: {} }],
      ejecutar: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify([
              { id: "POL-2024-01:1", politica_aplicable: "POL-2024-01" },
            ]),
          },
        ],
      }),
    },
    {
      responder: async () =>
        ++paso === 1
          ? {
              role: "assistant",
              content: "",
              tool_calls: [
                {
                  function: {
                    name: "buscar_politicas",
                    arguments: { pregunta: "agosto", fecha: "2026-10-31" },
                  },
                },
              ],
            }
          : {
              role: "assistant",
              content: "Aplica POL-2026-10 [POL-2024-01:1]",
            },
    },
  );
  await expect(
    s.conversar("Crédito otorgado en agosto de 2026", "2026-10-31"),
  ).rejects.toMatchObject({ codigo: "POLITICA_NO_APLICABLE" });
});
