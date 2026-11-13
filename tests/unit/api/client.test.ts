import { afterEach, describe, expect, test } from "bun:test";
import { fetchJson } from "../../../src/api/client.ts";
import {
  jsonResponse,
  mockFetchJson,
  mockFetchReject,
  mockFetchResponse,
  namedError,
  restoreSpies,
} from "../../helpers/fetchMock.ts";

const URL = "https://example.test/data";

afterEach(() => {
  restoreSpies();
});

describe("fetchJson", () => {
  test("devuelve el JSON cuando la respuesta es correcta", async () => {
    mockFetchJson({ ok: true, value: 7 });

    expect(await fetchJson<{ ok: boolean; value: number }>(URL)).toEqual({
      ok: true,
      value: 7,
    });
  });

  test("llama a fetch con la URL y una señal de timeout", async () => {
    const spy = mockFetchJson({});

    await fetchJson(URL);

    const [input, init] = spy.mock.calls[0] ?? [];
    expect(input).toBe(URL);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  test("lanza un error con el código HTTP cuando la respuesta no es ok", async () => {
    mockFetchResponse(jsonResponse({ error: true }, 503));

    await expect(fetchJson(URL)).rejects.toThrow(
      "OpenMeteo respondió con un error (HTTP 503).",
    );
  });

  test("lanza un error cuando el cuerpo no es JSON válido", async () => {
    mockFetchResponse(new Response("no es json"));

    await expect(fetchJson(URL)).rejects.toThrow(
      "OpenMeteo devolvió una respuesta que no se pudo leer.",
    );
  });

  test("lanza un error de conexión ante un fallo de red", async () => {
    mockFetchReject(new TypeError("fetch failed"));

    await expect(fetchJson(URL)).rejects.toThrow(
      "No se pudo conectar con OpenMeteo. Revisa tu conexión e intenta de nuevo.",
    );
  });

  test("lanza un error de timeout cuando la petición expira", async () => {
    mockFetchReject(namedError("TimeoutError"));

    await expect(fetchJson(URL)).rejects.toThrow(
      "La petición tardó demasiado. Revisa tu conexión e intenta de nuevo.",
    );
  });

  test("trata AbortError como timeout", async () => {
    mockFetchReject(namedError("AbortError"));

    await expect(fetchJson(URL)).rejects.toThrow("La petición tardó demasiado.");
  });

  test("trata un rechazo que no es Error como fallo de conexión", async () => {
    mockFetchReject("boom");

    await expect(fetchJson(URL)).rejects.toThrow("No se pudo conectar con OpenMeteo.");
  });
});
