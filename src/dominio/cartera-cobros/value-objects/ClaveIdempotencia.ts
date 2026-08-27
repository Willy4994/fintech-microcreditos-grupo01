import { DomainException } from '../../shared/exceptions/DomainException.js';

export class ClaveIdempotencia {
  private readonly valor: string;

  constructor(valor: string) {
    const valorNormalizado = valor.trim();

    if (valorNormalizado.length === 0) {
      throw new ClaveIdempotenciaInvalidaException(
        'La clave de idempotencia no puede estar vacía.'
      );
    }

    this.valor = valorNormalizado;
  }

  obtenerValor(): string {
    return this.valor;
  }

  esIgualA(otra: ClaveIdempotencia): boolean {
    return this.valor === otra.valor;
  }
}

export class ClaveIdempotenciaInvalidaException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}