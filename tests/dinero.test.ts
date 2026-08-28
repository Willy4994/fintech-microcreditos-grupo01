import { Decimal } from "decimal.js";
import { describe, expect, it } from "vitest";

import { MonedaIncompatibleException } from
  "../src/dominio/shared/exceptions/MonedaIncompatibleException.js";
import { Dinero } from
  "../src/dominio/shared/value-objects/Dinero.js";

describe("Dinero", () => {
  it("redondea a dos decimales con medio hacia arriba", () => {
    const dinero = Dinero.desdeDecimal(
      new Decimal("10.125"),
      "GTQ"
    );

    expect(dinero.obtenerCentavos()).toBe(1013);
  });

  it("es inmutable al sumar", () => {
    const original = Dinero.desdeCentavos(1000, "GTQ");
    const resultado = original.sumar(
      Dinero.desdeCentavos(250, "GTQ")
    );

    expect(original.obtenerCentavos()).toBe(1000);
    expect(resultado.obtenerCentavos()).toBe(1250);
    expect(resultado).not.toBe(original);
  });

  it("impide operar importes de monedas diferentes", () => {
    const quetzales = Dinero.desdeCentavos(100, "GTQ");
    const dolares = Dinero.desdeCentavos(100, "USD");

    expect(() => quetzales.sumar(dolares)).toThrow(
      MonedaIncompatibleException
    );
    expect(() => quetzales.esMenorQue(dolares)).toThrow(
      MonedaIncompatibleException
    );
  });
});
