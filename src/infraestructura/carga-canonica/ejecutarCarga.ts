import { pool } from "../persistencia/conexion.js";
import { cargarDatosCanonicos } from "./cargarDatosCanonicos.js";

async function main(): Promise<void> {
  try {
    await cargarDatosCanonicos();
  } catch (error) {
    console.error("Error durante la carga canónica:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await main();