<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Daily forecast for the venue, from Open-Meteo.
 *
 * Open-Meteo needs no API key and no account, so there is nothing to configure
 * beyond the coordinates in config/services.php. The forecast reaches 16 days
 * ahead — calendar days outside that window simply render without weather.
 *
 * Weather is decoration on top of the booking calendar, so every failure path
 * returns an empty array rather than throwing: a weather outage must never take
 * the calendar down with it.
 */
class WeatherService
{
    private const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

    private const FORECAST_DAYS = 16;

    /**
     * Hourly is deliberately shorter than daily: hour-by-hour forecasts past a
     * week carry little skill, and it keeps the payload on the booking grid small.
     */
    private const HOURLY_FORECAST_DAYS = 7;

    private const CACHE_MINUTES = 120;

    private const TIMEOUT_SECONDS = 6;

    /**
     * WMO weather codes collapsed into the handful of conditions the calendar
     * actually draws. Codes not listed here fall back to 'cloudy'.
     *
     * @var array<int, array{0: string, 1: string}>
     */
    private const CONDITIONS = [
        0 => ['clear', 'Clear sky'],
        1 => ['clear', 'Mainly clear'],
        2 => ['partly', 'Partly cloudy'],
        3 => ['cloudy', 'Overcast'],
        45 => ['fog', 'Fog'],
        48 => ['fog', 'Rime fog'],
        51 => ['drizzle', 'Light drizzle'],
        53 => ['drizzle', 'Drizzle'],
        55 => ['drizzle', 'Heavy drizzle'],
        56 => ['drizzle', 'Freezing drizzle'],
        57 => ['drizzle', 'Freezing drizzle'],
        61 => ['rain', 'Light rain'],
        63 => ['rain', 'Rain'],
        65 => ['rain', 'Heavy rain'],
        66 => ['rain', 'Freezing rain'],
        67 => ['rain', 'Freezing rain'],
        71 => ['snow', 'Light snow'],
        73 => ['snow', 'Snow'],
        75 => ['snow', 'Heavy snow'],
        77 => ['snow', 'Snow grains'],
        80 => ['showers', 'Light showers'],
        81 => ['showers', 'Showers'],
        82 => ['showers', 'Violent showers'],
        85 => ['snow', 'Snow showers'],
        86 => ['snow', 'Snow showers'],
        95 => ['storm', 'Thunderstorm'],
        96 => ['storm', 'Thunderstorm with hail'],
        99 => ['storm', 'Thunderstorm with hail'],
    ];

    /**
     * Forecast keyed by Y-m-d.
     *
     * @return array<string, array{icon: string, label: string, max: float, min: float, precipitation: int}>
     */
    public function dailyForecast(): array
    {
        $latitude = config('services.weather.latitude');
        $longitude = config('services.weather.longitude');

        if ($latitude === null || $longitude === null) {
            return [];
        }

        $cacheKey = "weather:daily:{$latitude},{$longitude}";
        $cached = Cache::get($cacheKey);

        if ($cached !== null) {
            return $cached;
        }

        $forecast = $this->fetch((float) $latitude, (float) $longitude);

        // Only cache successes — caching an outage would blank the calendar's
        // weather for the full TTL even after the API recovers.
        if ($forecast !== []) {
            Cache::put($cacheKey, $forecast, now()->addMinutes(self::CACHE_MINUTES));
        }

        return $forecast;
    }

    /**
     * Forecast keyed by "Y-m-d H:00", for lining hourly booking slots up with
     * the weather at that hour.
     *
     * @return array<string, array{icon: string, label: string, temp: float, precipitation: int}>
     */
    public function hourlyForecast(): array
    {
        $latitude = config('services.weather.latitude');
        $longitude = config('services.weather.longitude');

        if ($latitude === null || $longitude === null) {
            return [];
        }

        $cacheKey = "weather:hourly:{$latitude},{$longitude}";
        $cached = Cache::get($cacheKey);

        if ($cached !== null) {
            return $cached;
        }

        $forecast = $this->fetchHourly((float) $latitude, (float) $longitude);

        if ($forecast !== []) {
            Cache::put($cacheKey, $forecast, now()->addMinutes(self::CACHE_MINUTES));
        }

        return $forecast;
    }

    /**
     * @return array<string, array{icon: string, label: string, temp: float, precipitation: int}>
     */
    private function fetchHourly(float $latitude, float $longitude): array
    {
        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->retry(2, 200)
                ->get(self::ENDPOINT, [
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'hourly' => 'weather_code,temperature_2m,precipitation_probability',
                    'timezone' => config('services.weather.timezone', 'auto'),
                    'forecast_days' => self::HOURLY_FORECAST_DAYS,
                ]);

            if ($response->failed()) {
                Log::warning('weather.hourly.failed', ['status' => $response->status()]);

                return [];
            }

            $hourly = $response->json('hourly');
        } catch (\Throwable $e) {
            Log::warning('weather.hourly.error', ['message' => $e->getMessage()]);

            return [];
        }

        if (! is_array($hourly) || ! isset($hourly['time']) || ! is_array($hourly['time'])) {
            return [];
        }

        $forecast = [];

        foreach ($hourly['time'] as $index => $timestamp) {
            $code = (int) ($hourly['weather_code'][$index] ?? -1);
            [$icon, $label] = self::CONDITIONS[$code] ?? ['cloudy', 'Cloudy'];

            // Open-Meteo returns "2026-09-04T18:00"; key on "2026-09-04 18:00"
            // so the frontend can build the same key from a slot time.
            $forecast[str_replace('T', ' ', (string) $timestamp)] = [
                'icon' => $icon,
                'label' => $label,
                'temp' => round((float) ($hourly['temperature_2m'][$index] ?? 0)),
                'precipitation' => (int) ($hourly['precipitation_probability'][$index] ?? 0),
            ];
        }

        return $forecast;
    }

    /**
     * @return array<string, array{icon: string, label: string, max: float, min: float, precipitation: int}>
     */
    private function fetch(float $latitude, float $longitude): array
    {
        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->retry(2, 200)
                ->get(self::ENDPOINT, [
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'daily' => 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
                    'timezone' => config('services.weather.timezone', 'auto'),
                    'forecast_days' => self::FORECAST_DAYS,
                ]);

            if ($response->failed()) {
                Log::warning('weather.fetch.failed', ['status' => $response->status()]);

                return [];
            }

            $daily = $response->json('daily');
        } catch (\Throwable $e) {
            Log::warning('weather.fetch.error', ['message' => $e->getMessage()]);

            return [];
        }

        if (! is_array($daily) || ! isset($daily['time']) || ! is_array($daily['time'])) {
            return [];
        }

        $forecast = [];

        foreach ($daily['time'] as $index => $date) {
            $code = (int) ($daily['weather_code'][$index] ?? -1);
            [$icon, $label] = self::CONDITIONS[$code] ?? ['cloudy', 'Cloudy'];

            $forecast[$date] = [
                'icon' => $icon,
                'label' => $label,
                'max' => round((float) ($daily['temperature_2m_max'][$index] ?? 0)),
                'min' => round((float) ($daily['temperature_2m_min'][$index] ?? 0)),
                'precipitation' => (int) ($daily['precipitation_probability_max'][$index] ?? 0),
            ];
        }

        return $forecast;
    }
}
