import { Dinero } from '../../shared/value-objects/Dinero.js';
import {
  ConceptoMovimiento,
  Movimiento,
} from '../entities/Movimiento.js';

import { AplicadorGastos } from '../chain/AplicadorGastos.js';
import { AplicadorInteresMoratorio } from '../chain/AplicadorInteresMoratorio.js';
import { AplicadorInteresCorriente } from '../chain/AplicadorInteresCorriente.js';
import { AplicadorCapital } from '../chain/AplicadorCapital.js';

export interface DeudaPago {
  gastos: Dinero;
  interesMoratorio: Dinero;
  interesCorriente: Dinero;
  capital: Dinero;
}

export interface SaldosPendientes {
  gastos: Dinero;
  interesMoratorio: Dinero;
  interesCorriente: Dinero;
  capital: Dinero;
}

export interface ResultadoPrelacionPago {
  movimientos: Movimiento[];
  excedente: Dinero;
  saldosPendientes: SaldosPendientes;
}

export class PrelacionPago {
  aplicar(
    montoPago: Dinero,
    deuda: DeudaPago
  ): ResultadoPrelacionPago {
    const gastos = new AplicadorGastos(deuda.gastos);
    const moratorio = new AplicadorInteresMoratorio(
      deuda.interesMoratorio
    );
    const interesCorriente = new AplicadorInteresCorriente(
      deuda.interesCorriente
    );
    const capital = new AplicadorCapital(deuda.capital);

    gastos.establecerSiguiente(moratorio);
    moratorio.establecerSiguiente(interesCorriente);
    interesCorriente.establecerSiguiente(capital);

    const resultado = gastos.aplicar({
      restante: montoPago,
      movimientos: [],
    });

    return {
      movimientos: resultado.movimientos,
      excedente: resultado.restante,
      saldosPendientes: {
        gastos: this.calcularSaldoPendiente(
          deuda.gastos,
          ConceptoMovimiento.GASTOS,
          resultado.movimientos
        ),
        interesMoratorio: this.calcularSaldoPendiente(
          deuda.interesMoratorio,
          ConceptoMovimiento.INTERES_MORATORIO,
          resultado.movimientos
        ),
        interesCorriente: this.calcularSaldoPendiente(
          deuda.interesCorriente,
          ConceptoMovimiento.INTERES_CORRIENTE,
          resultado.movimientos
        ),
        capital: this.calcularSaldoPendiente(
          deuda.capital,
          ConceptoMovimiento.CAPITAL,
          resultado.movimientos
        ),
      },
    };
  }

  private calcularSaldoPendiente(
    deuda: Dinero,
    concepto: ConceptoMovimiento,
    movimientos: Movimiento[]
  ): Dinero {
    const aplicado = movimientos
      .filter(
        (movimiento) =>
          movimiento.obtenerConcepto() === concepto
      )
      .reduce(
        (total, movimiento) =>
          total + movimiento.obtenerMonto().obtenerCentavos(),
        0
      );

    return Dinero.desdeCentavos(
      deuda.obtenerCentavos() - aplicado,
      deuda.moneda
    );
  }
}