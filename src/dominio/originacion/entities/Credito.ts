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

import { DiasAtraso } from
  "../../cartera-cobros/value-objects/DiasAtraso.js";

import { TramoMora } from
  "../../cartera-cobros/value-objects/TramoMora.js";

import type {
  CambioEstadoCredito,
  ContextoTransicionCredito
} from "./HistorialEstadoCredito.js";

export class Credito {
  private estado: EstadoCredito;
  private diasAtraso = new DiasAtraso(0);
  private readonly historialEstados: CambioEstadoCredito[] = [];
  private fueReestructurado = false;

  constructor(
    public readonly id: CreditoId,
    public readonly clienteId: ClienteId,
    public readonly solicitudId: SolicitudCreditoId,
    public readonly capital: Dinero,
    public readonly plazoMeses: number,
    contextoCreacion: ContextoTransicionCredito = {
      fecha: new Date(0),
      actor: "SISTEMA",
      motivo: "Creación del crédito",
    }
  ) {
    this.estado =
      new CreditoSolicitado();

    this.historialEstados.push({
      estadoAnterior: null,
      estadoNuevo: this.estado.nombre,
      fecha: new Date(contextoCreacion.fecha),
      actor: contextoCreacion.actor,
      motivo: contextoCreacion.motivo,
    });
  }

  obtenerEstado(): NombreEstadoCredito {
    return this.estado.nombre;
  }

  aprobar(contexto: ContextoTransicionCredito): void {
    this.cambiarEstado(this.estado.aprobar(), contexto);
  }

  rechazar(contexto: ContextoTransicionCredito): void {
    this.cambiarEstado(this.estado.rechazar(), contexto);
  }

  desembolsar(contexto: ContextoTransicionCredito): void {
    this.cambiarEstado(this.estado.desembolsar(), contexto);
  }

  activar(contexto: ContextoTransicionCredito): void {
    this.cambiarEstado(this.estado.activar(), contexto);
  }

  marcarEnMora(
    diasAtraso: DiasAtraso,
    contexto: ContextoTransicionCredito
  ): void {
    if (diasAtraso.esCero()) {
      throw new Error(
        "Un crédito en mora debe tener al menos un día de atraso"
      );
    }

    this.cambiarEstado(this.estado.marcarEnMora(), contexto);
    this.diasAtraso = diasAtraso;
  }

  registrarPago(
    diasAtrasoRestantes: DiasAtraso,
    contexto: ContextoTransicionCredito
  ): void {
    const estadoResultante = this.estado.registrarPago(
      diasAtrasoRestantes.obtenerValor()
    );

    this.cambiarEstado(estadoResultante, contexto);
    this.diasAtraso = diasAtrasoRestantes;
  }

  anular(contexto: ContextoTransicionCredito): void {
    this.cambiarEstado(this.estado.anular(), contexto);
  }

  reestructurar(contexto: ContextoTransicionCredito): void {
    this.cambiarEstado(this.estado.reestructurar(), contexto);
    this.fueReestructurado = true;
    this.diasAtraso = new DiasAtraso(0);
  }

  curar(contexto: ContextoTransicionCredito): void {
    this.cambiarEstado(this.estado.curar(), contexto);
    this.diasAtraso = new DiasAtraso(0);
  }

  cancelar(contexto: ContextoTransicionCredito): void {
    this.cambiarEstado(this.estado.cancelar(), contexto);
    this.diasAtraso = new DiasAtraso(0);
  }

  declararIncobrable(contexto: ContextoTransicionCredito): void {
    if (!this.diasAtraso.esMayorQue(120)) {
      throw new Error(
        "Solo puede declararse incobrable con más de 120 días de atraso"
      );
    }

    this.cambiarEstado(
      this.estado.declararIncobrable(),
      contexto
    );
  }

  obtenerTramoMora(): TramoMora {
    return TramoMora.desdeDiasAtraso(this.diasAtraso);
  }

  estaMarcadoComoReestructurado(): boolean {
    return this.fueReestructurado;
  }

  obtenerHistorialEstados(): readonly CambioEstadoCredito[] {
    return this.historialEstados.map((cambio) => ({
      ...cambio,
      fecha: new Date(cambio.fecha),
    }));
  }

  private cambiarEstado(
    estadoNuevo: EstadoCredito,
    contexto: ContextoTransicionCredito
  ): void {
    const estadoAnterior = this.estado.nombre;
    this.estado = estadoNuevo;

    if (estadoAnterior === estadoNuevo.nombre) {
      return;
    }

    this.historialEstados.push({
      estadoAnterior,
      estadoNuevo: estadoNuevo.nombre,
      fecha: new Date(contexto.fecha),
      actor: contexto.actor,
      motivo: contexto.motivo,
    });
  }
}
