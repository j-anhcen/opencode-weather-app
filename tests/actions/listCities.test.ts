import { describe, expect, test } from "bun:test";
import { listCities } from "../../src/actions/listCities.ts";
import { captureLogs } from "../helpers/capture.ts";
import { MADRID, OTTAWA, makeConfig } from "../helpers/fixtures.ts";

describe("listCities", () => {
  test("muestra las ciudades numeradas y marca la default", () => {
    const capture = captureLogs();

    try {
      listCities(makeConfig({ defaultCity: MADRID, cities: [OTTAWA, MADRID] }));
    } finally {
      capture.restore();
    }

    const text = capture.logs.join("\n");
    expect(text).toContain("1. Ottawa, Canadá");
    expect(text).toContain("2. Madrid, España (default)");
  });

  test("no imprime nada cuando no hay ciudades", () => {
    const capture = captureLogs();

    try {
      listCities(makeConfig());
    } finally {
      capture.restore();
    }

    expect(capture.logs.join("\n").trim()).toBe("");
  });
});
