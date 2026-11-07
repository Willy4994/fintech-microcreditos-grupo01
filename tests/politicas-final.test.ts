import { describe, it, expect } from "vitest";
import { PoliticaConfigurada } from "../src/dominio/politica-mora/PoliticaConfigurada.js";
import { PoliticaPlana } from "../src/dominio/politica-mora/PoliticaPlana.js";
import { PoliticaRetroactiva } from "../src/dominio/politica-mora/PoliticaRetroactiva.js";
import { Dinero } from "../src/dominio/shared/value-objects/Dinero.js";
import { DiasAtraso } from "../src/dominio/cartera-cobros/value-objects/DiasAtraso.js";
import { TasaNominalAnual } from "../src/dominio/calculo-financiero/value-objects/TasaNominalAnual.js";
import { LibroDevengo } from "../src/dominio/cierres/services/CalculadoraDevengoInteres.js";
const tramos = [
  { id: "mora_1", ini: 1, fin: 30, bps: 1800 },
  { id: "mora_2", ini: 31, fin: 60, bps: 2400 },
  { id: "mora_3", ini: 61, fin: 90, bps: 3000 },
  { id: "vencido", ini: 91, fin: 120, bps: 3600 },
];
describe("Correcciones financieras de la rúbrica", () => {
  it("M-3 redondea una vez y explica el centavo de diferencia", () => {
    const r = new PoliticaConfigurada({ tipo: "escalonada", tramos }).desglosar(
      72576,
      100,
    );
    expect(r.total_centavos).toBe(5080);
    expect(r.tramos.reduce((a, t) => a + t.monto_centavos, 0)).toBe(5081);
    expect(r.ajuste_redondeo_centavos).toBe(-1);
  });
  it("cambiar tasas en datos cambia el cálculo sin modificar motor", () => {
    const p = new PoliticaConfigurada({
      tipo: "escalonada",
      tramos: [{ id: "unico", ini: 1, fin: 120, bps: 1000 }],
    });
    expect(p.desglosar(100000, 36).total_centavos).toBe(1000);
  });
  it.each([new PoliticaPlana(), new PoliticaRetroactiva()])(
    "congela a 120 días y limita al capital",
    (p) => {
      const f = (d: number, t = 24) =>
        p
          .calcularInteresMoratorio(
            Dinero.desdeCentavos(10000, "GTQ"),
            TasaNominalAnual.crear(t),
            "ACTUAL_360",
            new DiasAtraso(d),
          )
          .obtenerCentavos();
      expect(f(200)).toBe(f(120));
      expect(f(10000, 5000)).toBeLessThanOrEqual(10000);
    },
  );
  it("el suspenso acumulado se reconoce una sola vez al regularizar", () => {
    const libro = new LibroDevengo();
    const dinero = (n: number) => Dinero.desdeCentavos(n, "GTQ");
    expect(
      libro
        .registrar(dinero(1000), new DiasAtraso(91), false)
        .interesReconocido.obtenerCentavos(),
    ).toBe(0);
    expect(
      libro
        .registrar(dinero(500), new DiasAtraso(100), false)
        .interesEnSuspenso.obtenerCentavos(),
    ).toBe(1500);
    const r = libro.registrar(dinero(200), new DiasAtraso(0), true);
    expect(r.interesReconocido.obtenerCentavos()).toBe(1700);
    expect(r.interesEnSuspenso.obtenerCentavos()).toBe(0);
    expect(
      libro
        .registrar(dinero(0), new DiasAtraso(0), true)
        .interesReconocido.esCero(),
    ).toBe(true);
  });
});
