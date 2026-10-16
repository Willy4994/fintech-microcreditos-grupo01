import { readFile } from "node:fs/promises";
import path from "node:path";

interface Evento {
  seq: number;
  tipo: string;
  id_cliente?: string;
  id_credito?: string;
  id_asesor?: string;
  clave_idempotencia?: string;
  monto_centavos?: number;
  fecha?: string;
  canal?: string;
}

export interface ResultadoReferencias {
  clientesRegistrados: number;
  creditosRegistrados: number;
  pagosRevisados: number;
  pagosDuplicados: number;
  referenciasValidas: boolean;
}

export async function validarReferencias(): Promise<ResultadoReferencias> {
  const ruta = path.resolve(
    process.cwd(),
    "datos/datos-proyecto-final/eventos.jsonl"
  );

  const contenido = await readFile(ruta, "utf8");

  const rutaAsesores = path.resolve(
  process.cwd(),
  "datos/datos-proyecto-final/asesores.csv"
);

const contenidoAsesores = await readFile(rutaAsesores, "utf8");

const lineasAsesores = contenidoAsesores
  .trim()
  .split(/\r?\n/);

const encabezado = lineasAsesores.shift();

if (encabezado !== "id_asesor,nombre_completo") {
  throw new Error("El encabezado de asesores.csv no es válido.");
}

const asesores = new Set<string>();

for (const linea of lineasAsesores) {
  const [idAsesor, nombreCompleto] = linea.split(",", 2);

  if (!idAsesor || !nombreCompleto) {
    throw new Error(`Registro de asesor inválido: ${linea}`);
  }

  if (asesores.has(idAsesor)) {
    throw new Error(`Asesor duplicado: ${idAsesor}`);
  }

  asesores.add(idAsesor);
}

if (asesores.size !== 6) {
  throw new Error(
    `Se esperaban 6 asesores, pero se encontraron ${asesores.size}.`
  );
}

  const eventos = contenido
    .trim()
    .split(/\r?\n/)
    .map((linea) => JSON.parse(linea) as Evento);

  const clientes = new Set<string>();
  const creditos = new Set<string>();
  const clavesPagos = new Map<string, Evento>();

  let pagosRevisados = 0;
  let pagosDuplicados = 0;

  for (const evento of eventos) {
    switch (evento.tipo) {
      case "CLIENTE": {
        const id = evento.id_cliente!;

        if (clientes.has(id)) {
          throw new Error(`Cliente duplicado: ${id}`);
        }

        clientes.add(id);
        break;
      }

      case "DESEMBOLSO": {
        const idCredito = evento.id_credito!;
        const idCliente = evento.id_cliente!;

        const idAsesor = evento.id_asesor!;

if (!asesores.has(idAsesor)) {
  throw new Error(
    `Evento ${evento.seq}: el asesor ${idAsesor} no existe en el catálogo.`
  );
}

        if (!clientes.has(idCliente)) {
          throw new Error(
            `Evento ${evento.seq}: el cliente ${idCliente} no existe.`
          );
        }

        if (creditos.has(idCredito)) {
          throw new Error(`Crédito duplicado: ${idCredito}`);
        }

        creditos.add(idCredito);
        break;
      }

      case "PAGO": {
        pagosRevisados++;

        const idCredito = evento.id_credito!;
        const clave = evento.clave_idempotencia!;

        if (!creditos.has(idCredito)) {
          throw new Error(
            `Evento ${evento.seq}: el crédito ${idCredito} no existe.`
          );
        }

        if (clavesPagos.has(clave)) {
          pagosDuplicados++;
        } else {
          clavesPagos.set(clave, evento);
        }

        break;
      }
    }
  }

  return {
    clientesRegistrados: clientes.size,
    creditosRegistrados: creditos.size,
    pagosRevisados,
    pagosDuplicados,
    referenciasValidas: true,
  };
}