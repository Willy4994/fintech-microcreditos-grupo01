import { ErrorAplicacion, fechaValida } from "../aplicacion/errores.js";
export interface Evidencia {
  herramienta: string;
  parametros: Record<string, unknown>;
  resultado: unknown;
}
export function datosHerramienta(resultado: unknown): unknown {
  if (typeof resultado !== "object" || resultado === null) return resultado;
  const r = resultado as {
    isError?: boolean;
    content?: { type: string; text?: string }[];
  };
  const texto = r.content?.find((c) => c.type === "text")?.text;
  if (r.isError)
    throw new ErrorAplicacion(
      "ERROR_HERRAMIENTA",
      texto ?? "La consulta MCP falló",
      502,
    );
  if (texto !== undefined) {
    try {
      return JSON.parse(texto) as unknown;
    } catch {
      throw new ErrorAplicacion(
        "RESPUESTA_MCP_INVALIDA",
        "La herramienta no devolvió JSON",
        502,
      );
    }
  }
  return resultado;
}
export function dinero(centavos: unknown): string {
  if (typeof centavos !== "number" || !Number.isSafeInteger(centavos))
    throw new ErrorAplicacion(
      "IMPORTE_INVALIDO",
      "El núcleo debe devolver centavos enteros seguros",
      502,
    );
  const n = BigInt(centavos);
  const absoluto = n < 0n ? -n : n;
  return `${n < 0n ? "-" : ""}Q${(absoluto / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${(absoluto % 100n).toString().padStart(2, "0")}`;
}
const meses = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
export function parametrosDePregunta(
  nombre: string,
  entrada: Record<string, unknown>,
  pregunta: string,
  fechaSesion: string,
): Record<string, unknown> {
  const p = { ...entrada };
  const texto = pregunta.toLowerCase();
  const iso = texto.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  const larga = texto.match(
    /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(\d{4}))?\b/,
  );
  const explicita =
    iso ??
    (larga
      ? `${larga[3] ?? fechaSesion.slice(0, 4)}-${String(meses.indexOf(larga[2]!) + 1).padStart(2, "0")}-${larga[1]!.padStart(2, "0")}`
      : undefined);
  if (explicita) fechaValida(explicita);
  if (nombre === "consultar_cierre") {
    const mensual =
      /\bmensual\b/.test(texto) ||
      (!explicita && meses.some((m) => texto.includes(m)));
    if (mensual) {
      const m = texto.match(
        /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(\d{4}))?\b/,
      );
      const anio = m?.[2] ?? (explicita ?? fechaSesion).slice(0, 4);
      const mes = m
        ? meses.indexOf(m[1]!) + 1
        : Number((explicita ?? fechaSesion).slice(5, 7));
      p.desde = `${anio}-${String(mes).padStart(2, "0")}-01`;
      p.hasta = new Date(Date.UTC(Number(anio), mes, 0))
        .toISOString()
        .slice(0, 10);
    } else if (explicita || /\bdiario\b/.test(texto)) {
      p.desde = explicita ?? fechaSesion;
      p.hasta = explicita ?? fechaSesion;
    }
    // Un rango de dos fechas ISO se respeta completo.
    const rango = [...texto.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g)].map(
      (m) => m[0],
    );
    if (rango.length === 2) {
      p.desde = fechaValida(rango[0]!);
      p.hasta = fechaValida(rango[1]!);
    }
  } else if (nombre === "buscar_politicas") {
    p.fecha = fechaSesion;
    p.pregunta = pregunta;
  } else if ("fecha" in p) {
    p.fecha = explicita ?? fechaSesion;
  }
  if (nombre === "consultar_vencimientos") {
    const dias =
      texto.match(/(?:pr[oó]ximos?\s+)?(\d{1,3})\s*(?:d[ií]as\b|[?¿])/i)?.[1] ??
      texto.match(/pr[oó]ximos?\s+(\d{1,3})\b/i)?.[1];
    if (dias) p.dias = Number(dias);
  }
  return p;
}
type Registro = Record<string, unknown>;
function registro(d: unknown): Registro {
  return d as Registro;
}
function lista(d: unknown): Registro[] {
  return Array.isArray(d) ? (d as Registro[]) : [];
}
function campo(d: Registro, k: string): string {
  return String(d[k] ?? "No informado");
}
export function presentarFinanzas(evidencias: Evidencia[]): string {
  return evidencias
    .filter((e) => e.herramienta !== "buscar_politicas")
    .map((e) => {
      const bruto = datosHerramienta(e.resultado);
      const d = registro(bruto);
      // Conserva datos desconocidos sin permitir una interpretación libre del modelo.
      if (!d || typeof d !== "object") return JSON.stringify(bruto);
      if (
        e.herramienta === "consultar_cartera" &&
        "cartera_activa_centavos" in d
      )
        return presentarCartera(d);
      if (e.herramienta === "consultar_cierre" && "recuperaciones" in d) {
        const r = registro(d.recuperaciones);
        return [
          `Cierre del ${campo(d, "desde")} al ${campo(d, "hasta")}.`,
          `Desembolsos: ${dinero(d.desembolsos_centavos)}.`,
          ...[
            "gastos",
            "interes_moratorio",
            "interes_corriente",
            "capital",
            "total",
          ].map(
            (k) =>
              `${({ gastos: "Gastos", interes_moratorio: "Interés moratorio", interes_corriente: "Interés corriente", capital: "Capital", total: "Total recuperado" } as Record<string, string>)[k]}: ${dinero(r[k + "_centavos"])}.`,
          ),
          ...(typeof d.interes_reconocido_periodo_centavos === "number"
            ? [
                `Interés reconocido del período: ${dinero(d.interes_reconocido_periodo_centavos)}.`,
              ]
            : []),
        ].join("\n");
      }
      if (e.herramienta === "listar_morosos" && Array.isArray(bruto))
        return (
          `Créditos en mora al ${String(e.parametros.fecha)}:\n` +
          (lista(bruto)
            .map(
              (c) =>
                `${campo(c, "id_credito")}: ${campo(c, "dias_atraso")} días; ${campo(c, "tramo")}; saldo de capital ${dinero(c.saldo_centavos)}.`,
            )
            .join("\n") || "No hay créditos que coincidan.")
        );
      if (e.herramienta === "consultar_credito" && "estado" in d)
        return [
          `Crédito ${campo(d, "id_credito")} al ${campo(d, "fecha_corte")}.`,
          `Estado: ${campo(d, "estado")}; tramo: ${campo(d, "tramo")}; atraso: ${campo(d, "dias_atraso")} días.`,
          `Capital pendiente: ${dinero(d.capital_pendiente_centavos)}.`,
          `Cuotas pagadas: ${campo(d, "cuotas_pagadas")}; cuotas vencidas: ${campo(d, "cuotas_vencidas")}.`,
          d.proxima_cuota
            ? `Próxima cuota: ${campo(registro(d.proxima_cuota), "numero")}, vence ${campo(registro(d.proxima_cuota), "fecha_vencimiento")}.`
            : "Sin próxima cuota.",
        ].join("\n");
      if (e.herramienta === "explicar_mora" && "numero" in d) {
        const tramos = lista(d.desglose_mora);
        return [
          `Cuota ${campo(d, "numero")} de ${String(e.parametros.id)}, corte ${String(e.parametros.fecha)}.`,
          `Vencimiento: ${campo(d, "fecha_vencimiento")}; atraso: ${campo(d, "dias_atraso")} días; tramo: ${campo(d, "tramo")}.`,
          `Capital programado: ${dinero(d.capital_programado_centavos)}; capital pendiente: ${dinero(d.capital_centavos)}.`,
          ...(typeof d.capital_pagado_centavos === "number"
            ? [`Capital pagado: ${dinero(d.capital_pagado_centavos)}.`]
            : []),
          `Base de conteo: ${campo(d, "base_conteo")}.`,
          ...tramos.map(
            (t) =>
              `${campo(t, "tramo")}, ${campo(t, "desde")} a ${campo(t, "hasta")}: ${campo(t, "dias")} días, tasa ${campo(t, "tasa_bps")} puntos básicos anuales, capital base ${dinero(t.capital_centavos)}, componente informativo ${dinero(t.monto_centavos)}.`,
          ),
          `Mora generada: ${dinero(d.mora_generada_centavos)}; mora pendiente: ${dinero(d.interes_moratorio_centavos)}.`,
          `Gastos: ${dinero(d.gastos_centavos)}; interés corriente pendiente: ${dinero(d.interes_corriente_centavos)}; total exigible: ${dinero(d.total_exigible_centavos)}.`,
          `Los componentes por tramo son informativos; el total se redondea una sola vez con precisión completa. No se suman los componentes redondeados.`,
        ].join("\n");
      }
      if (e.herramienta === "consultar_vencimientos" && "cuotas" in d)
        return [
          `Vencimientos posteriores a ${campo(d, "desde")} y hasta ${campo(d, "hasta")}.`,
          `Cantidad: ${campo(d, "cantidad")}; monto total: ${dinero(d.monto_centavos)}.`,
          ...lista(d.cuotas).map(
            (c) =>
              `${campo(c, "id_credito")}, cuota ${campo(c, "numero")}, vence ${campo(c, "fecha_vencimiento")}: ${dinero(c.total_exigible_centavos)}.`,
          ),
        ].join("\n");
      if (e.herramienta === "proponer_pago")
        return `Propuesta de pago: ${campo(d, "estado")}. ${d.estado === "PENDIENTE" ? "Se requiere aprobación humana; el pago no se ha registrado." : ""}\n${JSON.stringify(d, null, 2)}`;
      return `Datos de ${e.herramienta} (campos monetarios en centavos):\n${JSON.stringify(bruto, null, 2)}`;
    })
    .join("\n\n");
}
function presentarCartera(d: Registro): string {
  return [
    `Cartera al ${campo(d, "fecha_corte")}.`,
    `Cartera activa: ${dinero(d.cartera_activa_centavos)}.`,
    `Cartera en mora: ${dinero(d.cartera_mora_centavos)} (${campo(d, "cartera_mora_porcentaje")} %).`,
    `Cartera en riesgo: ${dinero(d.cartera_riesgo_centavos)} (${campo(d, "cartera_riesgo_porcentaje")} %).`,
    ...lista(d.desglose).map(
      (t) =>
        `${campo(t, "tramo")}: ${dinero(t.capital_centavos)} (${campo(t, "porcentaje")} %).`,
    ),
    `Incobrable del mes: ${dinero(d.incobrable_mes_centavos)}.`,
  ].join("\n");
}
