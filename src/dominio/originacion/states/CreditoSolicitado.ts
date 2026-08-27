import type {
  NombreEstadoCredito
} from "./EstadoCredito.js";

import { EstadoCreditoBase } from
  "./EstadoCreditoBase.js";

import { CreditoAprobado } from
  "./CreditoAprobado.js";

import { CreditoRechazado } from
  "./CreditoRechazado.js";

export class CreditoSolicitado
  extends EstadoCreditoBase {

  readonly nombre: NombreEstadoCredito =
    "SOLICITADO";

  override aprobar(): EstadoCreditoBase {
    return new CreditoAprobado();
  }

  override rechazar(): EstadoCreditoBase {
    return new CreditoRechazado();
  }
}