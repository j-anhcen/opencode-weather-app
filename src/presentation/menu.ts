import { addCityFlow } from "../actions/addCity.ts";
import { showAllForecast, showDefaultForecast } from "../actions/getForecast.ts";
import { showAllWeather, showDefaultWeather } from "../actions/getWeather.ts";
import { removeCityFlow } from "../actions/removeCity.ts";
import { setDefaultCityFlow } from "../actions/setDefaultCity.ts";
import { settingsFlow } from "../actions/settings.ts";
import type { Config } from "../types/Config.ts";
import type { MenuOption } from "../types/MenuOption.ts";
import { cyan, red } from "../utils/colors.ts";
import { APP_TITLE, WIDTH } from "../utils/constants.ts";
import { center, unitLabel } from "../utils/format.ts";
import { ask } from "./input.ts";

const MENU_OPTIONS: MenuOption[] = [
  {
    id: "1",
    label: "Clima de ciudad default",
    run: showDefaultWeather,
  },
  {
    id: "2",
    label: (config) => `Clima de todas las ciudades (${config.cities.length})`,
    run: showAllWeather,
  },
  {
    id: "3",
    label: "Buscar y agregar ciudad",
    run: addCityFlow,
  },
  {
    id: "4",
    label: "Eliminar ciudad",
    run: removeCityFlow,
  },
  {
    id: "5",
    label: "Establecer ciudad default",
    run: setDefaultCityFlow,
  },
  {
    id: "6",
    label: "Pronóstico 7 días (default)",
    run: showDefaultForecast,
  },
  {
    id: "7",
    label: "Pronóstico 7 días (todas)",
    run: showAllForecast,
  },
  {
    id: "8",
    label: (config) => `Ajustes (${unitLabel(config.unit)})`,
    run: settingsFlow,
  },
];

function optionLabel(option: MenuOption, config: Config): string {
  return typeof option.label === "function" ? option.label(config) : option.label;
}

export function renderMenu(config: Config): string {
  const line = "═".repeat(WIDTH);
  const options = [
    ...MENU_OPTIONS.map(
      (option) => `  ${cyan(`${option.id}.`)} ${optionLabel(option, config)}`,
    ),
    `  ${cyan("9.")} Salir`,
  ];

  return [
    cyan(line),
    cyan(center(APP_TITLE, WIDTH)),
    cyan(line),
    ...options,
    cyan(line),
  ].join("\n");
}

export async function runMenu(config: Config): Promise<void> {
  while (true) {
    console.log(`\n${renderMenu(config)}`);

    const option = await ask("  Selecciona una opción: ");
    if (option === null || option === "9") return;

    const selected = MENU_OPTIONS.find((item) => item.id === option);
    if (!selected) {
      console.log(red("\n  Opción no válida. Intenta de nuevo."));
      continue;
    }

    await selected.run(config);

    const pause = await ask("\n  Presiona Enter para volver al menú...");
    if (pause === null) return;
  }
}
