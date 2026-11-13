import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cyan, green, red, yellow } from "../../../src/utils/colors.ts";

const ENV_KEYS = ["FORCE_COLOR", "NO_COLOR", "TERM"] as const;

let originalEnv: Record<string, string | undefined>;

beforeEach(() => {
  originalEnv = {};
  for (const key of ENV_KEYS) {
    originalEnv[key] = Bun.env[key];
    delete Bun.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete Bun.env[key];
    } else {
      Bun.env[key] = value;
    }
  }
});

describe("colores", () => {
  test("aplica los códigos ANSI cuando FORCE_COLOR=1", () => {
    Bun.env.FORCE_COLOR = "1";

    expect(cyan("x")).toBe("\x1b[36mx\x1b[0m");
    expect(yellow("x")).toBe("\x1b[33mx\x1b[0m");
    expect(green("x")).toBe("\x1b[32mx\x1b[0m");
    expect(red("x")).toBe("\x1b[31mx\x1b[0m");
  });

  test("no aplica colores cuando FORCE_COLOR=0", () => {
    Bun.env.FORCE_COLOR = "0";

    expect(cyan("x")).toBe("x");
    expect(red("x")).toBe("x");
  });

  test("no aplica colores cuando NO_COLOR está definido", () => {
    Bun.env.NO_COLOR = "1";

    expect(yellow("x")).toBe("x");
  });

  test("no aplica colores cuando TERM=dumb", () => {
    Bun.env.TERM = "dumb";

    expect(green("x")).toBe("x");
  });

  test("depende de TTY cuando no hay variables de entorno", () => {
    if (process.stdout.isTTY === true) {
      expect(red("x")).toBe("\x1b[31mx\x1b[0m");
    } else {
      expect(red("x")).toBe("x");
    }
  });
});
