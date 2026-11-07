import { afterEach, beforeEach, describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { crearSesiones } from "../src/infraestructura/http/sesiones.js";
import { ErrorAplicacion } from "../src/aplicacion/errores.js";
const previo = process.env.HUMAN_API_TOKEN;
const token = "solo-pruebas-no-es-una-credencial-real";
beforeEach(() => {
  process.env.HUMAN_API_TOKEN = token;
});
afterEach(() => {
  if (previo === undefined) delete process.env.HUMAN_API_TOKEN;
  else process.env.HUMAN_API_TOKEN = previo;
});
function aplicacion() {
  const app = express();
  app.use(express.json());
  const s = crearSesiones(app);
  app.get("/humano", s.humano, (_req, res) => res.json({ ok: true }));
  app.get("/gerencia", s.humano, s.gerencia, (_req, res) =>
    res.json({ ok: true }),
  );
  app.use(
    (
      e: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) =>
      res
        .status(e instanceof ErrorAplicacion ? e.estado : 400)
        .json({
          codigo: e instanceof ErrorAplicacion ? e.codigo : "ENTRADA_INVALIDA",
        }),
  );
  return app;
}
describe("Sesiones humanas para la interfaz", () => {
  it("no crea sesión con clave incorrecta", async () => {
    await request(aplicacion())
      .post("/api/sesion")
      .set("Authorization", "Bearer incorrecta")
      .send({ actor: "Prueba", perfil: "gerencia" })
      .expect(403);
  });
  it("crea cookie HttpOnly sin devolver el token y la invalida al salir", async () => {
    const app = aplicacion();
    const r = await request(app)
      .post("/api/sesion")
      .set("Authorization", `Bearer ${token}`)
      .send({ actor: "Prueba", perfil: "gerencia" })
      .expect(200);
    const cookies = r.headers["set-cookie"] as unknown as string[];
    expect(cookies[0]).toContain("HttpOnly");
    expect(cookies[0]).toContain("SameSite=Strict");
    expect(JSON.stringify(r.body)).not.toContain(token);
    const cookie = cookies[0]!.split(";")[0]!;
    await request(app).get("/humano").set("Cookie", cookie).expect(200);
    await request(app).delete("/api/sesion").set("Cookie", cookie).expect(204);
    await request(app).get("/api/sesion").set("Cookie", cookie).expect(401);
  });
  it("perfil asesor no puede acceder a gerencia", async () => {
    const app = aplicacion();
    const r = await request(app)
      .post("/api/sesion")
      .set("Authorization", `Bearer ${token}`)
      .send({ actor: "Asesor", perfil: "asesor" });
    const cookies = r.headers["set-cookie"] as unknown as string[];
    await request(app)
      .get("/gerencia")
      .set("Cookie", cookies[0]!.split(";")[0]!)
      .expect(403);
  });
  it("rechaza orígenes ajenos y mantiene la autorización de CLI", async () => {
    const app = aplicacion();
    await request(app)
      .post("/api/sesion")
      .set("Authorization", `Bearer ${token}`)
      .set("Origin", "http://otro-sitio.test")
      .send({ actor: "Prueba", perfil: "gerencia" })
      .expect(403);
    await request(app)
      .get("/humano")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });
});
