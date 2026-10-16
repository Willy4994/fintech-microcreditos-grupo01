import { pool } from "./conexion.js";

import {
  obtenerClientes,
  obtenerCreditos,
  obtenerPagos,
  obtenerPoliticas,
  obtenerConfiguracionFinanciera,
} from "./repositorios/index.js";

async function main(): Promise<void> {
  try {
    console.log("CRÉDITO VECINO - INTEGRACIÓN DE REPOSITORIOS");
    console.log("------------------------------------------------");

    const [
      clientes,
      creditos,
      pagos,
      politicas,
      configuracion,
    ] = await Promise.all([
      obtenerClientes(),
      obtenerCreditos(),
      obtenerPagos(),
      obtenerPoliticas(),
      obtenerConfiguracionFinanciera(),
    ]);

    console.log("Clientes:", clientes.length);
    console.log("Créditos:", creditos.length);
    console.log("Pagos:", pagos.length);
    console.log("Políticas:", politicas.length);
    console.log("Configuración:", configuracion?.version);

    if (
      clientes.length !== 60 ||
      creditos.length !== 75 ||
      pagos.length !== 226 ||
      politicas.length !== 2 ||
      configuracion?.version !== "1.0"
    ) {
      throw new Error(
        "Los repositorios no devolvieron las cantidades esperadas."
      );
    }

    console.log("------------------------------------------------");
    console.log("INTEGRACIÓN DE REPOSITORIOS EXITOSA");
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await main();