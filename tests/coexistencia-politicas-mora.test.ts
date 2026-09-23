import { describe, expect, it } from "vitest";

import { Dinero } from "../src/dominio/shared/value-objects/Dinero.js";
import { DiasAtraso } from "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";
import { TasaNominalAnual } from "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";

import { PoliticaPlana } from "../src/dominio/politica-mora/PoliticaPlana.js";
import { PoliticaEscalonada } from "../src/dominio/politica-mora/PoliticaEscalonada.js";

describe("Coexistencia de politicas de mora", () => {
  it("mantiene distinta mora para politica plana y escalonada a 45 dias", () => {
    const capital = Dinero.desdeCentavos(72576, "GTQ");
    const tasa = TasaNominalAnual.crear(24);
    const dias = new DiasAtraso(45);

    const politicaPlana = new PoliticaPlana();
    const politicaEscalonada = new PoliticaEscalonada();

    const resultadoPlana =
      politicaPlana.calcularInteresMoratorio(
        capital,
        tasa,
        "ACTUAL_360",
        dias
      );

    const resultadoEscalonada =
      politicaEscalonada.calcularInteresMoratorio(
        capital,
        tasa,
        "ACTUAL_360",
        dias
      );

    expect(resultadoPlana.toDecimal().toFixed(2))
      .toBe("21.77");

    expect(resultadoEscalonada.toDecimal().toFixed(2))
      .toBe("18.14");
  });
});