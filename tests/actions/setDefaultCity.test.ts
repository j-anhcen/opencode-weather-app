import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { setDefaultCityFlow } from "../../src/actions/setDefaultCity.ts";
import type { Config } from "../../src/types/Config.ts";
import { captureLogs, captureStdout } from "../helpers/capture.ts";
import { MADRID, OTTAWA, makeConfig } from "../helpers/fixtures.ts";
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
    await setDefaultCityFlow(config);
  } finally {
    capture.restore();
    stdout.restore();
  }
  return capture.logs.join("\n");
}

describe("setDefaultCityFlow", () => {
  test("indica cómo agregar una ciudad si no hay ninguna", async () => {
    const text = await run(makeConfig());

    expect(text).toContain("No hay ciudades guardadas. Agrega una con la opción 3.");
  });

  test("no modifica nada si la entrada termina", async () => {
    const config = makeConfig({ cities: [OTTAWA, MADRID] });

    const text = await run(config);

    expect(text).toContain("1. Ottawa, Canadá");
    expect(config.defaultCity).toBeNull();
    expect(await Bun.file(temp.path).exists()).toBe(false);
  });

  test("establece la ciudad elegida como default y la guarda", async () => {
    queueInput("2");
    const config = makeConfig({ cities: [OTTAWA, MADRID] });

    const text = await run(config);

    expect(text).toContain("Madrid, España es ahora la ciudad default.");
    expect(config.defaultCity).toEqual(MADRID);
    expect(await readConfigFile(temp.path)).toEqual(config);
  });

  test("vuelve a pedir el número si la opción no es válida", async () => {
    queueInput("0", "1");
    const config = makeConfig({ cities: [OTTAWA, MADRID] });

    const text = await run(config);

    expect(text).toContain("Opción no válida. Ingresa un número entre 1 y 2.");
    expect(config.defaultCity).toEqual(OTTAWA);
  });
});
