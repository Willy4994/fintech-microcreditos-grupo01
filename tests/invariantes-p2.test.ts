import { describe, expect, it } from "vitest";

import { PoliticaEscalonada } from
  "../src/dominio/politica-mora/PoliticaEscalonada.js";

import { PoliticaRetroactiva } from
  "../src/dominio/politica-mora/PoliticaRetroactiva.js";

import { PoliticaPlana } from
  "../src/dominio/politica-mora/PoliticaPlana.js";

import { GastoGestionCobro } from
  "../src/dominio/politica-mora/GastoGestionCobro.js";

import { Dinero } from
  "../src/dominio/shared/value-objects/Dinero.js";

import { DiasAtraso } from
  "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";

import { TasaNominalAnual } from
  "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";

import { Cartera } from
  "../src/dominio/cierres/entities/Cartera.js";

import { CalculadoraCarteraRiesgo } from
  "../src/dominio/cierres/services/CalculadoraCarteraRiesgo.js";

describe("Invariantes del Proyecto 2", () => {
  const capital = Dinero.desdeCentavos(
    72576,
    "GTQ"
  );

  const tasa24 = TasaNominalAnual.crear(24);

  /*
   * Invariante 1
   *
   * El interés moratorio es monótono:
   * más días nunca producen menos mora.
   */
  it("1. el interés moratorio es monótono respecto a los días de atraso", () => {
    const politica = new PoliticaEscalonada();

    let interesAnterior = Dinero.desdeCentavos(
      0,
      "GTQ"
    );

    for (let dia = 1; dia <= 120; dia++) {
      const interesActual =
        politica.calcularInteresMoratorio(
          capital,
          tasa24,
          "ACTUAL_360",
          new DiasAtraso(dia)
        );

      expect(
        interesActual.obtenerCentavos()
      ).toBeGreaterThanOrEqual(
        interesAnterior.obtenerCentavos()
      );

      interesAnterior = interesActual;
    }
  });

  /*
   * Invariante 2
   *
   * La política escalonada nunca debe producir
   * más interés que la retroactiva.
   */
  it("2. la política escalonada es menor o igual que la retroactiva", () => {
    const escalonada = new PoliticaEscalonada();
    const retroactiva = new PoliticaRetroactiva();

    for (let dia = 1; dia <= 120; dia++) {
      const interesEscalonado =
        escalonada.calcularInteresMoratorio(
          capital,
          tasa24,
          "ACTUAL_360",
          new DiasAtraso(dia)
        );

      const interesRetroactivo =
        retroactiva.calcularInteresMoratorio(
          capital,
          tasa24,
          "ACTUAL_360",
          new DiasAtraso(dia)
        );

      expect(
        interesEscalonado.obtenerCentavos()
      ).toBeLessThanOrEqual(
        interesRetroactivo.obtenerCentavos()
      );
    }
  });

  /*
   * Invariante 3
   *
   * El moratorio acumulado nunca puede superar
   * el capital que se encuentra en mora.
   */
  it("3. el interés moratorio nunca excede el capital en mora", () => {
    const politica = new PoliticaEscalonada();

    for (let dia = 1; dia <= 121; dia++) {
      const interes =
        politica.calcularInteresMoratorio(
          capital,
          tasa24,
          "ACTUAL_360",
          new DiasAtraso(dia)
        );

      expect(
        interes.obtenerCentavos()
      ).toBeLessThanOrEqual(
        capital.obtenerCentavos()
      );
    }
  });

  /*
   * Invariante 4
   *
   * Entre los días 1 y 30:
   * escalonada = plana al 18 %.
   */
  it("4. entre 1 y 30 días la escalonada equivale a una plana al 18%", () => {
    const escalonada = new PoliticaEscalonada();
    const plana = new PoliticaPlana();

    const tasa18 = TasaNominalAnual.crear(18);

    for (let dia = 1; dia <= 30; dia++) {
      const interesEscalonado =
        escalonada.calcularInteresMoratorio(
          capital,
          tasa18,
          "ACTUAL_360",
          new DiasAtraso(dia)
        );

      const interesPlano =
        plana.calcularInteresMoratorio(
          capital,
          tasa18,
          "ACTUAL_360",
          new DiasAtraso(dia)
        );

      expect(
        interesEscalonado.obtenerCentavos()
      ).toBe(
        interesPlano.obtenerCentavos()
      );
    }
  });

  /*
   * Invariante 5
   *
   * Compatibilidad con Proyecto 1:
   * política plana 24 %, Q725.76 y 15 días
   * continúa produciendo Q7.26.
   */
  it("5. conserva el resultado de P1 de Q7.26 a 15 días", () => {
    const plana = new PoliticaPlana();

    const resultado =
      plana.calcularInteresMoratorio(
        capital,
        tasa24,
        "ACTUAL_360",
        new DiasAtraso(15)
      );

    expect(
      resultado.toDecimal().toFixed(2)
    ).toBe("7.26");
  });

  /*
   * Invariante 6
   *
   * El gasto Q25 solamente se genera una vez
   * por cuota vencida.
   */
  it("6. el gasto de gestión de Q25 se genera como máximo una vez por cuota", () => {
    const gasto = new GastoGestionCobro();

    const primerCierre =
      gasto.generarSiCorresponde(
        new DiasAtraso(31),
        false,
        "GTQ"
      );

    expect(
      primerCierre.toDecimal().toFixed(2)
    ).toBe("25.00");

    const segundoCierre =
      gasto.generarSiCorresponde(
        new DiasAtraso(45),
        true,
        "GTQ"
      );

    expect(
      segundoCierre.toDecimal().toFixed(2)
    ).toBe("0.00");

    const tercerCierre =
      gasto.generarSiCorresponde(
        new DiasAtraso(60),
        true,
        "GTQ"
      );

    expect(
      tercerCierre.toDecimal().toFixed(2)
    ).toBe("0.00");
  });

  /*
   * Invariante 7
   *
   * Los porcentajes por tramo deben sumar
   * exactamente el 7.00 % de cartera en riesgo.
   */
  it("7. los porcentajes por tramo suman exactamente 7.00%", () => {
    const cartera = new Cartera(
      "CARTERA-INVARIANTE",
      new Date("2026-10-31"),
      "GTQ"
    );

    const agregar = (
      id: string,
      saldoQuetzales: number,
      dias: number,
      reestructurado = false
    ) => {
      cartera.agregarCredito({
        creditoId: id,
        saldoCapital: Dinero.desdeCentavos(
          saldoQuetzales * 100,
          "GTQ"
        ),
        diasAtraso: new DiasAtraso(dias),
        reestructurado,
        incobrable: false,
        declaradoIncobrableEnPeriodo: false,
      });
    };

    agregar("C-001", 620000, 0);
    agregar("C-002", 124000, 8);
    agregar("C-003", 24000, 45);
    agregar("C-004", 18000, 75);
    agregar("C-005", 8000, 100);
    agregar("C-006", 6000, 0, true);

    const resultado =
      new CalculadoraCarteraRiesgo().calcular(
        cartera
      );

    const sumaPorTramos =
      resultado.porcentajeMora2
        .plus(resultado.porcentajeMora3)
        .plus(resultado.porcentajeVencido)
        .plus(resultado.porcentajeReestructurado);

    expect(
      sumaPorTramos.times(100).toFixed(2)
    ).toBe("7.00");

    expect(
      resultado.porcentajeRiesgo
        .times(100)
        .toFixed(2)
    ).toBe("7.00");

    expect(
      sumaPorTramos.equals(
        resultado.porcentajeRiesgo
      )
    ).toBe(true);
  });

  /*
   * Invariante 8
   *
   * Al declararse incobrable:
   * - deja de formar parte de cartera activa;
   * - no se genera moratorio adicional después
   *   del día 120.
   */
  it("8. un incobrable sale de cartera activa y no genera moratorio adicional", () => {
    const politica = new PoliticaEscalonada();

    const interesDia120 =
      politica.calcularInteresMoratorio(
        capital,
        tasa24,
        "ACTUAL_360",
        new DiasAtraso(120)
      );

    const interesDia121 =
      politica.calcularInteresMoratorio(
        capital,
        tasa24,
        "ACTUAL_360",
        new DiasAtraso(121)
      );

    expect(
      interesDia121.obtenerCentavos()
    ).toBe(
      interesDia120.obtenerCentavos()
    );

    const cartera = new Cartera(
      "CARTERA-INCOBRABLE",
      new Date("2026-10-31"),
      "GTQ"
    );

    cartera.agregarCredito({
      creditoId: "C-ACTIVO",
      saldoCapital: Dinero.desdeCentavos(
        100000,
        "GTQ"
      ),
      diasAtraso: new DiasAtraso(0),
      reestructurado: false,
      incobrable: false,
      declaradoIncobrableEnPeriodo: false,
    });

    cartera.agregarCredito({
      creditoId: "C-INCOBRABLE",
      saldoCapital: Dinero.desdeCentavos(
        50000,
        "GTQ"
      ),
      diasAtraso: new DiasAtraso(121),
      reestructurado: false,
      incobrable: true,
      declaradoIncobrableEnPeriodo: true,
    });

    const resultado =
      new CalculadoraCarteraRiesgo().calcular(
        cartera
      );

    expect(
      resultado.carteraActiva.obtenerCentavos()
    ).toBe(100000);

    expect(
      resultado.montoDeclaradoIncobrable
        .obtenerCentavos()
    ).toBe(50000);
  });
});