import type { NombreEstadoCredito } from "./EstadoCredito.js";
import { EstadoCreditoBase } from "./EstadoCreditoBase.js";

export class CreditoIncobrable extends EstadoCreditoBase {
  readonly nombre: NombreEstadoCredito = "INCOBRABLE";
}
