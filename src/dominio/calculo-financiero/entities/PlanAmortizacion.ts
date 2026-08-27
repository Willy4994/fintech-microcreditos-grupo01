import { Cuota } from "./Cuota.js";
import { Dinero } from "../../shared/value-objects/Dinero.js";

export class PlanAmortizacion {
  private constructor(
    public readonly cuotas: readonly Cuota[]
  ) {}

  static crear(cuotas: Cuota[]): PlanAmortizacion {
    if (cuotas.length === 0) {
      throw new Error(
        "El plan de amortización debe tener al menos una cuota"
      );
    }

    return new PlanAmortizacion([...cuotas]);
  }

  obtenerCuotas(): readonly Cuota[] {
    return this.cuotas;
  }

  obtenerCantidadCuotas(): number {
    return this.cuotas.length;
  }

  obtenerUltimaCuota(): Cuota {
  return this.cuotas[this.cuotas.length - 1];
}

obtenerSaldoFinal(): Dinero {
  return this.cuotas[
    this.cuotas.length - 1
  ].saldo;
}

estaLiquidado(): boolean {
  return this.obtenerSaldoFinal().esCero();
}
}