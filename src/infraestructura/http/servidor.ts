import express from "express";
import { rutasCreditos } from "./rutas/creditos.js";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    estado: "OK",
    servicio: "Credito Vecino API"
  });
});

app.use("/api/creditos", rutasCreditos);

const puerto = Number(process.env.PORT ?? 3000);

app.listen(puerto, () => {
  console.log(
    `API Crédito Vecino ejecutándose en el puerto ${puerto}`
  );
});