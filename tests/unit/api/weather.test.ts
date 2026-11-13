import { afterEach, describe, expect, test } from "bun:test";
import {
  buildDailyForecastUrl,
  buildForecastUrl,
  fetchDailyForecast,
  fetchWeather,
} from "../../../src/api/weather.ts";
import { FORECAST_URL } from "../../../src/utils/constants.ts";
import { OTTAWA } from "../../helpers/fixtures.ts";
import { mockFetchJson, restoreSpies } from "../../helpers/fetchMock.ts";

const CURRENT_QUERY =
  "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m";
const DAILY_QUERY =
  "temperature_2m_max,temperature_2m_min,precipitation_probability_max";

afterEach(() => {
  restoreSpies();
});

describe("buildForecastUrl", () => {
  test("arma la URL del clima actual en celsius", () => {
    const url = new URL(buildForecastUrl(OTTAWA, "celsius"));

    expect(`${url.origin}${url.pathname}`).toBe(FORECAST_URL);
    expect(url.searchParams.get("latitude")).toBe("45.41117");
    expect(url.searchParams.get("longitude")).toBe("-75.69812");
    expect(url.searchParams.get("current")).toBe(CURRENT_QUERY);
    expect(url.searchParams.get("temperature_unit")).toBeNull();
    expect(url.searchParams.get("wind_speed_unit")).toBeNull();
  });

  test("agrega unidades imperiales en fahrenheit", () => {
    const url = new URL(buildForecastUrl(OTTAWA, "fahrenheit"));

    expect(url.searchParams.get("temperature_unit")).toBe("fahrenheit");
    expect(url.searchParams.get("wind_speed_unit")).toBe("mph");
  });
});

describe("buildDailyForecastUrl", () => {
  test("arma la URL del pronóstico de 7 días", () => {
    const url = new URL(buildDailyForecastUrl(OTTAWA, "celsius"));

    expect(`${url.origin}${url.pathname}`).toBe(FORECAST_URL);
    expect(url.searchParams.get("latitude")).toBe("45.41117");
    expect(url.searchParams.get("longitude")).toBe("-75.69812");
    expect(url.searchParams.get("daily")).toBe(DAILY_QUERY);
    expect(url.searchParams.get("forecast_days")).toBe("7");
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(url.searchParams.get("temperature_unit")).toBeNull();
  });

  test("solo cambia la unidad de temperatura en fahrenheit", () => {
    const url = new URL(buildDailyForecastUrl(OTTAWA, "fahrenheit"));

    expect(url.searchParams.get("temperature_unit")).toBe("fahrenheit");
    expect(url.searchParams.get("wind_speed_unit")).toBeNull();
  });
});

describe("fetchWeather", () => {
  test("mapea el clima actual y sus unidades", async () => {
    mockFetchJson({
      current: {
        temperature_2m: 12.6,
        apparent_temperature: 11.2,
        relative_humidity_2m: 64.7,
        wind_speed_10m: 12.2,
      },
      current_units: { temperature_2m: "°C", wind_speed_10m: "km/h" },
    });

    expect(await fetchWeather(OTTAWA, "celsius")).toEqual({
      temperature: 12.6,
      apparentTemperature: 11.2,
      humidity: 64.7,
      windSpeed: 12.2,
      temperatureUnit: "°C",
      windSpeedUnit: "km/h",
    });
  });

  test("usa unidades celsius por defecto si la API no las envía", async () => {
    mockFetchJson({
      current: {
        temperature_2m: 10,
        apparent_temperature: 9,
        relative_humidity_2m: 50,
        wind_speed_10m: 5,
      },
    });

    const weather = await fetchWeather(OTTAWA, "celsius");

    expect(weather.temperatureUnit).toBe("°C");
    expect(weather.windSpeedUnit).toBe("km/h");
  });

  test("usa unidades imperiales por defecto si la API no las envía", async () => {
    mockFetchJson({
      current: {
        temperature_2m: 50,
        apparent_temperature: 48,
        relative_humidity_2m: 50,
        wind_speed_10m: 3,
      },
    });

    const weather = await fetchWeather(OTTAWA, "fahrenheit");

    expect(weather.temperatureUnit).toBe("°F");
    expect(weather.windSpeedUnit).toBe("mp/h");
  });

  test("falla si la API no devuelve el bloque current", async () => {
    mockFetchJson({});

    await expect(fetchWeather(OTTAWA, "celsius")).rejects.toThrow(
      "OpenMeteo no devolvió los datos del clima esperados.",
    );
  });

  test("falla si algún campo del clima no es numérico", async () => {
    mockFetchJson({
      current: {
        temperature_2m: "12",
        apparent_temperature: 11,
        relative_humidity_2m: 60,
        wind_speed_10m: 5,
      },
    });

    await expect(fetchWeather(OTTAWA, "celsius")).rejects.toThrow(
      "OpenMeteo no devolvió los datos del clima esperados.",
    );
  });
});

describe("fetchDailyForecast", () => {
  test("mapea los días y admite precipitación nula", async () => {
    mockFetchJson({
      daily: {
        time: ["2026-11-13", "2026-11-14"],
        temperature_2m_max: [14.2, 12.8],
        temperature_2m_min: [5.6, 4.1],
        precipitation_probability_max: [20, null],
      },
      daily_units: { temperature_2m_max: "°C" },
    });

    expect(await fetchDailyForecast(OTTAWA, "celsius")).toEqual([
      {
        date: "2026-11-13",
        temperatureMax: 14.2,
        temperatureMin: 5.6,
        precipitationProbability: 20,
        temperatureUnit: "°C",
      },
      {
        date: "2026-11-14",
        temperatureMax: 12.8,
        temperatureMin: 4.1,
        precipitationProbability: null,
        temperatureUnit: "°C",
      },
    ]);
  });

  test("usa la unidad de la config si la API no la envía", async () => {
    mockFetchJson({
      daily: {
        time: ["2026-11-13"],
        temperature_2m_max: [60],
        temperature_2m_min: [40],
        precipitation_probability_max: [10],
      },
    });

    const [day] = await fetchDailyForecast(OTTAWA, "fahrenheit");

    expect(day?.temperatureUnit).toBe("°F");
  });

  test("falla si falta el bloque daily", async () => {
    mockFetchJson({});

    await expect(fetchDailyForecast(OTTAWA, "celsius")).rejects.toThrow(
      "OpenMeteo no devolvió los datos del pronóstico esperados.",
    );
  });

  test("falla si los arreglos tienen longitudes distintas", async () => {
    mockFetchJson({
      daily: {
        time: ["2026-11-13", "2026-11-14"],
        temperature_2m_max: [14.2],
        temperature_2m_min: [5.6, 4.1],
        precipitation_probability_max: [20, 10],
      },
    });

    await expect(fetchDailyForecast(OTTAWA, "celsius")).rejects.toThrow(
      "OpenMeteo no devolvió los datos del pronóstico esperados.",
    );
  });

  test("falla si los arreglos están vacíos", async () => {
    mockFetchJson({
      daily: {
        time: [],
        temperature_2m_max: [],
        temperature_2m_min: [],
        precipitation_probability_max: [],
      },
    });

    await expect(fetchDailyForecast(OTTAWA, "celsius")).rejects.toThrow(
      "OpenMeteo no devolvió los datos del pronóstico esperados.",
    );
  });

  test("falla con fechas vacías o temperaturas no numéricas", async () => {
    mockFetchJson({
      daily: {
        time: ["   "],
        temperature_2m_max: [14],
        temperature_2m_min: [5],
        precipitation_probability_max: [20],
      },
    });
    await expect(fetchDailyForecast(OTTAWA, "celsius")).rejects.toThrow(
      "OpenMeteo no devolvió los datos del pronóstico esperados.",
    );

    mockFetchJson({
      daily: {
        time: ["2026-11-13"],
        temperature_2m_max: [Number.POSITIVE_INFINITY],
        temperature_2m_min: [5],
        precipitation_probability_max: [20],
      },
    });
    await expect(fetchDailyForecast(OTTAWA, "celsius")).rejects.toThrow(
      "OpenMeteo no devolvió los datos del pronóstico esperados.",
    );

    mockFetchJson({
      daily: {
        time: ["2026-11-13"],
        temperature_2m_max: [14],
        temperature_2m_min: [5],
        precipitation_probability_max: ["20"],
      },
    });
    await expect(fetchDailyForecast(OTTAWA, "celsius")).rejects.toThrow(
      "OpenMeteo no devolvió los datos del pronóstico esperados.",
    );
  });
});
