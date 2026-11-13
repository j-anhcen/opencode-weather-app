import type { Config } from "./Config.ts";

export type MenuOption = {
  id: string;
  label: string | ((config: Config) => string);
  run: (config: Config) => Promise<void>;
};
