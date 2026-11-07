import { ErrorAplicacion, fechaValida } from "../aplicacion/errores.js";
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
export function periodoOtorgamiento(
  pregunta: string,
): { desde: string; hasta: string } | undefined {
  const texto = pregunta.toLowerCase();
  const tramo = texto.match(
    /\b(?:otorgad[oa]s?|desembolsad[oa]s?)\b([^?;.]{0,100})/,
  )?.[1];
  if (!tramo) return undefined;
  const iso = tramo.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  if (iso) {
    fechaValida(iso);
    return { desde: iso, hasta: iso };
  }
  const m = tramo.match(
    /\b(?:(\d{1,2})\s+de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(\d{4})\b/,
  );
  if (!m) return undefined;
  const mes = meses.indexOf(m[2]!) + 1;
  const prefijo = `${m[3]}-${String(mes).padStart(2, "0")}`;
  if (m[1]) {
    const fecha = fechaValida(`${prefijo}-${m[1].padStart(2, "0")}`);
    return { desde: fecha, hasta: fecha };
  }
  return {
    desde: `${prefijo}-01`,
    hasta: new Date(Date.UTC(Number(m[3]), mes, 0)).toISOString().slice(0, 10),
  };
}
export interface Vigencia {
  id_politica: string;
  desde: string | null;
  hasta: string | null;
}
export function seleccionarPolitica(
  periodo: { desde: string; hasta: string },
  politicas: Vigencia[],
): string {
  const coinciden = politicas.filter(
    (p) =>
      (p.desde === null || p.desde <= periodo.hasta) &&
      (p.hasta === null || p.hasta >= periodo.desde),
  );
  const p = coinciden[0];
  if (
    coinciden.length !== 1 ||
    !p ||
    (p.desde !== null && p.desde > periodo.desde) ||
    (p.hasta !== null && p.hasta < periodo.hasta)
  )
    throw new ErrorAplicacion(
      "VIGENCIA_AMBIGUA",
      "Indique una fecha exacta de otorgamiento con una política única",
      409,
    );
  return p.id_politica;
}
