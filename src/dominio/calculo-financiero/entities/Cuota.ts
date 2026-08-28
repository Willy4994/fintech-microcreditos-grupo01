import { Dinero } from "../../shared/value-objects/Dinero.js";

export class Cuota {
  private constructor(
    public readonly numero: number,
    public readonly monto: Dinero,
    public readonly interes: Dinero,
    public readonly amortizacionCapital: Dinero,
    public readonly saldo: Dinero
  ) {}

  static crear(
    numero: number,
    monto: Dinero,
    interes: Dinero,
    amortizacionCapital: Dinero,
    saldo: Dinero
  ): Cuota {
    if (!Number.isInteger(numero) || numero <= 0) {
      throw new Error(
        "El número de cuota debe ser un entero positivo"
      );
    }

    return new Cuota(
      numero,
      monto,
      interes,
      amortizacionCapital,
      saldo
    );
  }
}