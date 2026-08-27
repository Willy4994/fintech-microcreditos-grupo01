import Decimal from "decimal.js";

import { Dinero } from "../../shared/value-objects/Dinero.js";
import { TasaMensual } from "../value-objects/TasaMensual.js";
import { Plazo } from "../value-objects/Plazo.js";
import { Cuota } from "../entities/Cuota.js";
import { PlanAmortizacion } from "../entities/PlanAmortizacion.js";
import { MetodoAmortizacion } from "./MetodoAmortizacion.js";

export class AmortizacionFrancesa
  implements MetodoAmortizacion {

  calcular(
    capital: Dinero,
    tasaMensual: TasaMensual,
    plazo: Plazo
  ): PlanAmortizacion {

    const principal = new Decimal(
      capital.obtenerCentavos()
    ).dividedBy(100);

    const tasa = tasaMensual.obtenerValor();

    const meses = plazo.meses;

    let cuotaCalculada: Decimal;

    /*
     * Caso especial:
     * si la tasa es 0%, simplemente dividimos
     * el capital entre el número de períodos.
     */
    if (tasaMensual.esCero()) {

      cuotaCalculada = principal.dividedBy(
        meses
      );

    } else {

      const n = new Decimal(meses);

      /*
       * Fórmula de amortización francesa:
       *
       *             P × i
       * C = -----------------------
       *     1 - (1 + i)^(-n)
       */

      cuotaCalculada = principal
        .times(tasa)
        .dividedBy(
          new Decimal(1).minus(
            new Decimal(1)
              .plus(tasa)
              .pow(n.negated())
          )
        );
    }

    /*
     * La cuota bancaria se trabaja con
     * dos posiciones decimales.
     */
    const montoCuota = this.redondear(
      cuotaCalculada
    );

    let saldo = principal;

    const cuotas: Cuota[] = [];

    for (
      let numero = 1;
      numero <= meses;
      numero++
    ) {

      /*
       * Calculamos el interés del período
       * sobre el saldo pendiente.
       */
      const interes = this.redondear(
        saldo.times(tasa)
      );

      let amortizacionCapital: Decimal;
      let montoPago: Decimal;

      /*
       * Última cuota:
       *
       * amortizamos exactamente todo el
       * capital pendiente.
       */
      if (numero === meses) {

        amortizacionCapital = saldo;

        montoPago = this.redondear(
          interes.plus(
            amortizacionCapital
          )
        );

        saldo = new Decimal(0);

      } else {

        montoPago = montoCuota;

        amortizacionCapital = this.redondear(
          montoPago.minus(interes)
        );

        saldo = this.redondear(
          saldo.minus(
            amortizacionCapital
          )
        );
      }

      const cuota = Cuota.crear(
        numero,
        Dinero.desdeDecimal(
          montoPago,
          capital.moneda
        ),
        Dinero.desdeDecimal(
          interes,
          capital.moneda
        ),
        Dinero.desdeDecimal(
          amortizacionCapital,
          capital.moneda
        ),
        Dinero.desdeDecimal(
          saldo,
          capital.moneda
        )
      );

      cuotas.push(cuota);
    }

    return PlanAmortizacion.crear(
      cuotas
    );
  }

  private redondear(
    monto: Decimal
  ): Decimal {

    return monto.toDecimalPlaces(
      2,
      Decimal.ROUND_HALF_UP
    );
  }
}