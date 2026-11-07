export interface TramoCartera {
  tramo: string;
  capital_centavos: number;
  porcentaje: number;
}

export interface ResumenCartera {
  fecha_corte: string;
  cartera_activa_centavos: number;
  cartera_mora_centavos: number;
  cartera_mora_porcentaje: number;
  cartera_riesgo_centavos: number;
  cartera_riesgo_porcentaje: number;
  desglose: TramoCartera[];
  incobrable_mes_centavos: number;
}

export async function consultarCartera(fecha: string): Promise<ResumenCartera> {
  const respuesta = await fetch(
    `/api/cartera?fecha=${encodeURIComponent(fecha)}`,
  );

  if (!respuesta.ok) {
    throw new Error(
      `No fue posible consultar la cartera. HTTP ${respuesta.status}`,
    );
  }

  return (await respuesta.json()) as ResumenCartera;
}

export function formatearQuetzales(centavos: number): string {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100);
}

export function formatearPorcentaje(porcentaje: number): string {
  return `${porcentaje.toFixed(2)} %`;
}
