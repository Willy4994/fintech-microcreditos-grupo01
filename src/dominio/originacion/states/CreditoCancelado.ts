import type { NombreEstadoCredito } from "./EstadoCredito.js";
import { EstadoCreditoBase } from "./EstadoCreditoBase.js";

export class CreditoCancelado extends EstadoCreditoBase {
  readonly nombre: NombreEstadoCredito = "CANCELADO";
}
