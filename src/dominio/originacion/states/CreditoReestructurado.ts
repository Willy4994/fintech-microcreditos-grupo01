import type { NombreEstadoCredito } from "./EstadoCredito.js";
import { EstadoCreditoBase } from "./EstadoCreditoBase.js";
import { CreditoVigente } from "./CreditoVigente.js";
import { CreditoEnMora } from "./CreditoEnMora.js";
import { CreditoCancelado } from "./CreditoCancelado.js";

export class CreditoReestructurado extends EstadoCreditoBase {
  readonly nombre: NombreEstadoCredito = "REESTRUCTURADO";

  override curar(): EstadoCreditoBase {
    return new CreditoVigente();
  }

  override marcarEnMora(): EstadoCreditoBase {
    return new CreditoEnMora();
  }

  override cancelar(): EstadoCreditoBase {
    return new CreditoCancelado();
  }
}
