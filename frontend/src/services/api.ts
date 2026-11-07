import type { ResumenCartera } from "./cartera";
export class ApiError extends Error {
  codigo: string;
  detalles?: { monto_correcto_centavos?: number };
  constructor(
    mensaje: string,
    codigo: string,
    detalles?: { monto_correcto_centavos?: number },
  ) {
    super(mensaje);
    this.codigo = codigo;
    this.detalles = detalles;
  }
}
export async function api<T>(
  ruta: string,
  opciones: RequestInit = {},
): Promise<T> {
  const r = await fetch(`/api${ruta}`, {
    ...opciones,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...opciones.headers },
  });
  if (r.status === 204) return undefined as T;
  const datos = await r.json();
  if (!r.ok)
    throw new ApiError(
      datos.mensaje ?? "No se pudo completar la operación",
      datos.codigo ?? "ERROR",
      datos.detalles,
    );
  return datos as T;
}
export const post = <T>(ruta: string, datos: unknown) =>
  api<T>(ruta, { method: "POST", body: JSON.stringify(datos) });
export const mensajeError = (e: unknown) =>
  e instanceof Error ? e.message : "No fue posible completar la operación.";
export interface Sesion {
  actor: string;
  perfil: "asesor" | "gerencia";
}
export interface TramoMora {
  desde: string;
  hasta: string;
  capital_centavos: number;
  dias: number;
  tasa_bps: number;
  tramo: string;
  monto_centavos: number;
  centavos_sin_redondear: string;
}
export interface Cuota {
  numero: number;
  fecha_vencimiento: string;
  monto_programado_centavos: number;
  saldo_programado_centavos: number;
  capital_programado_centavos: number;
  interes_programado_centavos: number;
  capital_pagado_centavos: number;
  capital_centavos: number;
  interes_corriente_centavos: number;
  interes_moratorio_centavos: number;
  gastos_centavos: number;
  total_exigible_centavos: number;
  dias_atraso: number;
  tramo: string;
  pagada: boolean;
  desglose_mora: TramoMora[];
  mora_generada_centavos: number;
  base_conteo: string;
}
export interface Movimiento {
  id_pago: string;
  clave_idempotencia: string;
  fecha: string;
  monto_centavos: number;
  gastos_centavos: number;
  interes_moratorio_centavos: number;
  interes_corriente_centavos: number;
  capital_centavos: number;
  excedente_centavos: number;
}
export interface EstadoCredito {
  id_credito: string;
  id_cliente: string;
  id_asesor: string;
  id_politica: string;
  fecha_corte: string;
  estado: string;
  tramo: string;
  dias_atraso: number;
  capital_pendiente_centavos: number;
  cuotas_pagadas: number;
  cuotas_vencidas: number;
  cuotas: Cuota[];
  proxima_cuota: Cuota | null;
  movimientos: Movimiento[];
}
export interface CuotaPlan {
  numero: number;
  fecha_vencimiento: string;
  capital_centavos: number;
  interes_centavos: number;
  monto_centavos: number;
  saldo_centavos: number;
}
export interface PagoEntrada {
  id_credito: string;
  cuota: number;
  fecha: string;
  monto_centavos: number;
  clave_idempotencia: string;
}
export interface Propuesta {
  id?: string;
  estado: string;
  parametros?: PagoEntrada;
  desglose?: Cuota;
  duplicado?: boolean;
}
export interface Aprobacion {
  id: string;
  estado: string;
  parametros: PagoEntrada;
  expira_en: string;
}
export interface Decision {
  estado: string;
  resultado: { registrado?: boolean; duplicado?: boolean };
}
export interface Cierre {
  cartera?: ResumenCartera;
  desde: string;
  hasta: string;
  desembolsos_centavos: number;
  interes_reconocido_periodo_centavos: number;
  recuperaciones: {
    gastos_centavos: number;
    interes_moratorio_centavos: number;
    interes_corriente_centavos: number;
    capital_centavos: number;
    total_centavos: number;
  };
}
export interface ContenidoMcp {
  isError?: boolean;
  content?: { type: string; text?: string }[];
}
export interface Evidencia {
  herramienta: string;
  parametros: Record<string, unknown>;
  resultado: ContenidoMcp;
}
export interface RespuestaChat {
  sesion: string;
  fecha_corte: string;
  respuesta: string;
  evidencias: Evidencia[];
  fuentes: ContenidoMcp[];
}
export interface Fuente {
  id: string;
  documento: string;
  titulo: string;
  contenido: string;
  similitud: number;
}
export function leerMcp<T>(r: ContenidoMcp): T | undefined {
  try {
    return JSON.parse(
      r.content?.find((c) => c.type === "text")?.text ?? "null",
    ) as T;
  } catch {
    return undefined;
  }
}
export const nombresTramos: Record<string, string> = {
  SIN_MORA: "Al día",
  MORA_1: "Mora 1",
  MORA_2: "Mora 2",
  MORA_3: "Mora 3",
  VENCIDO: "Vencido",
  INCOBRABLE: "Incobrable",
  REESTRUCTURADO: "Reestructurado",
};
export function centavos(texto: string): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(texto))
    throw new Error("Ingresa un monto positivo con hasta dos decimales.");
  const [enteros, decimales = ""] = texto.split(".");
  const n = Number(enteros) * 100 + Number(decimales.padEnd(2, "0"));
  if (!Number.isSafeInteger(n) || n <= 0)
    throw new Error("El monto no es válido.");
  return n;
}
