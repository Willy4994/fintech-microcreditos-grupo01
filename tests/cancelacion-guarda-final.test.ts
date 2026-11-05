import { it, expect } from "vitest";
import { Credito } from "../src/dominio/originacion/entities/Credito.js";
import { CreditoId } from "../src/dominio/originacion/value-objects/CreditoId.js";
import { ClienteId } from "../src/dominio/originacion/value-objects/ClienteId.js";
import { SolicitudCreditoId } from "../src/dominio/originacion/value-objects/SolicitudCreditoId.js";
import { Dinero } from "../src/dominio/shared/value-objects/Dinero.js";
import { DiasAtraso } from "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";
it("CP-04.1 la guarda rechaza saldo cero si el caso de uso informa cuotas vencidas", () => {
  const contexto = {
    fecha: new Date("2026-10-31T00:00:00Z"),
    actor: "gerencia",
    motivo: "prueba",
  };
  const c = new Credito(
    CreditoId.crear("C-TEST"),
    ClienteId.crear("CL-TEST"),
    SolicitudCreditoId.crear("S-TEST"),
    Dinero.desdeCentavos(100000, "GTQ"),
    12,
    contexto,
  );
  c.aprobar(true, contexto);
  c.desembolsar(true, contexto);
  c.activar(contexto);
  c.marcarEnMora(new DiasAtraso(45), contexto);
  expect(() => c.cancelar(Dinero.desdeCentavos(0, "GTQ"), contexto, 1)).toThrow(
    "cuotas vencidas",
  );
  expect(c.obtenerEstado()).toBe("EN_MORA");
});
