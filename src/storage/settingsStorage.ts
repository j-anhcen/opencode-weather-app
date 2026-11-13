import { mkdir, rename } from "node:fs/promises";
import { dirname } from "node:path";
import type { Config } from "../types/Config.ts";
import { CONFIG_ENV_VAR, DEFAULT_CONFIG_PATH } from "../utils/constants.ts";
import { cityKey, normalizeCity } from "./citiesStorage.ts";

export function defaultConfig(): Config {
  return {
    defaultCity: null,
    cities: [],
    unit: "celsius",
  };
}

export function configPath(): string {
  return Bun.env[CONFIG_ENV_VAR] ?? DEFAULT_CONFIG_PATH;
}

export function normalizeConfig(value: unknown): Config {
  if (typeof value !== "object" || value === null) return defaultConfig();

  const candidate = value as Record<string, unknown>;
  const cities: Config["cities"] = [];
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

  let defaultCity: Config["defaultCity"] = null;
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
