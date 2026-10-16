import { readFile } from "node:fs/promises";
import path from "node:path";

export interface EventoCanonico {
  seq: number;
  tipo: "CLIENTE" | "DESEMBOLSO" | "PAGO";
  [campo: string]: unknown;
}

export interface AsesorCanonico {
  id_asesor: string;
  nombre_completo: string;
}

export interface PoliticasCanonicas {
  version: string;
  moneda: string;
  base_conteo: string;
  politicas_mora: Record<string, Record<string, unknown>>;
  [campo: string]: unknown;
}

export interface DatosCanonicos {
  eventos: EventoCanonico[];
  asesores: AsesorCanonico[];
  politicas: PoliticasCanonicas;
}

export async function leerDatosCanonicos(): Promise<DatosCanonicos> {
  const directorio = path.resolve(
    process.cwd(),
    "datos/datos-proyecto-final"
  );

  // Leer eventos.
  const contenidoEventos = await readFile(
    path.join(directorio, "eventos.jsonl"),
    "utf8"
  );

  const eventos = contenidoEventos
    .trim()
    .split(/\r?\n/)
    .map((linea) => JSON.parse(linea) as EventoCanonico);

  // Leer catálogo de asesores.
  const contenidoAsesores = await readFile(
    path.join(directorio, "asesores.csv"),
    "utf8"
  );

  const lineasAsesores = contenidoAsesores
    .trim()
    .split(/\r?\n/);

  const encabezado = lineasAsesores.shift();

  if (encabezado !== "id_asesor,nombre_completo") {
    throw new Error("Encabezado inválido en asesores.csv.");
  }

  const asesores = lineasAsesores.map((linea) => {
    const [id_asesor, nombre_completo] = linea.split(",", 2);

    if (!id_asesor || !nombre_completo) {
      throw new Error(`Registro de asesor inválido: ${linea}`);
    }

    return {
      id_asesor,
      nombre_completo,
    };
  });

  // Leer políticas financieras.
  const contenidoPoliticas = await readFile(
    path.join(directorio, "politicas.json"),
    "utf8"
  );

  const politicas = JSON.parse(
    contenidoPoliticas
  ) as PoliticasCanonicas;

  return {
    eventos,
    asesores,
    politicas,
  };
}