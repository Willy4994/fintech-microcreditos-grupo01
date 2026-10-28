import { verificarIntegridad } from "./verificarIntegridad.js";
import { validarEventos } from "./validarEventos.js";
import { validarReferencias } from "./validarReferencias.js";
import { leerDatosCanonicos } from "./leerDatosCanonicos.js";

async function main(): Promise<void> {
  try {
    console.log("CRÉDITO VECINO - LECTURA CANÓNICA");
    console.log("--------------------------------");

    await verificarIntegridad();
    await validarEventos();
    await validarReferencias();

    const datos = await leerDatosCanonicos();

    console.log("Eventos:", datos.eventos.length);
    console.log("Asesores:", datos.asesores.length);
    console.log(
      "Políticas de mora:",
      Object.keys(datos.politicas.politicas_mora).length
    );
    console.log("Versión:", datos.politicas.version);
    console.log("Moneda:", datos.politicas.moneda);
    console.log("Base de conteo:", datos.politicas.base_conteo);

    console.log("--------------------------------");
    console.log("LECTURA CANÓNICA COMPLETADA");
  } catch (error) {
    console.error("Error durante la lectura:", error);
    process.exitCode = 1;
  }
}

await main();
