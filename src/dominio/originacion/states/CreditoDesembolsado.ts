import type {
  NombreEstadoCredito
} from "./EstadoCredito.js";

import { EstadoCreditoBase } from
  "./EstadoCreditoBase.js";

import { CreditoVigente } from
  "./CreditoVigente.js";

export class CreditoDesembolsado
  extends EstadoCreditoBase {

  readonly nombre: NombreEstadoCredito =
    "DESEMBOLSADO";

  override activar(): EstadoCreditoBase {
    return new CreditoVigente();
  }
}
