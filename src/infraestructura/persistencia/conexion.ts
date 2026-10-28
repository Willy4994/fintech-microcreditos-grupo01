import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? "credito_vecino",
  user: process.env.PGUSER ?? "willi",
  password: process.env.PGPASSWORD,
  max: 10,
});

export async function verificarConexion(): Promise<void> {
  const resultado = await pool.query(
    "SELECT current_database() AS base_datos, current_user AS usuario"
  );

  console.log("Conexión exitosa con PostgreSQL");
  console.log(resultado.rows[0]);
}