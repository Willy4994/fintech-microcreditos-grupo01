import type { NombreEstadoCredito } from "./EstadoCredito.js";
import { EstadoCreditoBase } from "./EstadoCreditoBase.js";

export class CreditoAnulado extends EstadoCreditoBase {
  readonly nombre: NombreEstadoCredito = "ANULADO";
}
