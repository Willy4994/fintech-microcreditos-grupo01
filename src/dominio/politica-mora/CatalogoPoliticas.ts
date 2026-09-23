import type { PoliticaMora } from "./PoliticaMora.js";
import { PoliticaPlana } from "./PoliticaPlana.js";
import { PoliticaEscalonada } from "./PoliticaEscalonada.js";

export class CatalogoPoliticas {
  private readonly fechaInicioEscalonada =
    new Date("2026-10-01T00:00:00.000Z");

  obtenerPolitica(
    fechaOtorgamiento: Date
  ): PoliticaMora {
    if (
      fechaOtorgamiento.getTime() >=
      this.fechaInicioEscalonada.getTime()
    ) {
      return new PoliticaEscalonada();
    }

    return new PoliticaPlana();
  }
}