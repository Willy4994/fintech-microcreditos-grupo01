import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, copyFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { verificarIntegridad } from "../src/infraestructura/carga-canonica/verificarIntegridad.js";
import { validarEventos } from "../src/infraestructura/carga-canonica/validarEventos.js";
const original = process.env.CV_DATA_DIR;
const temporales: string[] = [];
afterEach(async () => {
  if (original === undefined) delete process.env.CV_DATA_DIR;
  else process.env.CV_DATA_DIR = original;
  await Promise.all(
    temporales.splice(0).map((p) => rm(p, { recursive: true, force: true })),
  );
});
describe("Carga canónica y ruta configurable", () => {
  it("verifica SHA y cuenta eventos con deduplicación", async () => {
    expect((await verificarIntegridad()).verificado).toBe(true);
    expect(await validarEventos()).toMatchObject({
      totalEventos: 363,
      clientes: 60,
      desembolsos: 75,
      pagos: 228,
      pagosUnicos: 226,
      pagosDuplicados: 2,
    });
  });
  it("usa CV_DATA_DIR y rechaza un byte alterado antes de cargar", async () => {
    const ruta = await mkdtemp(path.join(tmpdir(), "cv-carga-"));
    temporales.push(ruta);
    await copyFile(
      "datos/datos-proyecto-final/eventos.sha256",
      path.join(ruta, "eventos.sha256"),
    );
    await writeFile(path.join(ruta, "eventos.jsonl"), "alterado");
    process.env.CV_DATA_DIR = ruta;
    await expect(verificarIntegridad()).rejects.toThrow("SHA-256 falló");
  });
});
