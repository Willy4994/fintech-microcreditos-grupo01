import { Decimal} from "decimal.js";

export class TasaMensual {
  private constructor(
    private readonly valor: Decimal
  ) {}

  static crear(valor: Decimal): TasaMensual {
    if (valor.isNegative()) {
      throw new Error(
        "La tasa mensual no puede ser negativa"
      );
    }

    return new TasaMensual(valor);
  }

  obtenerValor(): Decimal {
    return this.valor;
  }

  esCero(): boolean {
    return this.valor.isZero();
  }
}