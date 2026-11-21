import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ReportRow } from '../types/database';
import {
  PRESET_PUNE_ROUTES,
  PUNE_LOCALITIES,
  calculateAvoidanceRoute,
  PunePresetRoute,
  PuneLocality
} from '../lib/routingService';
import { RerouteResult, RouteStep } from '../types/routing';
import { DemoBadge } from '../components/common/DemoBadge';

interface RerouteViewProps {
  reports: ReportRow[];
  onOpenMap: () => void;
}

// Custom DivIcons for Map Markers
const originIcon = L.divIcon({
  className: 'custom-origin-icon',
  html: `
    <div style="background-color: #006c4b; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid white;">
      <span class="material-symbols-outlined" style="font-size: 16px;">my_location</span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const destinationIcon = L.divIcon({
  className: 'custom-dest-icon',
  html: `
    <div style="background-color: #00271d; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid white;">
      <span class="material-symbols-outlined" style="font-size: 16px;">flag</span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const hazardBlockIcon = L.divIcon({
  className: 'custom-hazard-icon',
  html: `
    <div style="background-color: #ba1a1a; color: white; padding: 3px 8px; border-radius: 9999px; font-weight: 700; font-size: 10px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(186, 26, 26, 0.45); border: 1.5px solid white; white-space: nowrap;">
      <span class="material-symbols-outlined" style="font-size: 13px;">block</span>
      <span>Flooded Road</span>
    </div>
  `,
  iconSize: [95, 24],
  iconAnchor: [47, 12],
});

// Helper component to auto-fit bounds on route change
const RouteBoundsFitter: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 1) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
    }
  }, [coords, map]);
  return null;
};

function getStepIconName(step: RouteStep): string {
  const mod = step.modifier?.toLowerCase() || '';
  const type = step.type?.toLowerCase() || '';
  if (type === 'depart') return 'trip_origin';
  if (type === 'arrive') return 'flag';
  if (mod.includes('left')) return 'turn_left';
  if (mod.includes('right')) return 'turn_right';
  if (type === 'roundabout') return 'roundabout_right';
  if (type === 'fork') return 'fork_right';
  return 'straight';
}

export const RerouteView: React.FC<RerouteViewProps> = ({ reports, onOpenMap }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_PUNE_ROUTES[0].id);
  const [customOrigin, setCustomOrigin] = useState<PuneLocality | null>(null);
  const [customDestination, setCustomDestination] = useState<PuneLocality | null>(null);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  const [rerouteResult, setRerouteResult] = useState<RerouteResult | null>(null);
  const [activeTab, setActiveTab] = useState<'alternate' | 'baseline'>('alternate');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Origin & Destination
  const activePreset: PunePresetRoute =
    PRESET_PUNE_ROUTES.find((r) => r.id === selectedPresetId) || PRESET_PUNE_ROUTES[0];

  const currentOrigin = isCustomMode && customOrigin
    ? { name: customOrigin.name, lat: customOrigin.lat, lng: customOrigin.lng }
    : activePreset.origin;

  const currentDestination = isCustomMode && customDestination
    ? { name: customDestination.name, lat: customDestination.lat, lng: customDestination.lng }
    : activePreset.destination;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    calculateAvoidanceRoute(
      selectedPresetId,
      reports,
      isCustomMode && customOrigin ? currentOrigin : undefined,
      isCustomMode && customDestination ? currentDestination : undefined
    ).then((res) => {
      if (isMounted) {
        setRerouteResult(res);
        setIsLoading(false);
        // Default to alternate tab if baseline is blocked
        if (res.hasFloodingOnBaseline) {
          setActiveTab('alternate');
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedPresetId, reports, isCustomMode, customOrigin, customDestination]);

  const handlePresetSelect = (presetId: string) => {
    setIsCustomMode(false);
    setSelectedPresetId(presetId);
  };

  const handleSwap = () => {
    if (isCustomMode) {
      const tmp = customOrigin;
      setCustomOrigin(customDestination);
      setCustomDestination(tmp);
    } else {
      const nextIdx =
        (PRESET_PUNE_ROUTES.findIndex((r) => r.id === selectedPresetId) + 1) %
        PRESET_PUNE_ROUTES.length;
      setSelectedPresetId(PRESET_PUNE_ROUTES[nextIdx].id);
    }
  };

  const displayedRoute =
    activeTab === 'alternate' && rerouteResult?.alternateRoute
      ? rerouteResult.alternateRoute
      : rerouteResult?.baselineRoute;

  // Compute all coordinates for map view framing
  const allRouteCoords = [
    ...(rerouteResult?.baselineRoute?.geometry || []),
    ...(rerouteResult?.alternateRoute?.geometry || [])
  ];

  return (
    <div className="w-full max-w-md md:max-w-xl mx-auto px-4 py-4 flex flex-col gap-4 pb-24">
      {/* 1. Frosted Search Card */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
            Reroute Planner (OSRM Dynamic)
          </span>
          <div className="flex items-center gap-1.5">
            <DemoBadge />
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-container text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              <span>OSRM 50m Avoidance</span>
            </div>
          </div>
        </div>

        {/* Preset Corridor Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {PRESET_PUNE_ROUTES.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetSelect(p.id)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition-all ${
                !isCustomMode && selectedPresetId === p.id
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => {
              setIsCustomMode(true);
              if (!customOrigin) setCustomOrigin(PUNE_LOCALITIES[0]);
              if (!customDestination) setCustomDestination(PUNE_LOCALITIES[1]);
            }}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition-all ${
              isCustomMode
                ? 'bg-secondary text-on-secondary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Custom Pune Corridor
          </button>
        </div>

        {/* Origin / Destination Selectors */}
        <div className="flex items-center gap-3">
          {/* Connector Dots */}
          <div className="flex flex-col items-center justify-center gap-1 py-1 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <span className="w-0.5 h-6 bg-outline-variant rounded-full"></span>
            <span
              className="material-symbols-outlined text-primary text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
          </div>

          {/* Inputs */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {isCustomMode ? (
              <>
                <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 py-1.5 border border-surface-container-high">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] text-on-surface-variant font-medium">Origin</span>
                    <select
                      value={customOrigin?.id || PUNE_LOCALITIES[0].id}
                      onChange={(e) => {
                        const loc = PUNE_LOCALITIES.find((l) => l.id === e.target.value);
                        if (loc) setCustomOrigin(loc);
                      }}
                      className="bg-transparent font-semibold text-xs text-on-surface focus:outline-hidden"
                    >
                      {PUNE_LOCALITIES.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
                    my_location
                  </span>
                </div>

                <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 py-1.5 border border-surface-container-high">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] text-on-surface-variant font-medium">Destination</span>
                    <select
                      value={customDestination?.id || PUNE_LOCALITIES[1].id}
                      onChange={(e) => {
                        const loc = PUNE_LOCALITIES.find((l) => l.id === e.target.value);
                        if (loc) setCustomDestination(loc);
                      }}
                      className="bg-transparent font-semibold text-xs text-on-surface focus:outline-hidden"
                    >
                      {PUNE_LOCALITIES.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0">
                    search
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container-high">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-on-surface-variant font-medium">Origin</span>
                    <span className="font-semibold text-xs text-on-surface truncate">
                      {currentOrigin.name}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
                    my_location
                  </span>
                </div>

                <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container-high">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-on-surface-variant font-medium">Destination</span>
                    <span className="font-semibold text-xs text-on-surface truncate">
                      {currentDestination.name}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0">
                    search
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Swap button */}
          <button
            onClick={handleSwap}
            title="Swap Origin and Destination"
            className="w-10 h-10 rounded-xl bg-surface-container-low border border-surface-container-high text-primary flex items-center justify-center shrink-0 active:scale-95 transition-transform hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">swap_vert</span>
          </button>
        </div>
      </div>

      {/* 2. Real Interactive Leaflet Route Map */}
      <div className="relative w-full h-72 rounded-2xl overflow-hidden shadow-sm bg-surface-container-low border border-surface-container-high z-0">
        {isLoading && (
          <div className="absolute inset-0 bg-surface/70 backdrop-blur-xs z-500 flex flex-col items-center justify-center gap-2">
            <div className="w-7 h-7 border-3 border-secondary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-on-surface">Computing live OSRM detour...</span>
          </div>
        )}

        <MapContainer
          center={[currentOrigin.lat, currentOrigin.lng]}
          zoom={13}
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
            maxZoom={19}
          />

          {/* Auto-fit bounds on route change */}
          {allRouteCoords.length > 1 && <RouteBoundsFitter coords={allRouteCoords} />}

          {/* Baseline Route Polyline */}
          {rerouteResult?.baselineRoute && (
            <Polyline
              positions={rerouteResult.baselineRoute.geometry}
              pathOptions={{
                color: rerouteResult.hasFloodingOnBaseline ? '#ba1a1a' : '#717975',
                weight: activeTab === 'baseline' ? 6 : 4,
                dashArray: rerouteResult.hasFloodingOnBaseline ? '8, 8' : undefined,
                opacity: activeTab === 'baseline' ? 1.0 : 0.55,
              }}
            />
          )}

          {/* Alternate Avoidance Route Polyline */}
          {rerouteResult?.alternateRoute && (
            <Polyline
              positions={rerouteResult.alternateRoute.geometry}
              pathOptions={{
                color: '#006c4b',
                weight: activeTab === 'alternate' ? 6 : 4,
                opacity: activeTab === 'alternate' ? 1.0 : 0.45,
              }}
            />
          )}

          {/* Origin Marker */}
          <Marker position={[currentOrigin.lat, currentOrigin.lng]} icon={originIcon}>
            <Popup>
              <div className="text-xs font-semibold">Origin: {currentOrigin.name}</div>
            </Popup>
          </Marker>

          {/* Destination Marker */}
          <Marker position={[currentDestination.lat, currentDestination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-xs font-semibold">Destination: {currentDestination.name}</div>
            </Popup>
          </Marker>

          {/* Blocking Hazard Circle & Badge */}
          {rerouteResult?.blockingReport && (
            <>
              <Circle
                center={[rerouteResult.blockingReport.lat, rerouteResult.blockingReport.lng]}
                radius={rerouteResult.blockingReport.radiusMeters + 50}
                pathOptions={{
                  color: '#ba1a1a',
                  fillColor: '#ba1a1a',
                  fillOpacity: 0.35,
                  weight: 2,
                  dashArray: '4, 4',
                }}
              />
              <Marker
                position={[rerouteResult.blockingReport.lat, rerouteResult.blockingReport.lng]}
                icon={hazardBlockIcon}
              >
                <Popup>
                  <div className="text-xs font-bold text-error">
                    Flooded Road: {rerouteResult.blockingReport.depth}
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    {rerouteResult.blockingReport.message}
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between px-3 py-1.5 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-xs border border-surface-container-high text-xs z-400">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('alternate')}
              className={`flex items-center gap-1.5 font-semibold text-xs ${
                activeTab === 'alternate' ? 'text-secondary font-bold' : 'text-on-surface-variant'
              }`}
            >
              <span className="w-2.5 h-1.5 rounded-full bg-secondary"></span>
              Bypass Route
            </button>
            <button
              onClick={() => setActiveTab('baseline')}
              className={`flex items-center gap-1.5 font-semibold text-xs ${
                activeTab === 'baseline' ? 'text-error font-bold' : 'text-on-surface-variant'
              }`}
            >
              <span className="w-2.5 h-1.5 rounded-full bg-error"></span>
              Direct (Blocked)
            </button>
          </div>
          <button
            onClick={onOpenMap}
            className="text-secondary font-bold text-[11px] flex items-center gap-0.5 hover:underline"
          >
            Full GIS Map
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </button>
        </div>
      </div>

      {/* 3. Hazard Block Warning Callout */}
      {rerouteResult?.blockingReport && (
        <div className="flex items-stretch gap-3 bg-error-container/80 text-on-error-container rounded-2xl p-3.5 border border-error/30 shadow-xs">
          <div className="w-1 self-stretch rounded-full bg-error shrink-0"></div>
          <span
            className="material-symbols-outlined text-error text-[22px] shrink-0 self-center"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            warning
          </span>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs text-on-error-container">
              Direct Road Blocked: {rerouteResult.blockingReport.depth} Waterlogging
            </span>
            <span className="text-[11px] text-on-error-container/90 mt-0.5 leading-snug">
              {rerouteResult.blockingReport.message} Traffic dynamically rerouted along higher elevation bypass.
            </span>
          </div>
        </div>
      )}

      {/* 4. Route Comparison Cards (Ground Rule 2 Compliant) */}
      <div className="flex flex-col gap-3">
        {/* Recommended Route Card (Emerald) */}
        {rerouteResult?.alternateRoute && (
          <div
            onClick={() => setActiveTab('alternate')}
            className={`w-full text-left rounded-2xl p-4 border transition-all cursor-pointer flex flex-col gap-2.5 ${
              activeTab === 'alternate'
                ? 'bg-surface-container-lowest border-secondary shadow-md ring-1 ring-secondary/30'
                : 'bg-surface-container-lowest border-surface-container-high hover:border-outline-variant shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="material-symbols-outlined text-secondary text-[20px] shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified_user
                </span>
                <span className="font-bold text-sm text-on-surface truncate">
                  Route Avoiding Reported Flooding
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container text-[10px] font-bold uppercase shrink-0">
                Recommended
              </span>
            </div>

            <div className="flex items-baseline gap-3 text-xs">
              <div>
                <span className="font-bold text-lg text-secondary">
                  {rerouteResult.alternateRoute.durationMinutes} min
                </span>
                <span className="text-on-surface-variant ml-1 font-medium">
                  ({rerouteResult.alternateRoute.distanceKm} km)
                </span>
              </div>
              <span className="text-on-surface-variant text-[11px]">
                +{rerouteResult.deltaDurationMinutes} min (+{rerouteResult.deltaDistanceKm} km bypass)
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-snug">
              {rerouteResult.alternateRoute.summary}. {rerouteResult.alternateRoute.riskDescription}
            </p>

            {/* Mandatory Ground Rule 2 Disclaimer */}
            <div className="pt-2 border-t border-surface-container-high text-[10px] text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-secondary">info</span>
              <span>{rerouteResult.disclaimer}</span>
            </div>
          </div>
        )}

        {/* Baseline Direct Route Card (Blocked in Red) */}
        {rerouteResult && (
          <div
            onClick={() => setActiveTab('baseline')}
            className={`w-full text-left rounded-2xl p-4 border transition-all cursor-pointer flex flex-col gap-2 ${
              activeTab === 'baseline'
                ? 'bg-surface-container-lowest border-error shadow-md ring-1 ring-error/30'
                : 'bg-surface-container-lowest border-surface-container-high hover:border-outline-variant shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-error text-[20px] shrink-0">block</span>
                <span className="font-bold text-sm text-on-surface truncate">
                  Direct Shortest Route
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-bold uppercase shrink-0">
                {rerouteResult.hasFloodingOnBaseline ? 'Flooded / Blocked' : 'Clear'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 text-xs">
              <span className="font-bold text-base text-on-surface">
                {rerouteResult.baselineRoute.durationMinutes} min
              </span>
              <span className="text-on-surface-variant font-medium">
                ({rerouteResult.baselineRoute.distanceKm} km)
              </span>
            </div>

            <p className="text-xs text-error font-medium leading-snug">
              {rerouteResult.baselineRoute.riskDescription}
            </p>
          </div>
        )}

        {/* 5. Live Turn-by-Turn Guidance Steps (Powered by OSRM) */}
        {displayedRoute?.steps && displayedRoute.steps.length > 0 && (
          <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">
                {activeTab === 'alternate' ? 'Turn-by-Turn Avoidance Guidance' : 'Direct Route Steps'}
              </span>
              <span className="text-[11px] font-semibold text-secondary">
                {displayedRoute.steps.length} Steps (OSRM)
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {displayedRoute.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2 rounded-xl bg-surface-container-low text-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[15px]">
                      {getStepIconName(step)}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-on-surface leading-tight">
                      {step.instruction}
                    </span>
                    <span className="text-[10px] text-on-surface-variant mt-0.5">
                      {step.roadName} • {step.distanceMeters > 1000 ? `${(step.distanceMeters / 1000).toFixed(1)} km` : `${step.distanceMeters} m`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
