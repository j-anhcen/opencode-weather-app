import { spyOn } from "bun:test";

export type LogCapture = {
  logs: string[];
  restore: () => void;
};

const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, "");
}

/** Captura console.log y expone las líneas ya sin códigos ANSI. */
export function captureLogs(): LogCapture {
  const logs: string[] = [];
  const spy = spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(stripAnsi(args.map((arg) => String(arg)).join(" ")));
  });

  return {
    logs,
    restore: () => spy.mockRestore(),
  };
}

export type StdoutCapture = {
  writes: string[];
  restore: () => void;
};

/** Captura lo que se escribe en stdout (p. ej. las preguntas de `ask`). */
export function captureStdout(): StdoutCapture {
  const writes: string[] = [];
  const spy = spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
    writes.push(typeof chunk === "string" ? chunk : String(chunk));
    return true;
  });

  return {
    writes,
    restore: () => spy.mockRestore(),
  };
}

export function output(logs: string[]): string {
  return logs.join("\n");
}
