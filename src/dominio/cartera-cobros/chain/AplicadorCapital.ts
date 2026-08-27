import { Dinero } from '../../shared/value-objects/Dinero.js';
import {
  ConceptoMovimiento,
  Movimiento,
} from '../entities/Movimiento.js';
import { AplicadorPago } from './AplicadorPago.js';

import type {
  ContextoAplicacionPago,
  ResultadoAplicacionPago,
} from './AplicadorPago.js';

export class AplicadorCapital extends AplicadorPago {
  constructor(private readonly deudaCapital: Dinero) {
    super();
  }

  protected aplicarConcepto(
    contexto: ContextoAplicacionPago
  ): ResultadoAplicacionPago {
    const disponible = contexto.restante.obtenerCentavos();
    const deuda = this.deudaCapital.obtenerCentavos();

    const aplicado = Math.min(disponible, deuda);

    const montoAplicado = Dinero.desdeCentavos(
      aplicado,
      contexto.restante.moneda
    );

    const restante = Dinero.desdeCentavos(
      disponible - aplicado,
      contexto.restante.moneda
    );

    const movimientos = [...contexto.movimientos];

    if (!montoAplicado.esCero()) {
      movimientos.push(
        new Movimiento(
          ConceptoMovimiento.CAPITAL,
          montoAplicado
        )
      );
    }

    return {
      restante,
      movimientos,
    };
  }
}