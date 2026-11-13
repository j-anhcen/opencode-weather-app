import { askNumber } from "../presentation/input.ts";
import { saveConfig } from "../storage/settingsStorage.ts";
import type { Config } from "../types/Config.ts";
import { green } from "../utils/colors.ts";
import { cityLabel } from "../utils/format.ts";
import { listCities } from "./listCities.ts";

export async function setDefaultCityFlow(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log(
      "\n  No hay ciudades guardadas. Agrega una con la opción 3.",
    );
    return;
  }

  listCities(config);

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
