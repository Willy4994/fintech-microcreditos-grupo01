import { describe, expect, it } from 'vitest';

import { Dinero } from '../src/dominio/shared/value-objects/Dinero.js';

import {
  ConceptoMovimiento,
} from '../src/dominio/cartera-cobros/entities/Movimiento.js';

import {
  PrelacionPago,
} from '../src/dominio/cartera-cobros/services/PrelacionPago.js';

describe('PrelacionPago', () => {
  it('aplica un pago parcial respetando la prelacion obligatoria', () => {
    const servicio = new PrelacionPago();

    const resultado = servicio.aplicar(
      Dinero.desdeCentavos(50000, 'GTQ'),
      {
        gastos: Dinero.desdeCentavos(0, 'GTQ'),
        interesMoratorio: Dinero.desdeCentavos(726, 'GTQ'),
        interesCorriente: Dinero.desdeCentavos(27886, 'GTQ'),
        capital: Dinero.desdeCentavos(72576, 'GTQ'),
      }
    );

    expect(resultado.movimientos).toHaveLength(3);

    expect(
      resultado.movimientos[0]?.obtenerConcepto()
    ).toBe(ConceptoMovimiento.INTERES_MORATORIO);

    expect(
      resultado.movimientos[0]?.obtenerMonto().obtenerCentavos()
    ).toBe(726);

    expect(
      resultado.movimientos[1]?.obtenerConcepto()
    ).toBe(ConceptoMovimiento.INTERES_CORRIENTE);

    expect(
      resultado.movimientos[1]?.obtenerMonto().obtenerCentavos()
    ).toBe(27886);

    expect(
      resultado.movimientos[2]?.obtenerConcepto()
    ).toBe(ConceptoMovimiento.CAPITAL);

    expect(
      resultado.movimientos[2]?.obtenerMonto().obtenerCentavos()
    ).toBe(21388);

    expect(
      resultado.excedente.obtenerCentavos()
    ).toBe(0);

    expect(
  resultado.saldosPendientes.capital.obtenerCentavos()
).toBe(51188);

  });
});

it('aplica un pago exacto y deja la deuda cubierta sin excedente', () => {
  const servicio = new PrelacionPago();

  const resultado = servicio.aplicar(
    Dinero.desdeCentavos(101188, 'GTQ'),
    {
      gastos: Dinero.desdeCentavos(0, 'GTQ'),
      interesMoratorio: Dinero.desdeCentavos(726, 'GTQ'),
      interesCorriente: Dinero.desdeCentavos(27886, 'GTQ'),
      capital: Dinero.desdeCentavos(72576, 'GTQ'),
    }
  );

  expect(resultado.movimientos).toHaveLength(3);

  expect(
    resultado.movimientos[0]?.obtenerMonto().obtenerCentavos()
  ).toBe(726);

  expect(
    resultado.movimientos[1]?.obtenerMonto().obtenerCentavos()
  ).toBe(27886);

  expect(
    resultado.movimientos[2]?.obtenerMonto().obtenerCentavos()
  ).toBe(72576);

  expect(
    resultado.excedente.obtenerCentavos()
  ).toBe(0);
});

it('aplica primero la deuda y conserva el excedente a favor del cliente', () => {
  const servicio = new PrelacionPago();

  const resultado = servicio.aplicar(
    Dinero.desdeCentavos(300000, 'GTQ'),
    {
      gastos: Dinero.desdeCentavos(0, 'GTQ'),
      interesMoratorio: Dinero.desdeCentavos(726, 'GTQ'),
      interesCorriente: Dinero.desdeCentavos(27886, 'GTQ'),
      capital: Dinero.desdeCentavos(72576, 'GTQ'),
    }
  );

  expect(resultado.movimientos).toHaveLength(3);

  expect(
    resultado.movimientos[0]?.obtenerMonto().obtenerCentavos()
  ).toBe(726);

  expect(
    resultado.movimientos[1]?.obtenerMonto().obtenerCentavos()
  ).toBe(27886);

  expect(
    resultado.movimientos[2]?.obtenerMonto().obtenerCentavos()
  ).toBe(72576);

  expect(
    resultado.excedente.obtenerCentavos()
  ).toBe(198812);
});