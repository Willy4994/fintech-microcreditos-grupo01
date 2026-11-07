import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Express, RequestHandler, Request } from "express";
import { z } from "zod";
import { ErrorAplicacion } from "../../aplicacion/errores.js";
export const accesoSchema = z
  .object({
    actor: z.string().trim().min(2).max(80),
    perfil: z.enum(["asesor", "gerencia"]),
  })
  .strict();
interface Sesion {
  actor: string;
  perfil: "asesor" | "gerencia";
  expira: number;
}
export function crearSesiones(app: Express) {
  const sesiones = new Map<string, Sesion>();
  const id = (req: Request) =>
    req.headers.cookie
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("cv_sesion="))
      ?.slice(10);
  const sesion = (req: Request) => {
    const clave = id(req);
    const s = clave ? sesiones.get(clave) : undefined;
    if (s && s.expira > Date.now()) return s;
    if (clave) sesiones.delete(clave);
    return undefined;
  };
  const verificarToken: RequestHandler = (req, _res, next) => {
    const esperado = process.env.HUMAN_API_TOKEN,
      recibido = req.get("Authorization")?.replace(/^Bearer /, "") ?? "";
    if (!esperado || esperado.length < 24)
      return next(
        new ErrorAplicacion(
          "CONFIGURACION_HUMANA",
          "Configure la credencial humana en el servidor",
          503,
        ),
      );
    const a = Buffer.from(recibido),
      b = Buffer.from(esperado);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      return next(
        new ErrorAplicacion(
          "NO_AUTORIZADO",
          "La clave de acceso no es válida",
          403,
        ),
      );
    next();
  };
  const origenSeguro = (req: Request) => {
    const origen = req.get("origin");
    if (!origen) return true;
    try {
      return new URL(origen).host === req.get("host");
    } catch {
      return false;
    }
  };
  app.post("/api/sesion", verificarToken, (req, res) => {
    if (!origenSeguro(req))
      throw new ErrorAplicacion("ORIGEN_INVALIDO", "Origen no permitido", 403);
    const p = accesoSchema.parse(req.body);
    for (const [k, s] of sesiones)
      if (s.expira <= Date.now()) sesiones.delete(k);
    if (sesiones.size >= 100)
      throw new ErrorAplicacion(
        "LIMITE_SESIONES",
        "Demasiadas sesiones activas",
        429,
      );
    const anterior = id(req);
    if (anterior) sesiones.delete(anterior);
    const clave = randomBytes(32).toString("hex");
    sesiones.set(clave, { ...p, expira: Date.now() + 8 * 3600000 });
    res.cookie("cv_sesion", clave, {
      httpOnly: true,
      sameSite: "strict",
      secure: req.secure,
      maxAge: 8 * 3600000,
      path: "/",
    });
    res.json(p);
  });
  app.get("/api/sesion", (req, res) => {
    const s = sesion(req);
    if (!s) {
      res.status(401).json({
        codigo: "SESION_REQUERIDA",
        mensaje: "Inicia sesión para continuar",
      });
      return;
    }
    res.json({ actor: s.actor, perfil: s.perfil });
  });
  app.delete("/api/sesion", (req, res) => {
    if (!origenSeguro(req))
      throw new ErrorAplicacion("ORIGEN_INVALIDO", "Origen no permitido", 403);
    const clave = id(req);
    if (clave) sesiones.delete(clave);
    res.clearCookie("cv_sesion", { path: "/" });
    res.status(204).end();
  });
  const humano: RequestHandler = (req, res, next) => {
    if (sesion(req)) {
      if (!origenSeguro(req))
        return next(
          new ErrorAplicacion("ORIGEN_INVALIDO", "Origen no permitido", 403),
        );
      return next();
    }
    verificarToken(req, res, next);
  };
  const gerencia: RequestHandler = (req, _res, next) => {
    const s = sesion(req);
    if (s && s.perfil !== "gerencia")
      return next(
        new ErrorAplicacion(
          "PERFIL_NO_AUTORIZADO",
          "Esta función requiere perfil gerencial",
          403,
        ),
      );
    next();
  };
  return { humano, gerencia, actor: (req: Request) => sesion(req)?.actor };
}
