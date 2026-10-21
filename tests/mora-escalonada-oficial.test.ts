import { describe, it, expect } from "vitest";

import { PoliticaEscalonada } from "../src/dominio/politica-mora/PoliticaEscalonada.js";
import { Dinero } from "../src/dominio/shared/value-objects/Dinero.js";
import { DiasAtraso } from "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";
import { TasaNominalAnual } from "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";

describe("Política escalonada - Casos oficiales del Proyecto 2", () => {
  const politica = new PoliticaEscalonada();

  const capital = Dinero.desdeCentavos(72576, "GTQ");
  const tasa = TasaNominalAnual.crear(24);

  const calcularMora = (dias: number): number => {
    return politica
      .calcularInteresMoratorio(
        capital,
        tasa,
        "ACTUAL_360",
        new DiasAtraso(dias)
      )
      .obtenerCentavos();
  };

  it("M-1: 15 días de atraso generan Q5.44", () => {
    expect(calcularMora(15)).toBe(544);
  });

  it("M-2: 45 días de atraso generan Q18.14", () => {
    expect(calcularMora(45)).toBe(1814);
  });

  it("M-3: 100 días de atraso generan Q50.80", () => {
    expect(calcularMora(100)).toBe(5080);
  });

  it("M-4: 120 días de atraso generan Q65.32", () => {
    expect(calcularMora(120)).toBe(6532);
  });

  it("No genera mora adicional después del día 120", () => {
    expect(calcularMora(121)).toBe(calcularMora(120));
    expect(calcularMora(150)).toBe(calcularMora(120));
  });

  it("No genera mora cuando no existen días de atraso", () => {
    expect(calcularMora(0)).toBe(0);
  });

  it("La mora acumulada no supera el capital en mora", () => {
    expect(calcularMora(120)).toBeLessThanOrEqual(72576);
  });
});