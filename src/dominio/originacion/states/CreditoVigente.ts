import type { NombreEstadoCredito } from "./EstadoCredito.js";
import { EstadoCreditoBase } from "./EstadoCreditoBase.js";
import { CreditoEnMora } from "./CreditoEnMora.js";
import { CreditoCancelado } from "./CreditoCancelado.js";

export class CreditoVigente extends EstadoCreditoBase {
  readonly nombre: NombreEstadoCredito = "VIGENTE";

  override marcarEnMora(): EstadoCreditoBase {
    return new CreditoEnMora();
  }

  override registrarPago(_diasAtrasoRestantes: number): EstadoCreditoBase {
    return this;
  }

  override cancelar(): EstadoCreditoBase {
    return new CreditoCancelado();
  }
}
