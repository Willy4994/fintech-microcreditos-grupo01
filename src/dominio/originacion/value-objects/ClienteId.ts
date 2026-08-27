export class ClienteId {
    private constructor(
        public readonly valor: string
    ){}
    static crear(valor: string): ClienteId {
        const normalizado = valor.trim();

        if(normalizado.length === 0) {
            throw new Error(
                "El identificador del cliente es obligatorio"
            );
        }

        return new ClienteId(normalizado);
    }

    esIgualA(otro: ClienteId): boolean {
        return this.valor === otro.valor;
    }

    toString(): string {
        return this.valor;
    }
}