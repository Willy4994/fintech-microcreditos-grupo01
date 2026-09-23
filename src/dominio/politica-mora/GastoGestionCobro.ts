import { Dinero } from "../shared/value-objects/Dinero.js";
import type { Moneda } from "../shared/value-objects/Moneda.js";
import { DiasAtraso } from "../cartera-cobros/value-objects/DiasAtraso.js";

export class GastoGestionCobro {
  generarSiCorresponde(
    diasAtraso: DiasAtraso,
    gastoYaGenerado: boolean,
    moneda: Moneda
  ): Dinero {
    const correspondeGenerar =
      diasAtraso.obtenerValor() >= 31 &&
      !gastoYaGenerado;

    if (correspondeGenerar) {
      return Dinero.desdeCentavos(
        2500,
        moneda
      );
    }

    return Dinero.desdeCentavos(
      0,
      moneda
    );
  }
}