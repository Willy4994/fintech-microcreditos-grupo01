import type {
  NombreEstadoCredito
} from "./EstadoCredito.js";

import { EstadoCreditoBase } from
  "./EstadoCreditoBase.js";

export class CreditoRechazado
  extends EstadoCreditoBase {

  readonly nombre: NombreEstadoCredito =
    "RECHAZADO";
}