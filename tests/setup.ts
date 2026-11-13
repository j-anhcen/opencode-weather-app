import { mock } from "bun:test";
import { createReadlineMock } from "./helpers/readlineMock.ts";

// Se ejecuta antes que cualquier archivo de test (ver bunfig.toml).
// Así `presentation/input.ts` usa una cola controlada por los tests en vez
// de process.stdin, sin abrir el readline real.
mock.module("node:readline", () => ({
  createInterface: createReadlineMock,
}));

// Salida estable: los tests que verifican colores activan FORCE_COLOR ellos mismos.
Bun.env.FORCE_COLOR = "0";
