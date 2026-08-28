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

  activar(): EstadoCredito {
    throw new TransicionCreditoInvalidaException(
      this.nombre,
      "activar"
    );
  }

  marcarEnMora(): EstadoCredito {
    throw new TransicionCreditoInvalidaException(
      this.nombre,
      "marcar en mora"
    );
  }

  registrarPago(_diasAtrasoRestantes: number): EstadoCredito {
    throw new TransicionCreditoInvalidaException(
      this.nombre,
      "registrar pago"
    );
  }

  anular(): EstadoCredito {
    return this.transicionInvalida("anular");
  }

  reestructurar(): EstadoCredito {
    return this.transicionInvalida("reestructurar");
  }

  curar(): EstadoCredito {
    return this.transicionInvalida("curar");
  }

  cancelar(): EstadoCredito {
    return this.transicionInvalida("cancelar");
  }

  declararIncobrable(): EstadoCredito {
    return this.transicionInvalida("declarar incobrable");
  }

  private transicionInvalida(operacion: string): never {
    throw new TransicionCreditoInvalidaException(
      this.nombre,
      operacion
    );
  }
}
