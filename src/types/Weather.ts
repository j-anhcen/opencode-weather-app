export type CurrentWeather = {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  temperatureUnit: string;
  windSpeedUnit: string;
};

export type DailyForecast = {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number | null;
  temperatureUnit: string;
};
