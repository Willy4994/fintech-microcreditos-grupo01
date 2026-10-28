/**
 * CalendarioVencimientos
 *
 * Proyecto: Crédito Vecino, S. A.
 *
 * Responsabilidades:
 * - Calcular las fechas de vencimiento de las cuotas.
 * - Calcular los días de atraso según una fecha de corte.
 * - Generar el calendario completo de un crédito.
 *
 * Decisión de diseño:
 * Las cuotas vencen mensualmente tomando como referencia
 * el día original del desembolso.
 *
 * Si un mes no tiene ese día, se utiliza el último día
 * disponible de ese mes.
 *
 * Todas las fechas se procesan en UTC para evitar
 * problemas de zonas horarias.
 */

export interface CuotaCalendario {
  numero: number;
  fecha_vencimiento: string;
}

export class CalendarioVencimientos {

  /**
   * Convierte una fecha YYYY-MM-DD a un objeto Date UTC.
   */
  private static convertirFecha(fecha: string): Date {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new Error(
        "Formato de fecha inválido. Utilice YYYY-MM-DD."
      );
    }

    const partes = fecha.split("-").map(Number);

    const anio = partes[0];
    const mes = partes[1];
    const dia = partes[2];

    if (
      anio === undefined ||
      mes === undefined ||
      dia === undefined
    ) {
      throw new Error("Fecha inválida.");
    }

    const fechaUTC = new Date(0);

    fechaUTC.setUTCFullYear(anio, mes - 1, dia);
    fechaUTC.setUTCHours(0, 0, 0, 0);

    // Evita aceptar fechas inexistentes como 2026-02-30.
    if (
      fechaUTC.getUTCFullYear() !== anio ||
      fechaUTC.getUTCMonth() !== mes - 1 ||
      fechaUTC.getUTCDate() !== dia
    ) {
      throw new Error(
        `La fecha ${fecha} no existe.`
      );
    }

    return fechaUTC;
  }

  /**
   * Suma meses calendario a una fecha.
   *
   * Ejemplo:
   * 2026-01-31 + 1 mes = 2026-02-28
   * 2026-01-31 + 2 meses = 2026-03-31
   */
  static sumarMeses(
    fechaDesembolso: string,
    meses: number
  ): string {

    if (
      !Number.isInteger(meses) ||
      meses < 0
    ) {
      throw new Error(
        "La cantidad de meses debe ser un entero no negativo."
      );
    }

    const fechaOriginal =
      this.convertirFecha(fechaDesembolso);

    const anio = fechaOriginal.getUTCFullYear();
    const mes = fechaOriginal.getUTCMonth();
    const dia = fechaOriginal.getUTCDate();

    // Primer día del mes de destino.
    const fechaDestino = new Date(0);

    fechaDestino.setUTCFullYear(
      anio,
      mes + meses,
      1
    );

    fechaDestino.setUTCHours(0, 0, 0, 0);

    // Último día del mes de destino.
    const ultimoDiaMes = new Date(0);

    ultimoDiaMes.setUTCFullYear(
      fechaDestino.getUTCFullYear(),
      fechaDestino.getUTCMonth() + 1,
      0
    );

    const ultimoDia =
      ultimoDiaMes.getUTCDate();

    // Conserva el día original cuando es posible.
    fechaDestino.setUTCDate(
      Math.min(dia, ultimoDia)
    );

    return fechaDestino
      .toISOString()
      .slice(0, 10);
  }

  /**
   * Calcula los días calendario de atraso.
   *
   * Si la fecha de corte es anterior o igual
   * al vencimiento, devuelve 0.
   *
   * Ejemplo:
   * Vencimiento: 2026-03-14
   * Corte:       2026-03-20
   * Resultado:   6 días
   */
  static calcularDiasAtraso(
    fechaVencimiento: string,
    fechaCorte: string
  ): number {

    const vencimiento =
      this.convertirFecha(fechaVencimiento);

    const corte =
      this.convertirFecha(fechaCorte);

    const milisegundosPorDia =
      24 * 60 * 60 * 1000;

    const diferencia =
      corte.getTime() -
      vencimiento.getTime();

    return Math.max(
      0,
      Math.floor(
        diferencia / milisegundosPorDia
      )
    );
  }

  /**
   * Genera las fechas de vencimiento de un crédito.
   *
   * Ejemplo:
   * Desembolso: 2026-01-14
   * Cuotas: 12
   *
   * Primera cuota: 2026-02-14
   * Última cuota:  2027-01-14
   */
  static generarCalendario(
    fechaDesembolso: string,
    cantidadCuotas: number
  ): CuotaCalendario[] {

    // Validar fecha antes de generar las cuotas.
    this.convertirFecha(fechaDesembolso);

    if (
      !Number.isInteger(cantidadCuotas) ||
      cantidadCuotas <= 0
    ) {
      throw new Error(
        "La cantidad de cuotas debe ser un entero mayor que cero."
      );
    }

    const calendario: CuotaCalendario[] = [];

    for (
      let numero = 1;
      numero <= cantidadCuotas;
      numero++
    ) {

      const fechaVencimiento =
        this.sumarMeses(
          fechaDesembolso,
          numero
        );

      calendario.push({
        numero,
        fecha_vencimiento: fechaVencimiento
      });
    }

    return calendario;
  }
}