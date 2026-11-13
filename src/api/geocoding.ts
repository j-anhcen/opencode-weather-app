import type { City } from "../types/City.ts";
import { GEOCODING_URL } from "../utils/constants.ts";
import { fetchJson } from "./client.ts";

type GeocodingResponse = {
  results?: Array<{
    name?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    country?: unknown;
    admin1?: unknown;
  }>;
};

export function buildGeocodingUrl(name: string): string {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", name);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");
  return url.toString();
}

export async function geocodeCity(name: string): Promise<City | null> {
  const data = await fetchJson<GeocodingResponse>(buildGeocodingUrl(name));
  const result = data.results?.[0];

  if (!result) return null;

  const { latitude, longitude, country, admin1 } = result;
  if (typeof result.name !== "string" || result.name.trim() === "") return null;
  if (typeof latitude !== "number" || !Number.isFinite(latitude)) return null;
  if (typeof longitude !== "number" || !Number.isFinite(longitude)) return null;

  return {
    name: result.name.trim(),
    latitude,
    longitude,
    ...(typeof country === "string" && country.trim() !== ""
      ? { country: country.trim() }
      : {}),
    ...(typeof admin1 === "string" && admin1.trim() !== ""
      ? { admin1: admin1.trim() }
      : {}),
  };
}
