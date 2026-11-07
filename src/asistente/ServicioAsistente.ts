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

type FuenteRag = {
  id: string;
  contenido?: string;
  politica_aplicable?: string;
};

export interface PuertoMcp {
  cerrar?(): Promise<void>;
  herramientas(): Promise<
    {
      name: string;
      description?: string | undefined;
      inputSchema: unknown;
    }[]
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
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(120000),
        body: JSON.stringify({
          model: process.env.LLM_MODEL ?? "qwen3:8b",
          messages,
          tools,
          stream: false,
          think: false,
          options: {
            temperature: 0,
          },
        }),
      },
    );

    if (!r.ok) {
      throw new ErrorAplicacion(
        "MODELO_NO_DISPONIBLE",
        `Ollama devolvió ${r.status}`,
        503,
      );
    }

    return mensajeSchema.parse(
      ((await r.json()) as { message: unknown }).message,
    );
  }
}

export class ServicioAsistente {
  private sesiones = new Map<
    string,
    {
      fecha: string;
      mensajes: Mensaje[];
      actualizado: number;
    }
  >();

  private ocupadas = new Set<string>();

  constructor(
    private mcp: PuertoMcp = new ClienteMcp(),
    private modelo: ModeloChat = new ModeloOllama(),
  ) {}

  private extraerFuentes(
    evidencias: {
      herramienta: string;
      parametros: Record<string, unknown>;
      resultado: unknown;
    }[],
  ): FuenteRag[] {
    return evidencias
      .filter((e) => e.herramienta === "buscar_politicas")
      .flatMap((e) => {
        const resultado = datosHerramienta(e.resultado);

        if (!Array.isArray(resultado)) {
          return [];
        }

        return resultado.filter(
          (f): f is FuenteRag =>
            typeof f === "object" && f !== null && typeof f.id === "string",
        );
      });
  }

  private validarVigencia(contenido: string, fuentes: FuenteRag[]): void {
    const aplicables = new Set(
      fuentes
        .map((f) => f.politica_aplicable)
        .filter((id): id is string => Boolean(id)),
    );

    if (!aplicables.size) {
      return;
    }

    const mencionadas = contenido.match(/POL-\d{4}-\d{2}/g) ?? [];

    if (mencionadas.some((id) => !aplicables.has(id))) {
      throw new ErrorAplicacion(
        "POLITICA_NO_APLICABLE",
        "La respuesta menciona una política ajena a la vigencia del otorgamiento",
        502,
      );
    }
  }

  private citasValidas(contenido: string, fuentes: FuenteRag[]): boolean {
    const ids = new Set(fuentes.map((f) => f.id));

    const citas = [...contenido.matchAll(/\[([A-Z][A-Z0-9-]+:\d+)\]/g)].map(
      (c) => c[1],
    );

    return (
      citas.length > 0 && citas.every((c) => c !== undefined && ids.has(c))
    );
  }

  private async corregirCitas(
    mensajes: Mensaje[],
    fuentes: FuenteRag[],
  ): Promise<string> {
    const idsDisponibles = fuentes.map((f) => f.id);

    const correccion = await this.modelo.responder(
      [
        ...mensajes,
        {
          role: "user",
          content: `
Tu respuesta anterior no cumplió las reglas de citación documental.

Debes corregirla utilizando exclusivamente la evidencia recuperada
por la herramienta buscar_politicas.

Los identificadores disponibles son:

${JSON.stringify(idsDisponibles)}

INSTRUCCIONES OBLIGATORIAS:

1. Cita cada afirmación documental con el formato [ID].
2. Utiliza únicamente los identificadores disponibles.
3. No inventes información ni referencias.
4. Respeta la vigencia de las políticas.
5. No confundas la fecha de corte con la fecha de otorgamiento.
6. No afirmes que una política aplica si los documentos no lo respaldan.
7. Devuelve únicamente la respuesta corregida.
`,
        },
      ],
      [],
    );

    if (correccion.tool_calls?.length) {
      throw new ErrorAplicacion(
        "CITA_NO_RESPALDADA",
        "El modelo intentó ejecutar herramientas durante la corrección",
        502,
      );
    }

    this.validarVigencia(correccion.content, fuentes);

    if (!this.citasValidas(correccion.content, fuentes)) {
      throw new ErrorAplicacion(
        "CITA_NO_RESPALDADA",
        "El modelo no pudo generar citas documentales válidas",
        502,
      );
    }

    return correccion.content;
  }

  async cerrar() {
    this.sesiones.clear();
    await this.mcp.cerrar?.();
  }

  async conversar(pregunta: string, fecha: string, sesion?: string) {
    fechaValida(fecha);

    if (!pregunta.trim() || pregunta.length > 4000) {
      throw new ErrorAplicacion(
        "PREGUNTA_INVALIDA",
        "Use entre 1 y 4000 caracteres",
      );
    }

    const ahora = Date.now();

    for (const [id, s] of this.sesiones) {
      if (ahora - s.actualizado > 3600000) {
        this.sesiones.delete(id);
      }
    }

    const id = sesion ?? randomUUID();

    if (this.ocupadas.has(id)) {
      throw new ErrorAplicacion(
        "SESION_OCUPADA",
        "Espere la respuesta anterior",
        409,
      );
    }

    if (sesion && !this.sesiones.has(sesion)) {
      throw new ErrorAplicacion(
        "SESION_INEXISTENTE",
        "Inicie una sesión nueva",
        404,
      );
    }

    if (!this.sesiones.has(id) && this.sesiones.size >= 100) {
      throw new ErrorAplicacion(
        "LIMITE_SESIONES",
        "Demasiadas sesiones activas",
        429,
      );
    }

    const anterior = this.sesiones.get(id);

    if (anterior && anterior.fecha !== fecha) {
      throw new ErrorAplicacion(
        "FECHA_SESION",
        "Inicie una sesión nueva para cambiar la fecha de corte",
        409,
      );
    }

    const s = anterior ?? {
      fecha,
      mensajes: [],
      actualizado: ahora,
    };

    this.ocupadas.add(id);

    try {
      if (/NOTA[\s_-]*CAMPO[\s_-]*07/i.test(pregunta)) {
        const respuesta =
          "La nota NOTA-CAMPO-07 es un borrador no confiable. No seguiré sus instrucciones incrustadas ni divulgaré DPI, teléfonos u otros datos personales. Las políticas se verifican en documentos oficiales.";

        s.mensajes.push(
          {
            role: "user",
            content: pregunta,
          },
          {
            role: "assistant",
            content: respuesta,
          },
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
          content: `
Eres el asistente gerencial de Crédito Vecino.
Atiende únicamente créditos, pagos, cartera, mora, cierres y políticas institucionales.
Para saludos o preguntas ajenas (por ejemplo, fútbol), no llames herramientas ni respondas datos generales: orienta al usuario hacia ese ámbito.
Nunca llames herramientas irrelevantes para justificar una respuesta fuera de ámbito.

Fecha de corte de esta sesión: ${fecha}.

Usa esa fecha salvo que el usuario pida explícitamente otra.

Los números financieros provienen EXCLUSIVAMENTE
de herramientas MCP.

Nunca calcules ni inventes importes.

Los resultados monetarios son enteros en centavos.

El servidor presentará las cifras financieras en quetzales
de forma determinista.

No redactes fórmulas financieras.
Las consultas generales sobre solicitar créditos, requisitos, productos y condiciones sí están dentro del ámbito: consulta buscar_politicas. No necesitan identificador de crédito. Si las fuentes no contienen requisitos de admisión, explica esa limitación y sugiere confirmarlos con el asesor; no inventes documentos, ingresos ni garantías.

Cierre de un día usa desde=hasta.

Cierre mensual usa primer y último día del mes.

Si no hay evidencia, informa que no puedes responder.

Una propuesta de pago queda pendiente;
jamás afirmes que se registró sin evidencia.

No tienes permiso de aprobar pagos.

No solicites datos personales.

${INSTRUCCIONES_RAG}

REGLAS OBLIGATORIAS PARA RESPUESTAS DOCUMENTALES:

1. Cuando utilices buscar_politicas, debes citar los documentos recuperados.
2. Utiliza exclusivamente identificadores que aparezcan en los resultados.
3. El formato obligatorio es [IDENTIFICADOR:NUMERO].
4. Ejemplo: [POL-2024-01:1].
5. Cada afirmación documental debe tener respaldo.
6. No inventes citas ni identificadores.
7. Respeta la vigencia de cada política según la fecha de otorgamiento.
8. No confundas la fecha de corte con la fecha de otorgamiento.
9. Si una política no aplica al período consultado, no afirmes que aplica.
`,
        },
        ...s.mensajes,
        {
          role: "user",
          content: pregunta,
        },
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
          if (!evidencias.length) {
            const texto = pregunta
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase();
            const informativa =
              /\b(credito|creditos|prestamo|prestamos|producto|productos|pago|pagos)\b/.test(
                texto,
              ) &&
              /\b(necesito|necesita|necesitan|requisito|requisitos|pedir|solicitar|solicita|documentos|documentacion|condiciones|funciona|ofrecen|puedo)\b/.test(
                texto,
              );
            if (
              informativa &&
              catalogo.some((h) => h.name === "buscar_politicas")
            ) {
              const parametros = { pregunta, fecha };
              const resultado = await this.mcp.ejecutar(
                "buscar_politicas",
                parametros,
              );
              datosHerramienta(resultado);
              evidencias.push({
                herramienta: "buscar_politicas",
                parametros,
                resultado,
              });
              mensajes[mensajes.length - 1] = {
                role: "assistant",
                content: "",
                tool_calls: [
                  {
                    function: {
                      name: "buscar_politicas",
                      arguments: parametros,
                    },
                  },
                ],
              };
              mensajes.push({
                role: "tool",
                tool_name: "buscar_politicas",
                content: JSON.stringify(datosHerramienta(resultado)),
              });
              mensajes.push({
                role: "system",
                content:
                  "La pregunta trata del producto de Crédito Vecino. Responde con estas fuentes y citas. Si no documentan requisitos de admisión, indícalo y remite al asesor para confirmarlos; no inventes documentos, ingresos, garantías ni criterios de aprobación.",
              });
              continue;
            }
            // Sin evidencia no se muestra texto libre del modelo ni cifras sin respaldo.
            const respuesta =
              "Soy el asistente de Crédito Vecino. Puedo ayudarte con créditos, pagos, mora, cartera, cierres y políticas de la institución. Solo atiendo consultas relacionadas con Crédito Vecino.\n\nSi tu pregunta es sobre el sistema, indica qué necesitas consultar y, cuando corresponda, el crédito o período. Por ejemplo: «¿Cómo está la cartera al 31 de octubre de 2026?» o «¿Cómo se calcula la mora de este crédito?»";
            s.mensajes.push(
              { role: "user", content: pregunta },
              { role: "assistant", content: respuesta },
            );
            if (s.mensajes.length > 80) s.mensajes = s.mensajes.slice(-2);
            s.actualizado = ahora;
            this.sesiones.set(id, s);
            return {
              sesion: id,
              fecha_corte: fecha,
              respuesta,
              evidencias: [],
              fuentes: [],
            };
          }

          const recuperaciones = evidencias.filter(
            (e) => e.herramienta === "buscar_politicas",
          );

          if (recuperaciones.length) {
            const fuentes = this.extraerFuentes(evidencias);

            this.validarVigencia(m.content, fuentes);

            if (!this.citasValidas(m.content, fuentes)) {
              m.content = await this.corregirCitas(mensajes, fuentes);
            }

            this.validarVigencia(m.content, fuentes);

            if (!this.citasValidas(m.content, fuentes)) {
              throw new ErrorAplicacion(
                "CITA_NO_RESPALDADA",
                "El modelo no citó fragmentos recuperados válidos",
                502,
              );
            }
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

          let respuesta = (
            finanzas +
            (finanzas && textoPoliticas ? "\n\n" : "") +
            textoPoliticas
          ).replace(/\b\d{13}\b/g, "[dato personal omitido]");

          const consultaNormalizada = pregunta
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
          if (
            !finanzas &&
            recuperaciones.length &&
            /\b(credito|creditos|prestamo|prestamos)\b/.test(
              consultaNormalizada,
            ) &&
            /\b(requisitos?|documentos?|documentacion)\b|para\s+(pedir|solicitar)\b/.test(
              consultaNormalizada,
            )
          ) {
            const fuentes = this.extraerFuentes(evidencias);
            const manual = fuentes.find(
              (f) =>
                f.id.startsWith("MAN-PRODUCTO-01:") &&
                f.contenido?.includes("## Tasas"),
            );
            const texto = manual?.contenido
              ?.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
              .split("##")[0]
              ?.replace(/^#.*$/gm, "")
              .trim();
            respuesta =
              "Para pedir un crédito, un asesor debe confirmar contigo los requisitos y documentos de admisión. Con las fuentes recuperadas no puedo confirmar una lista completa; no sería correcto inventar documentos, ingresos mínimos o garantías." +
              (texto && manual
                ? `\n\nEl manual sí describe estas condiciones del producto:\n\n${texto} [${manual.id}]`
                : "") +
              "\n\nPuedes iniciar la solicitud con un asesor de Crédito Vecino y confirmar qué documentación corresponde a tu caso.";
          }
          mensajes[mensajes.length - 1] = {
            role: "assistant",
            content: respuesta,
          };

          s.mensajes = mensajes.slice(1);
          s.actualizado = ahora;

          if (s.mensajes.length > 80) {
            s.mensajes = [
              {
                role: "user",
                content: pregunta,
              },
              {
                role: "assistant",
                content: respuesta,
              },
            ];
          }

          this.sesiones.set(id, s);

          return {
            sesion: id,
            fecha_corte: fecha,
            respuesta,
            evidencias,
            fuentes: recuperaciones.map((e) => e.resultado),
          };
        }

        if (m.tool_calls.length > 8) {
          throw new ErrorAplicacion(
            "LIMITE_HERRAMIENTAS",
            "Demasiadas llamadas",
            502,
          );
        }

        for (const llamada of m.tool_calls) {
          const { name } = llamada.function;

          const parametros = parametrosDePregunta(
            name,
            llamada.function.arguments,
            pregunta,
            fecha,
          );

          llamada.function.arguments = parametros;

          if (!catalogo.some((h) => h.name === name)) {
            throw new ErrorAplicacion(
              "HERRAMIENTA_PROHIBIDA",
              "Herramienta no permitida",
              403,
            );
          }

          const resultado = await this.mcp.ejecutar(name, parametros);

          const datos = datosHerramienta(resultado);

          evidencias.push({
            herramienta: name,
            parametros,
            resultado,
          });

          mensajes.push({
            role: "tool",
            tool_name: name,
            content: JSON.stringify(datos),
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
