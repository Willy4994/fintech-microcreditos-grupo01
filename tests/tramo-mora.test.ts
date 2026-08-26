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

    expect(antes.obtenerTipo()).toBe(TipoTramoMora.MORA_2);
    expect(despues.obtenerTipo()).toBe(TipoTramoMora.MORA_1);
  });

  it('rechaza dias de atraso negativos', () => {
    expect(() => new DiasAtraso(-1)).toThrow(
      DiasAtrasoInvalidoException
    );
  });
});