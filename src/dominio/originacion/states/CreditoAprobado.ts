import type {
  NombreEstadoCredito
} from "./EstadoCredito.js";

import { EstadoCreditoBase } from
  "./EstadoCreditoBase.js";

import { CreditoDesembolsado } from
  "./CreditoDesembolsado.js";

import { CreditoAnulado } from
  "./CreditoAnulado.js";

export class CreditoAprobado
  extends EstadoCreditoBase {

  readonly nombre: NombreEstadoCredito =
    "APROBADO";

  override desembolsar(): EstadoCreditoBase {
    return new CreditoDesembolsado();
  }

  override anular(): EstadoCreditoBase {
    return new CreditoAnulado();
  }
}
