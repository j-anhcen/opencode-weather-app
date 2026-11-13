import { fetchDailyForecast } from "../api/weather.ts";
import { printError, renderForecastCard } from "../presentation/output.ts";
import type { City } from "../types/City.ts";
import type { Config, Unit } from "../types/Config.ts";

async function printForecast(city: City, unit: Unit): Promise<void> {
  console.log("\n  Consultando el pronóstico...");

  try {
    const days = await fetchDailyForecast(city, unit);
    console.log(`\n${renderForecastCard(city, days)}`);
  } catch (error) {
    printError(error);
  }
}

export async function showDefaultForecast(config: Config): Promise<void> {
  if (!config.defaultCity) {
    console.log(
      "\n  No hay una ciudad default. Agrega una con la opción 3 o establécelo con la opción 5.",
    );
    return;
  }

  await printForecast(config.defaultCity, config.unit);
}

export async function showAllForecast(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log("\n  No hay ciudades guardadas. Agrega una con la opción 3.");
    return;
  }

  for (const city of config.cities) {
    await printForecast(city, config.unit);
  }
}
