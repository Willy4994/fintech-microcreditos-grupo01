export class Cartera {
  private readonly creditos: string[] = [];

  constructor(
    public readonly id: string,
    public readonly fechaCorte: Date
  ) {}

  agregarCredito(creditoId: string): void {
    if (this.creditos.includes(creditoId)) {
      throw new Error(
        `El crédito ${creditoId} ya pertenece a la cartera`
      );
    }

    this.creditos.push(creditoId);
  }

  cantidadCreditos(): number {
    return this.creditos.length;
  }

  obtenerCreditos(): readonly string[] {
    return this.creditos;
  }
}