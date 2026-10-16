import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export interface ResultadoIntegridad {
  archivo: string;
  sha256Esperado: string;
  sha256Calculado: string;
  verificado: boolean;
}

export async function verificarIntegridad(): Promise<ResultadoIntegridad> {
  const directorio = path.resolve(
    process.cwd(),
    "datos/datos-proyecto-final"
  );

  const rutaEventos = path.join(directorio, "eventos.jsonl");
  const rutaHuella = path.join(directorio, "eventos.sha256");

  // Leer los bytes originales del archivo.
  const contenidoEventos = await readFile(rutaEventos);

  // Calcular la huella SHA-256.
  const sha256Calculado = createHash("sha256")
    .update(contenidoEventos)
    .digest("hex");

  // Leer la huella proporcionada en el paquete canónico.
  const contenidoHuella = await readFile(rutaHuella, "utf8");

  // El archivo puede contener la huella seguida del nombre del archivo.
  const sha256Esperado = contenidoHuella.trim().split(/\s+/)[0]?.toLowerCase();

  if (!sha256Esperado || !/^[a-f0-9]{64}$/.test(sha256Esperado)) {
    throw new Error("El archivo eventos.sha256 no contiene una huella válida.");
  }

  const verificado = sha256Calculado === sha256Esperado;

  if (!verificado) {
    throw new Error(
      "La verificación SHA-256 falló. El archivo eventos.jsonl podría haber sido modificado."
    );
  }

  return {
    archivo: "eventos.jsonl",
    sha256Esperado,
    sha256Calculado,
    verificado,
  };
}