import { Decimal } from "decimal.js";

import { Cartera } from "../entities/Cartera.js";
import { Dinero } from "../../shared/value-objects/Dinero.js";

export interface ResultadoCarteraRiesgo {
  carteraActiva: Dinero;
  carteraEnRiesgo: Dinero;
  porcentajeRiesgo: Decimal;
  montoDeclaradoIncobrable: Dinero;

  carteraEnMora: Dinero;
  porcentajeCarteraMora: Decimal;

  mora2: Dinero;
  porcentajeMora2: Decimal;

  mora3: Dinero;
  porcentajeMora3: Decimal;

  vencido: Dinero;
  porcentajeVencido: Decimal;

  reestructurado: Dinero;
  porcentajeReestructurado: Decimal;
}

export class CalculadoraCarteraRiesgo {
  calcular(cartera: Cartera): ResultadoCarteraRiesgo {
    const creditos = cartera.obtenerCreditos();
    const moneda = cartera.moneda;

    let carteraActiva = Dinero.desdeCentavos(0, moneda);
    let carteraEnRiesgo = Dinero.desdeCentavos(0, moneda);
    let montoDeclaradoIncobrable = Dinero.desdeCentavos(
      0,
      moneda
    );

    let carteraEnMora = Dinero.desdeCentavos(0, moneda);

    let mora2 = Dinero.desdeCentavos(0, moneda);
    let mora3 = Dinero.desdeCentavos(0, moneda);
    let vencido = Dinero.desdeCentavos(0, moneda);
    let reestructurado = Dinero.desdeCentavos(0, moneda);

    for (const credito of creditos) {
      if (credito.declaradoIncobrableEnPeriodo) {
        montoDeclaradoIncobrable =
          montoDeclaradoIncobrable.sumar(
            credito.saldoCapital
          );
      }

      if (credito.incobrable) {
        continue;
      }

      carteraActiva = carteraActiva.sumar(
        credito.saldoCapital
      );

      const dias = credito.diasAtraso.obtenerValor();

      /*
       * Cartera en mora:
       * incluye cualquier crédito activo con al menos
       * un día de atraso.
       */
      if (dias > 0) {
        carteraEnMora = carteraEnMora.sumar(
          credito.saldoCapital
        );
      }

      /*
       * Cartera en riesgo:
       * créditos con más de 30 días de atraso
       * o créditos reestructurados.
       */
      if (
        dias > 30 ||
        credito.reestructurado
      ) {
        carteraEnRiesgo = carteraEnRiesgo.sumar(
          credito.saldoCapital
        );
      }

      /*
       * Desglose de cartera en riesgo.
       *
       * El crédito reestructurado se clasifica en su
       * propia categoría para evitar contarlo dos veces.
       */
      if (credito.reestructurado) {
        reestructurado = reestructurado.sumar(
          credito.saldoCapital
        );

        continue;
      }

      if (dias >= 31 && dias <= 60) {
        mora2 = mora2.sumar(
          credito.saldoCapital
        );
      } else if (dias >= 61 && dias <= 90) {
        mora3 = mora3.sumar(
          credito.saldoCapital
        );
      } else if (dias >= 91 && dias <= 120) {
        vencido = vencido.sumar(
          credito.saldoCapital
        );
      }
    }

    const porcentajeRiesgo =
      this.calcularPorcentaje(
        carteraEnRiesgo,
        carteraActiva
      );

    const porcentajeCarteraMora =
      this.calcularPorcentaje(
        carteraEnMora,
        carteraActiva
      );

    const porcentajeMora2 =
      this.calcularPorcentaje(
        mora2,
        carteraActiva
      );

    const porcentajeMora3 =
      this.calcularPorcentaje(
        mora3,
        carteraActiva
      );

    const porcentajeVencido =
      this.calcularPorcentaje(
        vencido,
        carteraActiva
      );

    const porcentajeReestructurado =
      this.calcularPorcentaje(
        reestructurado,
        carteraActiva
      );

    return {
      carteraActiva,
      carteraEnRiesgo,
      porcentajeRiesgo,
      montoDeclaradoIncobrable,

      carteraEnMora,
      porcentajeCarteraMora,

      mora2,
      porcentajeMora2,

      mora3,
      porcentajeMora3,

      vencido,
      porcentajeVencido,

      reestructurado,
      porcentajeReestructurado,
    };
  }

  private calcularPorcentaje(
    monto: Dinero,
    carteraActiva: Dinero
  ): Decimal {
    if (carteraActiva.esCero()) {
      return new Decimal(0);
    }

    return monto
      .toDecimal()
      .dividedBy(
        carteraActiva.toDecimal()
      );
  }
}