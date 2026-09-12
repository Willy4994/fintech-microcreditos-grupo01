import { describe, expect, it } from "vitest";

import { Dinero } from "../src/dominio/shared/value-objects/Dinero.js";
import { DiasAtraso } from "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";
import { TasaNominalAnual } from "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";
import { PoliticaEscalonada } from "../src/dominio/politica-mora/PoliticaEscalonada.js";

describe("PoliticaEscalonada", () => {
  it("M-1: calcula Q5.44 para 15 dias de mora", () => {
    const politica = new PoliticaEscalonada();

    const resultado = politica.calcularInteresMoratorio(
      Dinero.desdeCentavos(72576, "GTQ"),
      TasaNominalAnual.crear(24),
      "ACTUAL_360",
      new DiasAtraso(15)
    );

    expect(resultado.toDecimal().toFixed(2)).toBe("5.44");
  });

  it("M-2: calcula Q18.14 para 45 dias de mora", () => {
    const politica = new PoliticaEscalonada();

    const resultado = politica.calcularInteresMoratorio(
      Dinero.desdeCentavos(72576, "GTQ"),
      TasaNominalAnual.crear(24),
      "ACTUAL_360",
      new DiasAtraso(45)
    );

    expect(resultado.toDecimal().toFixed(2)).toBe("18.14");
  });

  it("M-3: calcula Q50.80 para 100 dias de mora", () => {
    const politica = new PoliticaEscalonada();

    const resultado = politica.calcularInteresMoratorio(
      Dinero.desdeCentavos(72576, "GTQ"),
      TasaNominalAnual.crear(24),
      "ACTUAL_360",
      new DiasAtraso(100)
    );

    expect(resultado.toDecimal().toFixed(2)).toBe("50.80");
  });

  it("M-4: calcula Q65.32 para 120 dias de mora", () => {
  const politica = new PoliticaEscalonada();

  const resultado = politica.calcularInteresMoratorio(
    Dinero.desdeCentavos(72576, "GTQ"),
    TasaNominalAnual.crear(24),
    "ACTUAL_360",
    new DiasAtraso(120)
  );

  expect(resultado.toDecimal().toFixed(2)).toBe("65.32");
});
});