import { Dinero } from '../../shared/value-objects/Dinero.js';
import { Movimiento } from '../entities/Movimiento.js';

export interface ContextoAplicacionPago {
  restante: Dinero;
  movimientos: Movimiento[];
}

export interface ResultadoAplicacionPago {
  restante: Dinero;
  movimientos: Movimiento[];
}

export abstract class AplicadorPago {
  private siguiente?: AplicadorPago;

  establecerSiguiente(siguiente: AplicadorPago): AplicadorPago {
    this.siguiente = siguiente;
    return siguiente;
  }

  aplicar(contexto: ContextoAplicacionPago): ResultadoAplicacionPago {
    const resultado = this.aplicarConcepto(contexto);

    if (this.siguiente) {
      return this.siguiente.aplicar({
        restante: resultado.restante,
        movimientos: resultado.movimientos,
      });
    }

    return resultado;
  }

  protected abstract aplicarConcepto(
    contexto: ContextoAplicacionPago
  ): ResultadoAplicacionPago;
}