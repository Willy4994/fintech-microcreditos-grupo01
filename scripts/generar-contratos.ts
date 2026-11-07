import { accesoSchema } from "../src/infraestructura/http/sesiones.js";
import { z } from "zod";
import { writeFile } from "node:fs/promises";
import { crearCatalogo } from "../src/infraestructura/mcp/catalogo.js";
import {
  simulacionSchema,
  decisionSchema,
  cierreSchema,
  chatSchema,
} from "../src/contratos/final.js";
import {
  originacionSchema,
  propuestaSchema,
} from "../src/aplicacion/servicios/OperacionesPg.js";
const fecha = { type: "string", format: "date" };
const parameter = (
  name: string,
  where = "query",
  schema: unknown = fecha,
  required = true,
) => ({ name, in: where, required, schema });
const respuesta = {
  description: "Resultado JSON; importes enteros en centavos GTQ",
  content: {
    "application/json": {
      schema: { type: "object", additionalProperties: true },
    },
  },
};
const error = {
  description: "Error uniforme",
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
};
const get = (summary: string, parameters: unknown[] = []) => ({
  summary,
  parameters,
  responses: { "200": respuesta, "400": error, "404": error, "409": error },
});
const post = (
  summary: string,
  schema: z.ZodType,
  humano = false,
  status = "200",
  parameters: unknown[] = [],
) => ({
  summary,
  parameters,
  ...(humano ? { security: [{ humano: [] }, { sesion: [] }] } : {}),
  requestBody: {
    required: true,
    content: { "application/json": { schema: z.toJSONSchema(schema) } },
  },
  responses: {
    [status]: respuesta,
    "400": error,
    "403": error,
    "404": error,
    "409": error,
    "503": error,
  },
});
const id = parameter("id", "path", { type: "string" });
const corte = parameter("fecha");
const paths = {
  "/api/sesion": {
    get: {
      ...get("Consultar perfil de sesión local"),
      security: [{ sesion: [] }],
    },
    post: {
      ...post(
        "Abrir sesión humana local (cookie HttpOnly)",
        accesoSchema,
        true,
      ),
      security: [{ humano: [] }],
    },
    delete: {
      summary: "Cerrar sesión e invalidar cookie",
      responses: { "204": { description: "Sesión cerrada" } },
    },
  },
  "/api/clientes/etiquetas": {
    get: {
      ...get("Nombres de clientes para la interfaz, sin DPI ni teléfonos"),
      security: [{ humano: [] }, { sesion: [] }],
    },
  },
  "/api/creditos/{id}/cliente": {
    get: {
      ...get("Etiqueta de cliente de un crédito", [id]),
      security: [{ humano: [] }, { sesion: [] }],
    },
  },
  "/api/cartera/creditos": {
    get: get("Créditos y estados al corte", [
      corte,
      parameter("tramo", "query", { type: "string" }, false),
    ]),
  },
  "/api/health": { get: get("Disponibilidad") },
  "/api/creditos": {
    get: {
      ...get("Catálogo de créditos"),
      responses: {
        "200": {
          description: "Créditos",
          content: {
            "application/json": {
              schema: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
  },
  "/api/creditos/{id}": { get: get("Estado completo", [id, corte]) },
  "/api/creditos/{id}/estado-cuenta": {
    get: get("Estado de cuenta", [id, corte]),
  },
  "/api/creditos/{id}/amortizacion": { get: get("Cuotas", [id, corte]) },
  "/api/creditos/{id}/mora/{cuota}": {
    get: get("Deuda y desglose de mora", [
      id,
      parameter("cuota", "path", { type: "integer", minimum: 1 }),
      corte,
    ]),
  },
  "/api/cartera": { get: get("Indicadores y desglose de cartera", [corte]) },
  "/api/morosos": {
    get: get("Morosos por tramo", [
      corte,
      parameter(
        "tramo",
        "query",
        { type: "string", enum: ["MORA_1", "MORA_2", "MORA_3", "VENCIDO"] },
        false,
      ),
    ]),
  },
  "/api/vencimientos": {
    get: get("Próximos vencimientos", [
      corte,
      parameter("dias", "query", { type: "integer", minimum: 1, maximum: 366 }),
    ]),
  },
  "/api/cierres": {
    get: get("Consultar cierre", [parameter("desde"), parameter("hasta")]),
    post: post("Generar cierre idempotente", cierreSchema, true),
  },
  "/api/simulaciones": {
    post: post("Simular plan sin escritura", simulacionSchema),
  },
  "/api/originaciones": {
    post: post("Alta y desembolso atómicos", originacionSchema, true, "201"),
  },
  "/api/pagos/propuestas": {
    post: post("Proponer pago sin aplicarlo", propuestaSchema, false, "202"),
  },
  "/api/aprobaciones": {
    get: {
      ...get("Aprobaciones pendientes e históricas"),
      security: [{ humano: [] }, { sesion: [] }],
    },
  },
  "/api/aprobaciones/{id}/decision": {
    post: post("Decisión humana explícita", decisionSchema, true, "200", [id]),
  },
  "/api/chat": {
    post: post("Asistente con evidencia MCP y fuentes", chatSchema, true),
  },
};
await writeFile(
  "docs/api/openapi-final.json",
  JSON.stringify(
    {
      openapi: "3.1.0",
      info: {
        title: "Crédito Vecino — Backend Final",
        version: "2.0.0",
        description:
          "Contratos de entrada derivados de Zod. Las respuestas financieras se documentan en docs/final/api.md y se validan por integración; algunas respuestas son arrays.",
      },
      servers: [{ url: "http://127.0.0.1:3000" }],
      paths,
      components: {
        securitySchemes: {
          humano: { type: "http", scheme: "bearer" },
          sesion: { type: "apiKey", in: "cookie", name: "cv_sesion" },
        },
        schemas: {
          Error: {
            type: "object",
            required: ["codigo", "mensaje"],
            properties: {
              codigo: { type: "string" },
              mensaje: { type: "string" },
              detalles: {},
              correlacionId: { type: "string" },
            },
          },
        },
      },
    },
    null,
    2,
  ) + "\n",
);
await writeFile(
  "docs/api/herramientas-mcp.json",
  JSON.stringify(
    crearCatalogo().map((h) => ({
      nombre: h.nombre,
      descripcion: h.descripcion,
      inputSchema: z.toJSONSchema(h.schema),
    })),
    null,
    2,
  ) + "\n",
);
console.log("Contratos HTTP y herramientas MCP generados desde Zod");
