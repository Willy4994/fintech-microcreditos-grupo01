import { pool } from "../conexion.js";

export interface Pago {
  id_pago: string;
  clave_idempotencia: string;
  id_credito: string;
  fecha: string;
  monto_centavos: string;
  canal: string;
  seq_evento: number;
}

const columnasPago = `
  id_pago::text AS id_pago,
  clave_idempotencia,
  id_credito,
  TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
  monto_centavos::text AS monto_centavos,
  canal,
  seq_evento
`;

export async function obtenerPagos(): Promise<Pago[]> {
  const resultado = await pool.query<Pago>(
    `SELECT ${columnasPago}
     FROM pagos
     ORDER BY fecha, id_pago`
  );

  return resultado.rows;
}

export async function obtenerPagoPorClave(
  claveIdempotencia: string
): Promise<Pago | null> {
  const resultado = await pool.query<Pago>(
    `SELECT ${columnasPago}
     FROM pagos
     WHERE clave_idempotencia = $1`,
    [claveIdempotencia]
  );

  return resultado.rows[0] ?? null;
}

export async function obtenerPagosPorCredito(
  idCredito: string
): Promise<Pago[]> {
  const resultado = await pool.query<Pago>(
    `SELECT ${columnasPago}
     FROM pagos
     WHERE id_credito = $1
     ORDER BY fecha, id_pago`,
    [idCredito]
  );

  return resultado.rows;
}