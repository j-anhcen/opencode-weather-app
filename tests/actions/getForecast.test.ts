import { afterEach, describe, expect, test } from "bun:test";
import { showAllForecast, showDefaultForecast } from "../../src/actions/getForecast.ts";
import type { Config } from "../../src/types/Config.ts";
import { captureLogs } from "../helpers/capture.ts";
import { mockFetchJson, mockFetchReject, restoreSpies } from "../helpers/fetchMock.ts";
import { MADRID, OTTAWA, makeConfig } from "../helpers/fixtures.ts";

afterEach(() => {
  restoreSpies();
});

function dailyResponse() {
  return {
    daily: {
      time: ["2026-11-13", "2026-11-14"],
      temperature_2m_max: [14.2, 12.8],
      temperature_2m_min: [5.6, 4.1],
      precipitation_probability_max: [20, null],
    },
    daily_units: { temperature_2m_max: "°C" },
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

describe("showDefaultForecast", () => {
  test("indica cómo configurar una ciudad default", async () => {
    const spy = mockFetchJson(dailyResponse());

    const text = await run(showDefaultForecast, makeConfig());

    expect(text).toContain("No hay una ciudad default.");
    expect(spy).not.toHaveBeenCalled();
  });

  test("muestra el pronóstico de la ciudad default", async () => {
    const spy = mockFetchJson(dailyResponse());
    const config = makeConfig({ defaultCity: OTTAWA, cities: [OTTAWA] });

    const text = await run(showDefaultForecast, config);

    expect(text).toContain("Consultando el pronóstico...");
    expect(text).toContain("Ottawa, Canadá");
    expect(text).toContain("Máx/Mín (°C)");
    expect(text).toContain("hoy");
    expect(text).toContain("sáb 14");
    expect(spy).toHaveBeenCalledTimes(1);

    const url = new URL(String(spy.mock.calls[0]?.[0]));
    expect(url.searchParams.get("forecast_days")).toBe("7");
    expect(url.searchParams.get("timezone")).toBe("auto");
  });

  test("muestra el error de conexión", async () => {
    mockFetchReject(new TypeError("fetch failed"));
    const config = makeConfig({ defaultCity: OTTAWA, cities: [OTTAWA] });

    const text = await run(showDefaultForecast, config);

    expect(text).toContain("No se pudo conectar con OpenMeteo.");
  });
});

describe("showAllForecast", () => {
  test("avisa cuando no hay ciudades guardadas", async () => {
    const spy = mockFetchJson(dailyResponse());

    const text = await run(showAllForecast, makeConfig());

    expect(text).toContain("No hay ciudades guardadas. Agrega una con la opción 3.");
    expect(spy).not.toHaveBeenCalled();
  });

  test("muestra el pronóstico de todas las ciudades", async () => {
    const spy = mockFetchJson(dailyResponse());
    const config = makeConfig({ defaultCity: OTTAWA, cities: [OTTAWA, MADRID] });

    const text = await run(showAllForecast, config);

    expect(count(text, "Consultando el pronóstico...")).toBe(2);
    expect(text).toContain("Ottawa, Canadá");
    expect(text).toContain("Madrid, España");
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
