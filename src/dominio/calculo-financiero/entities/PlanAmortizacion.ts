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
    const ultimaCuota = this.cuotas.at(-1);

    if (ultimaCuota === undefined) {
      throw new Error(
        "El plan de amortización no contiene cuotas"
      );
    }

    return ultimaCuota;
  }

  obtenerSaldoFinal(): Dinero {
    return this.obtenerUltimaCuota().saldo;
  }

  estaLiquidado(): boolean {
    return this.obtenerSaldoFinal().esCero();
  }
}
