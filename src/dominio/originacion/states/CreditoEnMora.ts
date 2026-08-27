import type { NombreEstadoCredito } from "./EstadoCredito.js";
import { EstadoCreditoBase } from "./EstadoCreditoBase.js";
import { CreditoVigente } from "./CreditoVigente.js";
import { CreditoReestructurado } from "./CreditoReestructurado.js";
import { CreditoIncobrable } from "./CreditoIncobrable.js";

export class CreditoEnMora extends EstadoCreditoBase {
  readonly nombre: NombreEstadoCredito = "EN_MORA";

  override registrarPago(
    diasAtrasoRestantes: number
  ): EstadoCreditoBase {
    return diasAtrasoRestantes === 0
      ? new CreditoVigente()
      : this;
  }

  override reestructurar(): EstadoCreditoBase {
    return new CreditoReestructurado();
  }

  override declararIncobrable(): EstadoCreditoBase {
    return new CreditoIncobrable();
  }
}
