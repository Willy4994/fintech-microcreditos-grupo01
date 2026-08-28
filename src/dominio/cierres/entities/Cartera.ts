import { DiasAtraso } from
  "../../cartera-cobros/value-objects/DiasAtraso.js";
import { Dinero } from
  "../../shared/value-objects/Dinero.js";
import type { Moneda } from
  "../../shared/value-objects/Moneda.js";

export interface PosicionCartera {
  readonly creditoId: string;
  readonly saldoCapital: Dinero;
  readonly diasAtraso: DiasAtraso;
  readonly reestructurado: boolean;
  readonly incobrable: boolean;
  readonly declaradoIncobrableEnPeriodo: boolean;
}

export class Cartera {
  private readonly creditos: PosicionCartera[] = [];

  constructor(
    public readonly id: string,
    public readonly fechaCorte: Date,
    public readonly moneda: Moneda = "GTQ"
  ) {}

  agregarCredito(credito: PosicionCartera): void {
    if (
      this.creditos.some(
        (existente) => existente.creditoId === credito.creditoId
      )
    ) {
      throw new Error(
        `El crédito ${credito.creditoId} ya pertenece a la cartera`
      );
    }

    if (credito.saldoCapital.moneda !== this.moneda) {
      throw new Error(
        "La moneda del crédito debe coincidir con la cartera"
      );
    }

    if (
      credito.declaradoIncobrableEnPeriodo &&
      !credito.incobrable
    ) {
      throw new Error(
        "Un crédito declarado incobrable en el período debe ser incobrable"
      );
    }

    this.creditos.push(credito);
  }

  cantidadCreditos(): number {
    return this.creditos.length;
  }

  obtenerCreditos(): readonly PosicionCartera[] {
    return [...this.creditos];
  }
}
