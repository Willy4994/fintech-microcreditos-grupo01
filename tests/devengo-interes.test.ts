import { describe, expect, it } from "vitest";

import { CalculadoraDevengoInteres } from
  "../src/dominio/cierres/services/CalculadoraDevengoInteres.js";

import { Dinero } from
  "../src/dominio/shared/value-objects/Dinero.js";

import { DiasAtraso } from
  "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";

describe("CalculadoraDevengoInteres", () => {
  it("día 90: reconoce el interés corriente normalmente", () => {
    const calculadora = new CalculadoraDevengoInteres();

    const resultado = calculadora.calcular(
      Dinero.desdeCentavos(15000, "GTQ"),
      new DiasAtraso(90)
    );

    expect(
      resultado.interesReconocido.toDecimal().toFixed(2)
    ).toBe("150.00");

    expect(
      resultado.interesEnSuspenso.toDecimal().toFixed(2)
    ).toBe("0.00");
  });

  it("día 100: suspende el devengo de interés corriente", () => {
    const calculadora = new CalculadoraDevengoInteres();

    const resultado = calculadora.calcular(
      Dinero.desdeCentavos(15000, "GTQ"),
      new DiasAtraso(100)
    );

    expect(
      resultado.interesReconocido.toDecimal().toFixed(2)
    ).toBe("0.00");

    expect(
      resultado.interesEnSuspenso.toDecimal().toFixed(2)
    ).toBe("150.00");
  });

  it("reanuda el devengo cuando el crédito se regulariza", () => {
  const calculadora = new CalculadoraDevengoInteres();

  const interesCorriente = Dinero.desdeCentavos(
    15000,
    "GTQ"
  );

  const duranteMora = calculadora.calcular(
    interesCorriente,
    new DiasAtraso(100)
  );

  expect(
    duranteMora.interesReconocido.toDecimal().toFixed(2)
  ).toBe("0.00");

  expect(
    duranteMora.interesEnSuspenso.toDecimal().toFixed(2)
  ).toBe("150.00");

  const despuesDeRegularizar = calculadora.calcular(
    interesCorriente,
    new DiasAtraso(0)
  );

  expect(
    despuesDeRegularizar.interesReconocido.toDecimal().toFixed(2)
  ).toBe("150.00");

  expect(
    despuesDeRegularizar.interesEnSuspenso.toDecimal().toFixed(2)
  ).toBe("0.00");
});
});