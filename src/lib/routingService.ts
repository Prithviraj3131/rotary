import { ReportRow } from '../types/database';
import { RouteOption, RouteHazardBlock, RerouteResult } from '../types/routing';
import { DEPTH_LEVELS } from '../types/reports';
import { calculateDistanceMeters } from './geoUtils';
import weightsConfig from '../config/weights.json';

// Standard demo test routes in Pune
export const PRESET_PUNE_ROUTES = [
  {
    id: 'route-baner-shivajinagar',
    name: 'Baner to Shivajinagar',
    origin: { name: 'Baner, Pune', lat: 18.5590, lng: 73.7868 },
    destination: { name: 'Shivajinagar, Pune', lat: 18.5314, lng: 73.8446 },
    // Realistic coordinates traversing through university circle or underpasses
    baselinePath: [
      [18.5590, 73.7868],
      [18.5512, 73.8052],
      [18.5428, 73.8210], // Near Aundh / Khadki underpass
      [18.5360, 73.8340],
      [18.5314, 73.8446]
    ] as [number, number][],
    alternatePath: [
      [18.5590, 73.7868],
      [18.5630, 73.8010],
      [18.5540, 73.8280], // Higher elevation Pashan-Pune University bypass
      [18.5410, 73.8400],
      [18.5314, 73.8446]
    ] as [number, number][]
  },
  {
    id: 'route-sinhagad-deccan',
    name: 'Sinhagad Road to Deccan Gymkhana',
    origin: { name: 'Sinhagad Road (Vitthalwadi)', lat: 18.4795, lng: 73.8320 },
    destination: { name: 'Deccan Gymkhana', lat: 18.5175, lng: 73.8415 },
    baselinePath: [
      [18.4795, 73.8320],
      [18.4890, 73.8360], // Near flooded canal corridor
      [18.5020, 73.8390],
      [18.5175, 73.8415]
    ] as [number, number][],
    alternatePath: [
      [18.4795, 73.8320],
      [18.4810, 73.8450], // Higher ground via Parvati Hill / Mitra Mandal Chowk
      [18.5010, 73.8510],
      [18.5175, 73.8415]
    ] as [number, number][]
  }
];

/**
 * Checks if a polyline segment intersects or comes within buffer distance of any hazard circle
 */
export function findBlockingHazard(
  routePath: [number, number][],
  reports: ReportRow[]
): RouteHazardBlock | null {
  const now = Date.now();
  const EXPIRY_MS = 90 * 60 * 1000;
  const bufferM = weightsConfig.routing.buffer_m || 50;

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
 * Computes baseline route and alternate avoidance route around active flood circles (Method A)
 */
export async function calculateAvoidanceRoute(
  routePresetId: string,
  activeReports: ReportRow[]
): Promise<RerouteResult> {
  const preset = PRESET_PUNE_ROUTES.find(r => r.id === routePresetId) || PRESET_PUNE_ROUTES[0];
  const now = new Date().toISOString();

  // Test baseline path against active confirmed/severe hazards
  const baselineBlock = findBlockingHazard(preset.baselinePath, activeReports);
  const isBaselineBlocked = Boolean(baselineBlock);

  const baselineRoute: RouteOption = {
    id: 'route-baseline',
    name: 'Direct Shortest Path',
    summary: 'Via standard arterial roads',
    distanceKm: 8.4,
    durationMinutes: 22,
    isBaseline: true,
    isBlocked: isBaselineBlocked,
    blockingHazard: baselineBlock,
    geometry: preset.baselinePath,
    elevationGainM: 12,
    riskDescription: isBaselineBlocked
      ? 'Passes directly through reported flood hazard zone.'
      : 'No confirmed flooding reported on this route.',
    avoidanceVerified: !isBaselineBlocked
  };

  // Alternate route (elevated bypass clearing hazard circles)
  const alternateBlock = findBlockingHazard(preset.alternatePath, activeReports);
  const alternateRoute: RouteOption = {
    id: 'route-alternate-avoidance',
    name: 'Recommended Route Avoiding Reported Flooding',
    summary: 'Via higher elevation corridor / bypass',
    distanceKm: 9.8,
    durationMinutes: 27,
    isBaseline: false,
    isBlocked: Boolean(alternateBlock),
    blockingHazard: alternateBlock,
    geometry: preset.alternatePath,
    elevationGainM: 28,
    riskDescription: 'Circumvents active flood zones along elevated terrain.',
    avoidanceVerified: !alternateBlock
  };

  return {
    baselineRoute,
    alternateRoute,
    deltaDistanceKm: Number((alternateRoute.distanceKm - baselineRoute.distanceKm).toFixed(1)),
    deltaDurationMinutes: alternateRoute.durationMinutes - baselineRoute.durationMinutes,
    hasFloodingOnBaseline: isBaselineBlocked,
    blockingReport: baselineBlock,
    timestamp: now,
    // Mandatory Ground Rule 2 phrasing:
    disclaimer: 'No confirmed flooding reported on this route. Conditions can change rapidly in heavy rain.'
  };
}
