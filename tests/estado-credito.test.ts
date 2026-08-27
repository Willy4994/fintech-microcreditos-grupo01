import { describe, expect, it } from "vitest";

import { DiasAtraso } from
  "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";
import { TipoTramoMora } from
  "../src/dominio/cartera-cobros/value-objects/TramoMora.js";
import { Credito } from
  "../src/dominio/originacion/entities/Credito.js";
import { TransicionCreditoInvalidaException } from
  "../src/dominio/originacion/exceptions/TransicionCreditoInvalidaException.js";
import { ClienteId } from
  "../src/dominio/originacion/value-objects/ClienteId.js";
import { CreditoId } from
  "../src/dominio/originacion/value-objects/CreditoId.js";
import { SolicitudCreditoId } from
  "../src/dominio/originacion/value-objects/SolicitudCreditoId.js";
import { Dinero } from
  "../src/dominio/shared/value-objects/Dinero.js";

function crearCredito(): Credito {
  return new Credito(
    CreditoId.crear("C-001"),
    ClienteId.crear("CLI-001"),
    SolicitudCreditoId.crear("SOL-001"),
    Dinero.desdeCentavos(1_000_000, "GTQ"),
    12
  );
}

describe("Estado del crédito", () => {
  it("permite bajar de Mora 2 a Mora 1 y después regularizar", () => {
    const credito = crearCredito();
    credito.aprobar();
    credito.desembolsar();
    credito.activar();
    credito.marcarEnMora(new DiasAtraso(45));

    expect(credito.obtenerEstado()).toBe("EN_MORA");
    expect(credito.obtenerTramoMora().obtenerTipo()).toBe(
      TipoTramoMora.MORA_2
    );

    credito.registrarPago(new DiasAtraso(10));

    expect(credito.obtenerEstado()).toBe("EN_MORA");
    expect(credito.obtenerTramoMora().obtenerTipo()).toBe(
      TipoTramoMora.MORA_1
    );

    credito.registrarPago(new DiasAtraso(0));

    expect(credito.obtenerEstado()).toBe("VIGENTE");
    expect(credito.obtenerTramoMora().obtenerTipo()).toBe(
      TipoTramoMora.SIN_MORA
    );
  });

  it("rechaza registrar un pago en un crédito solicitado", () => {
    const credito = crearCredito();

    expect(() =>
      credito.registrarPago(new DiasAtraso(0))
    ).toThrow(TransicionCreditoInvalidaException);
    expect(credito.obtenerEstado()).toBe("SOLICITADO");
  });
});
