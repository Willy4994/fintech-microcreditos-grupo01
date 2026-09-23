import { Decimal } from "decimal.js";

import { Dinero } from "../shared/value-objects/Dinero.js";
import { DiasAtraso } from "../cartera-cobros/value-objects/DiasAtraso.js";
import { TasaNominalAnual } from "../calculo-financiero/value-objects/TasaNominalAnual.js";
import type { BaseConteo } from "../calculo-financiero/value-objects/BaseConteo.js";
import type { PoliticaMora } from "./PoliticaMora.js";

export class PoliticaEscalonada implements PoliticaMora {
  calcularInteresMoratorio(
    capitalEnMora: Dinero,
    _tasaMoratoria: TasaNominalAnual,
    baseConteo: BaseConteo,
    diasAtraso: DiasAtraso
  ): Dinero {
    const dias = diasAtraso.obtenerValor();

    const divisor = baseConteo === "ACTUAL_365"
      ? new Decimal(365)
      : new Decimal(360);

    let interesTotal = new Decimal(0);

    interesTotal = interesTotal.plus(
      this.calcularTramo(
        capitalEnMora,
        Math.min(dias, 30),
        18,
        divisor
      )
    );

    if (dias > 30) {
      interesTotal = interesTotal.plus(
        this.calcularTramo(
          capitalEnMora,
          Math.min(dias - 30, 30),
          24,
          divisor
        )
      );
    }

    if (dias > 60) {
      interesTotal = interesTotal.plus(
        this.calcularTramo(
          capitalEnMora,
          Math.min(dias - 60, 30),
          30,
          divisor
        )
      );
    }

    if (dias > 90) {
      interesTotal = interesTotal.plus(
        this.calcularTramo(
          capitalEnMora,
          Math.min(dias - 90, 30),
          36,
          divisor
        )
      );
    }

    return Dinero.desdeDecimal(
      interesTotal,
      capitalEnMora.moneda
    );
  }

  private calcularTramo(
    capitalEnMora: Dinero,
    dias: number,
    tasaPorcentaje: number,
    divisor: Decimal
  ): Decimal {
    if (dias <= 0) {
      return new Decimal(0);
    }

    const tasaDiaria = new Decimal(tasaPorcentaje)
      .dividedBy(100)
      .dividedBy(divisor);

    return capitalEnMora
      .toDecimal()
      .times(tasaDiaria)
      .times(dias);
  }
}