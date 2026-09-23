import { describe, expect, it } from "vitest";

import { PoliticaEscalonada } from
  "../src/dominio/politica-mora/PoliticaEscalonada.js";

import { Dinero } from
  "../src/dominio/shared/value-objects/Dinero.js";

import { DiasAtraso } from
  "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";

import { TasaNominalAnual } from
  "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";

import { PoliticaRetroactiva } from
  "../src/dominio/politica-mora/PoliticaRetroactiva.js";

describe("PoliticaEscalonada", () => {
  const politica = new PoliticaEscalonada();

  const capital = Dinero.desdeCentavos(
    72576,
    "GTQ"
  );

  const tasa = TasaNominalAnual.crear(24);

  it("calcula correctamente 15 días de atraso", () => {
    const resultado =
      politica.calcularInteresMoratorio(
        capital,
        tasa,
        "ACTUAL_360",
        new DiasAtraso(15)
      );

    expect(
      resultado.toDecimal().toFixed(2)
    ).toBe("5.44");
  });
  
  it("M-2: calcula Q18.14 para 45 días de atraso", () => {
  const resultado =
    politica.calcularInteresMoratorio(
      capital,
      tasa,
      "ACTUAL_360",
      new DiasAtraso(45)
    );

  expect(
    resultado.toDecimal().toFixed(2)
  ).toBe("18.14");
});

it("M-3: calcula Q50.80 para 100 días de atraso", () => {
  const resultado =
    politica.calcularInteresMoratorio(
      capital,
      tasa,
      "ACTUAL_360",
      new DiasAtraso(100)
    );

  expect(
    resultado.toDecimal().toFixed(2)
  ).toBe("50.80");
});

  it("política retroactiva calcula Q72.58 para 100 días", () => {
  const politicaRetroactiva =
    new PoliticaRetroactiva();

  const resultado =
    politicaRetroactiva.calcularInteresMoratorio(
      capital,
      tasa,
      "ACTUAL_360",
      new DiasAtraso(100)
    );

  expect(
    resultado.toDecimal().toFixed(2)
  ).toBe("72.58");
});

  it("calcula correctamente 30 días de atraso", () => {
    const resultado =
      politica.calcularInteresMoratorio(
        capital,
        tasa,
        "ACTUAL_360",
        new DiasAtraso(30)
      );

    expect(
      resultado.toDecimal().toFixed(2)
    ).toBe("10.89");
  });

  it("calcula correctamente 31 días de atraso", () => {
    const resultado =
      politica.calcularInteresMoratorio(
        capital,
        tasa,
        "ACTUAL_360",
        new DiasAtraso(31)
      );

    expect(
      resultado.toDecimal().toFixed(2)
    ).toBe("11.37");
  });

  it("calcula correctamente 60 días de atraso", () => {
    const resultado =
      politica.calcularInteresMoratorio(
        capital,
        tasa,
        "ACTUAL_360",
        new DiasAtraso(60)
      );

    expect(
      resultado.toDecimal().toFixed(2)
    ).toBe("25.40");
  });

  it("calcula correctamente 61 días de atraso", () => {
    const resultado =
      politica.calcularInteresMoratorio(
        capital,
        tasa,
        "ACTUAL_360",
        new DiasAtraso(61)
      );

    expect(
      resultado.toDecimal().toFixed(2)
    ).toBe("26.01");
  });

  it("calcula correctamente 90 días de atraso", () => {
    const resultado =
      politica.calcularInteresMoratorio(
        capital,
        tasa,
        "ACTUAL_360",
        new DiasAtraso(90)
      );

    expect(
      resultado.toDecimal().toFixed(2)
    ).toBe("43.55");
  });

  it("calcula correctamente 91 días de atraso", () => {
    const resultado =
      politica.calcularInteresMoratorio(
        capital,
        tasa,
        "ACTUAL_360",
        new DiasAtraso(91)
      );

    expect(
      resultado.toDecimal().toFixed(2)
    ).toBe("44.27");
  });

  it("calcula correctamente 120 días de atraso", () => {
    const resultado =
      politica.calcularInteresMoratorio(
        capital,
        tasa,
        "ACTUAL_360",
        new DiasAtraso(120)
      );

    expect(
      resultado.toDecimal().toFixed(2)
    ).toBe("65.32");
  });

  it("día 121 no acumula más moratorio que el día 120", () => {
    const dia120 =
      politica.calcularInteresMoratorio(
        capital,
        tasa,
        "ACTUAL_360",
        new DiasAtraso(120)
      );

    const dia121 =
      politica.calcularInteresMoratorio(
        capital,
        tasa,
        "ACTUAL_360",
        new DiasAtraso(121)
      );

    expect(
      dia120.toDecimal().toFixed(2)
    ).toBe("65.32");

    expect(
      dia121.toDecimal().toFixed(2)
    ).toBe("65.32");
  });
});