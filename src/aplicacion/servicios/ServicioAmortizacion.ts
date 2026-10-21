import { obtenerCreditoPorId } from "../../infraestructura/persistencia/repositorios/CreditoRepositorio.js";

import { Dinero } from "../../dominio/shared/value-objects/Dinero.js";

import { TasaNominalAnual } from "../../dominio/calculo-financiero/value-objects/TasaNominalAnual.js";

import { Plazo } from "../../dominio/calculo-financiero/value-objects/Plazo.js";

import { AmortizacionFrancesa } from "../../dominio/calculo-financiero/strategies/AmortizacionFrancesa.js";

import { CalendarioVencimientos } from "../../dominio/calculo-financiero/services/CalendarioVencimientos.js";

export class ServicioAmortizacion {

  async generarPlan(idCredito: string) {

    // 1. Consultar el credito en PostgreSQL
    const credito = await obtenerCreditoPorId(idCredito);

    if (!credito) {
      throw new Error(
        `No se encontro el credito ${idCredito}`
      );
    }

    // 2. Convertir el capital a Dinero
    const capitalCentavos = Number(credito.capital_centavos);

    if (
      !Number.isSafeInteger(capitalCentavos) ||
      capitalCentavos < 0
    ) {
      throw new Error(
        "Capital en centavos invalido"
      );
    }

    const capital = Dinero.desdeCentavos(
      capitalCentavos,
      "GTQ"
    );

    // 3. Convertir la tasa anual
    const tasaAnual = TasaNominalAnual.crear(
      credito.tna_bps / 100
    );

    // 4. Obtener la tasa mensual
    const tasaMensual = tasaAnual.obtenerTasaMensual();

    // 5. Crear el plazo
    const plazo = Plazo.crear(
      credito.plazo_meses
    );

    // 6. Generar el plan utilizando el motor original P1/P2
    const motor = new AmortizacionFrancesa();

    const plan = motor.calcular(
      capital,
      tasaMensual,
      plazo
    );

    // 7. Normalizar la fecha de desembolso
    const fechaDesembolso = String(
  credito.fecha_desembolso
).slice(0, 10);

    // 8. Generar el calendario de vencimientos
    const calendario = CalendarioVencimientos.generarCalendario(
      fechaDesembolso,
      plan.obtenerCantidadCuotas()
    );

    // 9. Agregar fechas a las cuotas existentes
    // No se modifican los importes del motor financiero.
    const cuotas = plan.obtenerCuotas().map(cuota => {

      const fechaCuota = calendario.find(
        item => item.numero === cuota.numero
      );

      if (!fechaCuota) {
        throw new Error(
          `No se encontro vencimiento para la cuota ${cuota.numero}`
        );
      }

      return {
        numero: cuota.numero,
        fecha_vencimiento: fechaCuota.fecha_vencimiento,
        monto_centavos: cuota.monto.obtenerCentavos(),
        interes_centavos: cuota.interes.obtenerCentavos(),
        capital_centavos: cuota.amortizacionCapital.obtenerCentavos(),
        saldo_centavos: cuota.saldo.obtenerCentavos()
      };
    });

    // 10. Devolver el resultado
    return {
      id_credito: credito.id_credito,
      nombre_cliente: credito.nombre_cliente,
      capital_centavos: credito.capital_centavos,
      tna_bps: credito.tna_bps,
      plazo_meses: credito.plazo_meses,
      fecha_desembolso: fechaDesembolso,
      cantidad_cuotas: plan.obtenerCantidadCuotas(),
      saldo_final_centavos: plan.obtenerSaldoFinal().obtenerCentavos(),
      cuotas
    };
  }
}