import { describe, expect, it } from "vitest";

import { Dinero } from "../src/dominio/shared/value-objects/Dinero.js";
import { DiasAtraso } from "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";
import { TasaNominalAnual } from "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";
import { PoliticaRetroactiva } from "../src/dominio/politica-mora/PoliticaRetroactiva.js";

describe("PoliticaRetroactiva", () => {
  it("calcula Q72.58 para 100 dias usando la tasa del tramo actual", () => {
    const politica = new PoliticaRetroactiva();

    const resultado = politica.calcularInteresMoratorio(
      Dinero.desdeCentavos(72576, "GTQ"),
      TasaNominalAnual.crear(24),
      "ACTUAL_360",
      new DiasAtraso(100)
    );

    expect(resultado.toDecimal().toFixed(2)).toBe("72.58");
  });
});