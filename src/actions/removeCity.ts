import { askNumber } from "../presentation/input.ts";
import { removeCity } from "../storage/citiesStorage.ts";
import { saveConfig } from "../storage/settingsStorage.ts";
import type { Config } from "../types/Config.ts";
import { green } from "../utils/colors.ts";
import { cityLabel } from "../utils/format.ts";
import { listCities } from "./listCities.ts";

export async function removeCityFlow(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log("\n  No hay ciudades guardadas.");
    return;
  }

  listCities(config);

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
