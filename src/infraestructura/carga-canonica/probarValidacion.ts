import { verificarIntegridad } from "./verificarIntegridad.js";
import { validarEventos } from "./validarEventos.js";

async function main(): Promise<void> {
  try {
    console.log("CRÉDITO VECINO - VALIDACIÓN CANÓNICA");
    console.log("-----------------------------------");

    const integridad = await verificarIntegridad();

    console.log(
      "Integridad SHA-256:",
      integridad.verificado ? "EXITOSA" : "FALLIDA"
    );

    const resultado = await validarEventos();

    console.log("Total de eventos:", resultado.totalEventos);
    console.log("Clientes:", resultado.clientes);
    console.log("Desembolsos:", resultado.desembolsos);
    console.log("Pagos:", resultado.pagos);
    console.log("Pagos únicos:", resultado.pagosUnicos);
    console.log("Pagos duplicados:", resultado.pagosDuplicados);

    console.log("-----------------------------------");
    console.log("VALIDACIÓN COMPLETADA");
  } catch (error) {
    console.error("Error durante la validación:", error);
    process.exitCode = 1;
  }
}

await main();