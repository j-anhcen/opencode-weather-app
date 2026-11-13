import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";

export function cityKey(city: City): string {
  return `${city.latitude.toFixed(4)},${city.longitude.toFixed(4)}`;
}

export function normalizeCity(value: unknown): City | null {
  if (typeof value !== "object" || value === null) return null;

  const candidate = value as Record<string, unknown>;
  const { name, latitude, longitude, country, admin1 } = candidate;

  if (typeof name !== "string" || name.trim() === "") return null;
  if (typeof latitude !== "number" || !Number.isFinite(latitude)) return null;
  if (typeof longitude !== "number" || !Number.isFinite(longitude)) return null;

  return {
    name: name.trim(),
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

export function addCity(config: Config, city: City): boolean {
  const key = cityKey(city);
  if (config.cities.some((saved) => cityKey(saved) === key)) return false;

  config.cities.push(city);
  if (!config.defaultCity) config.defaultCity = city;

  return true;
}

export function removeCity(config: Config, city: City): boolean {
  const key = cityKey(city);
  const index = config.cities.findIndex((saved) => cityKey(saved) === key);
  if (index === -1) return false;

  config.cities.splice(index, 1);
  if (config.defaultCity && cityKey(config.defaultCity) === key) {
    config.defaultCity = null;
  }

  return true;
}
