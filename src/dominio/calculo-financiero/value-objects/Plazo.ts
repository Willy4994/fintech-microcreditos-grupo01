export class Plazo {
  private constructor(
    public readonly meses: number
  ) {}

  static crear(meses: number): Plazo {
    if (!Number.isInteger(meses)) {
      throw new Error(
        "El plazo debe ser un número entero"
      );
    }

    if (meses < 3 || meses > 24) {
      throw new Error(
        "El plazo debe estar entre 3 y 24 meses"
      );
    }

    return new Plazo(meses);
  }
}