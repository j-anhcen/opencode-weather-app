import type { City } from "./City.ts";

export type Unit = "celsius" | "fahrenheit";

export type Config = {
  defaultCity: City | null;
  cities: City[];
  unit: Unit;
};
