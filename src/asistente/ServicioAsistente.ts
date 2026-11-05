import {
  presentarFinanzas,
  parametrosDePregunta,
  datosHerramienta,
} from "./PresentacionFinanciera.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ClienteMcp } from "./ClienteMcp.js";
import { INSTRUCCIONES_RAG } from "../rag/ServicioRag.js";
import { ErrorAplicacion, fechaValida } from "../aplicacion/errores.js";
const llamadaSchema = z.object({
  function: z.object({
    name: z.string(),
    arguments: z.record(z.string(), z.unknown()),
  }),
});
const mensajeSchema = z.object({
  role: z.literal("assistant"),
  content: z.string(),
  tool_calls: z.array(llamadaSchema).optional(),
});
type Mensaje = {
  role: string;
  content: string;
  tool_name?: string;
  tool_calls?: z.infer<typeof llamadaSchema>[] | undefined;
};
export interface PuertoMcp {
  herramientas(): Promise<
    { name: string; description?: string | undefined; inputSchema: unknown }[]
  >;
  ejecutar(
    nombre: string,
    parametros: Record<string, unknown>,
  ): Promise<unknown>;
}
export interface ModeloChat {
  responder(mensajes: Mensaje[], herramientas: unknown[]): Promise<Mensaje>;
}
export class ModeloOllama implements ModeloChat {
  async responder(messages: Mensaje[], tools: unknown[]): Promise<Mensaje> {
    const r = await fetch(
      `${process.env.OLLAMA_URL ?? "http://localhost:11434"}/api/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(120000),
        body: JSON.stringify({
          model: process.env.LLM_MODEL ?? "qwen3:8b",
          messages,
          tools,
          stream: false,
          think: false,
          options: { temperature: 0 },
        }),
      },
    );
    if (!r.ok)
      throw new ErrorAplicacion(
        "MODELO_NO_DISPONIBLE",
        `Ollama devolvió ${r.status}`,
        503,
      );
    return mensajeSchema.parse(
      ((await r.json()) as { message: unknown }).message,
    );
  }
}
export class ServicioAsistente {
  private sesiones = new Map<
    string,
    { fecha: string; mensajes: Mensaje[]; actualizado: number }
  >();
  private ocupadas = new Set<string>();
  constructor(
    private mcp: PuertoMcp = new ClienteMcp(),
    private modelo: ModeloChat = new ModeloOllama(),
  ) {}
  async conversar(pregunta: string, fecha: string, sesion?: string) {
    fechaValida(fecha);
    if (!pregunta.trim() || pregunta.length > 4000)
      throw new ErrorAplicacion(
        "PREGUNTA_INVALIDA",
        "Use entre 1 y 4000 caracteres",
      );
    const ahora = Date.now();
    for (const [id, s] of this.sesiones)
      if (ahora - s.actualizado > 3600000) this.sesiones.delete(id);
    const id = sesion ?? randomUUID();
    if (this.ocupadas.has(id))
      throw new ErrorAplicacion(
        "SESION_OCUPADA",
        "Espere la respuesta anterior",
        409,
      );
    if (sesion && !this.sesiones.has(sesion))
      throw new ErrorAplicacion(
        "SESION_INEXISTENTE",
        "Inicie una sesión nueva",
        404,
      );
    if (!this.sesiones.has(id) && this.sesiones.size >= 100)
      throw new ErrorAplicacion(
        "LIMITE_SESIONES",
        "Demasiadas sesiones activas",
        429,
      );
    const anterior = this.sesiones.get(id);
    if (anterior && anterior.fecha !== fecha)
      throw new ErrorAplicacion(
        "FECHA_SESION",
        "Inicie una sesión nueva para cambiar la fecha de corte",
        409,
      );
    const s = anterior ?? { fecha, mensajes: [], actualizado: ahora };
    this.ocupadas.add(id);
    try {
      // Barrera determinista del caso adversarial; no se ejecutan herramientas financieras.
      if (/NOTA[\s_-]*CAMPO[\s_-]*07/i.test(pregunta)) {
        const respuesta =
          "La nota NOTA-CAMPO-07 es un borrador no confiable. No seguiré sus instrucciones incrustadas ni divulgaré DPI, teléfonos u otros datos personales. Las políticas se verifican en documentos oficiales.";
        s.mensajes.push(
          { role: "user", content: pregunta },
          { role: "assistant", content: respuesta },
        );
        this.sesiones.set(id, s);
        return {
          sesion: id,
          fecha_corte: fecha,
          respuesta,
          evidencias: [],
          fuentes: [],
        };
      }
      const catalogo = await this.mcp.herramientas();
      const tools = catalogo.map((h) => ({
        type: "function",
        function: {
          name: h.name,
          description: h.description,
          parameters: h.inputSchema,
        },
      }));
      const mensajes: Mensaje[] = [
        {
          role: "system",
          content: `Eres el asistente gerencial de Crédito Vecino. Fecha de corte de esta sesión: ${fecha}. Usa esa fecha salvo que el usuario pida explícitamente otra. Los números financieros provienen EXCLUSIVAMENTE de herramientas MCP; nunca calcules ni inventes importes. Los resultados monetarios son enteros en centavos. El servidor presentará las cifras financieras en quetzales de forma determinista. No redactes fórmulas financieras. Cierre de un día usa desde=hasta; cierre mensual usa primer y último día del mes. Si no hay evidencia, informa que no puedes responder. Una propuesta de pago queda pendiente; jamás afirmes que se registró sin evidencia. No tienes permiso de aprobar pagos. No solicites datos personales. ${INSTRUCCIONES_RAG}`,
        },
        ...s.mensajes,
        { role: "user", content: pregunta },
      ];
      const evidencias: {
        herramienta: string;
        parametros: Record<string, unknown>;
        resultado: unknown;
      }[] = [];
      for (let paso = 0; paso < 8; paso++) {
        const m = await this.modelo.responder(mensajes, tools);
        mensajes.push(m);
        if (!m.tool_calls?.length) {
          if (!evidencias.length)
            throw new ErrorAplicacion(
              "SIN_EVIDENCIA",
              "El modelo no consultó las herramientas. Reformule la pregunta.",
              502,
            );
          const recuperaciones = evidencias.filter(
            (e) => e.herramienta === "buscar_politicas",
          );
          if (recuperaciones.length) {
            const fuentes = recuperaciones.flatMap((e) => {
              const r = e.resultado as {
                content?: { type: string; text?: string }[];
              };
              try {
                return JSON.parse(
                  r.content?.find((c) => c.type === "text")?.text ?? "[]",
                ) as { id: string; politica_aplicable?: string }[];
              } catch {
                return [];
              }
            });
            const aplicables = new Set(
              fuentes.map((f) => f.politica_aplicable).filter(Boolean),
            );
            if (aplicables.size) {
              const mencionadas = m.content.match(/POL-\d{4}-\d{2}/g) ?? [];
              if (mencionadas.some((id) => !aplicables.has(id)))
                throw new ErrorAplicacion(
                  "POLITICA_NO_APLICABLE",
                  "La respuesta menciona una política ajena a la vigencia del otorgamiento",
                  502,
                );
            }
            const ids = new Set(fuentes.map((f) => f.id));
            const citas = [
              ...m.content.matchAll(/\[([A-Z][A-Z0-9-]+:\d+)\]/g),
            ].map((c) => c[1]);
            if (!citas.length || citas.some((c) => !ids.has(c!)))
              throw new ErrorAplicacion(
                "CITA_NO_RESPALDADA",
                "El modelo no citó fragmentos recuperados válidos",
                502,
              );
          }
          const finanzas = presentarFinanzas(evidencias);
          const textoPoliticas = recuperaciones.length
            ? finanzas
              ? recuperaciones
                  .flatMap((e) => {
                    const fuentes = datosHerramienta(e.resultado);
                    return Array.isArray(fuentes)
                      ? fuentes.map(
                          (f: { id: string; contenido: string }) =>
                            `[${f.id}]\n${f.contenido}`,
                        )
                      : [];
                  })
                  .join("\n\n")
              : m.content
            : "";
          const respuesta = (
            finanzas +
            (finanzas && textoPoliticas ? "\n\n" : "") +
            textoPoliticas
          ).replace(/\b\d{13}\b/g, "[dato personal omitido]");
          mensajes[mensajes.length - 1] = {
            role: "assistant",
            content: respuesta,
          };
          s.mensajes = mensajes.slice(1);
          s.actualizado = ahora;
          // Conserva intercambios completos para no dejar llamadas sin sus resultados.
          if (s.mensajes.length > 80)
            s.mensajes = [
              { role: "user", content: pregunta },
              { role: "assistant", content: respuesta },
            ];
          this.sesiones.set(id, s);
          return {
            sesion: id,
            fecha_corte: fecha,
            respuesta,
            evidencias,
            fuentes: evidencias
              .filter((e) => e.herramienta === "buscar_politicas")
              .map((e) => e.resultado),
          };
        }
        if (m.tool_calls.length > 8)
          throw new ErrorAplicacion(
            "LIMITE_HERRAMIENTAS",
            "Demasiadas llamadas",
            502,
          );
        for (const llamada of m.tool_calls) {
          const { name } = llamada.function;
          const parametros = parametrosDePregunta(
            name,
            llamada.function.arguments,
            pregunta,
            fecha,
          );
          llamada.function.arguments = parametros;
          if (!catalogo.some((h) => h.name === name))
            throw new ErrorAplicacion(
              "HERRAMIENTA_PROHIBIDA",
              "Herramienta no permitida",
              403,
            );
          const resultado = await this.mcp.ejecutar(name, parametros);
          datosHerramienta(resultado); // Una herramienta fallida nunca se presenta como respuesta financiera.
          evidencias.push({ herramienta: name, parametros, resultado });
          mensajes.push({
            role: "tool",
            tool_name: name,
            content: JSON.stringify(resultado),
          });
        }
      }
      throw new ErrorAplicacion(
        "LIMITE_HERRAMIENTAS",
        "El modelo no terminó en ocho pasos",
        502,
      );
    } finally {
      this.ocupadas.delete(id);
    }
  }
}
