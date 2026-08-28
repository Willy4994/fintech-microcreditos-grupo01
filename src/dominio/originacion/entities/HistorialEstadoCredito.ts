import type { NombreEstadoCredito } from
  "../states/EstadoCredito.js";

export interface ContextoTransicionCredito {
  readonly fecha: Date;
  readonly actor: string;
  readonly motivo: string;
}

export interface CambioEstadoCredito {
  readonly estadoAnterior: NombreEstadoCredito | null;
  readonly estadoNuevo: NombreEstadoCredito;
  readonly fecha: Date;
  readonly actor: string;
  readonly motivo: string;
}
