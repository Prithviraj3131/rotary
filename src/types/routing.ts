// Frozen Routing Types (Section 4 & 7)

export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface RouteHazardBlock {
  reportId: string;
  depth: string;
  ageMinutes: number;
  lat: number;
  lng: number;
  radiusMeters: number;
  message: string;
}

export interface RouteStep {
  instruction: string;
  roadName: string;
  distanceMeters: number;
  durationSeconds: number;
  type: string;
  modifier?: string;
}

export interface RouteOption {
  id: string;
  name: string;
  summary: string;
  distanceKm: number;
  durationMinutes: number;
  isBaseline: boolean;
  isBlocked: boolean;
  blockingHazard?: RouteHazardBlock | null;
  geometry: [number, number][]; // Array of [lat, lng]
  elevationGainM?: number;
  riskDescription: string;
  avoidanceVerified: boolean;
  steps?: RouteStep[];
}

export interface RerouteResult {
  baselineRoute: RouteOption;
  alternateRoute: RouteOption | null;
  deltaDistanceKm: number;
  deltaDurationMinutes: number;
  hasFloodingOnBaseline: boolean;
  blockingReport: RouteHazardBlock | null;
  timestamp: string;
  disclaimer: string;
}
