import path from "node:path";
export function directorioDatos(): string {
  return path.resolve(process.env.CV_DATA_DIR ?? "datos/datos-proyecto-final");
}
