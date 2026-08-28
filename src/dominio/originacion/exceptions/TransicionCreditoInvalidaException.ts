import { DomainException } from
  "../../shared/exceptions/DomainException.js";

export class TransicionCreditoInvalidaException
  extends DomainException {

  constructor(
    estadoActual: string,
    operacion: string
  ) {
    super(
      `No se puede ejecutar '${operacion}' ` +
      `cuando el crédito se encuentra en estado '${estadoActual}'`
    );
  }
}