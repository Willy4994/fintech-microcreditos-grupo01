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
/** Libro del devengo: el suspenso permanece como cuenta de orden hasta regularizar. */
export class LibroDevengo {
  private suspenso: Dinero = Dinero.desdeCentavos(0, 'GTQ');
  registrar(interes: Dinero, dias: DiasAtraso, regularizado: boolean): ResultadoDevengoInteres {
    if (dias.obtenerValor() > 90 && !regularizado) {
      this.suspenso = this.suspenso.sumar(interes);
      return { interesReconocido: Dinero.desdeCentavos(0, interes.moneda), interesEnSuspenso: this.suspenso };
    }
    const reconocido = interes.sumar(this.suspenso);
    this.suspenso = Dinero.desdeCentavos(0, interes.moneda);
    return { interesReconocido: reconocido, interesEnSuspenso: this.suspenso };
  }
}
