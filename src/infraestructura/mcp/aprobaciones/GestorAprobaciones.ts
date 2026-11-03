import { randomUUID } from "node:crypto";

export type EstadoAprobacion =
  | "PENDIENTE"
  | "APROBADA"
  | "RECHAZADA";

export interface SolicitudAprobacion {
  id: string;
  operacion: string;
  parametros: Readonly<Record<string, unknown>>;
  motivo: string;
  estado: EstadoAprobacion;
  fechaSolicitud: string;
  fechaDecision?: string;
  autorizadoPor?: string;
  observacion?: string;
}

export interface NuevaSolicitudAprobacion {
  operacion: string;
  parametros: Record<string, unknown>;
  motivo: string;
}

export class GestorAprobaciones {
  private readonly solicitudes =
    new Map<string, SolicitudAprobacion>();

  solicitar(
    datos: NuevaSolicitudAprobacion
  ): SolicitudAprobacion {
    if (!datos.operacion.trim()) {
      throw new Error(
        "Debe indicar la operación solicitada"
      );
    }

    if (!datos.motivo.trim()) {
      throw new Error(
        "Debe indicar el motivo de la solicitud"
      );
    }

    const solicitud: SolicitudAprobacion = {
      id: randomUUID(),
      operacion: datos.operacion,
      parametros: structuredClone(datos.parametros),
      motivo: datos.motivo,
      estado: "PENDIENTE",
      fechaSolicitud: new Date().toISOString()
    };

    this.solicitudes.set(solicitud.id, solicitud);

    return structuredClone(solicitud);
  }

  consultar(
    id: string
  ): SolicitudAprobacion | undefined {
    const solicitud = this.solicitudes.get(id);

    return solicitud
      ? structuredClone(solicitud)
      : undefined;
  }

  listar(): SolicitudAprobacion[] {
    return Array.from(
      this.solicitudes.values(),
      (solicitud) => structuredClone(solicitud)
    );
  }

  aprobar(
    id: string,
    autorizadoPor: string,
    observacion?: string
  ): SolicitudAprobacion {
    return this.resolver(
      id,
      "APROBADA",
      autorizadoPor,
      observacion
    );
  }

  rechazar(
    id: string,
    autorizadoPor: string,
    observacion?: string
  ): SolicitudAprobacion {
    return this.resolver(
      id,
      "RECHAZADA",
      autorizadoPor,
      observacion
    );
  }

  private resolver(
    id: string,
    estado: "APROBADA" | "RECHAZADA",
    autorizadoPor: string,
    observacion?: string
  ): SolicitudAprobacion {
    const solicitud = this.solicitudes.get(id);

    if (!solicitud) {
      throw new Error(
        "La solicitud de aprobación no existe"
      );
    }

    if (solicitud.estado !== "PENDIENTE") {
      throw new Error(
        "La solicitud ya fue resuelta"
      );
    }

    if (!autorizadoPor.trim()) {
      throw new Error(
        "Debe identificar a la persona responsable"
      );
    }

    const actualizada: SolicitudAprobacion = {
  ...solicitud,
  estado,
  autorizadoPor,
  ...(observacion !== undefined ? { observacion } : {}),
  fechaDecision: new Date().toISOString()
};

    this.solicitudes.set(id, actualizada);

    return structuredClone(actualizada);
  }
}