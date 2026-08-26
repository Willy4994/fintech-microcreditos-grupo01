import { Dinero } from '../../shared/value-objects/Dinero.js';

export enum ConceptoMovimiento {
  GASTOS = 'GASTOS',
  INTERES_MORATORIO = 'INTERES_MORATORIO',
  INTERES_CORRIENTE = 'INTERES_CORRIENTE',
  CAPITAL = 'CAPITAL',
  EXCEDENTE = 'EXCEDENTE',
}

export class Movimiento {
  constructor(
    private readonly concepto: ConceptoMovimiento,
    private readonly monto: Dinero
  ) {}

  obtenerConcepto(): ConceptoMovimiento {
    return this.concepto;
  }

  obtenerMonto(): Dinero {
    return this.monto;
  }
}