import { z } from "zod";
export class ErrorAplicacion extends Error {
  constructor(
    public codigo: string,
    mensaje: string,
    public estado = 400,
    public detalles: unknown = undefined,
  ) {
    super(mensaje);
  }
}
export const fechaSchema = z.iso.date();
export const idSchema = z.string().trim().min(1).max(100);
export function fechaValida(fecha: string): string {
  return fechaSchema.parse(fecha);
}
export function exigir<T>(
  valor: T | null | undefined,
  mensaje = "Recurso inexistente",
): T {
  if (valor == null) throw new ErrorAplicacion("NO_ENCONTRADO", mensaje, 404);
  return valor;
}
