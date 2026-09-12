import { describe, expect, it } from "vitest";

import { CatalogoPoliticas } from "../src/dominio/politica-mora/CatalogoPoliticas.js";
import { PoliticaPlana } from "../src/dominio/politica-mora/PoliticaPlana.js";
import { PoliticaEscalonada } from "../src/dominio/politica-mora/PoliticaEscalonada.js";

describe("CatalogoPoliticas", () => {
  it("usa PoliticaPlana para creditos otorgados antes del 1 de octubre de 2026", () => {
    const catalogo = new CatalogoPoliticas();

    const politica = catalogo.obtenerPolitica(
      new Date("2026-09-30T23:59:59.000Z")
    );

    expect(politica).toBeInstanceOf(PoliticaPlana);
  });

  it("usa PoliticaEscalonada para creditos otorgados desde el 1 de octubre de 2026", () => {
    const catalogo = new CatalogoPoliticas();

    const politica = catalogo.obtenerPolitica(
      new Date("2026-10-01T00:00:00.000Z")
    );

    expect(politica).toBeInstanceOf(PoliticaEscalonada);
  });
});