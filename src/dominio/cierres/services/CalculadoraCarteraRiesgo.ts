import { Decimal } from "decimal.js";

import { Cartera } from "../entities/Cartera.js";
import { Dinero } from "../../shared/value-objects/Dinero.js";

export interface ResultadoCarteraRiesgo {
  carteraActiva: Dinero;
  carteraEnRiesgo: Dinero;
  porcentajeRiesgo: Decimal;
  montoDeclaradoIncobrable: Dinero;
}

export class CalculadoraCarteraRiesgo {
  calcular(cartera: Cartera): ResultadoCarteraRiesgo {
    const creditos = cartera.obtenerCreditos();
    const moneda = cartera.moneda;

    let carteraActiva = Dinero.desdeCentavos(0, moneda);
    let carteraEnRiesgo = Dinero.desdeCentavos(0, moneda);
    let montoDeclaradoIncobrable = Dinero.desdeCentavos(0, moneda);

    for (const credito of creditos) {
      if (credito.declaradoIncobrableEnPeriodo) {
        montoDeclaradoIncobrable = montoDeclaradoIncobrable.sumar(
          credito.saldoCapital
        );
      }

      if (credito.incobrable) {
        continue;
      }

      carteraActiva = carteraActiva.sumar(credito.saldoCapital);

      if (
        credito.diasAtraso.esMayorQue(30) ||
        credito.reestructurado
      ) {
        carteraEnRiesgo = carteraEnRiesgo.sumar(
          credito.saldoCapital
        );
      }
    }

    const porcentajeRiesgo = carteraActiva.esCero()
      ? new Decimal(0)
      : carteraEnRiesgo
          .toDecimal()
          .dividedBy(carteraActiva.toDecimal());

    return {
      carteraActiva,
      carteraEnRiesgo,
      porcentajeRiesgo,
      montoDeclaradoIncobrable,
    };
  }
}
