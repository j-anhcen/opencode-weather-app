import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type TempConfig = {
  dir: string;
  path: string;
  cleanup: () => Promise<void>;
};

/**
 * Crea un directorio temporal y apunta WEATHER_CLI_CONFIG a un config.json
 * dentro de él. La limpieza borra el directorio y la variable de entorno.
 */
export async function createTempConfig(): Promise<TempConfig> {
  const dir = await mkdtemp(join(tmpdir(), "weather-cli-test-"));
  const path = join(dir, "config.json");

  Bun.env.WEATHER_CLI_CONFIG = path;

  return {
    dir,
    path,
    cleanup: async () => {
      delete Bun.env.WEATHER_CLI_CONFIG;
      await rm(dir, { recursive: true, force: true });
    },
  };
}

export async function writeConfigFile(path: string, value: unknown): Promise<void> {
  const content = typeof value === "string" ? value : JSON.stringify(value);
  await Bun.write(path, content);
}

export async function readConfigFile(path: string): Promise<unknown> {
  return Bun.file(path).json();
}
