import { describe, expect, it } from "vitest";

import { DiasAtraso } from "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";
import { GastoGestionCobro } from "../src/dominio/politica-mora/GastoGestionCobro.js";

describe("GastoGestionCobro", () => {
  it("no genera gasto antes del dia 31", () => {
    const servicio = new GastoGestionCobro();

    const resultado = servicio.generarSiCorresponde(
      new DiasAtraso(30),
      false,
      "GTQ"
    );

    expect(
      resultado.toDecimal().toFixed(2)
    ).toBe("0.00");
  });

  it("genera Q25.00 al llegar al dia 31", () => {
    const servicio = new GastoGestionCobro();

    const resultado = servicio.generarSiCorresponde(
      new DiasAtraso(31),
      false,
      "GTQ"
    );

    expect(
      resultado.toDecimal().toFixed(2)
    ).toBe("25.00");
  });

  it("no genera nuevamente el gasto si ya fue registrado", () => {
    const servicio = new GastoGestionCobro();

    const resultado = servicio.generarSiCorresponde(
      new DiasAtraso(61),
      true,
      "GTQ"
    );

    expect(
      resultado.toDecimal().toFixed(2)
    ).toBe("0.00");
  });

  it("no duplica el gasto aunque se ejecute otro cierre", () => {
    const primerCierre =
      new GastoGestionCobro();

    const resultadoPrimerCierre =
      primerCierre.generarSiCorresponde(
        new DiasAtraso(31),
        false,
        "GTQ"
      );

    expect(
      resultadoPrimerCierre.toDecimal().toFixed(2)
    ).toBe("25.00");

    // Simulamos otro cierre con una nueva instancia.
    const segundoCierre =
      new GastoGestionCobro();

    const resultadoSegundoCierre =
      segundoCierre.generarSiCorresponde(
        new DiasAtraso(61),
        true,
        "GTQ"
      );

    expect(
      resultadoSegundoCierre.toDecimal().toFixed(2)
    ).toBe("0.00");
  });
});