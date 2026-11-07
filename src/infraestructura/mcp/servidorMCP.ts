import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { crearCatalogo } from "./catalogo.js";
import { ErrorAplicacion } from "../../aplicacion/errores.js";
import { pool } from "../persistencia/conexion.js";
import { z } from "zod";
const servidor = new McpServer({
  name: "credito-vecino-mcp",
  version: "2.0.0",
});
for (const h of crearCatalogo())
  servidor.registerTool(
    h.nombre,
    {
      description: h.descripcion,
      inputSchema: h.schema,
      annotations: {
        readOnlyHint: h.nombre !== "proponer_pago",
        destructiveHint: false,
        idempotentHint: h.nombre !== "proponer_pago",
        openWorldHint: false,
      },
    },
    async (entrada: Record<string, unknown>) => {
      try {
        const datos = await h.ejecutar(h.schema.parse(entrada));
        return {
          content: [{ type: "text" as const, text: JSON.stringify(datos) }],
        };
      } catch (e) {
        const codigo =
          e instanceof ErrorAplicacion
            ? e.codigo
            : e instanceof z.ZodError
              ? "ENTRADA_INVALIDA"
              : "ERROR_HERRAMIENTA";
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                codigo,
                mensaje: e instanceof Error ? e.message : "Error",
                detalles: e instanceof ErrorAplicacion ? e.detalles : undefined,
              }),
            },
          ],
        };
      }
    },
  );
process.on("SIGTERM", () => {
  void servidor.close().finally(() => pool.end());
});
await servidor.connect(new StdioServerTransport());
