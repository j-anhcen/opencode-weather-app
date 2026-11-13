import { createInterface } from "node:readline";
import { red } from "../utils/colors.ts";

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const lines = readline[Symbol.asyncIterator]();

export function closeInput(): void {
  readline.close();
}

export async function ask(question: string): Promise<string | null> {
  process.stdout.write(question);

  const { value, done } = await lines.next();
  if (done) {
    process.stdout.write("\n");
    return null;
  }

  return value.trim();
}

export async function askNumber(
  question: string,
  max: number,
): Promise<number | null> {
  while (true) {
    const answer = await ask(question);
    if (answer === null) return null;

    const value = Number(answer);
    if (Number.isInteger(value) && value >= 1 && value <= max) return value - 1;

    console.log(red(`  Opción no válida. Ingresa un número entre 1 y ${max}.`));
  }
}
