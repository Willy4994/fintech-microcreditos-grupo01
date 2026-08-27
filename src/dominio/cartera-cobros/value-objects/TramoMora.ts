import { DiasAtraso } from './DiasAtraso.js';

export enum TipoTramoMora {
  SIN_MORA = 'SIN_MORA',
  MORA_1 = 'MORA_1',
  MORA_2 = 'MORA_2',
  MORA_3 = 'MORA_3',
  VENCIDO = 'VENCIDO',
}

export class TramoMora {
  private readonly tipo: TipoTramoMora;

  private constructor(tipo: TipoTramoMora) {
    this.tipo = tipo;
  }

  static desdeDiasAtraso(diasAtraso: DiasAtraso): TramoMora {
    const dias = diasAtraso.obtenerValor();

    if (dias === 0) {
      return new TramoMora(TipoTramoMora.SIN_MORA);
    }

    if (dias <= 30) {
      return new TramoMora(TipoTramoMora.MORA_1);
    }

    if (dias <= 60) {
      return new TramoMora(TipoTramoMora.MORA_2);
    }

    if (dias <= 90) {
      return new TramoMora(TipoTramoMora.MORA_3);
    }

    return new TramoMora(TipoTramoMora.VENCIDO);
  }

  obtenerTipo(): TipoTramoMora {
    return this.tipo;
  }

  esIgualA(tipo: TipoTramoMora): boolean {
    return this.tipo === tipo;
  }
}