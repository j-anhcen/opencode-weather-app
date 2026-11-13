import { afterEach, describe, expect, test } from "bun:test";
import { renderMenu, runMenu } from "../../../src/presentation/menu.ts";
import type { Config } from "../../../src/types/Config.ts";
import { captureLogs, captureStdout, stripAnsi } from "../../helpers/capture.ts";
import { MADRID, OTTAWA, makeConfig } from "../../helpers/fixtures.ts";
import { pendingInput, queueInput, resetInputQueue } from "../../helpers/readlineMock.ts";

afterEach(() => {
  resetInputQueue();
});

async function runWithCapture(config: Config) {
  const logs = captureLogs();
  const stdout = captureStdout();

  try {
    await runMenu(config);
  } finally {
    logs.restore();
    stdout.restore();
  }

  return {
    logs: logs.logs.join("\n"),
    writes: stdout.writes.join(""),
  };
}

describe("renderMenu", () => {
  test("incluye el título, las 9 opciones y el ancho configurado", () => {
    const text = stripAnsi(renderMenu(makeConfig()));
    const lines = text.split("\n");

    expect(text).toContain("WEATHER CLI");
    expect(text).toContain("1. Clima de ciudad default");
    expect(text).toContain("2. Clima de todas las ciudades (0)");
    expect(text).toContain("3. Buscar y agregar ciudad");
    expect(text).toContain("4. Eliminar ciudad");
    expect(text).toContain("5. Establecer ciudad default");
    expect(text).toContain("6. Pronóstico 7 días (default)");
    expect(text).toContain("7. Pronóstico 7 días (todas)");
    expect(text).toContain("8. Ajustes (°C)");
    expect(text).toContain("9. Salir");
    expect(lines).toHaveLength(13);
    expect(lines[0]).toBe("═".repeat(40));
    expect(lines.at(-1)).toBe("═".repeat(40));
  });

  test("actualiza las etiquetas dinámicas con la config", () => {
    const text = stripAnsi(
      renderMenu(makeConfig({ cities: [OTTAWA, MADRID], unit: "fahrenheit" })),
    );

    expect(text).toContain("2. Clima de todas las ciudades (2)");
    expect(text).toContain("8. Ajustes (°F)");
  });
});

describe("runMenu", () => {
  test("sale con la opción 9", async () => {
    queueInput("9");

    const result = await runWithCapture(makeConfig());

    expect(result.logs).toContain("WEATHER CLI");
    expect(result.writes).toContain("Selecciona una opción:");
    expect(pendingInput()).toBe(0);
  });

  test("sale cuando la entrada termina (EOF)", async () => {
    const result = await runWithCapture(makeConfig());

    expect(result.writes).toContain("Selecciona una opción:");
    expect(pendingInput()).toBe(0);
  });

  test("reintenta después de una opción inválida", async () => {
    queueInput("99", "9");

    const result = await runWithCapture(makeConfig());

    expect(result.logs).toContain("Opción no válida. Intenta de nuevo.");
    expect(pendingInput()).toBe(0);
  });

  test("ejecuta la acción y espera Enter para volver al menú", async () => {
    queueInput("2", "", "9");

    const result = await runWithCapture(makeConfig());

    expect(result.logs).toContain("No hay ciudades guardadas.");
    expect(result.writes).toContain("Presiona Enter para volver al menú...");
    expect(pendingInput()).toBe(0);
  });

  test("sale si la pausa recibe EOF", async () => {
    queueInput("2");

    const result = await runWithCapture(makeConfig());

    expect(result.logs).toContain("No hay ciudades guardadas.");
    expect(result.writes).toContain("Presiona Enter para volver al menú...");
    expect(pendingInput()).toBe(0);
  });
});
