import { geocodeCity } from "../api/geocoding.ts";
import { ask } from "../presentation/input.ts";
import { printError } from "../presentation/output.ts";
import { addCity, cityKey } from "../storage/citiesStorage.ts";
import { saveConfig } from "../storage/settingsStorage.ts";
import type { Config } from "../types/Config.ts";
import { green, red } from "../utils/colors.ts";
import { cityLabel } from "../utils/format.ts";

export async function addCityFlow(config: Config): Promise<void> {
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
