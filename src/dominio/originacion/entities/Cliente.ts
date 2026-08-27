import { ClienteId } from
  "../value-objects/ClienteId.js";

import { DocumentoIdentificacion } from
  "../value-objects/DocumentoIdentificacion.js";

import { Email } from
  "../value-objects/Email.js";

export class Cliente {
  constructor(
    public readonly id: ClienteId,
    private nombre: string,
    public readonly documento: DocumentoIdentificacion,
    private email: Email
  ) {
    const nombreNormalizado = nombre.trim();

    if (nombreNormalizado.length === 0) {
      throw new Error(
        "El nombre del cliente es obligatorio"
      );
    }

    this.nombre = nombreNormalizado;
  }

  obtenerNombre(): string {
    return this.nombre;
  }

  obtenerEmail(): Email {
    return this.email;
  }

  cambiarEmail(nuevoEmail: Email): void {
    this.email = nuevoEmail;
  }
}