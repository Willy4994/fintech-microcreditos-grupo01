import { describe, expect, it } from 'vitest';

import { Dinero } from '../src/dominio/shared/value-objects/Dinero.js';
import { Pago } from '../src/dominio/cartera-cobros/entities/Pago.js';
import { ClaveIdempotencia } from '../src/dominio/cartera-cobros/value-objects/ClaveIdempotencia.js';
import { ProcesadorPago } from '../src/dominio/cartera-cobros/services/ProcesadorPago.js';

describe('ProcesadorPago', () => {
  it('no vuelve a procesar un pago con la misma clave de idempotencia', () => {
    const procesador = new ProcesadorPago();

    const clave = new ClaveIdempotencia('pago-001');

    const pago = new Pago(
      Dinero.desdeCentavos(50000, 'GTQ'),
      clave,
      new Date('2026-08-25')
    );

    const deuda = {
      gastos: Dinero.desdeCentavos(0, 'GTQ'),
      interesMoratorio: Dinero.desdeCentavos(726, 'GTQ'),
      interesCorriente: Dinero.desdeCentavos(27886, 'GTQ'),
      capital: Dinero.desdeCentavos(72576, 'GTQ'),
    };

    const resultado = procesador.procesar(
      pago,
      deuda,
      [new ClaveIdempotencia('pago-001')]
    );

    expect(resultado.duplicado).toBe(true);
    expect(resultado.movimientos).toHaveLength(0);

    expect(
      resultado.excedente.obtenerCentavos()
    ).toBe(50000);
  });
});