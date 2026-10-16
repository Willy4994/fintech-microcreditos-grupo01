import { pool } from "../conexion.js";

import {
  obtenerPoliticas,
  obtenerPoliticaPorId,
  obtenerPoliticaPorFecha,
  obtenerConfiguracionFinanciera,
} from "./PoliticaRepositorio.js";

async function main(): Promise<void> {
  try {
    console.log("CRÉDITO VECINO - REPOSITORIO DE POLÍTICAS");
    console.log("----------------------------------------");

    const politicas = await obtenerPoliticas();

    console.log("Políticas encontradas:", politicas.length);

    if (politicas.length !== 2) {
      throw new Error("Se esperaban exactamente 2 políticas.");
    }

    const politicaAnterior = await obtenerPoliticaPorId(
      "POL-2024-01"
    );

    if (!politicaAnterior) {
      throw new Error("No se encontró la política anterior.");
    }

    console.log(
      "Política anterior:",
      politicaAnterior.id_politica
    );

    const politicaSeptiembre = await obtenerPoliticaPorFecha(
      "2026-09-30"
    );

    const politicaOctubre = await obtenerPoliticaPorFecha(
      "2026-10-01"
    );

    console.log(
      "Política al 30/09/2026:",
      politicaSeptiembre?.id_politica
    );

    console.log(
      "Política al 01/10/2026:",
      politicaOctubre?.id_politica
    );

    if (
      politicaSeptiembre?.id_politica !== "POL-2024-01" ||
      politicaOctubre?.id_politica !== "POL-2026-10"
    ) {
      throw new Error(
        "Las políticas no corresponden a sus fechas de vigencia."
      );
    }

    const configuracion = await obtenerConfiguracionFinanciera();

    if (!configuracion) {
      throw new Error("No se encontró la configuración financiera.");
    }

    console.log("Versión:", configuracion.version);
    console.log("Moneda:", configuracion.moneda);
    console.log("Base de conteo:", configuracion.base_conteo);

    console.log("----------------------------------------");
    console.log("PRUEBA DEL REPOSITORIO COMPLETADA");
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await main();