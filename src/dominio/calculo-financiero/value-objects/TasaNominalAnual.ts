import Decimal from "decimal.js";

export class TasaNominalAnual {
  private constructor(
    private readonly porcentaje: Decimal
  ) {}

  static crear(porcentaje: number): TasaNominalAnual {
    if (porcentaje < 0) {
      throw new Error(
        "La tasa nominal anual no puede ser negativa"
      );
    }

    return new TasaNominalAnual(
      new Decimal(porcentaje)
    );
  }

  obtenerPorcentaje(): Decimal {
    return this.porcentaje;
  }

  obtenerTasaMensual(): TasaMensual {
    const tasaMensual = this.porcentaje
        .dividedBy(100)
     .dividedBy(12);

    return TasaMensual.crear(tasaMensual);
  }
}