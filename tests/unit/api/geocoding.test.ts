import { afterEach, describe, expect, test } from "bun:test";
import { buildGeocodingUrl, geocodeCity } from "../../../src/api/geocoding.ts";
import { GEOCODING_URL } from "../../../src/utils/constants.ts";
import { jsonResponse, mockFetchJson, mockFetchResponse, restoreSpies } from "../../helpers/fetchMock.ts";

afterEach(() => {
  restoreSpies();
});

describe("buildGeocodingUrl", () => {
  test("incluye los parámetros que espera la API", () => {
    const url = new URL(buildGeocodingUrl("Ottawa"));

    expect(`${url.origin}${url.pathname}`).toBe(GEOCODING_URL);
    expect(url.searchParams.get("name")).toBe("Ottawa");
    expect(url.searchParams.get("count")).toBe("1");
    expect(url.searchParams.get("language")).toBe("es");
    expect(url.searchParams.get("format")).toBe("json");
  });

  test("codifica nombres con espacios y caracteres especiales", () => {
    const url = new URL(buildGeocodingUrl("Nueva York & Cía"));

    expect(url.searchParams.get("name")).toBe("Nueva York & Cía");
  });
});

describe("geocodeCity", () => {
  test("mapea el primer resultado y recorta los textos", async () => {
    mockFetchJson({
      results: [
        {
          name: "  Ottawa  ",
          latitude: 45.41117,
          longitude: -75.69812,
          country: " Canadá ",
          admin1: " Ontario ",
        },
      ],
    });

    expect(await geocodeCity("Ottawa")).toEqual({
      name: "Ottawa",
      latitude: 45.41117,
      longitude: -75.69812,
      country: "Canadá",
      admin1: "Ontario",
    });
  });

  test("omite país y provincia cuando vienen vacíos", async () => {
    mockFetchJson({
      results: [
        { name: "Ottawa", latitude: 45.4, longitude: -75.7, country: "  ", admin1: "" },
      ],
    });

    const city = await geocodeCity("Ottawa");

    expect(city).toEqual({ name: "Ottawa", latitude: 45.4, longitude: -75.7 });
    expect(city).not.toHaveProperty("country");
    expect(city).not.toHaveProperty("admin1");
  });

  test("devuelve null cuando no hay resultados", async () => {
    mockFetchJson({});

    expect(await geocodeCity("Atlantis")).toBeNull();
  });

  test("devuelve null cuando el arreglo de resultados está vacío", async () => {
    mockFetchJson({ results: [] });

    expect(await geocodeCity("Atlantis")).toBeNull();
  });

  test("devuelve null cuando el nombre no es válido", async () => {
    mockFetchJson({ results: [{ name: "   ", latitude: 1, longitude: 2 }] });

    expect(await geocodeCity("X")).toBeNull();
  });

  test("devuelve null cuando las coordenadas no son números finitos", async () => {
    mockFetchJson({ results: [{ name: "X", latitude: "1", longitude: 2 }] });
    expect(await geocodeCity("X")).toBeNull();

    mockFetchJson({ results: [{ name: "X", latitude: 1, longitude: null }] });
    expect(await geocodeCity("X")).toBeNull();
  });

  test("propaga el error HTTP de la API", async () => {
    mockFetchResponse(jsonResponse({}, 500));

    await expect(geocodeCity("Ottawa")).rejects.toThrow(
      "OpenMeteo respondió con un error (HTTP 500).",
    );
  });
});
