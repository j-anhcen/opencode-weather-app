import { mkdir, rename } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname } from "node:path";

export type Unit = "celsius" | "fahrenheit";

export type City = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

export type Config = {
  defaultCity: City | null;
  cities: City[];
  unit: Unit;
};

export function defaultConfig(): Config {
  return {
    defaultCity: null,
    cities: [],
    unit: "celsius",
  };
}

export function configPath(): string {
  return (
    Bun.env.WEATHER_CLI_CONFIG ??
    `${homedir()}/.config/weather-cli/config.json`
  );
}

export function cityKey(city: City): string {
  return `${city.latitude.toFixed(4)},${city.longitude.toFixed(4)}`;
}

function normalizeCity(value: unknown): City | null {
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

export function normalizeConfig(value: unknown): Config {
  if (typeof value !== "object" || value === null) return defaultConfig();

  const candidate = value as Record<string, unknown>;
  const cities: City[] = [];
  const seen = new Set<string>();

  if (Array.isArray(candidate.cities)) {
    for (const entry of candidate.cities) {
      const city = normalizeCity(entry);
      if (!city) continue;

      const key = cityKey(city);
      if (seen.has(key)) continue;

      seen.add(key);
      cities.push(city);
    }
  }

  let defaultCity: City | null = null;
  const storedDefault = normalizeCity(candidate.defaultCity);
  if (storedDefault) {
    const key = cityKey(storedDefault);
    defaultCity = cities.find((city) => cityKey(city) === key) ?? null;
  }

  return {
    defaultCity,
    cities,
    unit: candidate.unit === "fahrenheit" ? "fahrenheit" : "celsius",
  };
}

export async function loadConfig(): Promise<Config> {
  const file = Bun.file(configPath());

  if (!(await file.exists())) return defaultConfig();

  try {
    return normalizeConfig(await file.json());
  } catch {
    return defaultConfig();
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const path = configPath();
  const temporaryPath = `${path}.tmp`;

  await mkdir(dirname(path), { recursive: true });
  await Bun.write(temporaryPath, `${JSON.stringify(config, null, 2)}\n`);
  await rename(temporaryPath, path);
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
