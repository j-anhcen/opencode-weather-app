import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  configPath,
  defaultConfig,
  loadConfig,
  normalizeConfig,
  saveConfig,
} from "../../../src/storage/settingsStorage.ts";
import { DEFAULT_CONFIG_PATH } from "../../../src/utils/constants.ts";
import { MADRID, OTTAWA } from "../../helpers/fixtures.ts";
import {
  createTempConfig,
  readConfigFile,
  writeConfigFile,
  type TempConfig,
} from "../../helpers/tempConfig.ts";

let temp: TempConfig;

beforeEach(async () => {
  temp = await createTempConfig();
});

afterEach(async () => {
  await temp.cleanup();
});

describe("defaultConfig", () => {
  test("parte sin ciudades, sin default y en celsius", () => {
    expect(defaultConfig()).toEqual({
      defaultCity: null,
      cities: [],
      unit: "celsius",
    });
  });

  test("devuelve un objeto nuevo en cada llamada", () => {
    const first = defaultConfig();
    first.cities.push(OTTAWA);

    expect(defaultConfig().cities).toEqual([]);
  });
});

describe("configPath", () => {
  test("usa WEATHER_CLI_CONFIG cuando está definida", () => {
    expect(configPath()).toBe(temp.path);
  });

  test("usa la ruta por defecto cuando la variable no existe", () => {
    delete Bun.env.WEATHER_CLI_CONFIG;

    expect(configPath()).toBe(DEFAULT_CONFIG_PATH);
  });
});

describe("normalizeConfig", () => {
  test("devuelve la config por defecto para valores no objeto", () => {
    expect(normalizeConfig(null)).toEqual(defaultConfig());
    expect(normalizeConfig("x")).toEqual(defaultConfig());
    expect(normalizeConfig(12)).toEqual(defaultConfig());
  });

  test("normaliza ciudades y descarta duplicados", () => {
    const config = normalizeConfig({
      cities: [
        { name: "  Ottawa ", latitude: 45.41117, longitude: -75.69812 },
        { name: "Ottawa repetida", latitude: 45.411171, longitude: -75.698121 },
        { name: "", latitude: 1, longitude: 2 },
        "basura",
      ],
    });

    expect(config.cities).toEqual([
      { name: "Ottawa", latitude: 45.41117, longitude: -75.69812 },
    ]);
  });

  test("solo acepta un default que exista entre las ciudades", () => {
    const config = normalizeConfig({
      cities: [OTTAWA],
      defaultCity: MADRID,
    });

    expect(config.defaultCity).toBeNull();
  });

  test("conserva el default cuando coincide por coordenadas", () => {
    const config = normalizeConfig({
      cities: [OTTAWA],
      defaultCity: { ...OTTAWA, name: "Ottawa (default)" },
    });

    expect(config.defaultCity).toEqual(OTTAWA);
  });

  test("solo acepta fahrenheit como unidad alternativa", () => {
    expect(normalizeConfig({ unit: "fahrenheit" }).unit).toBe("fahrenheit");
    expect(normalizeConfig({ unit: "kelvin" }).unit).toBe("celsius");
    expect(normalizeConfig({ unit: 12 }).unit).toBe("celsius");
  });

  test("ignora un campo cities que no es arreglo", () => {
    expect(normalizeConfig({ cities: "Ottawa" }).cities).toEqual([]);
  });
});

describe("loadConfig", () => {
  test("devuelve la config por defecto si el archivo no existe", async () => {
    expect(await loadConfig()).toEqual(defaultConfig());
  });

  test("devuelve la config por defecto si el JSON es inválido", async () => {
    await writeConfigFile(temp.path, "{ esto no es json");

    expect(await loadConfig()).toEqual(defaultConfig());
  });

  test("normaliza el contenido del archivo", async () => {
    await writeConfigFile(temp.path, {
      cities: [OTTAWA],
      defaultCity: OTTAWA,
      unit: "fahrenheit",
    });

    expect(await loadConfig()).toEqual({
      cities: [OTTAWA],
      defaultCity: OTTAWA,
      unit: "fahrenheit",
    });
  });
});

describe("saveConfig", () => {
  test("crea los directorios necesarios y escribe JSON con salto de línea final", async () => {
    const nestedPath = join(temp.dir, "a", "b", "config.json");
    Bun.env.WEATHER_CLI_CONFIG = nestedPath;
    const config = { defaultCity: OTTAWA, cities: [OTTAWA], unit: "celsius" as const };

    await saveConfig(config);

    const raw = await Bun.file(nestedPath).text();
    expect(raw).toBe(`${JSON.stringify(config, null, 2)}\n`);
  });

  test("no deja el archivo temporal después de escribir", async () => {
    await saveConfig({ defaultCity: null, cities: [], unit: "celsius" });

    expect(await Bun.file(`${temp.path}.tmp`).exists()).toBe(false);
  });

  test("permite guardar y volver a cargar la misma config", async () => {
    const config = { defaultCity: MADRID, cities: [OTTAWA, MADRID], unit: "fahrenheit" as const };

    await saveConfig(config);

    expect(await readConfigFile(temp.path)).toEqual(config);
    expect(await loadConfig()).toEqual(config);
  });
});
