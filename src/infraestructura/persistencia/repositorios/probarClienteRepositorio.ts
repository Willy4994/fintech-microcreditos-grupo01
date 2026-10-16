import { pool } from "../conexion.js";

import {
  obtenerClientes,
  obtenerClientePorId,
} from "./ClienteRepositorio.js";

async function main(): Promise<void> {
  try {
    console.log("CRÉDITO VECINO - REPOSITORIO DE CLIENTES");
    console.log("---------------------------------------");

    const clientes = await obtenerClientes();

    console.log("Clientes encontrados:", clientes.length);

    if (clientes.length !== 60) {
      throw new Error(
        `Se esperaban 60 clientes, pero se encontraron ${clientes.length}.`
      );
    }

    const primerCliente = clientes[0];

    if (!primerCliente) {
      throw new Error("No se encontraron clientes.");
    }

    const cliente = await obtenerClientePorId(
      primerCliente.id_cliente
    );

    console.log("Cliente consultado:", cliente);

    if (!cliente) {
      throw new Error("No fue posible recuperar el cliente.");
    }

    console.log("---------------------------------------");
    console.log("PRUEBA DEL REPOSITORIO COMPLETADA");
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await main();