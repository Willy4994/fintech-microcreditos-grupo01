import { Dinero } from "../../shared/value-objects/Dinero.js";
import { TasaMensual } from "../value-objects/TasaMensual.js";
import { Plazo } from "../value-objects/Plazo.js";
import { PlanAmortizacion } from "../entities/PlanAmortizacion.js";

export interface MetodoAmortizacion {
  calcular(
    capital: Dinero,
    tasaMensual: TasaMensual,
    plazo: Plazo
  ): PlanAmortizacion;
}