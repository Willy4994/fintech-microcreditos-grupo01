import type { EstadoSolicitud } from
  "../value-objects/EstadoSolicitud.js";

import { SolicitudCreditoId } from
  "../value-objects/SolicitudCreditoId.js";

import { ClienteId } from
  "../value-objects/ClienteId.js";

import { Dinero } from
  "../../shared/value-objects/Dinero.js";

export class SolicitudCredito {
  private estado: EstadoSolicitud;

  constructor(
    public readonly id: SolicitudCreditoId,
    public readonly clienteId: ClienteId,
    public readonly montoSolicitado: Dinero,
    public readonly plazoMeses: number,
    public readonly fechaSolicitud: Date
  ) {
    if (
      plazoMeses < 3 ||
      plazoMeses > 24 ||
      !Number.isInteger(plazoMeses)
    ) {
      throw new Error(
        "El plazo debe estar entre 3 y 24 meses"
      );
    }

    const minimo =
      Dinero.desdeCentavos(100_000);

    const maximo =
      Dinero.desdeCentavos(2_500_000);

    if (montoSolicitado.esMenorQue(minimo)) {
      throw new Error(
        "El monto mínimo solicitado es Q1,000.00"
      );
    }

    if (montoSolicitado.esMayorQue(maximo)) {
      throw new Error(
        "El monto máximo solicitado es Q25,000.00"
      );
    }

    this.estado = "PENDIENTE";
  }

  obtenerEstado(): EstadoSolicitud {
    return this.estado;
  }

  iniciarEvaluacion(): void {
    if (this.estado !== "PENDIENTE") {
      throw new Error(
        "Solo una solicitud pendiente puede iniciar evaluación"
      );
    }

    this.estado = "EN_EVALUACION";
  }

  aprobar(): void {
    if (this.estado !== "EN_EVALUACION") {
      throw new Error(
        "Solo una solicitud en evaluación puede aprobarse"
      );
    }

    this.estado = "APROBADA";
  }

  rechazar(): void {
    if (this.estado !== "EN_EVALUACION") {
      throw new Error(
        "Solo una solicitud en evaluación puede rechazarse"
      );
    }

    this.estado = "RECHAZADA";
  }

  anular(): void {
    if (
      this.estado === "APROBADA" ||
      this.estado === "RECHAZADA"
    ) {
      throw new Error(
        "Una solicitud resuelta no puede anularse"
      );
    }

    this.estado = "ANULADA";
  }
}