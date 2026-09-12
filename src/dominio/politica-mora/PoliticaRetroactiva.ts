import { Decimal } from "decimal.js";

import { Dinero } from "../shared/value-objects/Dinero.js";
import { DiasAtraso } from "../cartera-cobros/value-objects/DiasAtraso.js";
import { TasaNominalAnual } from "../calculo-financiero/value-objects/TasaNominalAnual.js";
import type { BaseConteo } from "../calculo-financiero/value-objects/BaseConteo.js";
import type { PoliticaMora } from "./PoliticaMora.js";

export class PoliticaRetroactiva implements PoliticaMora {
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

    const tasa = this.obtenerTasa(dias);

    const tasaDiaria = new Decimal(tasa)
      .dividedBy(100)
      .dividedBy(divisor);

    const interes = capitalEnMora
      .toDecimal()
      .times(tasaDiaria)
      .times(dias);

    return Dinero.desdeDecimal(
      interes,
      capitalEnMora.moneda
    );
  }

  private obtenerTasa(dias: number): number {
    if (dias <= 30) {
      return 18;
    }

    if (dias <= 60) {
      return 24;
    }

    if (dias <= 90) {
      return 30;
    }

    return 36;
  }
}