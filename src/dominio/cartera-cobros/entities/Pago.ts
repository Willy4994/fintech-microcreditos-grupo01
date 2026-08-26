import { Dinero } from '../../shared/value-objects/Dinero.js';
import { ClaveIdempotencia } from '../value-objects/ClaveIdempotencia.js';

export class Pago {
  constructor(
    private readonly monto: Dinero,
    private readonly claveIdempotencia: ClaveIdempotencia,
    private readonly fecha: Date
  ) {}

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