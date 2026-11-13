import { fetchWeather } from "../api/weather.ts";
import { printError, renderWeatherCard } from "../presentation/output.ts";
import type { City } from "../types/City.ts";
import type { Config, Unit } from "../types/Config.ts";

async function printWeather(city: City, unit: Unit): Promise<void> {
  console.log("\n  Consultando el clima...");

  try {
    const weather = await fetchWeather(city, unit);
    console.log(`\n${renderWeatherCard(city, weather)}`);
  } catch (error) {
    printError(error);
  }
}

export async function showDefaultWeather(config: Config): Promise<void> {
  if (!config.defaultCity) {
    console.log(
      "\n  No hay una ciudad default. Agrega una con la opción 3 o establécelo con la opción 5.",
    );
    return;
  }

  await printWeather(config.defaultCity, config.unit);
}

export async function showAllWeather(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log("\n  No hay ciudades guardadas. Agrega una con la opción 3.");
    return;
  }

  for (const city of config.cities) {
    await printWeather(city, config.unit);
  }
}
