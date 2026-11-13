import { closeInput } from "./presentation/input.ts";
import { runMenu } from "./presentation/menu.ts";
import { loadConfig } from "./storage/settingsStorage.ts";

try {
  await runMenu(await loadConfig());
} finally {
  closeInput();
}
