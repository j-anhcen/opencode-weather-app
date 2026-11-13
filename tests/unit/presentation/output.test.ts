import { describe, expect, test } from "bun:test";
import {
  printError,
  renderCityList,
  renderForecastCard,
  renderSettings,
  renderWeatherCard,
} from "../../../src/presentation/output.ts";
import {
  CURRENT_WEATHER,
  DAILY_FORECAST,
  MADRID,
  OTTAWA,
  makeConfig,
} from "../../helpers/fixtures.ts";
import { captureLogs, stripAnsi } from "../../helpers/capture.ts";

describe("renderSettings", () => {
  test("marca celsius como la unidad actual", () => {
    const text = stripAnsi(renderSettings(makeConfig({ unit: "celsius" })));

    expect(text).toContain("AJUSTES");
    expect(text).toContain("1. Celsius (°C)  ← actual");
    expect(text).toContain("2. Fahrenheit (°F)\n");
    expect(text).toContain("3. Volver");
  });

  test("marca fahrenheit como la unidad actual", () => {
    const text = stripAnsi(renderSettings(makeConfig({ unit: "fahrenheit" })));

    expect(text).toContain("2. Fahrenheit (°F)  ← actual");
    expect(text).toContain("1. Celsius (°C)\n");
  });
});

describe("renderCityList", () => {
  test("numera las ciudades y marca la default", () => {
    const text = stripAnsi(renderCityList([OTTAWA, MADRID], OTTAWA));

    expect(text.split("\n")).toEqual([
      "  1. Ottawa, Canadá (default)",
      "  2. Madrid, España",
    ]);
  });

  test("no marca ninguna ciudad cuando no hay default", () => {
    const text = stripAnsi(renderCityList([OTTAWA], null));

    expect(text).toBe("  1. Ottawa, Canadá");
  });

  test("devuelve una cadena vacía sin ciudades", () => {
    expect(renderCityList([], null)).toBe("");
  });
});

describe("renderWeatherCard", () => {
  test("redondea los valores y muestra las unidades", () => {
    const text = stripAnsi(renderWeatherCard(OTTAWA, CURRENT_WEATHER));

    expect(text).toContain("Ottawa, Canadá");
    expect(text).toContain("Temperatura: 13°C");
    expect(text).toContain("Sensación: 11°C");
    expect(text).toContain("Humedad: 65 %");
    expect(text).toContain("Viento: 12 km/h");
  });

  test("respeta las unidades imperiales", () => {
    const text = stripAnsi(
      renderWeatherCard(MADRID, {
        ...CURRENT_WEATHER,
        temperatureUnit: "°F",
        windSpeedUnit: "mp/h",
      }),
    );

    expect(text).toContain("Temperatura: 13°F");
    expect(text).toContain("Viento: 12 mp/h");
  });
});

describe("renderForecastCard", () => {
  test("muestra la cabecera con unidad, el día de hoy y la lluvia", () => {
    const text = stripAnsi(renderForecastCard(OTTAWA, DAILY_FORECAST));

    expect(text).toContain("Ottawa, Canadá");
    expect(text).toContain("Máx/Mín (°C)");
    expect(text).toContain("Lluvia");
    expect(text).toContain("hoy");
    expect(text).toContain("sáb 14");
    expect(text).toContain("14°/6°");
    expect(text).toContain("13°/4°");
    expect(text).toContain("20%");
    expect(text).toContain("—");
  });

  test("omite la unidad en la cabecera si no hay días", () => {
    const text = stripAnsi(renderForecastCard(OTTAWA, []));

    expect(text).toContain("Máx/Mín");
    expect(text).not.toContain("Máx/Mín (");
  });
});

describe("printError", () => {
  test("muestra el mensaje de un Error", () => {
    const capture = captureLogs();

    try {
      printError(new Error("algo falló"));
    } finally {
      capture.restore();
    }

    expect(capture.logs.join("\n")).toContain("algo falló");
  });

  test("muestra un mensaje genérico para valores que no son Error", () => {
    const capture = captureLogs();

    try {
      printError("algo falló");
    } finally {
      capture.restore();
    }

    expect(capture.logs.join("\n")).toContain("Ocurrió un error inesperado.");
  });
});
