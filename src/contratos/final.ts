import { z } from "zod";
import { fechaSchema, idSchema } from "../aplicacion/errores.js";
import { originacionSchema } from "../aplicacion/servicios/OperacionesPg.js";
export const simulacionSchema = originacionSchema
  .pick({
    capital_centavos: true,
    tna_bps: true,
    plazo_meses: true,
    fecha: true,
  })
  .strict();
export const decisionSchema = z
  .object({ aprobar: z.boolean(), actor: idSchema })
  .strict();
export const cierreSchema = z
  .object({ desde: fechaSchema, hasta: fechaSchema, actor: idSchema })
  .strict();
export const chatSchema = z
  .object({
    pregunta: z.string().min(1).max(4000),
    fecha: fechaSchema,
    sesion: z.uuid().optional(),
  })
  .strict();
