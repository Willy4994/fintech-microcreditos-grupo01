import { pool } from "../conexion.js";

export interface PoliticaMora {
  id_politica: string;
  nombre: string;
  tipo: "plana" | "escalonada";
  vigencia_desde: string | null;
  vigencia_hasta: string | null;
  configuracion: Record<string, unknown>;
}

export interface ConfiguracionFinanciera {
  id_configuracion: string;
  version: string;
  moneda: string;
  base_conteo: string;
  parametros: Record<string, unknown>;
}

export async function obtenerPoliticas(): Promise<PoliticaMora[]> {
  const resultado = await pool.query<PoliticaMora>(
    `SELECT
        id_politica,
        nombre,
        tipo,
        TO_CHAR(vigencia_desde, 'YYYY-MM-DD') AS vigencia_desde,
        TO_CHAR(vigencia_hasta, 'YYYY-MM-DD') AS vigencia_hasta,
        configuracion
     FROM politicas_mora
     ORDER BY id_politica`
  );

  return resultado.rows;
}

export async function obtenerPoliticaPorId(
  idPolitica: string
): Promise<PoliticaMora | null> {
  const resultado = await pool.query<PoliticaMora>(
    `SELECT
        id_politica,
        nombre,
        tipo,
        TO_CHAR(vigencia_desde, 'YYYY-MM-DD') AS vigencia_desde,
        TO_CHAR(vigencia_hasta, 'YYYY-MM-DD') AS vigencia_hasta,
        configuracion
     FROM politicas_mora
     WHERE id_politica = $1`,
    [idPolitica]
  );

  return resultado.rows[0] ?? null;
}

export async function obtenerPoliticaPorFecha(
  fecha: string
): Promise<PoliticaMora | null> {
  const resultado = await pool.query<PoliticaMora>(
    `SELECT
        id_politica,
        nombre,
        tipo,
        TO_CHAR(vigencia_desde, 'YYYY-MM-DD') AS vigencia_desde,
        TO_CHAR(vigencia_hasta, 'YYYY-MM-DD') AS vigencia_hasta,
        configuracion
     FROM politicas_mora
     WHERE (vigencia_desde IS NULL OR vigencia_desde <= $1::date)
       AND (vigencia_hasta IS NULL OR vigencia_hasta >= $1::date)`,
    [fecha]
  );

  if (resultado.rows.length > 1) {
    throw new Error(
      `Existen varias políticas aplicables a la fecha ${fecha}.`
    );
  }

  return resultado.rows[0] ?? null;
}

export async function obtenerConfiguracionFinanciera():
  Promise<ConfiguracionFinanciera | null> {

  const resultado = await pool.query<ConfiguracionFinanciera>(
    `SELECT
        id_configuracion::text AS id_configuracion,
        version,
        moneda,
        base_conteo,
        parametros
     FROM configuracion_financiera
     ORDER BY id_configuracion DESC
     LIMIT 1`
  );

  return resultado.rows[0] ?? null;
}