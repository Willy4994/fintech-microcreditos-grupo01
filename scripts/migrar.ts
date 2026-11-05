import { readdir, readFile } from "node:fs/promises";
import { pool } from "../src/infraestructura/persistencia/conexion.js";
try {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS migraciones(nombre TEXT PRIMARY KEY,aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now())",
  );
  for (const nombre of (await readdir("database/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    if (
      (await pool.query("SELECT 1 FROM migraciones WHERE nombre=$1", [nombre]))
        .rowCount
    )
      continue;
    const db = await pool.connect();
    try {
      // Una conexión mantiene atómico el SQL y su registro.
      await db.query("BEGIN");
      await db.query("SELECT pg_advisory_xact_lock(370040)");
      if (
        !(await db.query("SELECT 1 FROM migraciones WHERE nombre=$1", [nombre]))
          .rowCount
      ) {
        const sql = (await readFile(`database/migrations/${nombre}`, "utf8"))
          .replace(/^BEGIN;\s*$/gm, "")
          .replace(/^COMMIT;\s*$/gm, "");
        await db.query(sql);
        await db.query("INSERT INTO migraciones(nombre) VALUES($1)", [nombre]);
      }
      await db.query("COMMIT");
      console.log(`Migración ${nombre}: OK`);
    } catch (e) {
      await db.query("ROLLBACK");
      throw e;
    } finally {
      db.release();
    }
  }
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
