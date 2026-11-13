import { afterEach, describe, expect, test } from "bun:test";
import { showAllWeather, showDefaultWeather } from "../../src/actions/getWeather.ts";
import type { Config } from "../../src/types/Config.ts";
import { captureLogs } from "../helpers/capture.ts";
import { mockFetchJson, mockFetchReject, restoreSpies } from "../helpers/fetchMock.ts";
import { MADRID, OTTAWA, makeConfig } from "../helpers/fixtures.ts";

afterEach(() => {
  restoreSpies();
});

function currentResponse(unit: "celsius" | "fahrenheit") {
  const imperial = unit === "fahrenheit";

  return {
    current: {
      temperature_2m: imperial ? 55 : 12.6,
      apparent_temperature: imperial ? 52 : 11.2,
      relative_humidity_2m: 64.7,
      wind_speed_10m: imperial ? 7.6 : 12.2,
    },
    current_units: {
      temperature_2m: imperial ? "°F" : "°C",
      wind_speed_10m: imperial ? "mp/h" : "km/h",
    },
  };
}

async function run(action: (config: Config) => Promise<void>, config: Config): Promise<string> {
  const capture = captureLogs();
  try {
    await action(config);
  } finally {
    capture.restore();
  }
  return capture.logs.join("\n");
}

function count(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

describe("showDefaultWeather", () => {
  test("indica cómo configurar una ciudad default", async () => {
    const spy = mockFetchJson(currentResponse("celsius"));

    const text = await run(showDefaultWeather, makeConfig());

    expect(text).toContain("No hay una ciudad default.");
    expect(spy).not.toHaveBeenCalled();
  });

  test("consulta el clima de la ciudad default con la unidad configurada", async () => {
    const spy = mockFetchJson(currentResponse("fahrenheit"));
    const config = makeConfig({ defaultCity: OTTAWA, cities: [OTTAWA], unit: "fahrenheit" });

    const text = await run(showDefaultWeather, config);

    expect(text).toContain("Consultando el clima...");
    expect(text).toContain("Ottawa, Canadá");
    expect(text).toContain("Temperatura: 55°F");
    expect(text).toContain("Viento: 8 mp/h");
    expect(spy).toHaveBeenCalledTimes(1);

    const url = new URL(String(spy.mock.calls[0]?.[0]));
    expect(url.searchParams.get("latitude")).toBe("45.41117");
    expect(url.searchParams.get("temperature_unit")).toBe("fahrenheit");
  });

  test("muestra el error de conexión", async () => {
    mockFetchReject(new TypeError("fetch failed"));
    const config = makeConfig({ defaultCity: OTTAWA, cities: [OTTAWA] });

    const text = await run(showDefaultWeather, config);

    expect(text).toContain("No se pudo conectar con OpenMeteo.");
  });
});

describe("showAllWeather", () => {
  test("avisa cuando no hay ciudades guardadas", async () => {
    const spy = mockFetchJson(currentResponse("celsius"));

    const text = await run(showAllWeather, makeConfig());

    expect(text).toContain("No hay ciudades guardadas. Agrega una con la opción 3.");
    expect(spy).not.toHaveBeenCalled();
  });

  test("consulta el clima de todas las ciudades en orden", async () => {
    const spy = mockFetchJson(currentResponse("celsius"));
    const config = makeConfig({ defaultCity: OTTAWA, cities: [OTTAWA, MADRID] });

    const text = await run(showAllWeather, config);

    expect(count(text, "Consultando el clima...")).toBe(2);
    expect(text).toContain("Ottawa, Canadá");
    expect(text).toContain("Madrid, España");
    expect(spy).toHaveBeenCalledTimes(2);

    const firstUrl = new URL(String(spy.mock.calls[0]?.[0]));
    const secondUrl = new URL(String(spy.mock.calls[1]?.[0]));
    expect(firstUrl.searchParams.get("latitude")).toBe("45.41117");
    expect(secondUrl.searchParams.get("latitude")).toBe("40.4168");
  });
});
