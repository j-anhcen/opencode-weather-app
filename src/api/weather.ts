import type { City } from "../types/City.ts";
import type { Unit } from "../types/Config.ts";
import type { CurrentWeather, DailyForecast } from "../types/Weather.ts";
import { FORECAST_URL } from "../utils/constants.ts";
import { fetchJson } from "./client.ts";

type ForecastResponse = {
  current?: {
    temperature_2m?: unknown;
    apparent_temperature?: unknown;
    relative_humidity_2m?: unknown;
    wind_speed_10m?: unknown;
  };
  current_units?: {
    temperature_2m?: unknown;
    wind_speed_10m?: unknown;
  };
};

type DailyForecastResponse = {
  daily?: {
    time?: unknown;
    temperature_2m_max?: unknown;
    temperature_2m_min?: unknown;
    precipitation_probability_max?: unknown;
  };
  daily_units?: {
    temperature_2m_max?: unknown;
  };
};

export function buildForecastUrl(city: City, unit: Unit): string {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m",
  );

  if (unit === "fahrenheit") {
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("wind_speed_unit", "mph");
  }

  return url.toString();
}

export function buildDailyForecastUrl(city: City, unit: Unit): string {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("timezone", "auto");

  if (unit === "fahrenheit") {
    url.searchParams.set("temperature_unit", "fahrenheit");
  }

  return url.toString();
}

export async function fetchWeather(city: City, unit: Unit): Promise<CurrentWeather> {
  const data = await fetchJson<ForecastResponse>(buildForecastUrl(city, unit));
  const current = data.current;

  if (!current) {
    throw new Error("OpenMeteo no devolvió los datos del clima esperados.");
  }

  const { temperature_2m, apparent_temperature, relative_humidity_2m, wind_speed_10m } = current;

  if (
    typeof temperature_2m !== "number" ||
    typeof apparent_temperature !== "number" ||
    typeof relative_humidity_2m !== "number" ||
    typeof wind_speed_10m !== "number"
  ) {
    throw new Error("OpenMeteo no devolvió los datos del clima esperados.");
  }

  const temperatureUnit =
    typeof data.current_units?.temperature_2m === "string"
      ? data.current_units.temperature_2m
      : unit === "fahrenheit"
        ? "°F"
        : "°C";

  const windSpeedUnit =
    typeof data.current_units?.wind_speed_10m === "string"
      ? data.current_units.wind_speed_10m
      : unit === "fahrenheit"
        ? "mp/h"
        : "km/h";

  return {
    temperature: temperature_2m,
    apparentTemperature: apparent_temperature,
    humidity: relative_humidity_2m,
    windSpeed: wind_speed_10m,
    temperatureUnit,
    windSpeedUnit,
  };
}

export async function fetchDailyForecast(
  city: City,
  unit: Unit,
): Promise<DailyForecast[]> {
  const data = await fetchJson<DailyForecastResponse>(buildDailyForecastUrl(city, unit));
  const invalidData = "OpenMeteo no devolvió los datos del pronóstico esperados.";
  const daily = data.daily;

  const time = daily?.time;
  const temperatureMax = daily?.temperature_2m_max;
  const temperatureMin = daily?.temperature_2m_min;
  const precipitation = daily?.precipitation_probability_max;

  if (
    !Array.isArray(time) ||
    !Array.isArray(temperatureMax) ||
    !Array.isArray(temperatureMin) ||
    !Array.isArray(precipitation)
  ) {
    throw new Error(invalidData);
  }

  if (
    time.length === 0 ||
    temperatureMax.length !== time.length ||
    temperatureMin.length !== time.length ||
    precipitation.length !== time.length
  ) {
    throw new Error(invalidData);
  }

  const temperatureUnit =
    typeof data.daily_units?.temperature_2m_max === "string"
      ? data.daily_units.temperature_2m_max
      : unit === "fahrenheit"
        ? "°F"
        : "°C";

  const days: DailyForecast[] = [];

  for (let index = 0; index < time.length; index += 1) {
    const date = time[index];
    const max = temperatureMax[index];
    const min = temperatureMin[index];
    const probability = precipitation[index];

    if (typeof date !== "string" || date.trim() === "") throw new Error(invalidData);
    if (typeof max !== "number" || !Number.isFinite(max)) throw new Error(invalidData);
    if (typeof min !== "number" || !Number.isFinite(min)) throw new Error(invalidData);
    if (
      probability !== null &&
      (typeof probability !== "number" || !Number.isFinite(probability))
    ) {
      throw new Error(invalidData);
    }

    days.push({
      date,
      temperatureMax: max,
      temperatureMin: min,
      precipitationProbability: probability,
      temperatureUnit,
    });
  }

  return days;
}
