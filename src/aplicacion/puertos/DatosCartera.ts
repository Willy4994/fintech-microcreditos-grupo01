export interface CreditoDato {
  id_credito: string;
  id_cliente: string;
  id_asesor: string;
  id_politica: string;
  fecha_desembolso: string;
  capital_centavos: string | number;
  plazo_meses: number;
  tna_bps: number;
  reestructurado: boolean;
}
export interface PagoDato {
  id_pago: string;
  clave_idempotencia: string;
  id_credito: string;
  fecha: string;
  monto_centavos: string | number;
  canal: string;
  orden: number;
  cuota?: number | null;
}
export interface PoliticaDato {
  id_politica: string;
  configuracion: unknown;
}
export interface ConfiguracionDato {
  moneda: string;
  base_conteo: string;
  parametros: {
    gasto_gestion_cobro?: {
      dia_generacion: number;
      monto_centavos: number;
      aplica_a_politicas: string[];
    };
    regla_incobrable_dias?: number;
    regla_riesgo_dias?: number;
  };
}
export interface DatosCartera {
  creditos: CreditoDato[];
  pagos: PagoDato[];
  politicas: PoliticaDato[];
  configuracion: ConfiguracionDato;
}
export interface RepositorioCartera {
  leer(): Promise<DatosCartera>;
}
