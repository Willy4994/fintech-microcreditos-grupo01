import { describe, it, expect, vi } from "vitest";
import { ServicioAsistente } from "../../src/asistente/ServicioAsistente.js";
describe("Orientación cuando no hay consulta respaldada", () => {
  it.each(["¿Cómo quedó el Real Madrid?", "Hola", "¿Cuál es la cartera?"])(
    "responde sin error técnico ni texto no verificado: %s",
    async (pregunta) => {
      const ejecutar = vi.fn();
      const s = new ServicioAsistente(
        { herramientas: async () => [], ejecutar },
        {
          responder: async () => ({
            role: "assistant",
            content: "El Madrid ganó 9-0 y la cartera es Q999,999.00.",
          }),
        },
      );
      const r = await s.conversar(pregunta, "2026-10-31");
      expect(r.respuesta).toContain("Puedo ayudarte con créditos");
      expect(r.respuesta).not.toContain("999,999");
      expect(r.respuesta).not.toContain("9-0");
      expect(r.respuesta).not.toContain("herramientas");
      expect(r.evidencias).toEqual([]);
      expect(ejecutar).not.toHaveBeenCalled();
    },
  );
  it("conserva una sesión utilizable después de una pregunta general", async () => {
    const responder = vi
      .fn()
      .mockResolvedValue({ role: "assistant", content: "Hola" });
    const s = new ServicioAsistente(
      { herramientas: async () => [], ejecutar: vi.fn() },
      { responder },
    );
    const r = await s.conversar("Hola", "2026-10-31");
    const siguiente = await s.conversar(
      "¿Qué puedo consultar?",
      "2026-10-31",
      r.sesion,
    );
    expect(siguiente.sesion).toBe(r.sesion);
    expect(responder.mock.calls[1]![0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "user", content: "Hola" }),
      ]),
    );
  });
});

it("consulta RAG si el modelo no usó herramientas ante una pregunta válida sobre requisitos", async () => {
  let paso = 0;
  const ejecutar = vi.fn().mockResolvedValue({
    content: [
      {
        type: "text",
        text: JSON.stringify([
          {
            id: "MAN-PRODUCTO-01:1",
            contenido:
              "Créditos entre Q1000 y Q25000. No se detallan documentos de admisión.",
          },
        ]),
      },
    ],
  });
  const s = new ServicioAsistente(
    {
      herramientas: async () => [{ name: "buscar_politicas", inputSchema: {} }],
      ejecutar,
    },
    {
      responder: async () =>
        ++paso === 1
          ? { role: "assistant", content: "No puedo ayudar" }
          : {
              role: "assistant",
              content:
                "El manual describe el producto, pero no detalla los documentos necesarios para solicitarlo. Confírmalos con un asesor. [MAN-PRODUCTO-01:1]",
            },
    },
  );
  const pregunta = "Necesito consultar que necesito para pedir un crédito?";
  const r = await s.conversar(pregunta, "2026-10-31");
  expect(ejecutar).toHaveBeenCalledWith("buscar_politicas", {
    pregunta,
    fecha: "2026-10-31",
  });
  expect(r.respuesta).toContain("no puedo confirmar una lista completa");
  expect(r.respuesta).not.toContain("varía según el perfil");
  expect(r.respuesta).not.toContain("Solo atiendo");
  expect(r.fuentes).toHaveLength(1);
});
