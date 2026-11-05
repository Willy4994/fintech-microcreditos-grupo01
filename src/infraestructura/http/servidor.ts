import { crearApp } from "./app.js";
import { pool } from "../persistencia/conexion.js";
const servidor = crearApp().listen(
  Number(process.env.PORT ?? 3000),
  process.env.HOST ?? "127.0.0.1",
  () => console.log("API Crédito Vecino lista"),
);
process.on("SIGTERM", () =>
  servidor.close(() => {
    void pool.end();
  }),
);
