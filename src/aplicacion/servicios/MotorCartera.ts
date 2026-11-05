import { LibroDevengo } from "../../dominio/cierres/services/CalculadoraDevengoInteres.js";
import { DiasAtraso } from "../../dominio/cartera-cobros/value-objects/DiasAtraso.js";
import { PrelacionPago } from "../../dominio/cartera-cobros/services/PrelacionPago.js";
import { Decimal } from "decimal.js";
import { AmortizacionFrancesa } from "../../dominio/calculo-financiero/strategies/AmortizacionFrancesa.js";
import { TasaNominalAnual } from "../../dominio/calculo-financiero/value-objects/TasaNominalAnual.js";
import { Plazo } from "../../dominio/calculo-financiero/value-objects/Plazo.js";
import { Dinero } from "../../dominio/shared/value-objects/Dinero.js";
import { CalendarioVencimientos as Calendario } from "../../dominio/calculo-financiero/services/CalendarioVencimientos.js";
import { PoliticaConfigurada } from "../../dominio/politica-mora/PoliticaConfigurada.js";
import type { CreditoDato, DatosCartera } from "../puertos/DatosCartera.js";
import { ErrorAplicacion, exigir, fechaValida } from "../errores.js";
export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fechaValida(fecha)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
export function tramo(dias: number): string {
  return dias === 0
    ? "SIN_MORA"
    : dias <= 30
      ? "MORA_1"
      : dias <= 60
        ? "MORA_2"
        : dias <= 90
          ? "MORA_3"
          : dias <= 120
            ? "VENCIDO"
            : "INCOBRABLE";
}
export function simular(
  capital: number,
  tna: number,
  meses: number,
  fecha: string,
) {
  fechaValida(fecha);
  return new AmortizacionFrancesa()
    .calcular(
      Dinero.desdeCentavos(capital, "GTQ"),
      TasaNominalAnual.crear(tna / 100).obtenerTasaMensual(),
      Plazo.crear(meses),
    )
    .obtenerCuotas()
    .map((c) => ({
      numero: c.numero,
      fecha_vencimiento: Calendario.sumarMeses(fecha, c.numero),
      capital_centavos: c.amortizacionCapital.obtenerCentavos(),
      interes_centavos: c.interes.obtenerCentavos(),
      monto_centavos: c.monto.obtenerCentavos(),
      saldo_centavos: c.saldo.obtenerCentavos(),
    }));
}
export function reconstruir(datos: DatosCartera, id: string, corte: string) {
  fechaValida(corte);
  const credito = exigir(
    datos.creditos.find((c) => c.id_credito === id),
    "Crédito inexistente",
  );
  if (corte < credito.fecha_desembolso)
    throw new ErrorAplicacion("FECHA_INVALIDA", "Corte anterior al desembolso");
  if (Calendario.calcularDiasAtraso(credito.fecha_desembolso, corte) > 36525)
    throw new ErrorAplicacion(
      "FECHA_INVALIDA",
      "Corte fuera del rango de cien años",
    );
  const politica = new PoliticaConfigurada(
    exigir(
      datos.politicas.find((p) => p.id_politica === credito.id_politica),
      "Política inexistente",
    ).configuracion,
    datos.configuracion.parametros.regla_incobrable_dias ?? 120,
  );
  const limite = politica.limiteDias;
  const gasto = datos.configuracion.parametros.gasto_gestion_cobro;
  const divisor = datos.configuracion.base_conteo.toUpperCase().includes("365")
    ? 365
    : 360;
  const cuotas = simular(
    Number(credito.capital_centavos),
    credito.tna_bps,
    credito.plazo_meses,
    credito.fecha_desembolso,
  ).map((c) => ({
    ...c,
    capital_pagado_centavos: 0,
    interes_pagado_centavos: 0,
    mora_pagada_centavos: 0,
    gastos_pagados_centavos: 0,
    mora_exacta: new Decimal(0),
    gastos_centavos: 0,
    historial_tramos: [] as {
      desde: string;
      hasta: string;
      capital_centavos: number;
      dias: number;
      tasa_bps: number;
      tramo: string;
      centavos_sin_redondear: string;
    }[],
  }));
  const movimientos: {
    id_pago: string;
    clave_idempotencia: string;
    fecha: string;
    monto_centavos: number;
    gastos_centavos: number;
    interes_moratorio_centavos: number;
    interes_corriente_centavos: number;
    capital_centavos: number;
    excedente_centavos: number;
  }[] = [];
  const pagos = datos.pagos
    .filter((p) => p.id_credito === id && p.fecha <= corte)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.orden - b.orden);
  let incobrable: string | null = null;
  let baja = 0;
  let saldoFavor = 0;
  const claves = new Set<string>();
  const libro = new LibroDevengo();
  const reconocimientos: {
    fecha: string;
    interes_reconocido_centavos: number;
    interes_en_suspenso_centavos: number;
  }[] = [];
  let suspenso = 0;
  for (
    let dia = credito.fecha_desembolso;
    dia <= corte;
    dia = sumarDias(dia, 1)
  ) {
    const diasMax = Math.max(
      0,
      ...cuotas
        .filter(
          (c) =>
            c.capital_centavos > c.capital_pagado_centavos ||
            c.interes_centavos > c.interes_pagado_centavos,
        )
        .map((c) => Calendario.calcularDiasAtraso(c.fecha_vencimiento, dia)),
    );
    if (!incobrable && diasMax > limite) {
      incobrable = dia;
      baja = cuotas.reduce(
        (a, c) => a + c.capital_centavos - c.capital_pagado_centavos,
        0,
      );
    }
    if (!incobrable) {
      const interesDelDia = cuotas
        .filter((c) => c.fecha_vencimiento === dia)
        .reduce(
          (a, c) => a + c.interes_centavos - c.interes_pagado_centavos,
          0,
        );
      const devengo = libro.registrar(
        Dinero.desdeCentavos(interesDelDia, "GTQ"),
        new DiasAtraso(diasMax),
        diasMax <= 90,
      );
      suspenso = devengo.interesEnSuspenso.obtenerCentavos();
      if (interesDelDia > 0 || devengo.interesReconocido.obtenerCentavos() > 0)
        reconocimientos.push({
          fecha: dia,
          interes_reconocido_centavos:
            devengo.interesReconocido.obtenerCentavos(),
          interes_en_suspenso_centavos: suspenso,
        });
    }
    if (!incobrable)
      for (const c of cuotas) {
        const dias = Calendario.calcularDiasAtraso(c.fecha_vencimiento, dia);
        const capital = c.capital_centavos - c.capital_pagado_centavos;
        if (dias > 0 && capital > 0) {
          const actual = politica
            .desglosar(capital, dias, divisor)
            .tramos.at(-1);
          if (actual && dias <= limite) {
            const exacto = new Decimal(capital)
              .times(actual.tasa_bps)
              .div(10000)
              .div(divisor);
            c.mora_exacta = Decimal.min(
              c.capital_centavos,
              c.mora_exacta.plus(exacto),
            );
            const previo = c.historial_tramos.at(-1);
            if (
              previo &&
              previo.tramo === actual.tramo &&
              previo.capital_centavos === capital
            ) {
              previo.hasta = dia;
              previo.dias++;
              previo.centavos_sin_redondear = new Decimal(
                previo.centavos_sin_redondear,
              )
                .plus(exacto)
                .toString();
            } else
              c.historial_tramos.push({
                desde: dia,
                hasta: dia,
                capital_centavos: capital,
                dias: 1,
                tasa_bps: actual.tasa_bps,
                tramo: actual.tramo,
                centavos_sin_redondear: exacto.toString(),
              });
          }
          if (
            gasto &&
            gasto.aplica_a_politicas.includes(credito.id_politica) &&
            dias >= gasto.dia_generacion &&
            c.gastos_centavos === 0
          )
            c.gastos_centavos = gasto.monto_centavos;
        }
      }
    for (const p of pagos.filter((p) => p.fecha === dia)) {
      if (claves.has(p.clave_idempotencia)) continue;
      claves.add(p.clave_idempotencia);
      if (incobrable)
        throw new ErrorAplicacion(
          "PAGO_INCOBRABLE",
          "La bitácora contiene un pago posterior a la baja",
          409,
          { id_pago: p.id_pago },
        );
      let resto = Number(p.monto_centavos);
      const m = {
        id_pago: p.id_pago,
        clave_idempotencia: p.clave_idempotencia,
        fecha: dia,
        monto_centavos: resto,
        gastos_centavos: 0,
        interes_moratorio_centavos: 0,
        interes_corriente_centavos: 0,
        capital_centavos: 0,
        excedente_centavos: 0,
      };
      const seleccion = cuotas.filter(
        (c) => (!p.cuota || c.numero === p.cuota) && c.fecha_vencimiento <= dia,
      );
      const obligaciones = {
        gastos: 0,
        interesMoratorio: 0,
        interesCorriente: 0,
        capital: 0,
      };
      for (const c of seleccion) {
        obligaciones.gastos += c.gastos_centavos - c.gastos_pagados_centavos;
        obligaciones.interesMoratorio += Math.max(
          0,
          c.mora_exacta.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber() -
            c.mora_pagada_centavos,
        );
        obligaciones.interesCorriente +=
          c.interes_centavos - c.interes_pagado_centavos;
        obligaciones.capital += c.capital_centavos - c.capital_pagado_centavos;
      }
      const reparto = new PrelacionPago().aplicar(
        Dinero.desdeCentavos(resto, "GTQ"),
        {
          gastos: Dinero.desdeCentavos(obligaciones.gastos, "GTQ"),
          interesMoratorio: Dinero.desdeCentavos(
            obligaciones.interesMoratorio,
            "GTQ",
          ),
          interesCorriente: Dinero.desdeCentavos(
            obligaciones.interesCorriente,
            "GTQ",
          ),
          capital: Dinero.desdeCentavos(obligaciones.capital, "GTQ"),
        },
      );
      const limites = new Map<string, number>(
        reparto.movimientos.map((m) => [
          m.obtenerConcepto(),
          m.obtenerMonto().obtenerCentavos(),
        ]),
      );
      for (const concepto of ["gastos", "mora", "interes", "capital"] as const)
        for (const c of seleccion) {
          if (c.fecha_vencimiento > dia) continue;
          const deuda =
            concepto === "gastos"
              ? c.gastos_centavos - c.gastos_pagados_centavos
              : concepto === "mora"
                ? c.mora_exacta
                    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
                    .toNumber() - c.mora_pagada_centavos
                : concepto === "interes"
                  ? c.interes_centavos - c.interes_pagado_centavos
                  : c.capital_centavos - c.capital_pagado_centavos;
          const nombre =
            concepto === "gastos"
              ? "GASTOS"
              : concepto === "mora"
                ? "INTERES_MORATORIO"
                : concepto === "interes"
                  ? "INTERES_CORRIENTE"
                  : "CAPITAL";
          const disponible = limites.get(nombre) ?? 0;
          const aplicado = Math.min(disponible, Math.max(0, deuda));
          limites.set(nombre, disponible - aplicado);
          resto -= aplicado;
          if (concepto === "gastos") {
            c.gastos_pagados_centavos += aplicado;
            m.gastos_centavos += aplicado;
          }
          if (concepto === "mora") {
            c.mora_pagada_centavos += aplicado;
            m.interes_moratorio_centavos += aplicado;
          }
          if (concepto === "interes") {
            c.interes_pagado_centavos += aplicado;
            m.interes_corriente_centavos += aplicado;
          }
          if (concepto === "capital") {
            c.capital_pagado_centavos += aplicado;
            m.capital_centavos += aplicado;
          }
        }
      // Política P1: excedentes amortizan capital futuro, sin cobrar interés futuro.
      for (const c of cuotas) {
        const aplicado = Math.min(
          resto,
          c.capital_centavos - c.capital_pagado_centavos,
        );
        c.capital_pagado_centavos += aplicado;
        m.capital_centavos += aplicado;
        resto -= aplicado;
        if (
          c.capital_centavos === c.capital_pagado_centavos &&
          c.fecha_vencimiento > dia
        )
          c.interes_pagado_centavos = c.interes_centavos;
      }
      saldoFavor += resto;
      m.excedente_centavos = resto;
      movimientos.push(m);
      const diasTrasPago = Math.max(
        0,
        ...cuotas
          .filter(
            (c) =>
              c.capital_centavos > c.capital_pagado_centavos ||
              c.interes_centavos > c.interes_pagado_centavos,
          )
          .map((c) => Calendario.calcularDiasAtraso(c.fecha_vencimiento, dia)),
      );
      if (suspenso > 0 && diasTrasPago <= 90) {
        const recuperado = libro.registrar(
          Dinero.desdeCentavos(0, "GTQ"),
          new DiasAtraso(diasTrasPago),
          true,
        );
        suspenso = 0;
        reconocimientos.push({
          fecha: dia,
          interes_reconocido_centavos:
            recuperado.interesReconocido.obtenerCentavos(),
          interes_en_suspenso_centavos: 0,
        });
      }
    }
  }
  const detalle = cuotas.map((c) => {
    const capital = c.capital_centavos - c.capital_pagado_centavos;
    const interes = c.interes_centavos - c.interes_pagado_centavos;
    const mora =
      c.mora_exacta.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber() -
      c.mora_pagada_centavos;
    const gastos = c.gastos_centavos - c.gastos_pagados_centavos;
    const dias =
      capital > 0 || interes > 0
        ? Calendario.calcularDiasAtraso(c.fecha_vencimiento, corte)
        : 0;
    return {
      numero: c.numero,
      fecha_vencimiento: c.fecha_vencimiento,
      capital_programado_centavos: c.capital_centavos,
      capital_pagado_centavos: c.capital_pagado_centavos,
      interes_pagado_centavos: c.interes_pagado_centavos,
      base_conteo: datos.configuracion.base_conteo,
      interes_programado_centavos: c.interes_centavos,
      capital_centavos: capital,
      interes_corriente_centavos: interes,
      interes_moratorio_centavos: Math.max(0, mora),
      gastos_centavos: gastos,
      total_exigible_centavos: capital + interes + Math.max(0, mora) + gastos,
      dias_atraso: dias,
      tramo: tramo(dias),
      pagada: capital === 0 && interes === 0 && mora <= 0 && gastos === 0,
      desglose_mora: c.historial_tramos.map((t) => ({
        ...t,
        monto_centavos: new Decimal(t.centavos_sin_redondear)
          .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
          .toNumber(),
      })),
      mora_generada_centavos: c.mora_exacta
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toNumber(),
      regla_redondeo:
        "Los componentes son informativos; el total se redondea una sola vez.",
    };
  });
  const dias = Math.max(0, ...detalle.map((c) => c.dias_atraso));
  const capital = detalle.reduce((a, c) => a + c.capital_centavos, 0);
  const estado = incobrable
    ? "INCOBRABLE"
    : capital === 0 &&
        detalle.every(
          (c) =>
            c.interes_corriente_centavos === 0 &&
            c.interes_moratorio_centavos === 0 &&
            c.gastos_centavos === 0,
        )
      ? "CANCELADO"
      : dias > 0
        ? "EN_MORA"
        : "VIGENTE";
  return {
    id_credito: id,
    id_cliente: credito.id_cliente,
    id_asesor: credito.id_asesor,
    id_politica: credito.id_politica,
    fecha_corte: corte,
    estado,
    tramo: tramo(dias),
    dias_atraso: dias,
    reestructurado: credito.reestructurado,
    capital_pendiente_centavos: capital,
    saldo_favor_centavos: saldoFavor,
    interes_en_suspenso_centavos: suspenso,
    reconocimientos,
    fecha_incobrable: incobrable,
    baja_centavos: baja,
    cuotas: detalle,
    cuotas_pagadas: detalle.filter((c) => c.pagada).length,
    cuotas_vencidas: detalle.filter(
      (c) => !c.pagada && c.fecha_vencimiento < corte,
    ).length,
    proxima_cuota:
      detalle.find((c) => !c.pagada && c.fecha_vencimiento >= corte) ?? null,
    movimientos,
  };
}
export function cartera(datos: DatosCartera, fecha: string) {
  fechaValida(fecha);
  const estados = datos.creditos
    .filter((c) => c.fecha_desembolso <= fecha)
    .map((c) => reconstruir(datos, c.id_credito, fecha));
  const activos = estados.filter(
    (c) => c.estado !== "INCOBRABLE" && c.estado !== "CANCELADO",
  );
  const activa = activos.reduce((a, c) => a + c.capital_pendiente_centavos, 0);
  const porcentaje = (n: number) =>
    activa === 0
      ? 0
      : new Decimal(n).times(100).div(activa).toDecimalPlaces(6).toNumber();
  const suma = (lista: typeof estados) =>
    lista.reduce((a, c) => a + c.capital_pendiente_centavos, 0);
  const mora = suma(activos.filter((c) => c.dias_atraso > 0));
  const riesgo = suma(
    activos.filter(
      (c) =>
        c.dias_atraso >
          (datos.configuracion.parametros.regla_riesgo_dias ?? 30) ||
        c.reestructurado,
    ),
  );
  const desglose = ["MORA_2", "MORA_3", "VENCIDO", "REESTRUCTURADO"].map(
    (t) => {
      const lista = activos.filter((c) =>
        t === "REESTRUCTURADO"
          ? c.reestructurado && c.dias_atraso <= 30
          : c.tramo === t,
      );
      const saldo = suma(lista);
      return {
        tramo: t,
        capital_centavos: saldo,
        porcentaje: porcentaje(saldo),
      };
    },
  );
  return {
    fecha_corte: fecha,
    cartera_activa_centavos: activa,
    cartera_mora_centavos: mora,
    cartera_mora_porcentaje: porcentaje(mora),
    cartera_riesgo_centavos: riesgo,
    cartera_riesgo_porcentaje: porcentaje(riesgo),
    desglose,
    incobrable_mes_centavos: estados
      .filter((c) => c.fecha_incobrable?.startsWith(fecha.slice(0, 7)))
      .reduce((a, c) => a + c.baja_centavos, 0),
  };
}
export function cierre(datos: DatosCartera, desde: string, hasta: string) {
  fechaValida(desde);
  fechaValida(hasta);
  if (desde > hasta)
    throw new ErrorAplicacion("FECHA_INVALIDA", "Período invertido");
  const estados = datos.creditos
    .filter((c) => c.fecha_desembolso <= hasta)
    .map((c) => reconstruir(datos, c.id_credito, hasta));
  const movimientos = estados
    .flatMap((c) => c.movimientos)
    .filter((m) => m.fecha >= desde && m.fecha <= hasta);
  const sumar = (
    campo:
      | "gastos_centavos"
      | "interes_moratorio_centavos"
      | "interes_corriente_centavos"
      | "capital_centavos"
      | "monto_centavos",
  ) => movimientos.reduce((a, m) => a + m[campo], 0);
  return {
    desde,
    hasta,
    desembolsos_centavos: datos.creditos
      .filter((c) => c.fecha_desembolso >= desde && c.fecha_desembolso <= hasta)
      .reduce((a, c) => a + Number(c.capital_centavos), 0),
    interes_reconocido_periodo_centavos: estados
      .flatMap((c) => c.reconocimientos)
      .filter((r) => r.fecha >= desde && r.fecha <= hasta)
      .reduce((a, r) => a + r.interes_reconocido_centavos, 0),
    recuperaciones: {
      gastos_centavos: sumar("gastos_centavos"),
      interes_moratorio_centavos: sumar("interes_moratorio_centavos"),
      interes_corriente_centavos: sumar("interes_corriente_centavos"),
      capital_centavos: sumar("capital_centavos"),
      total_centavos: sumar("monto_centavos"),
    },
    cartera: cartera(datos, hasta),
  };
}
