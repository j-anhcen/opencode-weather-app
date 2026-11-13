import { renderCityList } from "../presentation/output.ts";
import type { Config } from "../types/Config.ts";

export function listCities(config: Config): void {
  console.log(`\n${renderCityList(config.cities, config.defaultCity)}`);
}
