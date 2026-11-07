import { crearApp } from "./app.js";
import { pool } from "../persistencia/conexion.js";
const app = crearApp();
const servidor = app.listen(
  Number(process.env.PORT ?? 3000),
  process.env.HOST ?? "127.0.0.1",
  () => console.log("Crédito Vecino: aplicación y API listas"),
);
let cerrando = false;
async function cerrar() {
  if (cerrando) return;
  cerrando = true;
  const limite = setTimeout(() => {
    servidor.closeAllConnections();
    process.exit(1);
  }, 10000);
  limite.unref();
  try {
    await app.locals.cerrar();
    await new Promise<void>((resolver, rechazar) =>
      servidor.close((e) => (e ? rechazar(e) : resolver())),
    );
    await pool.end();
  } catch (e) {
    console.error("No se completó el cierre del servidor", e);
    process.exitCode = 1;
  } finally {
    clearTimeout(limite);
  }
}
process.on("SIGTERM", () => {
  void cerrar();
});
process.on("SIGINT", () => {
  void cerrar();
});
