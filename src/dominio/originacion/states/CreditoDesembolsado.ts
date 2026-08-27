import type {
  NombreEstadoCredito
} from "./EstadoCredito.js";

import { EstadoCreditoBase } from
  "./EstadoCreditoBase.js";

export class CreditoDesembolsado
  extends EstadoCreditoBase {

  readonly nombre: NombreEstadoCredito =
    "DESEMBOLSADO";
}