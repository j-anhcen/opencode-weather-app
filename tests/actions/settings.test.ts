import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { settingsFlow } from "../../src/actions/settings.ts";
import type { Config } from "../../src/types/Config.ts";
import { captureLogs, captureStdout } from "../helpers/capture.ts";
import { makeConfig } from "../helpers/fixtures.ts";
import { queueInput, resetInputQueue } from "../helpers/readlineMock.ts";
import {
  createTempConfig,
  readConfigFile,
  type TempConfig,
} from "../helpers/tempConfig.ts";

let temp: TempConfig;

beforeEach(async () => {
  temp = await createTempConfig();
});

afterEach(async () => {
  resetInputQueue();
  await temp.cleanup();
});

async function run(config: Config): Promise<string> {
  const capture = captureLogs();
  const stdout = captureStdout();
  try {
    await settingsFlow(config);
  } finally {
    capture.restore();
    stdout.restore();
  }
  return capture.logs.join("\n");
}

describe("settingsFlow", () => {
  test("muestra los ajustes y no cambia nada si la entrada termina", async () => {
    const config = makeConfig();

    const text = await run(config);

    expect(text).toContain("AJUSTES");
    expect(config.unit).toBe("celsius");
    expect(await Bun.file(temp.path).exists()).toBe(false);
  });

  test("ignora una opción que no es 1 ni 2", async () => {
    queueInput("3");
    const config = makeConfig();

    const text = await run(config);

    expect(text).toContain("AJUSTES");
    expect(config.unit).toBe("celsius");
    expect(await Bun.file(temp.path).exists()).toBe(false);
  });

  test("avisa cuando la unidad ya es la elegida", async () => {
    queueInput("1");
    const config = makeConfig({ unit: "celsius" });

    const text = await run(config);

    expect(text).toContain("La unidad ya está en °C.");
    expect(await Bun.file(temp.path).exists()).toBe(false);
  });

  test("cambia a fahrenheit y guarda la config", async () => {
    queueInput("2");
    const config = makeConfig({ unit: "celsius" });

    const text = await run(config);

    expect(text).toContain("Unidad actualizada a °F.");
    expect(config.unit).toBe("fahrenheit");
    expect(await readConfigFile(temp.path)).toEqual(config);
  });

  test("vuelve a celsius desde fahrenheit", async () => {
    queueInput("1");
    const config = makeConfig({ unit: "fahrenheit" });

    const text = await run(config);

    expect(text).toContain("Unidad actualizada a °C.");
    expect(config.unit).toBe("celsius");
    expect(await readConfigFile(temp.path)).toEqual(config);
  });
});
