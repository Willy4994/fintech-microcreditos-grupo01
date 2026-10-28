import { obtenerPagosPorCreditoHastaFecha } from "../../infraestructura/persistencia/repositorios/PagoRepositorio.js";
import { pool } from "../../infraestructura/persistencia/conexion.js";

async function main() {
  const idCredito = "CV-2026-0001";
  const fechaCorte = "2026-10-01";

  const pagos = await obtenerPagosPorCreditoHastaFecha(
    idCredito,
    fechaCorte
  );

  const totalCentavos = pagos.reduce(
    (total, pago) => total + BigInt(pago.monto_centavos),
    0n
  );

  console.log("=== PAGOS POR FECHA DE CORTE ===");
  console.log("Crédito:", idCredito);
  console.log("Fecha de corte:", fechaCorte);
  console.log("Cantidad de pagos:", pagos.length);
  console.log("Total pagado (centavos):", totalCentavos.toString());

  console.table(
    pagos.map((pago) => ({
      fecha: pago.fecha,
      monto_centavos: pago.monto_centavos,
      clave: pago.clave_idempotencia
    }))
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await pool.end();
  });