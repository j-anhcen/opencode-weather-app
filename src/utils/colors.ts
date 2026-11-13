const RESET = "\x1b[0m";

type ColorName = "cyan" | "yellow" | "green" | "red";

const CODES: Record<ColorName, number> = {
  cyan: 36,
  yellow: 33,
  green: 32,
  red: 31,
};

function colorsEnabled(): boolean {
  const force = Bun.env.FORCE_COLOR;
  if (force !== undefined) return force !== "0";

  if (Bun.env.NO_COLOR !== undefined) return false;
  if (Bun.env.TERM === "dumb") return false;

  return process.stdout.isTTY === true;
}

function paint(text: string, color: ColorName): string {
  return colorsEnabled() ? `\x1b[${CODES[color]}m${text}${RESET}` : text;
}

export function cyan(text: string): string {
  return paint(text, "cyan");
}

export function yellow(text: string): string {
  return paint(text, "yellow");
}

export function green(text: string): string {
  return paint(text, "green");
}

export function red(text: string): string {
  return paint(text, "red");
}
