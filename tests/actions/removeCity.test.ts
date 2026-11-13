import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { removeCityFlow } from "../../src/actions/removeCity.ts";
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
    await removeCityFlow(config);
  } finally {
    capture.restore();
    stdout.restore();
  }
  return capture.logs.join("\n");
}

describe("removeCityFlow", () => {
  test("avisa cuando no hay ciudades guardadas", async () => {
    const text = await run(makeConfig());

    expect(text).toContain("No hay ciudades guardadas.");
  });

  test("no modifica nada si la entrada termina", async () => {
    const config = makeConfig({ defaultCity: OTTAWA, cities: [OTTAWA, MADRID] });

    const text = await run(config);

    expect(text).toContain("1. Ottawa, Canadá (default)");
    expect(config.cities).toEqual([OTTAWA, MADRID]);
    expect(await Bun.file(temp.path).exists()).toBe(false);
  });

  test("elimina la ciudad elegida y limpia el default", async () => {
    queueInput("1");
    const config = makeConfig({ defaultCity: OTTAWA, cities: [OTTAWA, MADRID] });

    const text = await run(config);

    expect(text).toContain("Ottawa, Canadá eliminada.");
    expect(config.cities).toEqual([MADRID]);
    expect(config.defaultCity).toBeNull();
    expect(await readConfigFile(temp.path)).toEqual(config);
  });

  test("mantiene el default al eliminar otra ciudad", async () => {
    queueInput("2");
    const config = makeConfig({ defaultCity: OTTAWA, cities: [OTTAWA, MADRID] });

    const text = await run(config);

    expect(text).toContain("Madrid, España eliminada.");
    expect(config.cities).toEqual([OTTAWA]);
    expect(config.defaultCity).toEqual(OTTAWA);
    expect(await readConfigFile(temp.path)).toEqual(config);
  });

  test("reintenta con un número fuera de rango", async () => {
    queueInput("9", "2");
    const config = makeConfig({ cities: [OTTAWA, MADRID] });

    const text = await run(config);

    expect(text).toContain("Opción no válida. Ingresa un número entre 1 y 2.");
    expect(config.cities).toEqual([OTTAWA]);
  });
});
