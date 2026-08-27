import type {
  EstadoCredito,
  NombreEstadoCredito
} from "./EstadoCredito.js";

import { TransicionCreditoInvalidaException } from
  "../exceptions/TransicionCreditoInvalidaException.js";

export abstract class EstadoCreditoBase
  implements EstadoCredito {

  abstract readonly nombre: NombreEstadoCredito;

  aprobar(): EstadoCredito {
    throw new TransicionCreditoInvalidaException(
      this.nombre,
      "aprobar"
    );
  }

  rechazar(): EstadoCredito {
    throw new TransicionCreditoInvalidaException(
      this.nombre,
      "rechazar"
    );
  }

  desembolsar(): EstadoCredito {
    throw new TransicionCreditoInvalidaException(
      this.nombre,
      "desembolsar"
    );
  }
}