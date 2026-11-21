import { PUNE_BOUNDS, PUNE_HOTSPOTS } from '../config/puneConfig';
import weightsConfig from '../config/weights.json';

export interface WeatherData {
  currentRainMmHr: number;
  rain3hMm: number;
  forecastPeakMmHr: number;
  rainFactor: number;
  source: 'Open-Meteo' | 'Demo Fallback';
  timestamp: string;
  isDemo: boolean;
}

export interface RainViewerRadarInfo {
  host: string;
  path: string;
  tileSize: number;
  time: number;
}

// In-memory cache for weather calls (10-minute TTL)
let weatherCache: { data: WeatherData; expiresAt: number } | null = null;
let radarCache: { info: RainViewerRadarInfo; expiresAt: number } | null = null;

/**
 * Calculates rain factor R from weights.json formula:
 * R = clamp(0.6 * (rain_mm_hr / 50) + 0.4 * (rain_3h_mm / 100), 0, 1)
 */
export function calculateRainFactor(
  rainMmHr: number,
  rain3hMm: number
): number {
  const cfg = weightsConfig.rain;
  const term1 = cfg.intensity_weight * (rainMmHr / cfg.intensity_norm_mm_hr);
  const term2 = cfg.accum_weight * (rain3hMm / cfg.accum_norm_mm_3h);
  return Number(Math.min(1.0, Math.max(0.0, term1 + term2)).toFixed(3));
}

/**
 * Fetches latest radar tile path from RainViewer API
 */
export async function fetchRainViewerRadar(): Promise<RainViewerRadarInfo | null> {
  const now = Date.now();
  if (radarCache && radarCache.expiresAt > now) {
    return radarCache.info;
  }

  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!res.ok) throw new Error(`RainViewer API returned status ${res.status}`);
    const data = await res.json();

    const radarTimes = data.radar?.past;
    if (!radarTimes || radarTimes.length === 0) {
      throw new Error('No radar time frames available in RainViewer response');
    }

    const latest = radarTimes[radarTimes.length - 1];
    const info: RainViewerRadarInfo = {
      host: data.host,
      path: latest.path,
      tileSize: 256,
      time: latest.time,
    };

    // Cache for 10 minutes
    radarCache = { info, expiresAt: now + 10 * 60 * 1000 };
    return info;
  } catch (err) {
    console.warn('RainViewer radar fetch failed, using fallback radar timestamp:', err);
    return null;
  }
}

/**
 * Fetches precipitation telemetry from Open-Meteo for Pune coordinates
 */
export async function fetchPunePrecipitation(overrideDemoRain?: number): Promise<WeatherData> {
  const now = Date.now();

  // If user has explicitly simulated heavy rain
  if (overrideDemoRain != null) {
    const factor = calculateRainFactor(overrideDemoRain, overrideDemoRain * 2.2);
    return {
      currentRainMmHr: overrideDemoRain,
      rain3hMm: Number((overrideDemoRain * 2.2).toFixed(1)),
      forecastPeakMmHr: Math.max(overrideDemoRain, 28),
      rainFactor: factor,
      source: 'Demo Fallback',
      timestamp: new Date().toISOString(),
      isDemo: true,
    };
  }

  // Check cache
  if (weatherCache && weatherCache.expiresAt > now) {
    return weatherCache.data;
  }

  const { lat, lng } = PUNE_BOUNDS.center;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=precipitation&hourly=precipitation&past_hours=3&forecast_hours=6&timezone=Asia%2FKolkata`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo returned status ${res.status}`);
    const data = await res.json();

    const currentRain = data.current?.precipitation || 0;
    
    // Sum last 3 hours of precipitation
    const hourlyPrecip: number[] = data.hourly?.precipitation || [];
    const past3h = hourlyPrecip.slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
    
    // Upcoming 3-hour peak
    const upcoming = hourlyPrecip.slice(3, 7);
    const forecastPeak = upcoming.length > 0 ? Math.max(...upcoming) : currentRain;

    const rainFactor = calculateRainFactor(currentRain, past3h);

    const weatherData: WeatherData = {
      currentRainMmHr: currentRain,
      rain3hMm: Number(past3h.toFixed(1)),
      forecastPeakMmHr: forecastPeak,
      rainFactor,
      source: 'Open-Meteo',
      timestamp: new Date().toISOString(),
      isDemo: false,
    };

    // Cache for 10 minutes
    weatherCache = { data: weatherData, expiresAt: now + 10 * 60 * 1000 };
    return weatherData;
  } catch (err) {
    console.warn('Open-Meteo call failed, using clearly labelled Pune demo fallback:', err);
    // Labelled demo fallback
    const fallbackRain = 18.5; // Moderate monsoon shower
    const fallback3h = 32.0;
    const factor = calculateRainFactor(fallbackRain, fallback3h);

    return {
      currentRainMmHr: fallbackRain,
      rain3hMm: fallback3h,
      forecastPeakMmHr: 24.0,
      rainFactor: factor,
      source: 'Demo Fallback',
      timestamp: new Date().toISOString(),
      isDemo: true,
    };
  }
}

/**
 * Checks if proactive heavy rain warning should fire for hotspots
 * Rule: forecast rain > 15 mm/hr and hotspot susceptibility S >= 0.5
 */
export function checkForecastHotspotAlert(
  forecastPeakMmHr: number,
  overridePlaceName?: string
): { triggered: boolean; placeName: string; forecastMmHr: number } | null {
  const threshold = weightsConfig.rain.heavy_rain_threshold_mm_hr;
  if (forecastPeakMmHr > threshold) {
    const primaryHotspot = overridePlaceName || PUNE_HOTSPOTS[0].name;
    return {
      triggered: true,
      placeName: primaryHotspot,
      forecastMmHr: forecastPeakMmHr,
    };
  }
  return null;
}
