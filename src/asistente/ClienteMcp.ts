import { existsSync } from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
export class ClienteMcp {
  private cliente = new Client({
    name: "asistente-gerencial",
    version: "2.0.0",
  });
  private inicio: Promise<void> | undefined;
  async conectar() {
    this.inicio ??= this.cliente
      .connect(
        new StdioClientTransport({
          command: process.execPath,
          args: [
            existsSync(
              new URL("../infraestructura/mcp/servidorMCP.js", import.meta.url),
            )
              ? fileURLToPath(
                  new URL(
                    "../infraestructura/mcp/servidorMCP.js",
                    import.meta.url,
                  ),
                )
              : path.resolve("dist/src/infraestructura/mcp/servidorMCP.js"),
          ],
          stderr: "inherit",
          env: Object.fromEntries(
            Object.entries(process.env).filter(
              ([k, v]) =>
                v !== undefined &&
                /^(PG|CV_DATA_DIR$|OLLAMA_URL$|LLM_MODEL$|EMBEDDING_MODEL$)/.test(
                  k,
                ),
            ),
          ) as Record<string, string>,
        }),
      )
      .catch((e) => {
        this.inicio = undefined;
        throw e;
      });
    await this.inicio;
  }
  async herramientas() {
    await this.conectar();
    return (await this.cliente.listTools()).tools;
  }
  async ejecutar(nombre: string, parametros: Record<string, unknown>) {
    await this.conectar();
    return this.cliente.callTool({ name: nombre, arguments: parametros });
  }
  async cerrar() {
    await this.cliente.close();
  }
}
