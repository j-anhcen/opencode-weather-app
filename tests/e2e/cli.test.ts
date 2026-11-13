import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stripAnsi } from "../helpers/capture.ts";
import { MADRID, OTTAWA } from "../helpers/fixtures.ts";
import { readConfigFile, writeConfigFile } from "../helpers/tempConfig.ts";

const ROOT = join(import.meta.dir, "..", "..");
const TIMEOUT_MS = 15_000;

let dir: string;
let configPath: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "weather-cli-e2e-"));
  configPath = join(dir, "config.json");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

type RunResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

async function runCli(input: string): Promise<RunResult> {
  const proc = Bun.spawn(["bun", "src/index.ts"], {
    cwd: ROOT,
    env: { ...Bun.env, WEATHER_CLI_CONFIG: configPath, FORCE_COLOR: "0" },
    stdin: new Blob([input]),
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { stdout: stripAnsi(stdout), stderr: stripAnsi(stderr), exitCode };
}

describe("CLI", () => {
  test(
    "muestra el menú completo y sale con la opción 9",
    async () => {
      const result = await runCli("9\n");

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("WEATHER CLI");
      expect(result.stdout).toContain("1. Clima de ciudad default");
      expect(result.stdout).toContain("2. Clima de todas las ciudades (0)");
      expect(result.stdout).toContain("8. Ajustes (°C)");
      expect(result.stdout).toContain("9. Salir");
      expect(result.stdout).toContain("Selecciona una opción:");
    },
    TIMEOUT_MS,
  );

  test(
    "avisa de una opción inválida y sigue en el menú",
    async () => {
      const result = await runCli("abc\n9\n");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Opción no válida. Intenta de nuevo.");
    },
    TIMEOUT_MS,
  );

  test(
    "opción 1 sin ciudad default no llama a la API",
    async () => {
      const result = await runCli("1\n\n9\n");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("No hay una ciudad default.");
    },
    TIMEOUT_MS,
  );

  test(
    "opción 2 sin ciudades guardadas",
    async () => {
      const result = await runCli("2\n\n9\n");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("No hay ciudades guardadas. Agrega una con la opción 3.");
    },
    TIMEOUT_MS,
  );

  test(
    "opción 6 sin ciudad default",
    async () => {
      const result = await runCli("6\n\n9\n");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("No hay una ciudad default.");
    },
    TIMEOUT_MS,
  );

  test(
    "opción 3 con nombre vacío no llama a la API",
    async () => {
      const result = await runCli("3\n\n\n9\n");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Debes ingresar el nombre de una ciudad.");
    },
    TIMEOUT_MS,
  );

  test(
    "opción 8 cambia la unidad y la persiste",
    async () => {
      const result = await runCli("8\n2\n\n9\n");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("AJUSTES");
      expect(result.stdout).toContain("Unidad actualizada a °F.");
      expect(await readConfigFile(configPath)).toMatchObject({ unit: "fahrenheit" });
    },
    TIMEOUT_MS,
  );

  test(
    "opción 4 elimina una ciudad de la config guardada",
    async () => {
      await writeConfigFile(configPath, {
        defaultCity: OTTAWA,
        cities: [OTTAWA, MADRID],
        unit: "celsius",
      });

      const result = await runCli("4\n1\n\n9\n");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Ottawa, Canadá eliminada.");
      expect(await readConfigFile(configPath)).toEqual({
        defaultCity: null,
        cities: [MADRID],
        unit: "celsius",
      });
    },
    TIMEOUT_MS,
  );

  test(
    "opción 5 establece y persiste la ciudad default",
    async () => {
      await writeConfigFile(configPath, {
        defaultCity: OTTAWA,
        cities: [OTTAWA, MADRID],
        unit: "celsius",
      });

      const result = await runCli("5\n2\n\n9\n");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Madrid, España es ahora la ciudad default.");
      expect(await readConfigFile(configPath)).toMatchObject({ defaultCity: MADRID });
    },
    TIMEOUT_MS,
  );

  test(
    "un config corrupto no impide arrancar",
    async () => {
      await writeConfigFile(configPath, "{ esto no es json");

      const result = await runCli("1\n\n9\n");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("No hay una ciudad default.");
    },
    TIMEOUT_MS,
  );
});
