import { pool } from "../conexion.js";

export interface Credito {
  id_credito: string;
  id_cliente: string;
  nombre_cliente: string;
  id_asesor: string;
  nombre_asesor: string;
  id_politica: string;
  fecha_desembolso: string;
  capital_centavos: string;
  plazo_meses: number;
  tna_bps: number;
  reestructurado: boolean;
}

export async function obtenerCreditos(): Promise<Credito[]> {
  const resultado = await pool.query<Credito>(
    `SELECT
        c.id_credito,
        c.id_cliente,
        cl.nombre_completo AS nombre_cliente,
        c.id_asesor,
        a.nombre_completo AS nombre_asesor,
        c.id_politica,
        TO_CHAR(c.fecha_desembolso, 'YYYY-MM-DD') AS fecha_desembolso,
        c.capital_centavos::text AS capital_centavos,
        c.plazo_meses,
        c.tna_bps,
        c.reestructurado
     FROM creditos c
     INNER JOIN clientes cl
       ON c.id_cliente = cl.id_cliente
     INNER JOIN asesores a
       ON c.id_asesor = a.id_asesor
     ORDER BY c.id_credito`
  );

  return resultado.rows;
}

export async function obtenerCreditoPorId(
  idCredito: string
): Promise<Credito | null> {
  const resultado = await pool.query<Credito>(
    `SELECT
        c.id_credito,
        c.id_cliente,
        cl.nombre_completo AS nombre_cliente,
        c.id_asesor,
        a.nombre_completo AS nombre_asesor,
        c.id_politica,
        TO_CHAR(c.fecha_desembolso, 'YYYY-MM-DD') AS fecha_desembolso,
        c.capital_centavos::text AS capital_centavos,
        c.plazo_meses,
        c.tna_bps,
        c.reestructurado
     FROM creditos c
     INNER JOIN clientes cl
       ON c.id_cliente = cl.id_cliente
     INNER JOIN asesores a
       ON c.id_asesor = a.id_asesor
     WHERE c.id_credito = $1`,
    [idCredito]
  );

  return resultado.rows[0] ?? null;
}

export async function obtenerCreditosPorCliente(
  idCliente: string
): Promise<Credito[]> {
  const resultado = await pool.query<Credito>(
    `SELECT
        c.id_credito,
        c.id_cliente,
        cl.nombre_completo AS nombre_cliente,
        c.id_asesor,
        a.nombre_completo AS nombre_asesor,
        c.id_politica,
        TO_CHAR(c.fecha_desembolso, 'YYYY-MM-DD') AS fecha_desembolso,
        c.capital_centavos::text AS capital_centavos,
        c.plazo_meses,
        c.tna_bps,
        c.reestructurado
     FROM creditos c
     INNER JOIN clientes cl
       ON c.id_cliente = cl.id_cliente
     INNER JOIN asesores a
       ON c.id_asesor = a.id_asesor
     WHERE c.id_cliente = $1
     ORDER BY c.fecha_desembolso, c.id_credito`,
    [idCliente]
  );

  return resultado.rows;
}