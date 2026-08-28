import { describe, expect, it } from "vitest";

import { AmortizacionFrancesa } from
  "../src/dominio/calculo-financiero/strategies/AmortizacionFrancesa.js";
import { Plazo } from
  "../src/dominio/calculo-financiero/value-objects/Plazo.js";
import { TasaNominalAnual } from
  "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";
import { Dinero } from
  "../src/dominio/shared/value-objects/Dinero.js";

describe("Amortización francesa", () => {
  it("reproduce exactamente las 12 filas del caso de referencia", () => {
    const plan = new AmortizacionFrancesa().calcular(
      Dinero.desdeCentavos(1_000_000, "GTQ"),
      TasaNominalAnual.crear(36).obtenerTasaMensual(),
      Plazo.crear(12)
    );

    const esperado = [
      [100462, 30000, 70462, 929538],
      [100462, 27886, 72576, 856962],
      [100462, 25709, 74753, 782209],
      [100462, 23466, 76996, 705213],
      [100462, 21156, 79306, 625907],
      [100462, 18777, 81685, 544222],
      [100462, 16327, 84135, 460087],
      [100462, 13803, 86659, 373428],
      [100462, 11203, 89259, 284169],
      [100462, 8525, 91937, 192232],
      [100462, 5767, 94695, 97537],
      [100463, 2926, 97537, 0],
    ];

    expect(plan.obtenerCuotas()).toHaveLength(12);
    expect(
      plan.obtenerCuotas().map((cuota) => [
        cuota.monto.obtenerCentavos(),
        cuota.interes.obtenerCentavos(),
        cuota.amortizacionCapital.obtenerCentavos(),
        cuota.saldo.obtenerCentavos(),
      ])
    ).toEqual(esperado);
  });

  it("cuadra exactamente el capital y deja saldo final cero", () => {
    const plan = new AmortizacionFrancesa().calcular(
      Dinero.desdeCentavos(1_000_000, "GTQ"),
      TasaNominalAnual.crear(36).obtenerTasaMensual(),
      Plazo.crear(12)
    );

    const amortizacionTotal = plan
      .obtenerCuotas()
      .reduce(
        (total, cuota) =>
          total + cuota.amortizacionCapital.obtenerCentavos(),
        0
      );

    expect(amortizacionTotal).toBe(1_000_000);
    expect(plan.obtenerUltimaCuota().monto.obtenerCentavos()).toBe(100463);
    expect(plan.obtenerSaldoFinal().obtenerCentavos()).toBe(0);
    expect(plan.estaLiquidado()).toBe(true);
  });
});
