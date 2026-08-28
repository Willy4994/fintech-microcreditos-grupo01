import { z } from "zod";

export const monedaSchema = z.enum(["GTQ", "USD"]);

export const dineroSchema = z.object({
  centavos: z.number().int(),
  moneda: monedaSchema,
});

export const clienteSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  documentoIdentificacion: z.string().min(1),
  email: z.string().email(),
});

export const solicitudCreditoSchema = z.object({
  id: z.string().min(1),
  clienteId: z.string().min(1),
  montoSolicitado: dineroSchema,
  plazoMeses: z.number().int().min(3).max(24),
  estado: z.enum([
    "PENDIENTE",
    "EN_EVALUACION",
    "APROBADA",
    "RECHAZADA",
    "ANULADA",
  ]),
});

export const estadoCreditoSchema = z.enum([
  "SOLICITADO",
  "APROBADO",
  "RECHAZADO",
  "DESEMBOLSADO",
  "VIGENTE",
  "EN_MORA",
  "REESTRUCTURADO",
  "CANCELADO",
  "ANULADO",
  "INCOBRABLE",
]);

export const creditoSchema = z.object({
  id: z.string().min(1),
  clienteId: z.string().min(1),
  solicitudId: z.string().min(1),
  capital: dineroSchema,
  plazoMeses: z.number().int().min(3).max(24),
  estado: estadoCreditoSchema,
  diasAtraso: z.number().int().nonnegative(),
  reestructurado: z.boolean(),
});

export const registrarPagoSchema = z.object({
  creditoId: z.string().min(1),
  claveIdempotencia: z.string().min(1),
  monto: dineroSchema.refine(
    (dinero) => dinero.centavos > 0,
    "El pago debe ser mayor que cero"
  ),
  fecha: z.string().date(),
});

export const cierreSchema = z.object({
  id: z.string().min(1),
  fechaCorte: z.string().date(),
  tipo: z.enum(["DIARIO", "MENSUAL"]),
});

export const carteraRiesgoSchema = z.object({
  fechaCorte: z.string().date(),
  carteraActiva: dineroSchema,
  carteraEnRiesgo: dineroSchema,
  porcentajeRiesgo: z.string(),
  montoDeclaradoIncobrable: dineroSchema,
});

export const errorApiSchema = z.object({
  codigo: z.string(),
  mensaje: z.string(),
  detalles: z.array(z.string()).default([]),
  correlacionId: z.string(),
});

export const esquemasContrato = {
  Cliente: clienteSchema,
  SolicitudCredito: solicitudCreditoSchema,
  Credito: creditoSchema,
  RegistrarPago: registrarPagoSchema,
  Cierre: cierreSchema,
  CarteraRiesgo: carteraRiesgoSchema,
  ErrorApi: errorApiSchema,
} as const;
