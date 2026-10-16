import { pool } from "../conexion.js";

import {
  obtenerPagos,
  obtenerPagoPorClave,
  obtenerPagosPorCredito,
} from "./PagoRepositorio.js";

async function main(): Promise<void> {
  try {
    console.log("CRÉDITO VECINO - REPOSITORIO DE PAGOS");
    console.log("------------------------------------");

    const pagos = await obtenerPagos();

    console.log("Pagos encontrados:", pagos.length);

    if (pagos.length !== 226) {
      throw new Error(
        `Se esperaban 226 pagos, pero se encontraron ${pagos.length}.`
      );
    }

    const primerPago = pagos[0];

    if (!primerPago) {
      throw new Error("No se encontraron pagos.");
    }

    const pago = await obtenerPagoPorClave(
      primerPago.clave_idempotencia
    );

    if (!pago) {
      throw new Error("No fue posible recuperar el pago.");
    }

    console.log("Pago consultado:", pago);

    const pagosCredito = await obtenerPagosPorCredito(
      primerPago.id_credito
    );

    console.log(
      "Pagos asociados al crédito:",
      pagosCredito.length
    );

    if (
      !pagosCredito.some(
        (item) => item.id_pago === primerPago.id_pago
      )
    ) {
      throw new Error(
        "El pago consultado no aparece en el historial del crédito."
      );
    }

    console.log("------------------------------------");
    console.log("PRUEBA DEL REPOSITORIO COMPLETADA");
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await main();