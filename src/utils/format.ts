import type { City } from "../types/City.ts";
import type { Unit } from "../types/Config.ts";
import { WEEKDAYS } from "./constants.ts";

export function unitLabel(unit: Unit): string {
  return unit === "fahrenheit" ? "°F" : "°C";
}

export function cityLabel(city: City): string {
  return city.country ? `${city.name}, ${city.country}` : city.name;
}

export function center(text: string, width: number): string {
  if (text.length >= width) return text;

  const left = Math.floor((width - text.length) / 2);
  const right = width - text.length - left;

  return `${" ".repeat(left)}${text}${" ".repeat(right)}`;
}

export function forecastDayLabel(date: string, isToday: boolean): string {
  if (isToday) return "hoy";

  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;

  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday ?? ""} ${day}`;
}
