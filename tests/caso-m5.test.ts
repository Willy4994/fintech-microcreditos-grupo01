import { describe, expect, it } from "vitest";

import { AmortizacionFrancesa } from
  "../src/dominio/calculo-financiero/strategies/AmortizacionFrancesa.js";

import { TasaNominalAnual } from
  "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";

import { Plazo } from
  "../src/dominio/calculo-financiero/value-objects/Plazo.js";

import { Dinero } from
  "../src/dominio/shared/value-objects/Dinero.js";

import { DiasAtraso } from
  "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";

import { PoliticaEscalonada } from
  "../src/dominio/politica-mora/PoliticaEscalonada.js";

import { GastoGestionCobro } from
  "../src/dominio/politica-mora/GastoGestionCobro.js";

describe("Caso obligatorio M-5", () => {
  it("calcula Q1,047.76 para la cuota 2 con 45 días de atraso", () => {
    /*
     * Crédito de referencia:
     * Q10,000
     * TNA 36 %
     * 12 meses
     */
    const capitalCredito =
      Dinero.desdeCentavos(
        1_000_000,
        "GTQ"
      );

    const tasaCredito =
      TasaNominalAnual.crear(36);

    const plan =
      new AmortizacionFrancesa().calcular(
        capitalCredito,
        tasaCredito.obtenerTasaMensual(),
        Plazo.crear(12)
      );

    /*
     * Obtenemos la cuota 2 directamente
     * del motor financiero.
     */
    const cuota2 =
      plan.obtenerCuotas()[1];

    expect(cuota2).toBeDefined();

    if (cuota2 === undefined) {
      throw new Error(
        "No se encontró la cuota 2"
      );
    }

    /*
     * La cuota normal debe conservar
     * el resultado del Proyecto 1.
     */
    expect(
      cuota2.monto.toDecimal().toFixed(2)
    ).toBe("1004.62");

    /*
     * Para calcular la mora usamos el
     * capital en mora de la cuota 2.
     */
    const politica =
      new PoliticaEscalonada();

    const mora =
      politica.calcularInteresMoratorio(
        cuota2.amortizacionCapital,
        tasaCredito,
        "ACTUAL_360",
        new DiasAtraso(45)
      );

    /*
     * Gasto de gestión:
     * desde 31 días corresponde Q25.
     */
    const gasto =
      new GastoGestionCobro()
        .generarSiCorresponde(
          new DiasAtraso(45),
          false,
          "GTQ"
        );

    expect(
      gasto.toDecimal().toFixed(2)
    ).toBe("25.00");

    /*
     * Total adeudado:
     *
     * cuota normal
     * + mora
     * + gasto de gestión
     */
    const total =
      cuota2.monto
        .sumar(mora)
        .sumar(gasto);

    expect(
      total.toDecimal().toFixed(2)
    ).toBe("1047.76");
  });
});