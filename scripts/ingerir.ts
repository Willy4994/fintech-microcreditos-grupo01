import { ServicioRag } from "../src/rag/ServicioRag.js";
import { pool } from "../src/infraestructura/persistencia/conexion.js";
try {
  console.log(await new ServicioRag().ingerir());
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
