import { ServicioAmortizacion } from "./ServicioAmortizacion.js";
import { pool } from "../../infraestructura/persistencia/conexion.js";

async function main(): Promise<void> {
  try {
    const servicio = new ServicioAmortizacion();

    const resultado = await servicio.generarPlan(
      "CV-2026-0001"
    );

    console.log("\n=== CREDITO VECINO ===");
    console.log("Crédito:", resultado.id_credito);
    console.log("Cliente:", resultado.nombre_cliente);
    console.log(
      "Capital: Q",
      Number(resultado.capital_centavos) / 100
    );
    console.log("TNA:", resultado.tna_bps / 100, "%");
    console.log("Plazo:", resultado.plazo_meses, "meses");
    console.log("Cuotas generadas:", resultado.cantidad_cuotas);

    console.table(
      resultado.cuotas.map(cuota => ({
        cuota: cuota.numero,
        pago: cuota.monto_centavos / 100,
        interes: cuota.interes_centavos / 100,
        capital: cuota.capital_centavos / 100,
        saldo: cuota.saldo_centavos / 100
      }))
    );

    console.log(
      "Saldo final:",
      resultado.saldo_final_centavos
    );
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();