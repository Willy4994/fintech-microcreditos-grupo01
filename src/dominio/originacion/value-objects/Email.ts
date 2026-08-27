export class Email {
  private constructor(
    public readonly valor: string
  ) {}

  static crear(valor: string): Email {
    const normalizado =
      valor.trim().toLowerCase();

    if (normalizado.length === 0) {
      throw new Error(
        "El correo electrónico es obligatorio"
      );
    }

    const formato =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formato.test(normalizado)) {
      throw new Error(
        "El correo electrónico no es válido"
      );
    }

    return new Email(normalizado);
  }

  esIgualA(otro: Email): boolean {
    return this.valor === otro.valor;
  }

  toString(): string {
    return this.valor;
  }
}