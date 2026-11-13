import { describe, expect, test } from "bun:test";
import {
  addCity,
  cityKey,
  normalizeCity,
  removeCity,
} from "../../../src/storage/citiesStorage.ts";
import { MADRID, OTTAWA, makeConfig } from "../../helpers/fixtures.ts";

describe("cityKey", () => {
  test("redondea las coordenadas a 4 decimales", () => {
    expect(cityKey(OTTAWA)).toBe("45.4112,-75.6981");
  });

  test("considera iguales coordenadas con diferencias menores al redondeo", () => {
    expect(cityKey({ ...OTTAWA, latitude: 45.411171 })).toBe(
      cityKey({ ...OTTAWA, latitude: 45.411169 }),
    );
  });
});

describe("normalizeCity", () => {
  test("rechaza valores que no son objetos", () => {
    expect(normalizeCity(null)).toBeNull();
    expect(normalizeCity(undefined)).toBeNull();
    expect(normalizeCity("Ottawa")).toBeNull();
    expect(normalizeCity(42)).toBeNull();
  });

  test("rechaza objetos sin nombre válido", () => {
    expect(normalizeCity({ latitude: 45, longitude: -75 })).toBeNull();
    expect(normalizeCity({ name: "   ", latitude: 45, longitude: -75 })).toBeNull();
    expect(normalizeCity({ name: 12, latitude: 45, longitude: -75 })).toBeNull();
  });

  test("rechaza coordenadas inválidas", () => {
    expect(normalizeCity({ name: "X", latitude: "45", longitude: -75 })).toBeNull();
    expect(normalizeCity({ name: "X", latitude: 45, longitude: Number.NaN })).toBeNull();
    expect(normalizeCity({ name: "X", latitude: Number.POSITIVE_INFINITY, longitude: -75 })).toBeNull();
    expect(normalizeCity({ name: "X", latitude: 45 })).toBeNull();
  });

  test("recorta nombre, país y provincia", () => {
    expect(
      normalizeCity({
        name: "  Ottawa  ",
        latitude: 45.4,
        longitude: -75.7,
        country: "  Canadá ",
        admin1: " Ontario ",
      }),
    ).toEqual({
      name: "Ottawa",
      latitude: 45.4,
      longitude: -75.7,
      country: "Canadá",
      admin1: "Ontario",
    });
  });

  test("omite país y provincia vacíos o no textuales", () => {
    const city = normalizeCity({
      name: "Ottawa",
      latitude: 45.4,
      longitude: -75.7,
      country: "  ",
      admin1: 7,
    });

    expect(city).toEqual({ name: "Ottawa", latitude: 45.4, longitude: -75.7 });
    expect(city).not.toHaveProperty("country");
    expect(city).not.toHaveProperty("admin1");
  });
});

describe("addCity", () => {
  test("agrega la ciudad y la vuelve default si no había default", () => {
    const config = makeConfig();

    expect(addCity(config, OTTAWA)).toBe(true);
    expect(config.cities).toEqual([OTTAWA]);
    expect(config.defaultCity).toEqual(OTTAWA);
  });

  test("no reemplaza el default existente", () => {
    const config = makeConfig({ defaultCity: MADRID, cities: [MADRID] });

    expect(addCity(config, OTTAWA)).toBe(true);
    expect(config.defaultCity).toEqual(MADRID);
    expect(config.cities).toEqual([MADRID, OTTAWA]);
  });

  test("rechaza duplicados por coordenadas", () => {
    const config = makeConfig({ cities: [OTTAWA] });
    const duplicate = { ...OTTAWA, name: "Ottawa (otra vez)", latitude: 45.411171 };

    expect(addCity(config, duplicate)).toBe(false);
    expect(config.cities).toHaveLength(1);
  });
});

describe("removeCity", () => {
  test("devuelve false si la ciudad no existe", () => {
    const config = makeConfig({ cities: [OTTAWA] });

    expect(removeCity(config, MADRID)).toBe(false);
    expect(config.cities).toEqual([OTTAWA]);
  });

  test("elimina la ciudad y limpia el default si era la default", () => {
    const config = makeConfig({ defaultCity: OTTAWA, cities: [OTTAWA, MADRID] });

    expect(removeCity(config, OTTAWA)).toBe(true);
    expect(config.cities).toEqual([MADRID]);
    expect(config.defaultCity).toBeNull();
  });

  test("mantiene el default si se elimina otra ciudad", () => {
    const config = makeConfig({ defaultCity: OTTAWA, cities: [OTTAWA, MADRID] });

    expect(removeCity(config, MADRID)).toBe(true);
    expect(config.defaultCity).toEqual(OTTAWA);
    expect(config.cities).toEqual([OTTAWA]);
  });
});
