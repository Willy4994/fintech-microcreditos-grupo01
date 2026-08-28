import { describe, expect, it } from "vitest";

import { esquemasOpenApi } from
  "../src/contratos/esquemas-openapi.js";
import { registrarPagoSchema } from
  "../src/contratos/schemas.js";

describe("Contratos Zod y OpenAPI", () => {
  it("valida pagos con centavos enteros", () => {
    expect(
      registrarPagoSchema.safeParse({
        creditoId: "C-001",
        claveIdempotencia: "PAGO-001",
        monto: { centavos: 101_188, moneda: "GTQ" },
        fecha: "2026-08-27",
      }).success
    ).toBe(true);

    expect(
      registrarPagoSchema.safeParse({
        creditoId: "C-001",
        claveIdempotencia: "PAGO-002",
        monto: { centavos: 10.5, moneda: "GTQ" },
        fecha: "2026-08-27",
      }).success
    ).toBe(false);
  });

  it("deriva los componentes de contrato desde Zod", () => {
    expect(esquemasOpenApi).toHaveProperty("Cliente");
    expect(esquemasOpenApi).toHaveProperty("RegistrarPago");
    expect(esquemasOpenApi).toHaveProperty("ErrorApi");
  });
});
