export class DocumentoIdentificacion {
    private constructor(
        public readonly valor: string
    )   {}

    static crear(
        valor:string
    ): DocumentoIdentificacion {
        const normalizado = valor.trim();

        if (normalizado.length === 0) {
            throw new Error(
                "El documento de Identificacion es obligatorio"
            );
        }

        return new DocumentoIdentificacion(
            normalizado
        );
    }

    esIgualA(
        otro: DocumentoIdentificacion
    ): boolean {
        return this.valor === otro.valor;
    }
    
    toString(): string {
        return this.valor;
    }
}