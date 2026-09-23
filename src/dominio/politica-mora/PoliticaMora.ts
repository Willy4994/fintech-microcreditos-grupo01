import { Dinero } from "../shared/value-objects/Dinero.js";
import { DiasAtraso } from "../cartera-cobros/value-objects/DiasAtraso.js";
import { TasaNominalAnual } from "../calculo-financiero/value-objects/TasaNominalAnual.js";
import type { BaseConteo } from "../calculo-financiero/value-objects/BaseConteo.js";

export interface PoliticaMora {
  calcularInteresMoratorio(
    capitalEnMora: Dinero,
    tasaMoratoria: TasaNominalAnual,
    baseConteo: BaseConteo,
    diasAtraso: DiasAtraso
  ): Dinero;
}