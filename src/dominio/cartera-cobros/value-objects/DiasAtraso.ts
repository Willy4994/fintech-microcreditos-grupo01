import { DomainException } from '../../shared/exceptions/DomainException.js';

export class DiasAtraso {
  private readonly valor: number;

  constructor(valor: number) {
    if (!Number.isInteger(valor)) {
      throw new DiasAtrasoInvalidoException(
        'Los días de atraso deben ser un número entero.'
      );
    }

    if (valor < 0) {
      throw new DiasAtrasoInvalidoException(
        'Los días de atraso no pueden ser negativos.'
      );
    }

    this.valor = valor;
  }

  obtenerValor(): number {
    return this.valor;
  }

  esCero(): boolean {
    return this.valor === 0;
  }

  esMayorQue(dias: number): boolean {
    return this.valor > dias;
  }
}

export class DiasAtrasoInvalidoException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}