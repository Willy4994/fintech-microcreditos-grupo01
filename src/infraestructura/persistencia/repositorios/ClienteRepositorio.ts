import { pool } from "../conexion.js";

export interface Cliente {
  id_cliente: string;
  nombre_completo: string;
  dpi: string;
  telefono: string | null;
  municipio: string | null;
  fecha_alta: string;
}

export async function obtenerClientes(): Promise<Cliente[]> {
  const resultado = await pool.query<Cliente>(
    `SELECT
        id_cliente,
        nombre_completo,
        dpi,
        telefono,
        municipio,
        TO_CHAR(fecha_alta, 'YYYY-MM-DD') AS fecha_alta
     FROM clientes
     ORDER BY id_cliente`
  );

  return resultado.rows;
}

export async function obtenerClientePorId(
  idCliente: string
): Promise<Cliente | null> {
  const resultado = await pool.query<Cliente>(
    `SELECT
        id_cliente,
        nombre_completo,
        dpi,
        telefono,
        municipio,
        TO_CHAR(fecha_alta, 'YYYY-MM-DD') AS fecha_alta
     FROM clientes
     WHERE id_cliente = $1`,
    [idCliente]
  );

  return resultado.rows[0] ?? null;
}