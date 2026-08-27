import { describe, expect, it } from "vitest";

import {
  CalculadoraCarteraRiesgo,
} from "../src/dominio/cierres/services/CalculadoraCarteraRiesgo.js";
import type {
  PosicionCartera,
} from "../src/dominio/cierres/entities/Cartera.js";
import { Cartera } from
  "../src/dominio/cierres/entities/Cartera.js";
import { DiasAtraso } from
  "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";
import { Dinero } from
  "../src/dominio/shared/value-objects/Dinero.js";

function credito(
  creditoId: string,
  saldoQuetzales: number,
  diasAtraso: number,
  reestructurado = false,
  incobrable = false,
  declaradoIncobrableEnPeriodo = false
): PosicionCartera {
  return {
    creditoId,
    saldoCapital: Dinero.desdeCentavos(
      saldoQuetzales * 100,
      "GTQ"
    ),
    diasAtraso: new DiasAtraso(diasAtraso),
    reestructurado,
    incobrable,
    declaradoIncobrableEnPeriodo,
  };
}

describe("CalculadoraCarteraRiesgo", () => {
  const casoReferencia = (
    declararC005Incobrable = false
  ): Cartera => {
    const cartera = new Cartera(
      "CARTERA-2026-08",
      new Date("2026-08-31"),
      "GTQ"
    );

    const creditos: PosicionCartera[] = [
      credito("C-001", 620_000, 0),
      credito("C-002", 124_000, 8),
      credito("C-003", 24_000, 45),
      credito("C-004", 18_000, 75),
      credito(
        "C-005",
        8_000,
        100,
        false,
        declararC005Incobrable,
        declararC005Incobrable
      ),
      credito("C-006", 6_000, 0, true),
      credito("C-007", 15_000, 210, false, true),
    ];

    for (const posicion of creditos) {
      cartera.agregarCredito(posicion);
    }

    return cartera;
  };

  it("reproduce la cartera en riesgo de 7.00%", () => {
    const resultado = new CalculadoraCarteraRiesgo().calcular(
      casoReferencia()
    );

    expect(resultado.carteraActiva.obtenerCentavos()).toBe(80_000_000);
    expect(resultado.carteraEnRiesgo.obtenerCentavos()).toBe(5_600_000);
    expect(resultado.porcentajeRiesgo.toFixed(4)).toBe("0.0700");
    expect(resultado.montoDeclaradoIncobrable.obtenerCentavos()).toBe(0);
  });

  it("reproduce 6.06% al declarar incobrable C-005", () => {
    const resultado = new CalculadoraCarteraRiesgo().calcular(
      casoReferencia(true)
    );

    expect(resultado.carteraActiva.obtenerCentavos()).toBe(79_200_000);
    expect(resultado.carteraEnRiesgo.obtenerCentavos()).toBe(4_800_000);
    expect(resultado.porcentajeRiesgo.times(100).toFixed(2)).toBe("6.06");
    expect(resultado.montoDeclaradoIncobrable.obtenerCentavos()).toBe(
      800_000
    );
  });
});
