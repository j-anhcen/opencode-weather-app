import { green, red } from "./src/colors.ts";
import {
  addCity,
  cityKey,
  loadConfig,
  removeCity,
  saveConfig,
  type City,
  type Config,
  type Unit,
} from "./src/storage.ts";
import {
  ask,
  askNumber,
  cityLabel,
  renderCityList,
  renderMenu,
  renderSettings,
  renderWeatherCard,
  unitLabel,
} from "./src/ui.ts";
import { fetchWeather, geocodeCity } from "./src/weather.ts";

function printError(error: unknown): void {
  const message =
    error instanceof Error ? error.message : "Ocurrió un error inesperado.";
  console.log(`\n  ${red(message)}`);
}

async function printWeather(city: City, unit: Unit): Promise<void> {
  console.log("\n  Consultando el clima...");

  try {
    const weather = await fetchWeather(city, unit);
    console.log(`\n${renderWeatherCard(city, weather)}`);
  } catch (error) {
    printError(error);
  }
}

async function showDefaultWeather(config: Config): Promise<void> {
  if (!config.defaultCity) {
    console.log(
      "\n  No hay una ciudad default. Agrega una con la opción 3 o establécelo con la opción 5.",
    );
    return;
  }

  await printWeather(config.defaultCity, config.unit);
}

async function showAllWeather(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log("\n  No hay ciudades guardadas. Agrega una con la opción 3.");
    return;
  }

  for (const city of config.cities) {
    await printWeather(city, config.unit);
  }
}

async function addCityFlow(config: Config): Promise<void> {
  const name = await ask("  Nombre de la ciudad: ");
  if (name === null) return;

  if (name === "") {
    console.log(red("\n  Debes ingresar el nombre de una ciudad."));
    return;
  }

  console.log("  Buscando ciudad...");

  try {
    const city = await geocodeCity(name);

    if (!city) {
      console.log(red(`\n  No se encontró la ciudad "${name}".`));
      return;
    }

    const hadDefault = config.defaultCity !== null;

    if (!addCity(config, city)) {
      console.log(red(`\n  ${cityLabel(city)} ya está guardada.`));
      return;
    }

    await saveConfig(config);

    const becameDefault =
      !hadDefault &&
      config.defaultCity !== null &&
      cityKey(config.defaultCity) === cityKey(city);

    console.log(
      green(
        `\n  ${cityLabel(city)} agregada${becameDefault ? " y establecida como default" : ""}.`,
      ),
    );
  } catch (error) {
    printError(error);
  }
}

async function removeCityFlow(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log("\n  No hay ciudades guardadas.");
    return;
  }

  console.log(`\n${renderCityList(config.cities, config.defaultCity)}`);

  const index = await askNumber(
    "  Número de ciudad a eliminar: ",
    config.cities.length,
  );
  if (index === null) return;

  const city = config.cities[index];
  if (!city) return;

  if (!removeCity(config, city)) return;

  await saveConfig(config);
  console.log(green(`\n  ${cityLabel(city)} eliminada.`));
}

async function setDefaultCityFlow(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log(
      "\n  No hay ciudades guardadas. Agrega una con la opción 3.",
    );
    return;
  }

  console.log(`\n${renderCityList(config.cities, config.defaultCity)}`);

  const index = await askNumber(
    "  Número de ciudad default: ",
    config.cities.length,
  );
  if (index === null) return;

  const city = config.cities[index];
  if (!city) return;

  config.defaultCity = city;
  await saveConfig(config);
  console.log(green(`\n  ${cityLabel(city)} es ahora la ciudad default.`));
}

async function settingsFlow(config: Config): Promise<void> {
  console.log(`\n${renderSettings(config)}`);

  const option = await ask("  Selecciona una opción: ");
  if (option === null) return;

  const unit: Unit | null =
    option === "1" ? "celsius" : option === "2" ? "fahrenheit" : null;
  if (!unit) return;

  if (config.unit === unit) {
    console.log(`\n  La unidad ya está en ${unitLabel(unit)}.`);
    return;
  }

  config.unit = unit;
  await saveConfig(config);
  console.log(green(`\n  Unidad actualizada a ${unitLabel(unit)}.`));
}

async function main(): Promise<void> {
  const config = await loadConfig();

  while (true) {
    console.log(`\n${renderMenu(config)}`);

    const option = await ask("  Selecciona una opción: ");
    if (option === null || option === "9") return;

    switch (option) {
      case "1":
        await showDefaultWeather(config);
        break;
      case "2":
        await showAllWeather(config);
        break;
      case "3":
        await addCityFlow(config);
        break;
      case "4":
        await removeCityFlow(config);
        break;
      case "5":
        await setDefaultCityFlow(config);
        break;
      case "8":
        await settingsFlow(config);
        break;
      default:
        console.log(red("\n  Opción no válida. Intenta de nuevo."));
        continue;
    }

    const pause = await ask("\n  Presiona Enter para volver al menú...");
    if (pause === null) return;
  }
}

await main();
