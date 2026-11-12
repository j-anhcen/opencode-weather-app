import { createInterface } from "node:readline";
import { cyan, red, yellow } from "./colors.ts";
import type { City, Config, Unit } from "./storage.ts";
import type { CurrentWeather } from "./weather.ts";

const WIDTH = 40;

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const lines = readline[Symbol.asyncIterator]();

export function unitLabel(unit: Unit): string {
  return unit === "fahrenheit" ? "°F" : "°C";
}

function center(text: string, width: number): string {
  if (text.length >= width) return text;

  const left = Math.floor((width - text.length) / 2);
  const right = width - text.length - left;

  return `${" ".repeat(left)}${text}${" ".repeat(right)}`;
}

export function renderMenu(config: Config): string {
  const line = "═".repeat(WIDTH);
  const options = [
    "1. Clima de ciudad default",
    `2. Clima de todas las ciudades (${config.cities.length})`,
    "3. Buscar y agregar ciudad",
    "4. Eliminar ciudad",
    "5. Establecer ciudad default",
    `8. Ajustes (${unitLabel(config.unit)})`,
    "9. Salir",
  ];

  return [
    cyan(line),
    cyan(center("WEATHER CLI", WIDTH)),
    cyan(line),
    ...options.map((option) => `  ${cyan(option.slice(0, 2))}${option.slice(2)}`),
    cyan(line),
  ].join("\n");
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

export function cityLabel(city: City): string {
  return city.country ? `${city.name}, ${city.country}` : city.name;
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

export async function ask(question: string): Promise<string | null> {
  process.stdout.write(question);

  const { value, done } = await lines.next();
  if (done) {
    process.stdout.write("\n");
    return null;
  }

  return value.trim();
}

export async function askNumber(
  question: string,
  max: number,
): Promise<number | null> {
  while (true) {
    const answer = await ask(question);
    if (answer === null) return null;

    const value = Number(answer);
    if (Number.isInteger(value) && value >= 1 && value <= max) return value - 1;

    console.log(red(`  Opción no válida. Ingresa un número entre 1 y ${max}.`));
  }
}
