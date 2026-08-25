import type { Moneda } from "./Moneda.js";

export class Dinero {
    private constructor(
        private readonly centavos:number,
        public readonly moneda : Moneda
    ) {
        if (!Number.isInteger(centavos)) {
            throw new Error(
                "Dinero debe representarse mediante centavos enteros"
            );
        }
    }

    static desdeCentavos(
        centavos: number,
        moneda: Moneda = "GTQ"
    ): Dinero {
        return new Dinero(centavos, moneda);
    }

    static desdeQuetzales(monto:number): Dinero {
        const centavos = Math.round(monto * 100);

        return new Dinero(centavos, "GTQ");
    }

    static cero(moneda: Moneda = "GTQ"): Dinero{
        return new Dinero(0, moneda);
    }

    sumar(otro:Dinero):Dinero {
        this.validarMismaMoneda(otro);

        return new Dinero(
            this.centavos + otro.centavos,
            this.moneda
        );
    }

    esMayorQue(otro:Dinero):Boolean {
        this.validarMismaMoneda(otro);

        return this.centavos > otro.centavos;
    }

    esMenorQue(otro:Dinero):Boolean {
        this.validarMismaMoneda(otro);

        return this.centavos < otro.centavos;
    }

    esIgualA(otro:Dinero):Boolean {
        return (
            this.moneda === otro.moneda &&
            this.centavos === otro.centavos
        );
    }

    esCero():Boolean{
        return this.centavos === 0;
    }

    obtenerCentavos(): number {
        return this.centavos;;
    }

    obtenerMonto(): number {
        return this.centavos / 100;
    }

    private validarMismaMoneda(otro: Dinero){
        if (this.moneda !== otro.moneda){
            throw new Error(
                `No se puede operar ${this.moneda} con ${otro.moneda}`
            );
        }
    }

}