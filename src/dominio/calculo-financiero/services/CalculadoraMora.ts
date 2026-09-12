import { Dinero } from "../../shared/value-objects/Dinero.js";
import { DiasAtraso } from "../../cartera-cobros/value-objects/DiasAtraso.js";
import { TasaNominalAnual } from "../value-objects/TasaNominalAnual.js";
import type { BaseConteo } from "../value-objects/BaseConteo.js";

import type { PoliticaMora } from "../../politica-mora/PoliticaMora.js";
import { PoliticaPlana } from "../../politica-mora/PoliticaPlana.js";

export class CalculadoraMora {
  constructor(
    private readonly politica: PoliticaMora = new PoliticaPlana()
  ) {}

  calcularInteresMoratorio(
    capitalEnMora: Dinero,
    tasaMoratoria: TasaNominalAnual,
    baseConteo: BaseConteo,
    diasAtraso: DiasAtraso
  ): Dinero {
    return this.politica.calcularInteresMoratorio(
      capitalEnMora,
      tasaMoratoria,
      baseConteo,
      diasAtraso
    );
  }
}