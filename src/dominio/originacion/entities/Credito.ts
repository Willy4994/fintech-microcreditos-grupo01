import { CreditoId } from
  "../value-objects/CreditoId.js";

import { ClienteId } from
  "../value-objects/ClienteId.js";

import { SolicitudCreditoId } from
  "../value-objects/SolicitudCreditoId.js";

import { Dinero } from
  "../../shared/value-objects/Dinero.js";

import type {
  EstadoCredito,
  NombreEstadoCredito
} from "../states/EstadoCredito.js";

import { CreditoSolicitado } from
  "../states/CreditoSolicitado.js";

export class Credito {
  private estado: EstadoCredito;

  constructor(
    public readonly id: CreditoId,
    public readonly clienteId: ClienteId,
    public readonly solicitudId: SolicitudCreditoId,
    public readonly capital: Dinero,
    public readonly plazoMeses: number
  ) {
    this.estado =
      new CreditoSolicitado();
  }

  obtenerEstado(): NombreEstadoCredito {
    return this.estado.nombre;
  }

  aprobar(): void {
    this.estado =
      this.estado.aprobar();
  }

  rechazar(): void {
    this.estado =
      this.estado.rechazar();
  }

  desembolsar(): void {
    this.estado =
      this.estado.desembolsar();
  }
}