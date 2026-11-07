export interface Credito {
  id_credito: string;
  id_cliente: string;
  id_asesor: string;
  id_politica: string;
  fecha_desembolso: string;
  capital_centavos: string;
  plazo_meses: number;
  tna_bps: number;
  reestructurado: boolean;
}

export interface CreditoMoroso {
  id_credito: string;
  dias_atraso: number;
  tramo: string;
  saldo_centavos: number;
}

export async function consultarCreditos(): Promise<Credito[]> {
  const respuesta = await fetch("/api/creditos");

  if (!respuesta.ok) {
    throw new Error("No fue posible consultar los créditos.");
  }

  return (await respuesta.json()) as Credito[];
}

export async function consultarMorosos(
  fecha: string,
): Promise<CreditoMoroso[]> {
  const respuesta = await fetch(
    `/api/morosos?fecha=${encodeURIComponent(fecha)}`,
  );

  if (!respuesta.ok) {
    throw new Error("No fue posible consultar los créditos morosos.");
  }

  return (await respuesta.json()) as CreditoMoroso[];
}
