import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";
import type { CurrentWeather, DailyForecast } from "../types/Weather.ts";
import { cyan, red, yellow } from "../utils/colors.ts";
import { WIDTH } from "../utils/constants.ts";
import { cityLabel, forecastDayLabel, unitLabel } from "../utils/format.ts";

export function printError(error: unknown): void {
  const message =
    error instanceof Error ? error.message : "Ocurrió un error inesperado.";
  console.log(`\n  ${red(message)}`);
}

export function renderSettings(config: Config): string {
  const line = "─".repeat(WIDTH);

  return [
    cyan(line),
    cyan("  AJUSTES"),
    cyan(line),
    `  ${cyan("1.")} Celsius (°C)${config.unit === "celsius" ? "  ← actual" : ""}`,
    `  ${cyan("2.")} Fahrenheit (°F)${config.unit === "fahrenheit" ? "  ← actual" : ""}`,
    `  ${cyan("3.")} Volver`,
    cyan(line),
  ].join("\n");
}

export function renderCityList(cities: City[], defaultCity: City | null): string {
  return cities
    .map((city, index) => {
      const isDefault =
        defaultCity !== null &&
        defaultCity.latitude === city.latitude &&
        defaultCity.longitude === city.longitude;

      return `  ${cyan(`${index + 1}.`)} ${cityLabel(city)}${isDefault ? " (default)" : ""}`;
    })
    .join("\n");
}

export function renderWeatherCard(city: City, weather: CurrentWeather): string {
  const line = "─".repeat(WIDTH);

  return [
    cyan(line),
    `  ${cityLabel(city)}`,
    `  Temperatura: ${yellow(`${Math.round(weather.temperature)}${weather.temperatureUnit}`)}`,
    `  Sensación: ${yellow(`${Math.round(weather.apparentTemperature)}${weather.temperatureUnit}`)}`,
    `  Humedad: ${Math.round(weather.humidity)} %`,
    `  Viento: ${Math.round(weather.windSpeed)} ${weather.windSpeedUnit}`,
    cyan(line),
  ].join("\n");
}

export function renderForecastCard(city: City, days: DailyForecast[]): string {
  const line = "─".repeat(WIDTH);
  const unit = days[0]?.temperatureUnit ?? "";
  const header = `  ${"Día".padEnd(7)}${`Máx/Mín${unit ? ` (${unit})` : ""}`.padEnd(14)}Lluvia`;

  const rows = days.map((day, index) => {
    const label = forecastDayLabel(day.date, index === 0).padEnd(7);
    const temperatures = yellow(
      `${Math.round(day.temperatureMax)}°/${Math.round(day.temperatureMin)}°`.padEnd(14),
    );
    const precipitation =
      day.precipitationProbability === null
        ? "—"
        : `${Math.round(day.precipitationProbability)}%`;

    return `  ${label}${temperatures}${precipitation}`;
  });

  return [
    cyan(line),
    `  ${cityLabel(city)}`,
    cyan(header),
    ...rows,
    cyan(line),
  ].join("\n");
}
