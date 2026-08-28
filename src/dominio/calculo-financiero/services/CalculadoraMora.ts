import { Decimal } from "decimal.js";

import { Dinero } from "../../shared/value-objects/Dinero.js";
import { DiasAtraso } from "../../cartera-cobros/value-objects/DiasAtraso.js";
import { TasaNominalAnual } from "../value-objects/TasaNominalAnual.js";
import type { BaseConteo } from "../value-objects/BaseConteo.js";

export class CalculadoraMora {
  calcularInteresMoratorio(
    capitalEnMora: Dinero,
    tasaMoratoria: TasaNominalAnual,
    baseConteo: BaseConteo,
    diasAtraso: DiasAtraso
  ): Dinero {
    const divisor = baseConteo === "ACTUAL_365"
      ? new Decimal(365)
      : new Decimal(360);

    const tasaDiaria = tasaMoratoria
      .obtenerPorcentaje()
      .dividedBy(100)
      .dividedBy(divisor);

    const interes = capitalEnMora
      .toDecimal()
      .times(tasaDiaria)
      .times(diasAtraso.obtenerValor());

    return Dinero.desdeDecimal(
      interes,
      capitalEnMora.moneda
    );
  }
}
