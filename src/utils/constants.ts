import { homedir } from "node:os";

export const APP_TITLE = "WEATHER CLI";
export const WIDTH = 40;

export const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;

export const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
export const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
export const REQUEST_TIMEOUT_MS = 10_000;

export const CONFIG_ENV_VAR = "WEATHER_CLI_CONFIG";
export const DEFAULT_CONFIG_PATH = `${homedir()}/.config/weather-cli/config.json`;
