import { it, expect } from "vitest";
import { ClienteMcp } from "../src/asistente/ClienteMcp.js";
it("SDK MCP real por stdio descubre herramientas y rechaza fechas inválidas sin acceder a SQL", async () => {
  const c = new ClienteMcp();
  try {
    const herramientas = await c.herramientas();
    expect(herramientas.map((h) => h.name)).toContain("proponer_pago");
    expect(herramientas.map((h) => h.name)).not.toContain("aprobar_pago");
    const resultado = await c.ejecutar("consultar_cartera", {
      fecha: "2026-02-30",
    });
    expect(resultado).toMatchObject({ isError: true });
  } finally {
    await c.cerrar();
  }
}, 15000);
