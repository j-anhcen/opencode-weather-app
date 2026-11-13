import { spyOn } from "bun:test";

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

type RestorableSpy = { mockRestore: () => void };

const activeSpies: RestorableSpy[] = [];

function track<T extends RestorableSpy>(spy: T): T {
  activeSpies.push(spy);
  return spy;
}

/** Restaura solo los spies de fetch creados por estos helpers. */
export function restoreSpies(): void {
  while (activeSpies.length > 0) {
    activeSpies.pop()?.mockRestore();
  }
}

export function mockFetchResponse(response: Response) {
  // Cada llamada recibe una copia: el cuerpo de un Response solo se lee una vez.
  const implementation = (() => Promise.resolve(response.clone())) as unknown as typeof fetch;
  return track(spyOn(globalThis, "fetch").mockImplementation(implementation));
}

export function mockFetchJson(data: unknown, status = 200) {
  return mockFetchResponse(jsonResponse(data, status));
}

export function mockFetchReject(error: unknown) {
  return track(spyOn(globalThis, "fetch").mockRejectedValue(error));
}

/** Crea un error con el `name` que espera `fetchJson` (TimeoutError, AbortError...). */
export function namedError(name: string, message = name): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}
