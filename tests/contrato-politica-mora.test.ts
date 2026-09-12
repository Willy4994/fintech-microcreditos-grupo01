import { describe, expect, it } from "vitest";

import { Dinero } from "../src/dominio/shared/value-objects/Dinero.js";
import { DiasAtraso } from "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";
import { TasaNominalAnual } from "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";

import type { PoliticaMora } from "../src/dominio/politica-mora/PoliticaMora.js";
import { PoliticaPlana } from "../src/dominio/politica-mora/PoliticaPlana.js";
import { PoliticaEscalonada } from "../src/dominio/politica-mora/PoliticaEscalonada.js";
import { PoliticaRetroactiva } from "../src/dominio/politica-mora/PoliticaRetroactiva.js";

function probarContrato(
  nombre: string,
  crearPolitica: () => PoliticaMora
): void {
  describe(nombre, () => {
    it("retorna un monto no negativo", () => {
      const politica = crearPolitica();

      const resultado = politica.calcularInteresMoratorio(
        Dinero.desdeCentavos(72576, "GTQ"),
        TasaNominalAnual.crear(24),
        "ACTUAL_360",
        new DiasAtraso(15)
      );

      expect(
        resultado.toDecimal().greaterThanOrEqualTo(0)
      ).toBe(true);
    });

    it("retorna cero cuando no existen dias de atraso", () => {
      const politica = crearPolitica();

      const resultado = politica.calcularInteresMoratorio(
        Dinero.desdeCentavos(72576, "GTQ"),
        TasaNominalAnual.crear(24),
        "ACTUAL_360",
        new DiasAtraso(0)
      );

      expect(
        resultado.toDecimal().toFixed(2)
      ).toBe("0.00");
    });

    it("mantiene la moneda del capital recibido", () => {
      const politica = crearPolitica();

      const capital = Dinero.desdeCentavos(
        72576,
        "GTQ"
      );

      const resultado = politica.calcularInteresMoratorio(
        capital,
        TasaNominalAnual.crear(24),
        "ACTUAL_360",
        new DiasAtraso(15)
      );

      expect(resultado.moneda).toBe(capital.moneda);
    });
  });
}

probarContrato(
  "Contrato PoliticaPlana",
  () => new PoliticaPlana()
);

probarContrato(
  "Contrato PoliticaEscalonada",
  () => new PoliticaEscalonada()
);

probarContrato(
  "Contrato PoliticaRetroactiva",
  () => new PoliticaRetroactiva()
);