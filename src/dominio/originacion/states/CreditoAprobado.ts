import type {
  NombreEstadoCredito
} from "./EstadoCredito.js";

import { EstadoCreditoBase } from
  "./EstadoCreditoBase.js";

import { CreditoDesembolsado } from
  "./CreditoDesembolsado.js";

export class CreditoAprobado
  extends EstadoCreditoBase {

  readonly nombre: NombreEstadoCredito =
    "APROBADO";

  override desembolsar(): EstadoCreditoBase {
    return new CreditoDesembolsado();
  }
}