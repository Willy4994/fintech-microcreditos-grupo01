import { Dinero } from '../../shared/value-objects/Dinero.js';
import { Movimiento } from '../entities/Movimiento.js';
import { Pago } from '../entities/Pago.js';
import { ClaveIdempotencia } from '../value-objects/ClaveIdempotencia.js';
import { PrelacionPago } from './PrelacionPago.js';

import type { DeudaPago } from './PrelacionPago.js';

export interface ResultadoProcesamientoPago {
  duplicado: boolean;
  movimientos: Movimiento[];
  excedente: Dinero;
}

export class ProcesadorPago {
  constructor(
    private readonly prelacionPago: PrelacionPago = new PrelacionPago()
  ) {}

  procesar(
    pago: Pago,
    deuda: DeudaPago,
    clavesProcesadas: ClaveIdempotencia[]
  ): ResultadoProcesamientoPago {
    const yaProcesado = clavesProcesadas.some((clave) =>
      clave.esIgualA(pago.obtenerClaveIdempotencia())
    );

    if (yaProcesado) {
      return {
        duplicado: true,
        movimientos: [],
        excedente: pago.obtenerMonto(),
      };
    }

    const resultado = this.prelacionPago.aplicar(
      pago.obtenerMonto(),
      deuda
    );

    return {
      duplicado: false,
      movimientos: resultado.movimientos,
      excedente: resultado.excedente,
    };
  }
}