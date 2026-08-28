import { describe, expect, it } from "vitest";

import { CalculadoraMora } from
  "../src/dominio/calculo-financiero/services/CalculadoraMora.js";
import { TasaNominalAnual } from
  "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";
import { DiasAtraso } from
  "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";
import { Dinero } from
  "../src/dominio/shared/value-objects/Dinero.js";

describe("CalculadoraMora", () => {
  it("reproduce Q7.26 sobre el capital en mora del ejemplo", () => {
    const interes = new CalculadoraMora().calcularInteresMoratorio(
      Dinero.desdeCentavos(72_576, "GTQ"),
      TasaNominalAnual.crear(24),
      "ACTUAL_360",
      new DiasAtraso(15)
    );

    expect(interes.obtenerCentavos()).toBe(726);
  });

  it("no genera mora cuando no hay días de atraso", () => {
    const interes = new CalculadoraMora().calcularInteresMoratorio(
      Dinero.desdeCentavos(72_576, "GTQ"),
      TasaNominalAnual.crear(24),
      "ACTUAL_360",
      new DiasAtraso(0)
    );

    expect(interes.esCero()).toBe(true);
  });
});
