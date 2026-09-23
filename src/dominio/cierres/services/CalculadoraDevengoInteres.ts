import { Dinero } from "../../shared/value-objects/Dinero.js";
import { DiasAtraso } from "../../cartera-cobros/value-objects/DiasAtraso.js";

export interface ResultadoDevengoInteres {
  readonly interesReconocido: Dinero;
  readonly interesEnSuspenso: Dinero;
}

export class CalculadoraDevengoInteres {
  calcular(
    interesCorriente: Dinero,
    diasAtraso: DiasAtraso
  ): ResultadoDevengoInteres {
    if (diasAtraso.obtenerValor() <= 90) {
      return {
        interesReconocido: interesCorriente,
        interesEnSuspenso: Dinero.desdeCentavos(
          0,
          interesCorriente.moneda
        ),
      };
    }

    return {
      interesReconocido: Dinero.desdeCentavos(
        0,
        interesCorriente.moneda
      ),
      interesEnSuspenso: interesCorriente,
    };
  }
}