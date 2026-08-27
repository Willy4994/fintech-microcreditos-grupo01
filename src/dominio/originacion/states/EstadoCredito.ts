export type NombreEstadoCredito =
  | "SOLICITADO"
  | "APROBADO"
  | "RECHAZADO"
  | "DESEMBOLSADO"
  | "VIGENTE"
  | "EN_MORA"
  | "REESTRUCTURADO"
  | "CANCELADO"
  | "ANULADO"
  | "INCOBRABLE";

export interface EstadoCredito {
  readonly nombre: NombreEstadoCredito;

  aprobar(): EstadoCredito;

  rechazar(): EstadoCredito;

  desembolsar(): EstadoCredito;

  activar(): EstadoCredito;

  marcarEnMora(): EstadoCredito;

  registrarPago(diasAtrasoRestantes: number): EstadoCredito;

  anular(): EstadoCredito;

  reestructurar(): EstadoCredito;

  curar(): EstadoCredito;

  cancelar(): EstadoCredito;

  declararIncobrable(): EstadoCredito;
}
