import { Decimal } from "decimal.js";
import { z } from "zod";
import type { PoliticaMora } from "./PoliticaMora.js";
import { Dinero } from "../shared/value-objects/Dinero.js";
import type { DiasAtraso } from "../cartera-cobros/value-objects/DiasAtraso.js";
import type { TasaNominalAnual } from "../calculo-financiero/value-objects/TasaNominalAnual.js";
import type { BaseConteo } from "../calculo-financiero/value-objects/BaseConteo.js";
export const tramoSchema = z.object({
  id: z.string(),
  ini: z.number().int().positive(),
  fin: z.number().int().positive(),
  bps: z.number().int().nonnegative(),
});
export const politicaSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("plana"),
    tna_bps: z.number().int().nonnegative(),
  }),
  z.object({
    tipo: z.literal("escalonada"),
    tramos: z.array(tramoSchema).min(1),
  }),
]);
export type ConfiguracionPolitica = z.infer<typeof politicaSchema>;
export class PoliticaConfigurada implements PoliticaMora {
  readonly configuracion: ConfiguracionPolitica;
  constructor(
    datos: unknown,
    readonly limiteDias = 120,
  ) {
    this.configuracion = politicaSchema.parse(datos);
    if (this.configuracion.tipo === "escalonada") {
      let siguiente = 1;
      for (const tramo of this.configuracion.tramos) {
        if (tramo.ini !== siguiente || tramo.fin < tramo.ini)
          throw new Error("Tramos no contiguos u ordenados");
        siguiente = tramo.fin + 1;
      }
    }
  }
  desglosar(capitalCentavos: number, dias: number, divisor = 360) {
    const d = Math.min(this.limiteDias, Math.max(0, dias));
    const tramos =
      this.configuracion.tipo === "plana"
        ? [
            {
              id: "plana",
              ini: 1,
              fin: this.limiteDias,
              bps: this.configuracion.tna_bps,
            },
          ]
        : this.configuracion.tramos;
    const detalle = tramos
      .map((t) => {
        const recorridos = Math.max(0, Math.min(d, t.fin) - t.ini + 1);
        const exacto = new Decimal(capitalCentavos)
          .times(t.bps)
          .times(recorridos)
          .div(10000)
          .div(divisor);
        return {
          tramo: t.id,
          dias: recorridos,
          tasa_bps: t.bps,
          centavos_sin_redondear: exacto.toString(),
          monto_centavos: exacto
            .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
            .toNumber(),
        };
      })
      .filter((t) => t.dias > 0);
    const suma = detalle.reduce(
      (a, t) => a.plus(t.centavos_sin_redondear),
      new Decimal(0),
    );
    const total = Decimal.min(capitalCentavos, suma)
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toNumber();
    return {
      tramos: detalle,
      total_centavos: total,
      ajuste_redondeo_centavos:
        total - detalle.reduce((a, t) => a + t.monto_centavos, 0),
      regla_redondeo:
        "Precisión completa por tramo; un único redondeo HALF_UP al final.",
    };
  }
  calcularInteresMoratorio(
    capital: Dinero,
    _tasa: TasaNominalAnual,
    base: BaseConteo,
    dias: DiasAtraso,
  ): Dinero {
    return Dinero.desdeCentavos(
      this.desglosar(
        capital.obtenerCentavos(),
        dias.obtenerValor(),
        base === "ACTUAL_365" ? 365 : 360,
      ).total_centavos,
      capital.moneda,
    );
  }
}
