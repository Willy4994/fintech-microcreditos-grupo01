import { Dinero } from '../../shared/value-objects/Dinero.js';
import { DomainException } from '../../shared/exceptions/DomainException.js';
import { ClaveIdempotencia } from '../value-objects/ClaveIdempotencia.js';

export class Pago {
  constructor(
    private readonly monto: Dinero,
    private readonly claveIdempotencia: ClaveIdempotencia,
    private readonly fecha: Date
  ) {
    if (monto.obtenerCentavos() <= 0) {
      throw new PagoInvalidoException(
        'El monto del pago debe ser mayor que cero.'
      );
    }
  }

  obtenerMonto(): Dinero {
    return this.monto;
  }

  obtenerClaveIdempotencia(): ClaveIdempotencia {
    return this.claveIdempotencia;
  }

  obtenerFecha(): Date {
    return new Date(this.fecha);
  }
}

export class PagoInvalidoException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}