import { describe, it, expect } from "vitest";

import { GestorAprobaciones } from "./GestorAprobaciones.js";

describe("Gestor de aprobaciones humanas", () => {

  it("crea una solicitud en estado PENDIENTE", () => {
    const gestor = new GestorAprobaciones();

    const solicitud = gestor.solicitar({
      operacion: "REGISTRAR_PAGO",
      parametros: {
        idCredito: "CV-2026-0001",
        montoCentavos: 50000
      },
      motivo: "Registrar un pago solicitado por el asistente"
    });

    expect(solicitud.id).toBeDefined();
    expect(solicitud.estado).toBe("PENDIENTE");
    expect(gestor.consultar(solicitud.id)?.estado).toBe("PENDIENTE");
  });

  it("permite aprobar una solicitud pendiente", () => {
    const gestor = new GestorAprobaciones();

    const solicitud = gestor.solicitar({
      operacion: "REGISTRAR_PAGO",
      parametros: {
        montoCentavos: 50000
      },
      motivo: "Prueba de aprobación"
    });

    const resultado = gestor.aprobar(
      solicitud.id,
      "supervisor01",
      "Operación revisada"
    );

    expect(resultado.estado).toBe("APROBADA");
    expect(resultado.autorizadoPor).toBe("supervisor01");
    expect(resultado.fechaDecision).toBeDefined();
  });

  it("permite rechazar una solicitud pendiente", () => {
    const gestor = new GestorAprobaciones();

    const solicitud = gestor.solicitar({
      operacion: "REGISTRAR_PAGO",
      parametros: {
        montoCentavos: 50000
      },
      motivo: "Prueba de rechazo"
    });

    const resultado = gestor.rechazar(
      solicitud.id,
      "supervisor01",
      "Información insuficiente"
    );

    expect(resultado.estado).toBe("RECHAZADA");
  });

  it("impide aprobar dos veces la misma solicitud", () => {
    const gestor = new GestorAprobaciones();

    const solicitud = gestor.solicitar({
      operacion: "REGISTRAR_PAGO",
      parametros: {
        montoCentavos: 50000
      },
      motivo: "Verificar doble aprobación"
    });

    gestor.aprobar(solicitud.id, "supervisor01");

    expect(() => {
      gestor.aprobar(solicitud.id, "supervisor02");
    }).toThrow("La solicitud ya fue resuelta");
  });

  it("protege los parámetros originales de la solicitud", () => {
    const gestor = new GestorAprobaciones();

    const parametros = {
      idCredito: "CV-2026-0001",
      montoCentavos: 50000
    };

    const solicitud = gestor.solicitar({
      operacion: "REGISTRAR_PAGO",
      parametros,
      motivo: "Verificar integridad de parámetros"
    });

    // Modificar el objeto original después de crear la solicitud.
    parametros.montoCentavos = 999999;

    // Modificar también la copia recibida del gestor.
    (solicitud.parametros as Record<string, unknown>).montoCentavos =
      888888;

    const almacenada = gestor.consultar(solicitud.id);

    expect(almacenada?.parametros.montoCentavos).toBe(50000);
  });

});