import { pool, verificarConexion } from "./conexion.js";

async function main(): Promise<void> {
  try {
    await verificarConexion();
  } catch (error) {
    console.error("Error al conectar con PostgreSQL:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await main();