import { randomUUID } from "node:crypto";
import { pool } from "../../persistencia/conexion.js";

export type EstadoAprobacion =
  | "PENDIENTE"
  | "APROBADA"
  | "RECHAZADA";

export interface SolicitudAprobacion {
  id: string;
  operacion: string;
  parametros: Record<string, unknown>;
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

interface FilaAprobacion {
  id: string;
  operacion: string;
  parametros: Record<string, unknown>;
  motivo: string;
  estado: EstadoAprobacion;
  fecha_solicitud: Date;
  fecha_decision: Date | null;
  autorizado_por: string | null;
  observacion: string | null;
}

function convertirFila(
  fila: FilaAprobacion
): SolicitudAprobacion {
  return {
    id: fila.id,
    operacion: fila.operacion,
    parametros: fila.parametros,
    motivo: fila.motivo,
    estado: fila.estado,
    fechaSolicitud: fila.fecha_solicitud.toISOString(),
    ...(fila.fecha_decision !== null
      ? { fechaDecision: fila.fecha_decision.toISOString() }
      : {}),
    ...(fila.autorizado_por !== null
      ? { autorizadoPor: fila.autorizado_por }
      : {}),
    ...(fila.observacion !== null
      ? { observacion: fila.observacion }
      : {})
  };
}

export class RepositorioAprobaciones {
  async solicitar(
    datos: NuevaSolicitudAprobacion
  ): Promise<SolicitudAprobacion> {
    if (!datos.operacion.trim()) {
      throw new Error("Debe indicar la operación solicitada");
    }

    if (!datos.motivo.trim()) {
      throw new Error("Debe indicar el motivo de la solicitud");
    }

    const id = randomUUID();

    const resultado = await pool.query<FilaAprobacion>(
      `
      INSERT INTO solicitudes_aprobacion_mcp (
        id,
        operacion,
        parametros,
        motivo
      )
      VALUES ($1, $2, $3::jsonb, $4)
      RETURNING *
      `,
      [
        id,
        datos.operacion,
        JSON.stringify(datos.parametros),
        datos.motivo
      ]
    );

    const fila = resultado.rows[0];

    if (!fila) {
      throw new Error("No se pudo registrar la solicitud");
    }

    return convertirFila(fila);
  }

  async consultar(
    id: string
  ): Promise<SolicitudAprobacion | undefined> {
    const resultado = await pool.query<FilaAprobacion>(
      `
      SELECT *
      FROM solicitudes_aprobacion_mcp
      WHERE id = $1
      `,
      [id]
    );

    const fila = resultado.rows[0];

    return fila ? convertirFila(fila) : undefined;
  }

  async listar(): Promise<SolicitudAprobacion[]> {
    const resultado = await pool.query<FilaAprobacion>(
      `
      SELECT *
      FROM solicitudes_aprobacion_mcp
      ORDER BY fecha_solicitud DESC
      `
    );

    return resultado.rows.map(convertirFila);
  }

  async aprobar(
    id: string,
    autorizadoPor: string,
    observacion?: string
  ): Promise<SolicitudAprobacion> {
    return this.resolver(
      id,
      "APROBADA",
      autorizadoPor,
      observacion
    );
  }

  async rechazar(
    id: string,
    autorizadoPor: string,
    observacion?: string
  ): Promise<SolicitudAprobacion> {
    return this.resolver(
      id,
      "RECHAZADA",
      autorizadoPor,
      observacion
    );
  }

  private async resolver(
    id: string,
    estado: "APROBADA" | "RECHAZADA",
    autorizadoPor: string,
    observacion?: string
  ): Promise<SolicitudAprobacion> {
    if (!autorizadoPor.trim()) {
      throw new Error(
        "Debe identificar a la persona responsable"
      );
    }

    const cliente = await pool.connect();

    try {
      await cliente.query("BEGIN");

      const resultado = await cliente.query<FilaAprobacion>(
        `
        UPDATE solicitudes_aprobacion_mcp
        SET
          estado = $2,
          autorizado_por = $3,
          observacion = $4,
          fecha_decision = CURRENT_TIMESTAMP
        WHERE id = $1
          AND estado = 'PENDIENTE'
        RETURNING *
        `,
        [id, estado, autorizadoPor, observacion ?? null]
      );

      const fila = resultado.rows[0];

      if (!fila) {
        throw new Error(
          "La solicitud no existe o ya fue resuelta"
        );
      }

      await cliente.query(
        `
        INSERT INTO auditoria_aprobaciones_mcp (
          id_solicitud,
          accion,
          responsable,
          observacion
        )
        VALUES ($1, $2, $3, $4)
        `,
        [id, estado, autorizadoPor, observacion ?? null]
      );

      await cliente.query("COMMIT");

      return convertirFila(fila);

    } catch (error) {
      await cliente.query("ROLLBACK");
      throw error;

    } finally {
      cliente.release();
    }
  }
}