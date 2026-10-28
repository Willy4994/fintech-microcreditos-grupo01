import { verificarIntegridad } from "./verificarIntegridad.js";
import { validarEventos } from "./validarEventos.js";
import { validarReferencias } from "./validarReferencias.js";

async function main(): Promise<void> {
  try {
    console.log("CRÉDITO VECINO - VALIDACIÓN DE REFERENCIAS");
    console.log("------------------------------------------");

    await verificarIntegridad();
    console.log("Integridad SHA-256: EXITOSA");

    await validarEventos();
    console.log("Validación estructural: EXITOSA");

    const resultado = await validarReferencias();

    console.log("Clientes registrados:", resultado.clientesRegistrados);
    console.log("Créditos registrados:", resultado.creditosRegistrados);
    console.log("Pagos revisados:", resultado.pagosRevisados);
    console.log("Pagos duplicados:", resultado.pagosDuplicados);
    console.log(
      "Referencias:",
      resultado.referenciasValidas ? "VÁLIDAS" : "INVÁLIDAS"
    );

    console.log("------------------------------------------");
    console.log("VALIDACIÓN DE REFERENCIAS COMPLETADA");
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  }
}

await main();