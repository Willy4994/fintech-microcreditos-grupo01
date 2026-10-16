// Repositorio de clientes
export {
  obtenerClientes,
  obtenerClientePorId,
} from "./ClienteRepositorio.js";

export type {
  Cliente,
} from "./ClienteRepositorio.js";

// Repositorio de créditos
export {
  obtenerCreditos,
  obtenerCreditoPorId,
  obtenerCreditosPorCliente,
} from "./CreditoRepositorio.js";

export type {
  Credito,
} from "./CreditoRepositorio.js";

// Repositorio de pagos
export {
  obtenerPagos,
  obtenerPagoPorClave,
  obtenerPagosPorCredito,
} from "./PagoRepositorio.js";

export type {
  Pago,
} from "./PagoRepositorio.js";

// Repositorio de políticas
export {
  obtenerPoliticas,
  obtenerPoliticaPorId,
  obtenerPoliticaPorFecha,
  obtenerConfiguracionFinanciera,
} from "./PoliticaRepositorio.js";

export type {
  PoliticaMora,
  ConfiguracionFinanciera,
} from "./PoliticaRepositorio.js";