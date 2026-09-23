import { describe, expect, it } from "vitest";

import { Dinero } from
  "../src/dominio/shared/value-objects/Dinero.js";

import { DiasAtraso } from
  "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";

import { TasaNominalAnual } from
  "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";

import { PoliticaPlana } from
  "../src/dominio/politica-mora/PoliticaPlana.js";

import { PoliticaEscalonada } from
  "../src/dominio/politica-mora/PoliticaEscalonada.js";

describe("Coexistencia de políticas de mora P1 y P2", () => {
  it("calcula Q21.77 plana y Q18.14 escalonada para 45 días", () => {
    const capital =
      Dinero.desdeCentavos(
        72576,
        "GTQ"
      );

    const diasAtraso =
      new DiasAtraso(45);

    /*
     * Política anterior P1:
     * tasa plana de 24 %
     */
    const tasaPlana =
      TasaNominalAnual.crear(24);

    const politicaPlana =
      new PoliticaPlana();

    const resultadoPlana =
      politicaPlana.calcularInteresMoratorio(
        capital,
        tasaPlana,
        "ACTUAL_360",
        diasAtraso
      );

    /*
     * Nueva política P2:
     * cálculo por tramos recorridos.
     *
     * La tasa recibida forma parte del
     * contrato común PoliticaMora.
     */
    const politicaEscalonada =
      new PoliticaEscalonada();

    const resultadoEscalonada =
      politicaEscalonada.calcularInteresMoratorio(
        capital,
        tasaPlana,
        "ACTUAL_360",
        diasAtraso
      );

    expect(
      resultadoPlana.toDecimal().toFixed(2)
    ).toBe("21.77");

    expect(
      resultadoEscalonada.toDecimal().toFixed(2)
    ).toBe("18.14");
  });
});