import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registrarHerramientasCreditos } from "./herramientas/creditos.js";

const servidor = new McpServer({
  name: "credito-vecino-mcp",
  version: "1.0.0",
});

// Herramienta de diagnóstico.
servidor.registerTool(
  "verificar_conexion",
  {
    description:
      "Verifica que el servidor MCP de Crédito Vecino esté funcionando.",
  },
  async () => ({
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          estado: "OK",
          servidor: "credito-vecino-mcp",
          mensaje: "Servidor MCP funcionando correctamente.",
        }),
      },
    ],
  }),
);

// Herramientas financieras.
registrarHerramientasCreditos(servidor);

async function iniciarServidor(): Promise<void> {
  const transporte = new StdioServerTransport();

  await servidor.connect(transporte);

  console.error("Servidor MCP de Crédito Vecino iniciado.");
}

iniciarServidor().catch((error: unknown) => {
  console.error("Error al iniciar el servidor MCP:", error);
  process.exit(1);
});