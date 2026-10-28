import { pool } from "../conexion.js";

import {
  obtenerCreditos,
  obtenerCreditoPorId,
  obtenerCreditosPorCliente,
} from "./CreditoRepositorio.js";

async function main(): Promise<void> {
  try {
    console.log("CRÉDITO VECINO - REPOSITORIO DE CRÉDITOS");
    console.log("----------------------------------------");

    const creditos = await obtenerCreditos();

    console.log("Créditos encontrados:", creditos.length);

    if (creditos.length !== 75) {
      throw new Error(
        `Se esperaban 75 créditos, pero se encontraron ${creditos.length}.`
      );
    }

    const primerCredito = creditos[0];

    if (!primerCredito) {
      throw new Error("No se encontraron créditos.");
    }

    const credito = await obtenerCreditoPorId(
      primerCredito.id_credito
    );

    if (!credito) {
      throw new Error("No fue posible recuperar el crédito.");
    }

    console.log("Crédito consultado:", credito);

    const creditosCliente = await obtenerCreditosPorCliente(
      primerCredito.id_cliente
    );

    console.log(
      "Créditos del cliente:",
      creditosCliente.length
    );

    if (
      !creditosCliente.some(
        (item) => item.id_credito === primerCredito.id_credito
      )
    ) {
      throw new Error(
        "El crédito consultado no aparece en la cartera del cliente."
      );
    }

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