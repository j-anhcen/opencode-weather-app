import { REQUEST_TIMEOUT_MS } from "../utils/constants.ts";

export async function fetchJson<T>(url: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw new Error("La petición tardó demasiado. Revisa tu conexión e intenta de nuevo.");
    }

    throw new Error("No se pudo conectar con OpenMeteo. Revisa tu conexión e intenta de nuevo.");
  }

  if (!response.ok) {
    throw new Error(`OpenMeteo respondió con un error (HTTP ${response.status}).`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("OpenMeteo devolvió una respuesta que no se pudo leer.");
  }
}
