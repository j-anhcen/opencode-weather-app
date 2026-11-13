import { afterEach, describe, expect, test } from "bun:test";
import { ask, askNumber, closeInput } from "../../../src/presentation/input.ts";
import { captureLogs, captureStdout } from "../../helpers/capture.ts";
import {
  closeCallCount,
  queueInput,
  resetCloseCalls,
  resetInputQueue,
} from "../../helpers/readlineMock.ts";

afterEach(() => {
  resetInputQueue();
  resetCloseCalls();
});

describe("closeInput", () => {
  test("cierra la interfaz de lectura", () => {
    closeInput();

    expect(closeCallCount()).toBe(1);
  });
});

describe("ask", () => {
  test("escribe la pregunta y recorta la respuesta", async () => {
    queueInput("  hola  ");
    const stdout = captureStdout();

    let answer: string | null;
    try {
      answer = await ask("> ");
    } finally {
      stdout.restore();
    }

    expect(answer).toBe("hola");
    expect(stdout.writes.join("")).toContain("> ");
  });

  test("devuelve null y escribe un salto de línea al llegar a EOF", async () => {
    const stdout = captureStdout();

    let answer: string | null;
    try {
      answer = await ask("> ");
    } finally {
      stdout.restore();
    }

    expect(answer).toBeNull();
    expect(stdout.writes.join("")).toBe("> \n");
  });
});

describe("askNumber", () => {
  test("devuelve el índice base 0 de una opción válida", async () => {
    queueInput("2");
    const stdout = captureStdout();

    let result: number | null;
    try {
      result = await askNumber("> ", 3);
    } finally {
      stdout.restore();
    }

    expect(result).toBe(1);
  });

  test("acepta el primer y el último valor del rango", async () => {
    queueInput("1");
    const stdout = captureStdout();

    try {
      expect(await askNumber("> ", 1)).toBe(0);
      queueInput("3");
      expect(await askNumber("> ", 3)).toBe(2);
    } finally {
      stdout.restore();
    }
  });

  test("reintenta con valores fuera de rango, decimales o texto", async () => {
    queueInput("0", "4", "1.5", "abc", "2");
    const capture = captureLogs();
    const stdout = captureStdout();

    let result: number | null;
    try {
      result = await askNumber("> ", 3);
    } finally {
      capture.restore();
      stdout.restore();
    }

    expect(result).toBe(1);
    expect(capture.logs).toHaveLength(4);
    for (const line of capture.logs) {
      expect(line).toContain("Opción no válida. Ingresa un número entre 1 y 3.");
    }
  });

  test("devuelve null si la entrada termina", async () => {
    const stdout = captureStdout();

    let result: number | null;
    try {
      result = await askNumber("> ", 3);
    } finally {
      stdout.restore();
    }

    expect(result).toBeNull();
  });
});
