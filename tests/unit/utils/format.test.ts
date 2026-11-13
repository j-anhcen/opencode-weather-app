import { describe, expect, test } from "bun:test";
import { center, cityLabel, forecastDayLabel, unitLabel } from "../../../src/utils/format.ts";
import { OTTAWA } from "../../helpers/fixtures.ts";

describe("unitLabel", () => {
  test("devuelve °C para celsius", () => {
    expect(unitLabel("celsius")).toBe("°C");
  });

  test("devuelve °F para fahrenheit", () => {
    expect(unitLabel("fahrenheit")).toBe("°F");
  });
});

describe("cityLabel", () => {
  test("incluye el país cuando existe", () => {
    expect(cityLabel(OTTAWA)).toBe("Ottawa, Canadá");
  });

  test("solo muestra el nombre cuando no hay país", () => {
    expect(cityLabel({ name: "Ottawa", latitude: 45, longitude: -75 })).toBe("Ottawa");
  });
});

describe("center", () => {
  test("centra con diferencia par", () => {
    expect(center("abc", 9)).toBe("   abc   ");
  });

  test("centra con diferencia impar", () => {
    expect(center("abc", 8)).toBe("  abc   ");
  });

  test("devuelve el texto intacto si ya ocupa el ancho", () => {
    expect(center("abcdef", 6)).toBe("abcdef");
  });

  test("devuelve el texto intacto si es más ancho que el ancho", () => {
    expect(center("abcdefghij", 4)).toBe("abcdefghij");
  });
});

describe("forecastDayLabel", () => {
  test("usa 'hoy' para el primer día", () => {
    expect(forecastDayLabel("2026-11-13", true)).toBe("hoy");
  });

  test("calcula el día de la semana en UTC", () => {
    expect(forecastDayLabel("2026-11-13", false)).toBe("vie 13");
    expect(forecastDayLabel("2026-11-14", false)).toBe("sáb 14");
    expect(forecastDayLabel("2026-11-15", false)).toBe("dom 15");
  });

  test("devuelve la fecha original si no se puede interpretar", () => {
    expect(forecastDayLabel("abc", false)).toBe("abc");
    expect(forecastDayLabel("2026-00-10", false)).toBe("2026-00-10");
    expect(forecastDayLabel("", false)).toBe("");
  });
});
