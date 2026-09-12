import { describe, expect, it } from "vitest";

import { Dinero } from "../src/dominio/shared/value-objects/Dinero.js";
import { DiasAtraso } from "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";
import { TasaNominalAnual } from "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";

import { PoliticaEscalonada } from "../src/dominio/politica-mora/PoliticaEscalonada.js";
import { GastoGestionCobro } from "../src/dominio/politica-mora/GastoGestionCobro.js";

describe("M-5 Total de cuota vencida", () => {
  it("calcula Q1,047.76 para la cuota 2 con 45 dias de mora y gasto de gestion", () => {
    const cuota = Dinero.desdeCentavos(100462, "GTQ");

    const politicaMora = new PoliticaEscalonada();

    const interesMoratorio =
      politicaMora.calcularInteresMoratorio(
        Dinero.desdeCentavos(72576, "GTQ"),
        TasaNominalAnual.crear(24),
        "ACTUAL_360",
        new DiasAtraso(45)
      );

    const servicioGasto =
      new GastoGestionCobro();

    const gastoGestion =
      servicioGasto.generarSiCorresponde(
        new DiasAtraso(45),
        false,
        "GTQ"
      );

    const total =
      cuota
        .sumar(interesMoratorio)
        .sumar(gastoGestion);

    expect(
      interesMoratorio.toDecimal().toFixed(2)
    ).toBe("18.14");

    expect(
      gastoGestion.toDecimal().toFixed(2)
    ).toBe("25.00");

    expect(
      total.toDecimal().toFixed(2)
    ).toBe("1047.76");
  });
});