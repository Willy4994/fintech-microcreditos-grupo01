import { readFile } from "node:fs/promises";
import path from "node:path";

type Evento = Record<string, unknown>;

export interface ResultadoValidacion {
  totalEventos: number;
  clientes: number;
  desembolsos: number;
  pagos: number;
  pagosUnicos: number;
  pagosDuplicados: number;
}

function exigirTexto(
  evento: Evento,
  campo: string
): string {
  const valor = evento[campo];

  if (typeof valor !== "string" || valor.trim() === "") {
    throw new Error(
      `Evento ${evento.seq}: campo '${campo}' inválido.`
    );
  }

  return valor;
}

function exigirEntero(
  evento: Evento,
  campo: string,
  minimo = 0
): number {
  const valor = evento[campo];

  if (
    typeof valor !== "number" ||
    !Number.isSafeInteger(valor) ||
    valor < minimo
  ) {
    throw new Error(
      `Evento ${evento.seq}: campo '${campo}' debe ser un entero válido.`
    );
  }

  return valor;
}

function exigirFecha(
  evento: Evento,
  campo: string
): void {
  const fecha = exigirTexto(evento, campo);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error(
      `Evento ${evento.seq}: fecha '${campo}' inválida.`
    );
  }
}

export async function validarEventos(): Promise<ResultadoValidacion> {
  const ruta = path.resolve(
    process.cwd(),
    "datos/datos-proyecto-final/eventos.jsonl"
  );

  const contenido = await readFile(ruta, "utf8");

  const eventos: Evento[] = contenido
    .trim()
    .split(/\r?\n/)
    .map((linea) => JSON.parse(linea) as Evento);

  if (eventos.length !== 363) {
    throw new Error(
      `Se esperaban 363 eventos, pero se encontraron ${eventos.length}.`
    );
  }

  let clientes = 0;
  let desembolsos = 0;
  let pagos = 0;

  const clavesPagos = new Set<string>();

  for (const [indice, evento] of eventos.entries()) {
    const secuencia = exigirEntero(evento, "seq", 1);

    if (secuencia !== indice + 1) {
      throw new Error(
        `Secuencia incorrecta: se esperaba ${indice + 1}, se encontró ${secuencia}.`
      );
    }

    const tipo = exigirTexto(evento, "tipo");

    switch (tipo) {
      case "CLIENTE":
        clientes++;

        exigirTexto(evento, "id_cliente");
        exigirTexto(evento, "nombre_completo");
        exigirTexto(evento, "dpi");
        exigirTexto(evento, "telefono");
        exigirTexto(evento, "municipio");
        exigirFecha(evento, "fecha_alta");
        break;

      case "DESEMBOLSO":
        desembolsos++;

        exigirTexto(evento, "id_credito");
        exigirTexto(evento, "id_cliente");
        exigirTexto(evento, "id_asesor");
        exigirFecha(evento, "fecha");

        exigirEntero(evento, "capital_centavos", 1);
        exigirEntero(evento, "plazo_meses", 1);
        exigirEntero(evento, "tna_bps", 0);

        if (typeof evento.reestructurado !== "boolean") {
          throw new Error(
            `Evento ${secuencia}: 'reestructurado' debe ser booleano.`
          );
        }
        break;

      case "PAGO":
        pagos++;

        clavesPagos.add(
          exigirTexto(evento, "clave_idempotencia")
        );

        exigirTexto(evento, "id_credito");
        exigirFecha(evento, "fecha");
        exigirEntero(evento, "monto_centavos", 1);
        exigirTexto(evento, "canal");
        break;

      default:
        throw new Error(
          `Evento ${secuencia}: tipo desconocido '${tipo}'.`
        );
    }
  }

  if (clientes !== 60 || desembolsos !== 75 || pagos !== 228) {
    throw new Error(
      "Las cantidades de eventos no coinciden con el contrato canónico."
    );
  }

  return {
    totalEventos: eventos.length,
    clientes,
    desembolsos,
    pagos,
    pagosUnicos: clavesPagos.size,
    pagosDuplicados: pagos - clavesPagos.size,
  };
}