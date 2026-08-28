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
import type { ContextoTransicionCredito } from
  "../src/dominio/originacion/entities/HistorialEstadoCredito.js";

function contexto(
  motivo: string,
  actor = "usuario-prueba"
): ContextoTransicionCredito {
  return {
    fecha: new Date("2026-08-27T12:00:00Z"),
    actor,
    motivo,
  };
}

function crearCredito(): Credito {
  return new Credito(
    CreditoId.crear("C-001"),
    ClienteId.crear("CLI-001"),
    SolicitudCreditoId.crear("SOL-001"),
    Dinero.desdeCentavos(1_000_000, "GTQ"),
    12,
    contexto("Crédito creado")
  );
}

function activarCredito(credito: Credito): void {
  credito.aprobar(true, contexto("Comité aprueba"));
  credito.desembolsar(true, contexto("Capital entregado"));
  credito.activar(contexto("Inicia el plan"));
}

describe("Estado del crédito", () => {
  it("permite bajar de Mora 2 a Mora 1 y después regularizar", () => {
    const credito = crearCredito();
    activarCredito(credito);
    credito.marcarEnMora(
      new DiasAtraso(45),
      contexto("Cuota vencida")
    );

    expect(credito.obtenerEstado()).toBe("EN_MORA");
    expect(credito.obtenerTramoMora().obtenerTipo()).toBe(
      TipoTramoMora.MORA_2
    );

    credito.registrarPago(
      new DiasAtraso(10),
      contexto("Pago parcial")
    );

    expect(credito.obtenerEstado()).toBe("EN_MORA");
    expect(credito.obtenerTramoMora().obtenerTipo()).toBe(
      TipoTramoMora.MORA_1
    );

    credito.registrarPago(
      new DiasAtraso(0),
      contexto("Pagó todo lo vencido")
    );

    expect(credito.obtenerEstado()).toBe("VIGENTE");
    expect(credito.obtenerTramoMora().obtenerTipo()).toBe(
      TipoTramoMora.SIN_MORA
    );
  });

  it("rechaza registrar un pago en un crédito solicitado", () => {
    const credito = crearCredito();

    expect(() =>
      credito.registrarPago(
        new DiasAtraso(0),
        contexto("Intento de pago")
      )
    ).toThrow(TransicionCreditoInvalidaException);
    expect(credito.obtenerEstado()).toBe("SOLICITADO");
  });

  it("cubre rechazo y anulación como estados terminales", () => {
    const rechazado = crearCredito();
    rechazado.rechazar(contexto("Comité rechaza"));

    expect(rechazado.obtenerEstado()).toBe("RECHAZADO");
    expect(() => rechazado.aprobar(true, contexto("Reintento"))).toThrow(
      TransicionCreditoInvalidaException
    );

    const anulado = crearCredito();
    anulado.aprobar(true, contexto("Comité aprueba"));
    anulado.anular(contexto("Cliente desiste"));

    expect(anulado.obtenerEstado()).toBe("ANULADO");
    expect(() =>
      anulado.desembolsar(true, contexto("Intento posterior"))
    ).toThrow(TransicionCreditoInvalidaException);
  });

  it("reestructura, conserva la marca de riesgo y permite la cura", () => {
    const credito = crearCredito();
    activarCredito(credito);
    credito.marcarEnMora(
      new DiasAtraso(75),
      contexto("Atraso acumulado")
    );
    credito.reestructurar(
      true,
      contexto("Comité autoriza acuerdo")
    );

    expect(credito.obtenerEstado()).toBe("REESTRUCTURADO");
    expect(credito.estaMarcadoComoReestructurado()).toBe(true);

    credito.curar(true, contexto("Cumple política de cura"));

    expect(credito.obtenerEstado()).toBe("VIGENTE");
    expect(credito.estaMarcadoComoReestructurado()).toBe(true);
  });

  it("declara incobrable únicamente después de 120 días", () => {
    const credito = crearCredito();
    activarCredito(credito);
    credito.marcarEnMora(
      new DiasAtraso(121),
      contexto("Supera 120 días")
    );
    credito.declararIncobrable(contexto("Baja contable"));

    expect(credito.obtenerEstado()).toBe("INCOBRABLE");
    expect(() =>
      credito.registrarPago(
        new DiasAtraso(0),
        contexto("Cobro posterior")
      )
    ).toThrow(TransicionCreditoInvalidaException);
  });

  it("cancela un crédito vigente y conserva historial auditable", () => {
    const credito = crearCredito();
    activarCredito(credito);
    credito.cancelar(
      Dinero.desdeCentavos(0, "GTQ"),
      contexto("Saldo de capital igual a cero")
    );

    expect(credito.obtenerEstado()).toBe("CANCELADO");

    const historial = credito.obtenerHistorialEstados();
    expect(historial.map((cambio) => cambio.estadoNuevo)).toEqual([
      "SOLICITADO",
      "APROBADO",
      "DESEMBOLSADO",
      "VIGENTE",
      "CANCELADO",
    ]);
    expect(historial.every((cambio) => cambio.actor.length > 0)).toBe(true);
    expect(historial.every((cambio) => cambio.motivo.length > 0)).toBe(true);
  });

  it("exige las guardas de aprobación y cancelación", () => {
    const credito = crearCredito();

    expect(() =>
      credito.aprobar(false, contexto("No cumple política"))
    ).toThrow("no cumple la política");
    expect(credito.obtenerEstado()).toBe("SOLICITADO");

    activarCredito(credito);

    expect(() =>
      credito.cancelar(
        Dinero.desdeCentavos(1, "GTQ"),
        contexto("Intento con saldo")
      )
    ).toThrow("saldo de capital cero");
    expect(credito.obtenerEstado()).toBe("VIGENTE");
  });
});
