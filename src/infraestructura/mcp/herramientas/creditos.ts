import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { consultarApi } from "../clienteApi.js";

const esquemaId = z.string().trim().min(1);

const esquemaFecha = z.iso.date();

function respuestaExitosa(datos: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(datos, null, 2),
      },
    ],
  };
}

function respuestaError(error: unknown) {
  const mensaje =
    error instanceof Error ? error.message : "Error desconocido";

  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: `No fue posible completar la consulta: ${mensaje}`,
      },
    ],
  };
}

async function ejecutarConsulta(ruta: string) {
  try {
    const datos = await consultarApi(ruta);
    return respuestaExitosa(datos);
  } catch (error: unknown) {
    return respuestaError(error);
  }
}

export function registrarHerramientasCreditos(
  servidor: McpServer,
): void {

  // 1. Listar créditos
  servidor.registerTool(
    "listar_creditos",
    {
      description:
        "Lista los créditos registrados en Crédito Vecino.",
    },
    async () => ejecutarConsulta("/api/creditos"),
  );

  // 2. Consultar crédito individual
  servidor.registerTool(
    "consultar_credito",
    {
      description:
        "Consulta la información de un crédito por su identificador.",
      inputSchema: {
        id: esquemaId,
      },
    },
    async ({ id }) =>
      ejecutarConsulta(
        `/api/creditos/${encodeURIComponent(id)}`,
      ),
  );

  // 3. Consultar amortización
  servidor.registerTool(
    "consultar_amortizacion",
    {
      description:
        "Consulta el plan de amortización de un crédito.",
      inputSchema: {
        id: esquemaId,
      },
    },
    async ({ id }) =>
      ejecutarConsulta(
        `/api/creditos/${encodeURIComponent(id)}/amortizacion`,
      ),
  );

  // 4. Consultar pagos
  servidor.registerTool(
    "consultar_pagos",
    {
      description:
        "Consulta los pagos registrados de un crédito.",
      inputSchema: {
        id: esquemaId,
      },
    },
    async ({ id }) =>
      ejecutarConsulta(
        `/api/creditos/${encodeURIComponent(id)}/pagos`,
      ),
  );

  // 5. Consultar pagos históricos
  servidor.registerTool(
    "consultar_pagos_historicos",
    {
      description:
        "Consulta los pagos registrados hasta una fecha determinada.",
      inputSchema: {
        id: esquemaId,
        fecha: esquemaFecha,
      },
    },
    async ({ id, fecha }) =>
      ejecutarConsulta(
        `/api/creditos/${encodeURIComponent(id)}/pagos-historicos?fecha=${encodeURIComponent(fecha)}`,
      ),
  );

  // 6. Consultar estado de cuenta
  servidor.registerTool(
    "consultar_estado_cuenta",
    {
      description:
        "Consulta el estado de cuenta de un crédito a una fecha determinada.",
      inputSchema: {
        id: esquemaId,
        fecha: esquemaFecha,
      },
    },
    async ({ id, fecha }) =>
      ejecutarConsulta(
        `/api/creditos/${encodeURIComponent(id)}/estado-cuenta?fecha=${encodeURIComponent(fecha)}`,
      ),
  );
}