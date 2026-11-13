import type { City } from "../../src/types/City.ts";
import type { Config } from "../../src/types/Config.ts";
import type { CurrentWeather, DailyForecast } from "../../src/types/Weather.ts";

export const OTTAWA: City = {
  name: "Ottawa",
  latitude: 45.41117,
  longitude: -75.69812,
  country: "Canadá",
  admin1: "Ontario",
};

export const MADRID: City = {
  name: "Madrid",
  latitude: 40.4168,
  longitude: -3.7038,
  country: "España",
  admin1: "Madrid",
};

export const TOKYO: City = {
  name: "Tokio",
  latitude: 35.6895,
  longitude: 139.6917,
  country: "Japón",
};

export function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    defaultCity: null,
    cities: [],
    unit: "celsius",
    ...overrides,
  };
}

export const CURRENT_WEATHER: CurrentWeather = {
  temperature: 12.6,
  apparentTemperature: 11.2,
  humidity: 64.7,
  windSpeed: 12.2,
  temperatureUnit: "°C",
  windSpeedUnit: "km/h",
};

export const DAILY_FORECAST: DailyForecast[] = [
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
];
