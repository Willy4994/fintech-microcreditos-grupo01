export class SolicitudCreditoId {
  private constructor(
    public readonly valor: string
  ) {}

  static crear(valor: string): SolicitudCreditoId {
    const normalizado = valor.trim();

    if (normalizado.length === 0) {
      throw new Error(
        "El identificador de la solicitud es obligatorio"
      );
    }

    return new SolicitudCreditoId(normalizado);
  }

  esIgualA(otro: SolicitudCreditoId): boolean {
    return this.valor === otro.valor;
  }

  toString(): string {
    return this.valor;
  }
}