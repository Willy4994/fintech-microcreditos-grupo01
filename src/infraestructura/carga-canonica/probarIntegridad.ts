import { verificarIntegridad } from "./verificarIntegridad.js";

async function main(): Promise<void> {
  try {
    const resultado = await verificarIntegridad();

    console.log("========================================");
    console.log("CRÉDITO VECINO - VERIFICACIÓN CANÓNICA");
    console.log("========================================");
    console.log("Archivo:", resultado.archivo);
    console.log("SHA-256 esperado:", resultado.sha256Esperado);
    console.log("SHA-256 calculado:", resultado.sha256Calculado);
    console.log("Verificación:", resultado.verificado ? "EXITOSA" : "FALLIDA");
  } catch (error) {
    console.error("Error de integridad:", error);
    process.exitCode = 1;
  }
}

await main();