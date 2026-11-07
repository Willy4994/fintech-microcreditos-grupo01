import { crearSesiones } from "./sesiones.js";
import path from "node:path";
import { existsSync } from "node:fs";
import {
  simulacionSchema,
  decisionSchema,
  cierreSchema,
  chatSchema,
} from "../../contratos/final.js";
import express, { type ErrorRequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ConsultasGerenciales } from "../../aplicacion/servicios/ConsultasGerenciales.js";
import { RepositorioCarteraPg } from "../persistencia/RepositorioCarteraPg.js";
import { OperacionesPg } from "../../aplicacion/servicios/OperacionesPg.js";
import { simular } from "../../aplicacion/servicios/MotorCartera.js";
import {
  ErrorAplicacion,
  fechaSchema,
  idSchema,
} from "../../aplicacion/errores.js";
import { ServicioAsistente } from "../../asistente/ServicioAsistente.js";
import { pool } from "../persistencia/conexion.js";
export function crearApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));
  const consultas = new ConsultasGerenciales(new RepositorioCarteraPg());
  const operaciones = new OperacionesPg();
  const asistente = new ServicioAsistente();
  app.locals.cerrar = () => asistente.cerrar();
  const { humano, gerencia, actor } = crearSesiones(app);
  app.get("/api/health", (_req, res) =>
    res.json({ estado: "OK", servicio: "Crédito Vecino", version: "2.0.0" }),
  );
  app.get("/api/clientes/etiquetas", humano, async (_req, res) =>
    res.json(
      (
        await pool.query(
          "SELECT id_cliente,nombre_completo FROM clientes ORDER BY nombre_completo",
        )
      ).rows,
    ),
  );
  app.get("/api/creditos", async (_req, res) => {
    const d = await new RepositorioCarteraPg().leer();
    res.json(d.creditos);
  });
  app.get("/api/creditos/:id/cliente", humano, async (req, res) => {
    const r = await pool.query(
      "SELECT cl.id_cliente,cl.nombre_completo FROM clientes cl JOIN creditos c ON c.id_cliente=cl.id_cliente WHERE c.id_credito=$1",
      [idSchema.parse(req.params.id)],
    );
    if (!r.rows[0])
      throw new ErrorAplicacion("NO_ENCONTRADO", "Crédito inexistente", 404);
    res.json(r.rows[0]);
  });
  app.get("/api/creditos/:id", async (req, res) =>
    res.json(
      await consultas.credito(
        idSchema.parse(req.params.id),
        fechaSchema.parse(req.query.fecha),
      ),
    ),
  );
  app.get("/api/creditos/:id/estado-cuenta", async (req, res) =>
    res.json(
      await consultas.credito(
        idSchema.parse(req.params.id),
        fechaSchema.parse(req.query.fecha),
      ),
    ),
  );
  app.get("/api/creditos/:id/mora/:cuota", async (req, res) => {
    const c = await consultas.credito(
      idSchema.parse(req.params.id),
      fechaSchema.parse(req.query.fecha),
    );
    const q = c.cuotas.find((q) => q.numero === Number(req.params.cuota));
    if (!q)
      throw new ErrorAplicacion("NO_ENCONTRADO", "Cuota inexistente", 404);
    res.json(q);
  });
  app.get("/api/creditos/:id/amortizacion", async (req, res) => {
    const c = await consultas.credito(
      idSchema.parse(req.params.id),
      fechaSchema.parse(req.query.fecha),
    );
    res.json(c.cuotas);
  });
  app.get("/api/cartera/creditos", async (req, res) =>
    res.json(
      await consultas.listar(
        fechaSchema.parse(req.query.fecha),
        z
          .enum([
            "MORA_1",
            "MORA_2",
            "MORA_3",
            "VENCIDO",
            "REESTRUCTURADO",
            "INCOBRABLE",
            "SIN_MORA",
          ])
          .optional()
          .parse(req.query.tramo),
      ),
    ),
  );
  app.get("/api/cartera", async (req, res) =>
    res.json(await consultas.cartera(fechaSchema.parse(req.query.fecha))),
  );
  app.get("/api/morosos", async (req, res) =>
    res.json(
      await consultas.morosos(
        fechaSchema.parse(req.query.fecha),
        z
          .enum(["MORA_1", "MORA_2", "MORA_3", "VENCIDO"])
          .optional()
          .parse(req.query.tramo),
      ),
    ),
  );
  app.get("/api/vencimientos", async (req, res) =>
    res.json(
      await consultas.vencimientos(
        fechaSchema.parse(req.query.fecha),
        z.coerce.number().int().min(1).max(366).parse(req.query.dias),
      ),
    ),
  );
  app.get("/api/cierres", async (req, res) => {
    const desde = fechaSchema.parse(req.query.desde),
      hasta = fechaSchema.parse(req.query.hasta);
    const persistido = await pool.query(
      "SELECT resultado FROM cierres WHERE desde=$1 AND hasta=$2",
      [desde, hasta],
    );
    res.json({
      ...(persistido.rows[0]?.resultado ??
        (await consultas.cierre(desde, hasta))),
      persistido: !!persistido.rows[0],
    });
  });
  app.post("/api/simulaciones", (req, res) => {
    const p = simulacionSchema.parse(req.body);
    res.json(simular(p.capital_centavos, p.tna_bps, p.plazo_meses, p.fecha));
  });
  app.post("/api/originaciones", humano, async (req, res) =>
    res
      .status(201)
      .json(await operaciones.originar(req.body, actor(req) ?? "asesor")),
  );
  app.post("/api/pagos/propuestas", async (req, res) =>
    res.status(202).json(await operaciones.proponer(req.body)),
  );
  app.get("/api/aprobaciones", humano, async (_req, res) =>
    res.json(
      (
        await pool.query(
          "SELECT id,operacion,parametros,estado,fecha_solicitud,expira_en,resultado FROM solicitudes_aprobacion_mcp ORDER BY fecha_solicitud DESC LIMIT 100",
        )
      ).rows,
    ),
  );
  app.post("/api/aprobaciones/:id/decision", humano, async (req, res) => {
    const p = decisionSchema.parse(req.body);
    res.json(
      await operaciones.decidir(
        idSchema.parse(req.params.id),
        p.aprobar,
        actor(req) ?? p.actor,
      ),
    );
  });
  app.post("/api/cierres", humano, gerencia, async (req, res) => {
    const p = cierreSchema.parse(req.body);
    res.json(
      await operaciones.generarCierre(p.desde, p.hasta, actor(req) ?? p.actor),
    );
  });
  app.post("/api/chat", humano, gerencia, async (req, res) => {
    const p = chatSchema.parse(req.body);
    res.json(await asistente.conversar(p.pregunta, p.fecha, p.sesion));
  });
  const sitio = path.resolve("frontend/dist");
  if (existsSync(path.join(sitio, "index.html"))) {
    app.use(express.static(sitio));
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api/"))
        res.sendFile(path.join(sitio, "index.html"));
      else next();
    });
  }
  app.use((_req, res) =>
    res
      .status(404)
      .json({ codigo: "NO_ENCONTRADO", mensaje: "Ruta inexistente" }),
  );
  const errores: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    const correlacionId = randomUUID();
    if (error instanceof z.ZodError) {
      res.status(400).json({
        codigo: "ENTRADA_INVALIDA",
        mensaje: "Datos inválidos",
        detalles: error.issues,
        correlacionId,
      });
      return;
    }
    if (error instanceof ErrorAplicacion) {
      res.status(error.estado).json({
        codigo: error.codigo,
        mensaje: error.message,
        detalles: error.detalles,
        correlacionId,
      });
      return;
    }
    if (error instanceof SyntaxError) {
      res.status(400).json({
        codigo: "JSON_INVALIDO",
        mensaje: "JSON inválido",
        correlacionId,
      });
      return;
    }
    const codigo = (error as { code?: string })?.code;
    if (codigo === "23505" || codigo === "23503") {
      res.status(409).json({
        codigo: "CONFLICTO_DATOS",
        mensaje: "Identificador duplicado o referencia inexistente",
        correlacionId,
      });
      return;
    }
    console.error({ correlacionId, error });
    res.status(500).json({
      codigo: "ERROR_INTERNO",
      mensaje: "No fue posible completar la operación",
      correlacionId,
    });
  };
  app.use(errores);
  return app;
}
