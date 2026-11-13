import { ask } from "../presentation/input.ts";
import { renderSettings } from "../presentation/output.ts";
import { saveConfig } from "../storage/settingsStorage.ts";
import type { Config, Unit } from "../types/Config.ts";
import { green } from "../utils/colors.ts";
import { unitLabel } from "../utils/format.ts";

export async function settingsFlow(config: Config): Promise<void> {
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
