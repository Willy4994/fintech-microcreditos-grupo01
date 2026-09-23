import { describe, expect, it } from "vitest";

import { Dinero } from "../src/dominio/shared/value-objects/Dinero.js";
import { DiasAtraso } from "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";
import { TasaNominalAnual } from "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";
import { PoliticaPlana } from "../src/dominio/politica-mora/PoliticaPlana.js";

describe("PoliticaPlana", () => {
  it("mantiene el caso de referencia del Proyecto 1 en Q7.26", () => {
    const politica = new PoliticaPlana();

    const resultado = politica.calcularInteresMoratorio(
      Dinero.desdeCentavos(72576, "GTQ"),
      TasaNominalAnual.crear(24),
      "ACTUAL_360",
      new DiasAtraso(15)
    );

    expect(resultado.toDecimal().toFixed(2)).toBe("7.26");
  });
});