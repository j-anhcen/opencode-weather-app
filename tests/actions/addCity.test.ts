import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { addCityFlow } from "../../src/actions/addCity.ts";
import type { City } from "../../src/types/City.ts";
import type { Config } from "../../src/types/Config.ts";
import { captureLogs, captureStdout } from "../helpers/capture.ts";
import { mockFetchJson, mockFetchReject, restoreSpies } from "../helpers/fetchMock.ts";
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
  restoreSpies();
  resetInputQueue();
  await temp.cleanup();
});

function geocodingResponse(city: City) {
  return {
    results: [
      {
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
        country: city.country,
        admin1: city.admin1,
      },
    ],
  };
}

async function run(config: Config): Promise<string> {
  const capture = captureLogs();
  const stdout = captureStdout();
  try {
    await addCityFlow(config);
  } finally {
    capture.restore();
    stdout.restore();
  }
  return capture.logs.join("\n");
}

describe("addCityFlow", () => {
  test("no hace nada si la entrada termina", async () => {
    const config = makeConfig();
    const spy = mockFetchJson({});

    const text = await run(config);

    expect(text).toBe("");
    expect(config.cities).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  test("pide un nombre cuando se envía vacío", async () => {
    queueInput("");
    const config = makeConfig();
    const spy = mockFetchJson({});

    const text = await run(config);

    expect(text).toContain("Debes ingresar el nombre de una ciudad.");
    expect(spy).not.toHaveBeenCalled();
  });

  test("avisa cuando la ciudad no existe", async () => {
    queueInput("Atlantis");
    const config = makeConfig();
    mockFetchJson({});

    const text = await run(config);

    expect(text).toContain('No se encontró la ciudad "Atlantis".');
    expect(config.cities).toEqual([]);
    expect(await Bun.file(temp.path).exists()).toBe(false);
  });

  test("agrega la primera ciudad y la vuelve default", async () => {
    queueInput("  Ottawa  ");
    const config = makeConfig();
    const spy = mockFetchJson(geocodingResponse(OTTAWA));

    const text = await run(config);

    expect(text).toContain("Buscando ciudad...");
    expect(text).toContain("Ottawa, Canadá agregada y establecida como default.");
    expect(config.cities).toEqual([OTTAWA]);
    expect(config.defaultCity).toEqual(OTTAWA);
    expect(await readConfigFile(temp.path)).toEqual(config);

    const url = new URL(String(spy.mock.calls[0]?.[0]));
    expect(url.searchParams.get("name")).toBe("Ottawa");
  });

  test("no cambia el default cuando ya existía uno", async () => {
    queueInput("Ottawa");
    const config = makeConfig({ defaultCity: MADRID, cities: [MADRID] });
    mockFetchJson(geocodingResponse(OTTAWA));

    const text = await run(config);

    expect(text).toContain("Ottawa, Canadá agregada.");
    expect(text).not.toContain("establecida como default");
    expect(config.defaultCity).toEqual(MADRID);
    expect(config.cities).toEqual([MADRID, OTTAWA]);
    expect(await readConfigFile(temp.path)).toEqual(config);
  });

  test("avisa cuando la ciudad ya está guardada", async () => {
    queueInput("Ottawa");
    const config = makeConfig({ defaultCity: OTTAWA, cities: [OTTAWA] });
    mockFetchJson(geocodingResponse(OTTAWA));

    const text = await run(config);

    expect(text).toContain("Ottawa, Canadá ya está guardada.");
    expect(config.cities).toEqual([OTTAWA]);
    expect(await Bun.file(temp.path).exists()).toBe(false);
  });

  test("muestra el error de conexión sin romper el flujo", async () => {
    queueInput("Ottawa");
    const config = makeConfig();
    mockFetchReject(new TypeError("fetch failed"));

    const text = await run(config);

    expect(text).toContain("No se pudo conectar con OpenMeteo.");
    expect(config.cities).toEqual([]);
  });
});
