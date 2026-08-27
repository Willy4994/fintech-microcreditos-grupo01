import { Decimal } from "decimal.js";
import type { Moneda } from "./Moneda.js";
import { MonedaIncompatibleException } from "../exceptions/MonedaIncompatibleException.js";

export class Dinero {
    private constructor(
        private readonly centavos: number,
        public readonly moneda: Moneda
    ) {
        if (!Number.isInteger(centavos)) {
            throw new Error(
                "El dinero debe almacenarse en centavos enteros"
            );
        }
    }

    static desdeCentavos(
        centavos: number,
        moneda: Moneda = "GTQ"
    ): Dinero {
        return new Dinero(
            centavos,
            moneda
        );
    }

    static desdeDecimal(
        monto: Decimal,
        moneda: Moneda = "GTQ"
    ): Dinero {
        const redondeado = monto.toDecimalPlaces(
            2,
            Decimal.ROUND_HALF_UP
        );

        const centavos = redondeado
            .times(100)
            .toNumber();

        if (!Number.isInteger(centavos)) {
            throw new Error(
                "El monto no pudo convertirse a centavos enteros"
            );
        }

        return new Dinero(
            centavos,
            moneda
        );
    }

    obtenerCentavos(): number {
        return this.centavos;
    }

    obtenerMonto(): number {
        return this.centavos / 100;
    }

    esCero(): boolean {
        return this.centavos === 0;
    }

    esMenorQue(otro: Dinero): boolean {
        this.validarMismaMoneda(otro);

        return this.centavos < otro.centavos;
    }

    esMayorQue(otro: Dinero): boolean {
        this.validarMismaMoneda(otro);

        return this.centavos > otro.centavos;
    }

    sumar(otro: Dinero): Dinero {
        this.validarMismaMoneda(otro);

        return new Dinero(
            this.centavos + otro.centavos,
            this.moneda
        );
    }

    restar(otro: Dinero): Dinero {
        this.validarMismaMoneda(otro);

        return new Dinero(
            this.centavos - otro.centavos,
            this.moneda
        );
    }

    toDecimal(): Decimal {
        return new Decimal(
            this.centavos
        ).dividedBy(100);
    }

    toString(): string {
        return `${this.moneda} ${this.toDecimal().toFixed(2)}`;
    }

    private validarMismaMoneda(
        otro: Dinero
    ): void {
        if (this.moneda !== otro.moneda) {
            throw new MonedaIncompatibleException(
                this.moneda,
                otro.moneda
            );
        }
    }
}
