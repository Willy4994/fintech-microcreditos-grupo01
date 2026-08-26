import { describe, expect, it } from 'vitest';

import { Dinero } from '../src/dominio/shared/value-objects/Dinero.js';

import {
  Pago,
  PagoInvalidoException,
} from '../src/dominio/cartera-cobros/entities/Pago.js';

import {
  ClaveIdempotencia,
} from '../src/dominio/cartera-cobros/value-objects/ClaveIdempotencia.js';

describe('Pago', () => {
  it('rechaza un pago con monto cero', () => {
    expect(() =>
      new Pago(
        Dinero.desdeCentavos(0, 'GTQ'),
        new ClaveIdempotencia('pago-cero'),
        new Date('2026-08-26')
      )
    ).toThrow(PagoInvalidoException);
  });

  it('rechaza un pago con monto negativo', () => {
    expect(() =>
      new Pago(
        Dinero.desdeCentavos(-100, 'GTQ'),
        new ClaveIdempotencia('pago-negativo'),
        new Date('2026-08-26')
      )
    ).toThrow(PagoInvalidoException);
  });
});