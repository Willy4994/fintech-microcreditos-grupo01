import { DomainException} from "./DomainException.js";
import type { Moneda } from "../value-objects/Moneda.js";

export class MonedaIncompatibleException
    extends DomainException {
        constructor(
            monedaOrigen : Moneda,
            monedaDestino : Moneda
        ){
            super(
                `No se puede operar ${monedaOrigen} con ${monedaDestino}`
            );
        }
    }