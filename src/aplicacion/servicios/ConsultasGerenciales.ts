import type { RepositorioCartera } from "../puertos/DatosCartera.js";
import { cartera, cierre, reconstruir, sumarDias } from "./MotorCartera.js";
import { ErrorAplicacion, fechaValida } from "../errores.js";
export class ConsultasGerenciales {
  constructor(private repo: RepositorioCartera) {}
  async credito(id: string, fecha: string) {
    return reconstruir(await this.repo.leer(), id, fecha);
  }
  async cartera(fecha: string) {
    return cartera(await this.repo.leer(), fecha);
  }
  async morosos(fecha: string, tramo?: string) {
    fechaValida(fecha);
    const datos = await this.repo.leer();
    return datos.creditos
      .filter((c) => c.fecha_desembolso <= fecha)
      .map((c) => reconstruir(datos, c.id_credito, fecha))
      .filter((c) => c.estado === "EN_MORA" && (!tramo || c.tramo === tramo))
      .map((c) => ({
        id_credito: c.id_credito,
        dias_atraso: c.dias_atraso,
        tramo: c.tramo,
        saldo_centavos: c.capital_pendiente_centavos,
      }));
  }
  async vencimientos(fecha: string, dias: number) {
    fechaValida(fecha);
    if (!Number.isInteger(dias) || dias < 1 || dias > 366)
      throw new ErrorAplicacion("VENTANA_INVALIDA", "Ventana de 1 a 366 días");
    const datos = await this.repo.leer();
    const fin = sumarDias(fecha, dias);
    const cuotas = datos.creditos
      .filter((c) => c.fecha_desembolso <= fecha)
      .flatMap((c) => {
        const estado = reconstruir(datos, c.id_credito, fecha);
        if (estado.estado === "INCOBRABLE") return [];
        return estado.cuotas
          .filter(
            (q) =>
              !q.pagada &&
              q.fecha_vencimiento > fecha &&
              q.fecha_vencimiento <= fin,
          )
          .map((q) => ({ id_credito: c.id_credito, ...q }));
      });
    return {
      desde: fecha,
      hasta: fin,
      cantidad: cuotas.length,
      monto_centavos: cuotas.reduce((a, c) => a + c.total_exigible_centavos, 0),
      cuotas,
    };
  }
  async cierre(desde: string, hasta: string) {
    return cierre(await this.repo.leer(), desde, hasta);
  }
}
