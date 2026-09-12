import { describe, expect, it } from "vitest";

import { Credito } from "../src/dominio/originacion/entities/Credito.js";

import { CreditoId } from "../src/dominio/originacion/value-objects/CreditoId.js";
import { ClienteId } from "../src/dominio/originacion/value-objects/ClienteId.js";
import { SolicitudCreditoId } from "../src/dominio/originacion/value-objects/SolicitudCreditoId.js";

import { Dinero } from "../src/dominio/shared/value-objects/Dinero.js";
import { DiasAtraso } from "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";

function crearContexto(motivo: string) {
  return {
    fecha: new Date("2026-10-15T12:00:00.000Z"),
    actor: "usuario-prueba",
    motivo,
  };
}

function crearCredito(): Credito {
  return new Credito(
    CreditoId.crear("CRED-001"),
    ClienteId.crear("CLI-001"),
    SolicitudCreditoId.crear("SOL-001"),
    Dinero.desdeCentavos(1000000, "GTQ"),
    12,
    crearContexto("Creacion del credito")
  );
}

describe("Cancelacion de credito en mora", () => {
  it("CP-04.1: permite EN_MORA a CANCELADO cuando el saldo de capital es cero", () => {
    const credito = crearCredito();

    credito.aprobar(
      true,
      crearContexto("Credito aprobado")
    );

    credito.desembolsar(
      true,
      crearContexto("Capital desembolsado")
    );

    credito.activar(
      crearContexto("Credito activado")
    );

    credito.marcarEnMora(
      new DiasAtraso(45),
      crearContexto("Credito con 45 dias de atraso")
    );

    expect(credito.obtenerEstado()).toBe("EN_MORA");

    credito.cancelar(
      Dinero.desdeCentavos(0, "GTQ"),
      crearContexto("Credito totalmente liquidado")
    );

    expect(credito.obtenerEstado()).toBe("CANCELADO");
  });

  it("mantiene invalida la cancelacion desde SOLICITADO", () => {
    const credito = crearCredito();

    expect(() => {
      credito.cancelar(
        Dinero.desdeCentavos(0, "GTQ"),
        crearContexto("Intento de cancelacion")
      );
    }).toThrow();

    expect(credito.obtenerEstado()).toBe("SOLICITADO");
  });

  it("no permite cancelar un credito en mora si aun existe saldo de capital", () => {
    const credito = crearCredito();

    credito.aprobar(
      true,
      crearContexto("Credito aprobado")
    );

    credito.desembolsar(
      true,
      crearContexto("Capital desembolsado")
    );

    credito.activar(
      crearContexto("Credito activado")
    );

    credito.marcarEnMora(
      new DiasAtraso(45),
      crearContexto("Credito con 45 dias de atraso")
    );

    expect(() => {
      credito.cancelar(
        Dinero.desdeCentavos(10000, "GTQ"),
        crearContexto("Intento con saldo pendiente")
      );
    }).toThrow(
      "Solo puede cancelarse un crédito con saldo de capital cero"
    );

    expect(credito.obtenerEstado()).toBe("EN_MORA");
  });
});