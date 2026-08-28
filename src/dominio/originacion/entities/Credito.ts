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
    contextoCreacion: ContextoTransicionCredito
  ) {
    this.validarContexto(contextoCreacion);

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

  aprobar(
    cumplePoliticaCredito: boolean,
    contexto: ContextoTransicionCredito
  ): void {
    if (!cumplePoliticaCredito) {
      throw new Error(
        "El crédito no cumple la política de aprobación"
      );
    }

    this.cambiarEstado(this.estado.aprobar(), contexto);
  }

  rechazar(contexto: ContextoTransicionCredito): void {
    this.cambiarEstado(this.estado.rechazar(), contexto);
  }

  desembolsar(
    capitalEntregado: boolean,
    contexto: ContextoTransicionCredito
  ): void {
    if (!capitalEntregado) {
      throw new Error(
        "No puede desembolsarse sin entregar el capital al cliente"
      );
    }

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

  reestructurar(
    comiteAutoriza: boolean,
    contexto: ContextoTransicionCredito
  ): void {
    if (!comiteAutoriza) {
      throw new Error(
        "La reestructuración requiere autorización del comité"
      );
    }

    this.cambiarEstado(this.estado.reestructurar(), contexto);
    this.fueReestructurado = true;
    this.diasAtraso = new DiasAtraso(0);
  }

  curar(
    cumplePoliticaCura: boolean,
    contexto: ContextoTransicionCredito
  ): void {
    if (!cumplePoliticaCura) {
      throw new Error(
        "El crédito no cumple la política de cura"
      );
    }

    this.cambiarEstado(this.estado.curar(), contexto);
    this.diasAtraso = new DiasAtraso(0);
  }

  cancelar(
    saldoCapitalRestante: Dinero,
    contexto: ContextoTransicionCredito
  ): void {
    if (saldoCapitalRestante.moneda !== this.capital.moneda) {
      throw new Error(
        "La moneda del saldo debe coincidir con la del crédito"
      );
    }

    if (!saldoCapitalRestante.esCero()) {
      throw new Error(
        "Solo puede cancelarse un crédito con saldo de capital cero"
      );
    }

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
    this.validarContexto(contexto);

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

  private validarContexto(
    contexto: ContextoTransicionCredito
  ): void {
    if (Number.isNaN(contexto.fecha.getTime())) {
      throw new Error("La fecha de la transición no es válida");
    }

    if (contexto.actor.trim().length === 0) {
      throw new Error("El actor de la transición es obligatorio");
    }

    if (contexto.motivo.trim().length === 0) {
      throw new Error("El motivo de la transición es obligatorio");
    }
  }
}
