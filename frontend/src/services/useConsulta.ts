import { useEffect, useState } from "react";
import { api, mensajeError } from "./api";
export function useConsulta<T>(ruta: string, version = 0) {
  const [datos, setDatos] = useState<T | null>(null),
    [error, setError] = useState(""),
    [cargando, setCargando] = useState(true);
  useEffect(() => {
    const control = new AbortController();
    setCargando(true);
    setDatos(null);
    setError("");
    api<T>(ruta, { signal: control.signal })
      .then(setDatos)
      .catch((e) => {
        if (!control.signal.aborted) setError(mensajeError(e));
      })
      .finally(() => {
        if (!control.signal.aborted) setCargando(false);
      });
    return () => control.abort();
  }, [ruta, version]);
  return { datos, error, cargando };
}
