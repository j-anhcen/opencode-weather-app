import type { City, Unit } from "./storage.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 10_000;

export type CurrentWeather = {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  temperatureUnit: string;
  windSpeedUnit: string;
};

type GeocodingResponse = {
  results?: Array<{
    name?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    country?: unknown;
    admin1?: unknown;
  }>;
};

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

export function buildGeocodingUrl(name: string): string {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", name);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");
  return url.toString();
}

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

async function fetchJson<T>(url: string): Promise<T> {
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

export async function geocodeCity(name: string): Promise<City | null> {
  const data = await fetchJson<GeocodingResponse>(buildGeocodingUrl(name));
  const result = data.results?.[0];

  if (!result) return null;

  const { latitude, longitude, country, admin1 } = result;
  if (typeof result.name !== "string" || result.name.trim() === "") return null;
  if (typeof latitude !== "number" || !Number.isFinite(latitude)) return null;
  if (typeof longitude !== "number" || !Number.isFinite(longitude)) return null;

  return {
    name: result.name.trim(),
    latitude,
    longitude,
    ...(typeof country === "string" && country.trim() !== ""
      ? { country: country.trim() }
      : {}),
    ...(typeof admin1 === "string" && admin1.trim() !== ""
      ? { admin1: admin1.trim() }
      : {}),
  };
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
