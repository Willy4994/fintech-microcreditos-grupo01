import { ClienteMcp } from "../src/asistente/ClienteMcp.js";
import { ServicioAsistente } from "../src/asistente/ServicioAsistente.js";
import {
  CASOS_EVALUACION,
  evaluarRespuesta,
} from "../src/asistente/Evaluacion.js";
import type { Evidencia } from "../src/asistente/PresentacionFinanciera.js";
import { mkdir, writeFile } from "node:fs/promises";
const mcp = new ClienteMcp();
const asistente = new ServicioAsistente(mcp);
const resultados: unknown[] = [];
const sesiones = new Map<string, string>();
try {
  for (const caso of CASOS_EVALUACION) {
    try {
      const sesion = caso.seguimiento
        ? sesiones.get(caso.seguimiento)
        : undefined;
      if (caso.seguimiento && !sesion)
        throw new Error(
          "No existe la sesión requerida para evaluar el seguimiento",
        );
      const r = await asistente.conversar(caso.pregunta, "2026-10-31", sesion);
      sesiones.set(caso.id, r.sesion);
      const referencias: Evidencia[] = [];
      for (const c of caso.consultas.filter(
        (c) => c.herramienta !== "buscar_politicas",
      ))
        referencias.push({
          ...c,
          resultado: await mcp.ejecutar(c.herramienta, c.parametros),
        });
      const verificacion = evaluarRespuesta(
        caso,
        r.respuesta,
        r.evidencias,
        referencias,
      );
      resultados.push({
        id: caso.id,
        ...verificacion,
        revision_semantica_rag_pendiente: caso.politica !== undefined,
        ...r,
      });
      console.log(
        caso.id,
        verificacion.aprobado ? "VALIDACIÓN OK" : "REVISAR",
        ...verificacion.fallos,
      );
      if (!verificacion.aprobado) process.exitCode = 1;
    } catch (e) {
      resultados.push({
        id: caso.id,
        aprobado: false,
        error: e instanceof Error ? e.message : String(e),
      });
      process.exitCode = 1;
      console.error(caso.id, e);
    }
  }
  await mkdir("docs/final/resultados", { recursive: true });
  await writeFile(
    "docs/final/resultados/evals-modelo.json",
    JSON.stringify(
      {
        version_evaluacion: 2,
        modelo: process.env.LLM_MODEL ?? "qwen3:8b",
        ejecutado_en: new Date().toISOString(),
        alcance:
          "Parámetros esperados, consulta MCP directa, presentación monetaria determinista, citas de política y seguimiento de sesión. No sustituye oráculos privados ni revisión semántica del RAG.",
        resultados,
      },
      null,
      2,
    ),
  );
} finally {
  await mcp.cerrar();
}
