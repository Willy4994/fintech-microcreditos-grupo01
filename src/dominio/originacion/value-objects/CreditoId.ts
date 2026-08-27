export class CreditoId {
  private constructor(
    public readonly valor: string
  ) {}

  static crear(valor: string): CreditoId {
    const normalizado = valor.trim();

    if (normalizado.length === 0) {
      throw new Error(
        "El identificador del crédito es obligatorio"
      );
    }

    return new CreditoId(normalizado);
  }

  esIgualA(otro: CreditoId): boolean {
    return this.valor === otro.valor;
  }

  toString(): string {
    return this.valor;
  }
}