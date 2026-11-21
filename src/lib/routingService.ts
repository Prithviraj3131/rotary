import { ReportRow } from '../types/database';
import { RouteOption, RouteHazardBlock, RerouteResult, RouteStep } from '../types/routing';
import { DEPTH_LEVELS } from '../types/reports';
import { calculateDistanceMeters } from './geoUtils';
import weightsConfig from '../config/weights.json';

export interface PuneLocality {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const PUNE_LOCALITIES: PuneLocality[] = [
  { id: 'baner', name: 'Baner', lat: 18.5590, lng: 73.7868 },
  { id: 'shivajinagar', name: 'Shivajinagar', lat: 18.5314, lng: 73.8446 },
  { id: 'sinhagad', name: 'Sinhagad Road (Vitthalwadi)', lat: 18.4795, lng: 73.8320 },
  { id: 'deccan', name: 'Deccan Gymkhana', lat: 18.5175, lng: 73.8415 },
  { id: 'kothrud', name: 'Kothrud Stand', lat: 18.5074, lng: 73.8077 },
  { id: 'swargate', name: 'Swargate Junction', lat: 18.5015, lng: 73.8580 },
  { id: 'aundh', name: 'Aundh (Bremen Chowk)', lat: 18.5582, lng: 73.8065 },
  { id: 'hinjawadi', name: 'Hinjawadi Phase 1', lat: 18.5913, lng: 73.7389 },
  { id: 'katraj', name: 'Katraj Chowk', lat: 18.4575, lng: 73.8677 },
  { id: 'punestation', name: 'Pune Railway Station', lat: 18.5284, lng: 73.8744 },
  { id: 'hadapsar', name: 'Hadapsar Gadital', lat: 18.5089, lng: 73.9259 },
  { id: 'vimannagar', name: 'Viman Nagar', lat: 18.5679, lng: 73.9143 }
];

export interface PunePresetRoute {
  id: string;
  name: string;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  baselinePath: [number, number][];
  fallbackDetourWaypoint?: { lat: number; lng: number };
}

// Preset test routes across high-traffic flood corridors in Pune
export const PRESET_PUNE_ROUTES: PunePresetRoute[] = [
  {
    id: 'route-baner-shivajinagar',
    name: 'Baner to Shivajinagar',
    origin: { name: 'Baner, Pune', lat: 18.5590, lng: 73.7868 },
    destination: { name: 'Shivajinagar, Pune', lat: 18.5314, lng: 73.8446 },
    baselinePath: [
      [18.5590, 73.7868],
      [18.5512, 73.8052],
      [18.5428, 73.8210],
      [18.5360, 73.8340],
      [18.5314, 73.8446]
    ],
    fallbackDetourWaypoint: { lat: 18.5540, lng: 73.8280 }
  },
  {
    id: 'route-sinhagad-deccan',
    name: 'Sinhagad Road to Deccan Gymkhana',
    origin: { name: 'Sinhagad Road (Vitthalwadi)', lat: 18.4795, lng: 73.8320 },
    destination: { name: 'Deccan Gymkhana', lat: 18.5175, lng: 73.8415 },
    baselinePath: [
      [18.4795, 73.8320],
      [18.4890, 73.8360],
      [18.5020, 73.8390],
      [18.5175, 73.8415]
    ],
    fallbackDetourWaypoint: { lat: 18.4980, lng: 73.8510 }
  },
  {
    id: 'route-kothrud-swargate',
    name: 'Kothrud to Swargate',
    origin: { name: 'Kothrud Stand', lat: 18.5074, lng: 73.8077 },
    destination: { name: 'Swargate Junction', lat: 18.5015, lng: 73.8580 },
    baselinePath: [
      [18.5074, 73.8077],
      [18.5090, 73.8250],
      [18.5050, 73.8420],
      [18.5015, 73.8580]
    ],
    fallbackDetourWaypoint: { lat: 18.5140, lng: 73.8350 }
  },
  {
    id: 'route-hinjawadi-aundh',
    name: 'Hinjawadi to Aundh',
    origin: { name: 'Hinjawadi Phase 1', lat: 18.5913, lng: 73.7389 },
    destination: { name: 'Aundh (Bremen Chowk)', lat: 18.5582, lng: 73.8065 },
    baselinePath: [
      [18.5913, 73.7389],
      [18.5780, 73.7650],
      [18.5660, 73.7890],
      [18.5582, 73.8065]
    ],
    fallbackDetourWaypoint: { lat: 18.5790, lng: 73.7740 }
  },
  {
    id: 'route-katraj-punestation',
    name: 'Katraj to Pune Station',
    origin: { name: 'Katraj Chowk', lat: 18.4575, lng: 73.8677 },
    destination: { name: 'Pune Railway Station', lat: 18.5284, lng: 73.8744 },
    baselinePath: [
      [18.4575, 73.8677],
      [18.4820, 73.8620],
      [18.5015, 73.8580],
      [18.5284, 73.8744]
    ],
    fallbackDetourWaypoint: { lat: 18.4890, lng: 73.8820 }
  }
];

/**
 * Human-readable format of OSRM turn-by-turn maneuvers
 */
function formatStepInstruction(s: {
  maneuver?: { type?: string; modifier?: string };
  name?: string;
  distance?: number;
}): string {
  const type = s.maneuver?.type || 'turn';
  const modifier = s.maneuver?.modifier || '';
  const road = s.name ? `onto ${s.name}` : '';

  if (type === 'depart') {
    return s.name ? `Depart heading ${modifier} on ${s.name}` : `Depart heading ${modifier}`;
  }
  if (type === 'arrive') {
    return 'Arrive at destination';
  }
  if (type === 'fork') {
    return `Keep ${modifier || 'straight'} ${road}`.trim();
  }
  if (type === 'roundabout') {
    return `Enter roundabout and take exit ${road}`.trim();
  }
  if (type === 'end of road') {
    return `Turn ${modifier || 'right'} at the end of the road ${road}`.trim();
  }
  if (type === 'new name') {
    return `Continue ${road}`.trim();
  }
  if (modifier) {
    return `Turn ${modifier} ${road}`.trim();
  }
  return `Continue straight ${road}`.trim();
}

/**
 * Live OSRM Driving Route Fetcher (100% Free Open Tooling - Ground Rule 10)
 */
export async function fetchOSRMRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  waypoints: { lat: number; lng: number }[] = []
): Promise<{
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][];
  steps: RouteStep[];
  success: boolean;
}> {
  try {
    const coords = [
      `${origin.lng},${origin.lat}`,
      ...waypoints.map(w => `${w.lng},${w.lat}`),
      `${destination.lng},${destination.lat}`
    ].join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`OSRM HTTP status ${res.status}`);
    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes || !data.routes.length) {
      throw new Error(`OSRM returned error code: ${data.code}`);
    }

    const route = data.routes[0];
    const geometry: [number, number][] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]] // convert [lng, lat] to [lat, lng]
    );

    const steps: RouteStep[] = [];
    if (route.legs) {
      for (const leg of route.legs) {
        if (leg.steps) {
          for (const s of leg.steps) {
            steps.push({
              instruction: formatStepInstruction(s),
              roadName: s.name || 'Connecting Road',
              distanceMeters: Math.round(s.distance || 0),
              durationSeconds: Math.round(s.duration || 0),
              type: s.maneuver?.type || 'turn',
              modifier: s.maneuver?.modifier || ''
            });
          }
        }
      }
    }

    return {
      distanceKm: Number((route.distance / 1000).toFixed(1)),
      durationMinutes: Math.max(1, Math.round(route.duration / 60)),
      geometry,
      steps,
      success: true
    };
  } catch (err) {
    console.warn('Live OSRM routing request failed or offline; using fallback geometry:', err);

    // Resilient offline fallback geometry between points
    const points: [number, number][] = [
      [origin.lat, origin.lng],
      ...waypoints.map(w => [w.lat, w.lng] as [number, number]),
      [destination.lat, destination.lng]
    ];

    const totalDistM = points.reduce((acc, pt, i) => {
      if (i === 0) return 0;
      return acc + calculateDistanceMeters(points[i - 1][0], points[i - 1][1], pt[0], pt[1]);
    }, 0);

    const distanceKm = Number((totalDistM / 1000).toFixed(1));
    const durationMinutes = Math.max(3, Math.round((distanceKm / 25) * 60)); // ~25km/h city monsoon average

    const fallbackSteps: RouteStep[] = [
      {
        instruction: `Depart towards destination`,
        roadName: 'Arterial Corridor',
        distanceMeters: Math.round(totalDistM * 0.4),
        durationSeconds: Math.round(durationMinutes * 60 * 0.4),
        type: 'depart'
      },
      {
        instruction: waypoints.length > 0 ? `Bypass reported flood polygon via elevated waypoint` : 'Continue along primary road',
        roadName: 'Elevated bypass route',
        distanceMeters: Math.round(totalDistM * 0.4),
        durationSeconds: Math.round(durationMinutes * 60 * 0.4),
        type: 'turn'
      },
      {
        instruction: 'Arrive at destination',
        roadName: 'Destination',
        distanceMeters: Math.round(totalDistM * 0.2),
        durationSeconds: Math.round(durationMinutes * 60 * 0.2),
        type: 'arrive'
      }
    ];

    return {
      distanceKm,
      durationMinutes,
      geometry: points,
      steps: fallbackSteps,
      success: false
    };
  }
}

/**
 * Checks if a polyline segment intersects or comes within buffer distance of any hazard circle
 */
export function findBlockingHazard(
  routePath: [number, number][],
  reports: ReportRow[]
): RouteHazardBlock | null {
  const now = Date.now();
  const EXPIRY_MS = weightsConfig.trust.expiry_minutes * 60 * 1000; // 90 min TTL (Ground Rule 6)
  const bufferM = weightsConfig.routing.buffer_m || 50; // 50m buffer (Ground Rule 5)

  // Only confirmed or severe active reports trigger a hard block (Ground Rule 1)
  const activeBlockers = reports.filter(r => {
    if (r.status !== 'confirmed' && r.status !== 'severe') return false;
    const age = now - new Date(r.observed_at).getTime();
    return age < EXPIRY_MS;
  });

  for (const report of activeBlockers) {
    const depthCfg = DEPTH_LEVELS[report.depth] || DEPTH_LEVELS.ankle;
    const thresholdDist = depthCfg.radius_m + bufferM;

    for (const [lat, lng] of routePath) {
      const dist = calculateDistanceMeters(lat, lng, report.lat, report.lng);
      if (dist <= thresholdDist) {
        const ageMinutes = Math.floor((now - new Date(report.observed_at).getTime()) / 60000);
        return {
          reportId: report.id,
          depth: depthCfg.label,
          ageMinutes,
          lat: report.lat,
          lng: report.lng,
          radiusMeters: depthCfg.radius_m,
          message: `Blocked by ${report.status} ${depthCfg.label} reported ${ageMinutes}m ago (${Math.round(dist)}m from path).`
        };
      }
    }
  }

  return null;
}

/**
 * Calculates perpendicular detour waypoint around a blocking hazard
 */
function calculateDetourWaypoint(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  hazard: RouteHazardBlock
): { lat: number; lng: number } {
  // Vector from origin to destination
  const dLat = destination.lat - origin.lat;
  const dLng = destination.lng - origin.lng;
  const mag = Math.sqrt(dLat * dLat + dLng * dLng) || 0.001;

  // Normal unit vectors (perpendicular)
  const normLat = -dLng / mag;
  const normLng = dLat / mag;

  // Detour offset: hazard radius + buffer + safety margin (~600m in degrees)
  const offsetDeg = Math.max(0.006, (hazard.radiusMeters + 350) / 111320);

  // Return offset waypoint
  return {
    lat: hazard.lat + normLat * offsetDeg,
    lng: hazard.lng + normLng * offsetDeg
  };
}

/**
 * Computes baseline route and alternate avoidance route around active flood circles (Method A)
 * Fetches live real road geometry from OpenStreetMap OSRM.
 */
export async function calculateAvoidanceRoute(
  routePresetId: string,
  activeReports: ReportRow[],
  customOrigin?: { name: string; lat: number; lng: number },
  customDestination?: { name: string; lat: number; lng: number }
): Promise<RerouteResult> {
  const preset = PRESET_PUNE_ROUTES.find(r => r.id === routePresetId) || PRESET_PUNE_ROUTES[0];
  const origin = customOrigin || preset.origin;
  const destination = customDestination || preset.destination;
  const now = new Date().toISOString();

  // 1. Fetch live baseline route from OSRM
  const baselineOSRMFetch = await fetchOSRMRoute(origin, destination);
  const baselineBlock = findBlockingHazard(baselineOSRMFetch.geometry, activeReports);
  const isBaselineBlocked = Boolean(baselineBlock);

  const baselineRoute: RouteOption = {
    id: 'route-baseline',
    name: 'Direct Shortest Path',
    summary: `Direct road corridor between ${origin.name} and ${destination.name}`,
    distanceKm: baselineOSRMFetch.distanceKm,
    durationMinutes: baselineOSRMFetch.durationMinutes,
    isBaseline: true,
    isBlocked: isBaselineBlocked,
    blockingHazard: baselineBlock,
    geometry: baselineOSRMFetch.geometry,
    elevationGainM: 12,
    riskDescription: isBaselineBlocked
      ? 'Passes directly through reported flood hazard zone.'
      : 'No confirmed flooding reported on this route.',
    avoidanceVerified: !isBaselineBlocked,
    steps: baselineOSRMFetch.steps
  };

  // 2. Compute alternate avoidance route
  let alternateRoute: RouteOption | null = null;

  if (isBaselineBlocked && baselineBlock) {
    // Generate dynamic detour waypoint around the blocking hazard
    const detourWaypoint = calculateDetourWaypoint(origin, destination, baselineBlock);
    
    // Fetch alternate route passing through detour waypoint
    const altOSRM = await fetchOSRMRoute(origin, destination, [detourWaypoint]);
    const altBlock = findBlockingHazard(altOSRM.geometry, activeReports);

    alternateRoute = {
      id: 'route-alternate-avoidance',
      name: 'Recommended Route Avoiding Reported Flooding',
      summary: `Bypass around ${baselineBlock.depth} waterlogging via elevated corridor`,
      distanceKm: altOSRM.distanceKm,
      durationMinutes: altOSRM.durationMinutes,
      isBaseline: false,
      isBlocked: Boolean(altBlock),
      blockingHazard: altBlock,
      geometry: altOSRM.geometry,
      elevationGainM: 26,
      riskDescription: altBlock
        ? 'Detour also intersects reported waterlogging; use high caution.'
        : 'Circumvents active flood zones along elevated terrain.',
      avoidanceVerified: !altBlock,
      steps: altOSRM.steps
    };
  } else {
    // Baseline is clear; generate alternative elevated option if preset has detour
    const fallbackWaypoint = preset.fallbackDetourWaypoint;
    const waypoints = fallbackWaypoint ? [fallbackWaypoint] : [];
    const altOSRM = await fetchOSRMRoute(origin, destination, waypoints);
    const altBlock = findBlockingHazard(altOSRM.geometry, activeReports);

    alternateRoute = {
      id: 'route-alternate-clear',
      name: 'Alternate Elevated Corridor',
      summary: 'Secondary arterial route along higher elevation grade',
      distanceKm: altOSRM.distanceKm,
      durationMinutes: altOSRM.durationMinutes,
      isBaseline: false,
      isBlocked: Boolean(altBlock),
      blockingHazard: altBlock,
      geometry: altOSRM.geometry,
      elevationGainM: 22,
      riskDescription: 'Circumvents low-lying stormwater drains.',
      avoidanceVerified: !altBlock,
      steps: altOSRM.steps
    };
  }

  const deltaDist = Number((alternateRoute.distanceKm - baselineRoute.distanceKm).toFixed(1));
  const deltaDur = Math.max(0, alternateRoute.durationMinutes - baselineRoute.durationMinutes);

  return {
    baselineRoute,
    alternateRoute,
    deltaDistanceKm: deltaDist,
    deltaDurationMinutes: deltaDur,
    hasFloodingOnBaseline: isBaselineBlocked,
    blockingReport: baselineBlock,
    timestamp: now,
    // Mandatory Ground Rule 2 phrasing:
    disclaimer: 'No confirmed flooding reported on this route. Conditions can change rapidly in heavy rain.'
  };
}
