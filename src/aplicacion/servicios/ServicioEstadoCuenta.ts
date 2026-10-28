import {
  obtenerCreditoPorId,
} from "../../infraestructura/persistencia/repositorios/CreditoRepositorio.js";

import {
  obtenerPagosPorCreditoHastaFecha,
} from "../../infraestructura/persistencia/repositorios/PagoRepositorio.js";

import {
  obtenerPoliticaPorId,
  obtenerConfiguracionFinanciera,
} from "../../infraestructura/persistencia/repositorios/PoliticaRepositorio.js";

import { ServicioAmortizacion } from "./ServicioAmortizacion.js";

import { Dinero } from "../../dominio/shared/value-objects/Dinero.js";

import {
  PrelacionPago,
} from "../../dominio/cartera-cobros/services/PrelacionPago.js";

import {
  CalculadoraMora,
} from "../../dominio/calculo-financiero/services/CalculadoraMora.js";

import {
  CalendarioVencimientos,
} from "../../dominio/calculo-financiero/services/CalendarioVencimientos.js";

import {
  TasaNominalAnual,
} from "../../dominio/calculo-financiero/value-objects/TasaNominalAnual.js";

import type {
  BaseConteo,
} from "../../dominio/calculo-financiero/value-objects/BaseConteo.js";

import {
  DiasAtraso,
} from "../../dominio/cartera-cobros/value-objects/DiasAtraso.js";

import {
  PoliticaPlana,
} from "../../dominio/politica-mora/PoliticaPlana.js";

import {
  PoliticaEscalonada,
} from "../../dominio/politica-mora/PoliticaEscalonada.js";

import {
  GastoGestionCobro,
} from "../../dominio/politica-mora/GastoGestionCobro.js";

import {
  CalculadoraDevengoInteres,
} from "../../dominio/cierres/services/CalculadoraDevengoInteres.js";

interface CuotaEstado {
  numero: number;
  fecha_vencimiento: string;
  capital_programado_centavos: number;
  interes_programado_centavos: number;
  capital_pagado_centavos: number;
  interes_pagado_centavos: number;
}

interface Obligaciones {
  capital: number;
  interes: number;
  mora: number;
  gastos: number;
}

interface MovimientoReconstruido {
  id_pago: string;
  fecha: string;
  monto_centavos: number;
  capital_centavos: number;
  interes_corriente_centavos: number;
  interes_moratorio_centavos: number;
  gastos_centavos: number;
  excedente_centavos: number;
}

export class ServicioEstadoCuenta {
  private readonly prelacion = new PrelacionPago();

  private validarFecha(fecha: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new Error(
        "La fecha de corte debe tener formato YYYY-MM-DD."
      );
    }

    const valor = new Date(`${fecha}T00:00:00.000Z`);

    if (
      Number.isNaN(valor.getTime()) ||
      valor.toISOString().slice(0, 10) !== fecha
    ) {
      throw new Error("La fecha de corte no es válida.");
    }
  }

  private convertirBaseConteo(valor: string): BaseConteo {
    const normalizado = valor
      .trim()
      .toUpperCase()
      .replace("/", "_");

    if (
      normalizado === "ACTUAL_360" ||
      normalizado === "ACTUAL_365" ||
      normalizado === "30_360"
    ) {
      return normalizado;
    }

    throw new Error(
      `Base de conteo no soportada: ${valor}`
    );
  }

  private validarCentavos(
    valor: string | number,
    descripcion: string
  ): number {
    const numero = Number(valor);

    if (
      !Number.isSafeInteger(numero) ||
      numero < 0
    ) {
      throw new Error(
        `${descripcion}: monto en centavos inválido.`
      );
    }

    return numero;
  }

  private obtenerCapitalVencido(
    cuotas: CuotaEstado[],
    fecha: string
  ): number {
    return cuotas
      .filter(
        (cuota) => cuota.fecha_vencimiento < fecha
      )
      .reduce(
        (total, cuota) =>
          total +
          Math.max(
            0,
            cuota.capital_programado_centavos -
              cuota.capital_pagado_centavos
          ),
        0
      );
  }

  private obtenerInteresExigible(
    cuotas: CuotaEstado[],
    fecha: string
  ): number {
    return cuotas
      .filter(
        (cuota) => cuota.fecha_vencimiento <= fecha
      )
      .reduce(
        (total, cuota) =>
          total +
          Math.max(
            0,
            cuota.interes_programado_centavos -
              cuota.interes_pagado_centavos
          ),
        0
      );
  }

  private obtenerCapitalExigible(
    cuotas: CuotaEstado[],
    fecha: string
  ): number {
    return cuotas
      .filter(
        (cuota) => cuota.fecha_vencimiento <= fecha
      )
      .reduce(
        (total, cuota) =>
          total +
          Math.max(
            0,
            cuota.capital_programado_centavos -
              cuota.capital_pagado_centavos
          ),
        0
      );
  }

  async consultar(
    idCredito: string,
    fechaCorte: string
  ) {
    this.validarFecha(fechaCorte);

    const credito = await obtenerCreditoPorId(idCredito);

    if (!credito) {
      return null;
    }

    const [
      plan,
      pagos,
      politica,
      configuracion,
    ] = await Promise.all([
      new ServicioAmortizacion().generarPlan(idCredito),
      obtenerPagosPorCreditoHastaFecha(
        idCredito,
        fechaCorte
      ),
      obtenerPoliticaPorId(credito.id_politica),
      obtenerConfiguracionFinanciera(),
    ]);

    if (!politica) {
      throw new Error(
        `No existe la política ${credito.id_politica}.`
      );
    }

    if (!configuracion) {
      throw new Error(
        "No existe configuración financiera."
      );
    }

    if (fechaCorte < plan.fecha_desembolso) {
      throw new Error(
        "La fecha de corte no puede ser anterior al desembolso."
      );
    }

    const baseConteo = this.convertirBaseConteo(
      configuracion.base_conteo
    );

    const cuotas: CuotaEstado[] = plan.cuotas.map(
      (cuota) => ({
        numero: cuota.numero,
        fecha_vencimiento: cuota.fecha_vencimiento,
        capital_programado_centavos:
          cuota.capital_centavos,
        interes_programado_centavos:
          cuota.interes_centavos,
        capital_pagado_centavos: 0,
        interes_pagado_centavos: 0,
      })
    );

    const capitalOriginal = this.validarCentavos(
      credito.capital_centavos,
      "Capital original"
    );

    let capitalPagado = 0;
    let moraPagada = 0;
    let gastosPagados = 0;
    let saldoFavor = 0;
    let moraAcumulada = 0;
    let gastosAcumulados = 0;
    let fechaUltimoCalculoMora = plan.fecha_desembolso;

    const movimientosReconstruidos:
      MovimientoReconstruido[] = [];

    const tasaMoratoriaBps =
      politica.tipo === "plana"
        ? Number(politica.configuracion["tna_bps"])
        : 0;

    if (
      politica.tipo === "plana" &&
      (
        !Number.isSafeInteger(tasaMoratoriaBps) ||
        tasaMoratoriaBps < 0
      )
    ) {
      throw new Error(
        "La política plana no tiene una tasa moratoria válida."
      );
    }

    const calculadoraMora = new CalculadoraMora(
      politica.tipo === "escalonada"
        ? new PoliticaEscalonada()
        : new PoliticaPlana()
    );

    const tasaMoratoria = TasaNominalAnual.crear(
      tasaMoratoriaBps / 100
    );

    const parametros = configuracion.parametros;

    const reglaGastos = parametros[
      "gasto_gestion_cobro"
    ] as
      | {
          dia_generacion?: number;
          monto_centavos?: number;
          aplica_a_politicas?: string[];
        }
      | undefined;

    const permiteGastos =
      Array.isArray(reglaGastos?.aplica_a_politicas) &&
      reglaGastos.aplica_a_politicas.includes(
        credito.id_politica
      );

    const gastoGestion = new GastoGestionCobro();

    const cuotasConGastoGenerado = new Set<number>();

    const calcularMoraHasta = (
      fecha: string
    ): void => {
      if (fecha <= fechaUltimoCalculoMora) {
        return;
      }

      let moraPeriodo = 0;

      for (const cuota of cuotas) {
        const capitalPendiente = Math.max(
          0,
          cuota.capital_programado_centavos -
            cuota.capital_pagado_centavos
        );

        if (
          capitalPendiente === 0 ||
          cuota.fecha_vencimiento >= fecha
        ) {
          continue;
        }

        const fechaInicio =
          fechaUltimoCalculoMora > cuota.fecha_vencimiento
            ? fechaUltimoCalculoMora
            : cuota.fecha_vencimiento;

        const diasInicio =
          CalendarioVencimientos.calcularDiasAtraso(
            cuota.fecha_vencimiento,
            fechaInicio
          );

        const diasFin =
          CalendarioVencimientos.calcularDiasAtraso(
            cuota.fecha_vencimiento,
            fecha
          );

        const moraInicio = calculadoraMora
          .calcularInteresMoratorio(
            Dinero.desdeCentavos(
              capitalPendiente,
              "GTQ"
            ),
            tasaMoratoria,
            baseConteo,
            new DiasAtraso(diasInicio)
          )
          .obtenerCentavos();

        const moraFin = calculadoraMora
          .calcularInteresMoratorio(
            Dinero.desdeCentavos(
              capitalPendiente,
              "GTQ"
            ),
            tasaMoratoria,
            baseConteo,
            new DiasAtraso(diasFin)
          )
          .obtenerCentavos();

        moraPeriodo += Math.max(
          0,
          moraFin - moraInicio
        );
      }

      moraAcumulada += moraPeriodo;
      fechaUltimoCalculoMora = fecha;
    };

const generarGastoSiCorresponde = (
  fecha: string
): void => {
  if (!permiteGastos) {
    return;
  }

  for (const cuota of cuotas) {
    // Cada cuota puede generar el gasto una sola vez.
    if (cuotasConGastoGenerado.has(cuota.numero)) {
      continue;
    }

    const capitalPendiente =
      cuota.capital_programado_centavos -
      cuota.capital_pagado_centavos;

    if (
      capitalPendiente <= 0 ||
      cuota.fecha_vencimiento >= fecha
    ) {
      continue;
    }

    const diasAtraso =
      CalendarioVencimientos.calcularDiasAtraso(
        cuota.fecha_vencimiento,
        fecha
      );

    const gasto = gastoGestion.generarSiCorresponde(
      new DiasAtraso(diasAtraso),
      false,
      "GTQ"
    );

    const montoGasto = gasto.obtenerCentavos();

    if (montoGasto > 0) {
      gastosAcumulados += montoGasto;
      cuotasConGastoGenerado.add(cuota.numero);
    }
  }
};

    const distribuirEnCuotas = (
      monto: number,
      concepto: "capital" | "interes",
      fecha: string
    ): void => {
      let restante = monto;

      for (const cuota of cuotas) {
        if (
          restante <= 0 ||
          cuota.fecha_vencimiento > fecha
        ) {
          continue;
        }

        const programado =
          concepto === "capital"
            ? cuota.capital_programado_centavos
            : cuota.interes_programado_centavos;

        const pagado =
          concepto === "capital"
            ? cuota.capital_pagado_centavos
            : cuota.interes_pagado_centavos;

        const aplicar = Math.min(
          restante,
          programado - pagado
        );

        if (concepto === "capital") {
          cuota.capital_pagado_centavos += aplicar;
        } else {
          cuota.interes_pagado_centavos += aplicar;
        }

        restante -= aplicar;
      }

      if (restante !== 0) {
        throw new Error(
          "La aplicación del pago excede las obligaciones exigibles."
        );
      }
    };

    // Filtrar y ordenar los pagos históricos.
    const pagosHistoricos = [...pagos]
      .filter(
        (pago) =>
          pago.fecha >= plan.fecha_desembolso &&
          pago.fecha <= fechaCorte
      )
      .sort((a, b) => {
        const comparacionFecha =
          a.fecha.localeCompare(b.fecha);

        if (comparacionFecha !== 0) {
          return comparacionFecha;
        }

        return a.id_pago.localeCompare(b.id_pago);
      });

    for (const pago of pagosHistoricos) {
      const monto = this.validarCentavos(
        pago.monto_centavos,
        `Pago ${pago.id_pago}`
      );

      calcularMoraHasta(pago.fecha);
      generarGastoSiCorresponde(pago.fecha);

      const deuda: Obligaciones = {
        gastos: Math.max(
          0,
          gastosAcumulados - gastosPagados
        ),
        mora: Math.max(
          0,
          moraAcumulada - moraPagada
        ),
        interes: this.obtenerInteresExigible(
          cuotas,
          pago.fecha
        ),
        capital: this.obtenerCapitalExigible(
          cuotas,
          pago.fecha
        ),
      };

      const resultado = this.prelacion.aplicar(
        Dinero.desdeCentavos(monto, "GTQ"),
        {
          gastos: Dinero.desdeCentavos(
            deuda.gastos,
            "GTQ"
          ),
          interesMoratorio: Dinero.desdeCentavos(
            deuda.mora,
            "GTQ"
          ),
          interesCorriente: Dinero.desdeCentavos(
            deuda.interes,
            "GTQ"
          ),
          capital: Dinero.desdeCentavos(
            deuda.capital,
            "GTQ"
          ),
        }
      );

      let aplicadoGastos = 0;
      let aplicadoMora = 0;
      let aplicadoInteres = 0;
      let aplicadoCapital = 0;

      for (const movimiento of resultado.movimientos) {
        const concepto = movimiento.obtenerConcepto();

        const centavos =
          movimiento.obtenerMonto().obtenerCentavos();

        switch (concepto) {
          case "GASTOS":
            aplicadoGastos += centavos;
            break;

          case "INTERES_MORATORIO":
            aplicadoMora += centavos;
            break;

          case "INTERES_CORRIENTE":
            aplicadoInteres += centavos;
            break;

          case "CAPITAL":
            aplicadoCapital += centavos;
            break;
        }
      }

      gastosPagados += aplicadoGastos;
      moraPagada += aplicadoMora;

      distribuirEnCuotas(
        aplicadoInteres,
        "interes",
        pago.fecha
      );

      distribuirEnCuotas(
        aplicadoCapital,
        "capital",
        pago.fecha
      );

      capitalPagado += aplicadoCapital;

      const excedente =
        resultado.excedente.obtenerCentavos();

      saldoFavor += excedente;

      movimientosReconstruidos.push({
        id_pago: pago.id_pago,
        fecha: pago.fecha,
        monto_centavos: monto,
        capital_centavos: aplicadoCapital,
        interes_corriente_centavos:
          aplicadoInteres,
        interes_moratorio_centavos:
          aplicadoMora,
        gastos_centavos: aplicadoGastos,
        excedente_centavos: excedente,
      });
    }

    calcularMoraHasta(fechaCorte);
    generarGastoSiCorresponde(fechaCorte);

    const capitalPendiente = Math.max(
      0,
      capitalOriginal - capitalPagado
    );

    const interesCorrientePendiente =
      this.obtenerInteresExigible(
        cuotas,
        fechaCorte
      );

    const moraPendiente = Math.max(
      0,
      moraAcumulada - moraPagada
    );

    const gastosPendientes = Math.max(
      0,
      gastosAcumulados - gastosPagados
    );

    const diasMaximosAtraso = cuotas.reduce(
      (maximo, cuota) => {
        const pendiente =
          cuota.capital_programado_centavos -
          cuota.capital_pagado_centavos;

        if (
          pendiente <= 0 ||
          cuota.fecha_vencimiento >= fechaCorte
        ) {
          return maximo;
        }

        return Math.max(
          maximo,
          CalendarioVencimientos.calcularDiasAtraso(
            cuota.fecha_vencimiento,
            fechaCorte
          )
        );
      },
      0
    );

    const devengo = new CalculadoraDevengoInteres()
      .calcular(
        Dinero.desdeCentavos(
          interesCorrientePendiente,
          "GTQ"
        ),
        new DiasAtraso(diasMaximosAtraso)
      );

    const saldoTotal =
      capitalPendiente +
      interesCorrientePendiente +
      moraPendiente +
      gastosPendientes;

    return {
      id_credito: credito.id_credito,
      nombre_cliente: credito.nombre_cliente,
      fecha_corte: fechaCorte,
      id_politica: credito.id_politica,
      moneda: "GTQ",

      capital_original_centavos: capitalOriginal,
      capital_pendiente_centavos: capitalPendiente,
      capital_vencido_centavos:
        this.obtenerCapitalVencido(
          cuotas,
          fechaCorte
        ),

      interes_corriente_centavos:
        interesCorrientePendiente,

      interes_reconocido_centavos:
        devengo.interesReconocido.obtenerCentavos(),

      interes_en_suspenso_centavos:
        devengo.interesEnSuspenso.obtenerCentavos(),

      interes_moratorio_centavos:
        moraPendiente,

      gastos_cobranza_centavos:
        gastosPendientes,

      saldo_total_centavos: saldoTotal,
      saldo_favor_centavos: saldoFavor,

      cantidad_pagos_aplicados:
        pagosHistoricos.length,

      movimientos_reconstruidos:
        movimientosReconstruidos,

      estado_calculo:
        "RECONSTRUCCION_EN_MEMORIA",

      advertencias: [
        "Los excedentes se conservan como saldo a favor y no se aplican automáticamente.",
        "El calendario mensual utilizado debe validarse como regla institucional.",
        "Los movimientos se reconstruyen en memoria; no existe conciliación contra un libro mayor persistido.",
        "El interés corriente corresponde a cuotas exigibles según el cronograma; no representa un devengo diario independiente.",
      ],
    };
  }
}