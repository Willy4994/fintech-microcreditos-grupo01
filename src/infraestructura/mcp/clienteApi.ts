const API_BASE_URL =
  process.env.CREDITO_VECINO_API_URL ?? "http://localhost:3000";

export async function consultarApi(
  ruta: string,
): Promise<unknown> {
  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!respuesta.ok) {
    throw new Error(
      `Error de API: ${respuesta.status} ${respuesta.statusText}`,
    );
  }

  return respuesta.json();
}