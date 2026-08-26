import { describe, expect, it } from 'vitest';

import {
  DiasAtraso,
  DiasAtrasoInvalidoException,
} from '../src/dominio/cartera-cobros/value-objects/DiasAtraso.js';

import {
  TipoTramoMora,
  TramoMora,
} from '../src/dominio/cartera-cobros/value-objects/TramoMora.js';

describe('TramoMora', () => {
  it('clasifica correctamente los dias de atraso', () => {
    expect(
      TramoMora.desdeDiasAtraso(new DiasAtraso(0)).obtenerTipo()
    ).toBe(TipoTramoMora.SIN_MORA);

    expect(
      TramoMora.desdeDiasAtraso(new DiasAtraso(15)).obtenerTipo()
    ).toBe(TipoTramoMora.MORA_1);

    expect(
      TramoMora.desdeDiasAtraso(new DiasAtraso(45)).obtenerTipo()
    ).toBe(TipoTramoMora.MORA_2);

    expect(
      TramoMora.desdeDiasAtraso(new DiasAtraso(75)).obtenerTipo()
    ).toBe(TipoTramoMora.MORA_3);

    expect(
      TramoMora.desdeDiasAtraso(new DiasAtraso(100)).obtenerTipo()
    ).toBe(TipoTramoMora.VENCIDO);
  });

  it('permite bajar de tramo cuando disminuyen los dias de atraso', () => {
    const antes = TramoMora.desdeDiasAtraso(
      new DiasAtraso(45)
    );

    const despues = TramoMora.desdeDiasAtraso(
      new DiasAtraso(10)
    );

    expect(
      antes.obtenerTipo()
    ).toBe(TipoTramoMora.MORA_2);

    expect(
      despues.obtenerTipo()
    ).toBe(TipoTramoMora.MORA_1);
  });

  it('rechaza dias de atraso negativos', () => {
    expect(
      () => new DiasAtraso(-1)
    ).toThrow(DiasAtrasoInvalidoException);
  });

  it('clasifica correctamente los limites entre tramos', () => {
    expect(
      TramoMora.desdeDiasAtraso(new DiasAtraso(30)).obtenerTipo()
    ).toBe(TipoTramoMora.MORA_1);

    expect(
      TramoMora.desdeDiasAtraso(new DiasAtraso(31)).obtenerTipo()
    ).toBe(TipoTramoMora.MORA_2);

    expect(
      TramoMora.desdeDiasAtraso(new DiasAtraso(60)).obtenerTipo()
    ).toBe(TipoTramoMora.MORA_2);

    expect(
      TramoMora.desdeDiasAtraso(new DiasAtraso(61)).obtenerTipo()
    ).toBe(TipoTramoMora.MORA_3);

    expect(
      TramoMora.desdeDiasAtraso(new DiasAtraso(90)).obtenerTipo()
    ).toBe(TipoTramoMora.MORA_3);

    expect(
      TramoMora.desdeDiasAtraso(new DiasAtraso(91)).obtenerTipo()
    ).toBe(TipoTramoMora.VENCIDO);

    expect(
      TramoMora.desdeDiasAtraso(new DiasAtraso(120)).obtenerTipo()
    ).toBe(TipoTramoMora.VENCIDO);
  });
});