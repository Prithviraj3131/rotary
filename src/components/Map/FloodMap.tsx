import React, { useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { PUNE_BOUNDS } from '../../config/puneConfig';
import { ReportRow, CellRiskRow } from '../../types/database';
import { HazardCircles } from './HazardCircles';
import { RainRadarLayer } from './RainRadarLayer';
import { PredictedCells } from './PredictedCells';
import { HeatmapLayer } from './HeatmapLayer';
import { ShelterMapMarkers, MapPlace } from './ShelterMapMarkers';
import { WeatherData } from '../../lib/weather';

interface PredictedCellItem extends CellRiskRow {
  lat: number;
  lng: number;
  s: number;
  elevation: number;
}

interface FloodMapProps {
  reports: ReportRow[];
  predictedCells?: PredictedCellItem[];
  userLocation?: [number, number] | null;
  weather?: WeatherData | null;
  onVoteStillFlooded?: (reportId: string) => void;
  onVoteCleared?: (reportId: string) => void;
  onOpenAnalytics?: () => void;
  onOpenReroute?: (reportId?: string) => void;
}

type MapFilterCategory =
  | 'all'
  | 'flood-risk'
  | 'waterlogging'
  | 'road-closures'
  | 'safe-places'
  | 'emergency';

const PUNE_SEARCH_LOCALITIES = [
  { name: 'Baner', lat: 18.5590, lng: 73.7868 },
  { name: 'Aundh', lat: 18.5582, lng: 73.8065 },
  { name: 'Shivajinagar', lat: 18.5314, lng: 73.8446 },
  { name: 'Deccan Gymkhana', lat: 18.5175, lng: 73.8415 },
  { name: 'Kothrud', lat: 18.5074, lng: 73.8077 },
  { name: 'Swargate', lat: 18.5015, lng: 73.8580 },
  { name: 'Katraj Basin', lat: 18.4575, lng: 73.8677 },
  { name: 'Sinhagad Road', lat: 18.4831, lng: 73.8340 },
  { name: 'Hinjawadi', lat: 18.5913, lng: 73.7389 },
  { name: 'Pulgate / Camp', lat: 18.5080, lng: 73.8780 },
];

// Helper to pan/fly map programmatically
const MapActionDispatcher: React.FC<{
  targetLocation: [number, number] | null;
  resetTarget: () => void;
}> = ({ targetLocation, resetTarget }) => {
  const map = useMap();
  React.useEffect(() => {
    if (targetLocation) {
      map.flyTo(targetLocation, 14, { duration: 1.2 });
      resetTarget();
    }
  }, [targetLocation, map, resetTarget]);
  return null;
};

export const FloodMap: React.FC<FloodMapProps> = ({
  reports,
  predictedCells = [],
  userLocation,
  weather,
  onVoteStillFlooded,
  onVoteCleared,
  onOpenAnalytics,
  onOpenReroute,
}) => {
  const [activeFilter, setActiveFilter] = useState<MapFilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  // Layer toggles
  const [showRadar, setShowRadar] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Selected item for bottom sheet drawer
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(() => {
    return reports.find((r) => r.status === 'severe') || reports[0] || null;
  });
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);

  const initialCenter: [number, number] = userLocation || [
    PUNE_BOUNDS.center.lat,
    PUNE_BOUNDS.center.lng,
  ];

  // Search filter
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = PUNE_SEARCH_LOCALITIES.find((l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (match) {
      setFlyTarget([match.lat, match.lng]);
    }
  };

  const handleRecenter = () => {
    setFlyTarget(userLocation || [PUNE_BOUNDS.center.lat, PUNE_BOUNDS.center.lng]);
  };

  // Filter reports based on active filter chip
  const filteredReports = reports.filter((r) => {
    if (activeFilter === 'waterlogging') return true;
    if (activeFilter === 'road-closures') return !r.road_passable;
    if (activeFilter === 'safe-places' || activeFilter === 'emergency') return false;
    return true;
  });

  const shouldShowPredictions =
    activeFilter === 'all' || activeFilter === 'flood-risk';
  const shouldShowShelters =
    activeFilter === 'all' || activeFilter === 'safe-places';
  const shouldShowEmergency =
    activeFilter === 'all' || activeFilter === 'emergency';

  return (
    <div className="relative w-full h-[calc(100vh-130px)] bg-surface-container-low overflow-hidden">
      {/* 1. Leaflet Interactive GIS Canvas */}
      <MapContainer
        center={initialCenter}
        zoom={PUNE_BOUNDS.zoom}
        zoomControl={false}
        className="w-full h-full z-10"
        maxBounds={[
          [PUNE_BOUNDS.minLat - 0.1, PUNE_BOUNDS.minLng - 0.1],
          [PUNE_BOUNDS.maxLat + 0.1, PUNE_BOUNDS.maxLng + 0.1],
        ]}
      >
        <MapActionDispatcher
          targetLocation={flyTarget}
          resetTarget={() => setFlyTarget(null)}
        />
        <ZoomControl position="bottomright" />

        {/* Free High-Contrast OpenStreetMap Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* RainViewer Live Radar Tile Overlay */}
        {showRadar && <RainRadarLayer opacity={0.65} />}

        {/* Historical Flood Heatmap Layer */}
        {showHeatmap && <HeatmapLayer opacity={0.55} />}

        {/* Hydrological Predicted Risk Cells (Orange Dashed Outlines) */}
        {shouldShowPredictions && <PredictedCells cells={predictedCells} />}

        {/* Safe Relief Shelters & Emergency Rescue Stations */}
        <ShelterMapMarkers
          showShelters={shouldShowShelters}
          showEmergency={shouldShowEmergency}
          onSelectPlace={(place) => {
            setSelectedPlace(place);
            setSelectedReport(null);
            setIsSheetCollapsed(false);
          }}
        />

        {/* Ground Flood Reports (Depth-Scaled Circles + HTML DivIcon Pins) */}
        <HazardCircles
          reports={filteredReports}
          userLocation={userLocation}
          onVoteStillFlooded={onVoteStillFlooded}
          onVoteCleared={onVoteCleared}
          onSelectReport={(report) => {
            setSelectedReport(report);
            setSelectedPlace(null);
            setIsSheetCollapsed(false);
          }}
        />
      </MapContainer>

      {/* 2. Top Floating Search & Filter Bar (Matching live_flood_map template) */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col gap-2 pointer-events-none">
        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-surface-container-lowest/90 backdrop-blur-xl shadow-md border border-surface-container-high"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Baner, Aundh, Kothrud, Deccan, Katraj..."
            className="w-full bg-transparent text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
          <button
            type="submit"
            className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider shrink-0"
          >
            Locate
          </button>
        </form>

        {/* Filter Chips Bar (Scrollable) */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold shadow-xs transition-all ${
              activeFilter === 'all'
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-surface-container-lowest/90 backdrop-blur-md text-on-surface hover:bg-surface-container'
            }`}
          >
            All
          </button>

          <button
            onClick={() => setActiveFilter('flood-risk')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold shadow-xs transition-all flex items-center gap-1 ${
              activeFilter === 'flood-risk'
                ? 'bg-orange-600 text-white font-bold'
                : 'bg-surface-container-lowest/90 backdrop-blur-md text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">model_training</span>
            <span>Flood risk</span>
          </button>

          <button
            onClick={() => setActiveFilter('waterlogging')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold shadow-xs transition-all flex items-center gap-1 ${
              activeFilter === 'waterlogging'
                ? 'bg-error text-on-error font-bold'
                : 'bg-surface-container-lowest/90 backdrop-blur-md text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">water_damage</span>
            <span>Waterlogging</span>
          </button>

          <button
            onClick={() => setActiveFilter('road-closures')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold shadow-xs transition-all flex items-center gap-1 ${
              activeFilter === 'road-closures'
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-surface-container-lowest/90 backdrop-blur-md text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">block</span>
            <span>Road closures</span>
          </button>

          <button
            onClick={() => setActiveFilter('safe-places')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold shadow-xs transition-all flex items-center gap-1 ${
              activeFilter === 'safe-places'
                ? 'bg-secondary text-on-secondary font-bold'
                : 'bg-surface-container-lowest/90 backdrop-blur-md text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">shield</span>
            <span>Shelters</span>
          </button>

          <button
            onClick={() => setActiveFilter('emergency')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold shadow-xs transition-all flex items-center gap-1 ${
              activeFilter === 'emergency'
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-surface-container-lowest/90 backdrop-blur-md text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">local_hospital</span>
            <span>Emergency</span>
          </button>
        </div>

        {/* Live Weather / Doppler Layer Switchers */}
        <div className="pointer-events-auto flex items-center justify-between gap-2">
          {/* Weather Telemetry Pill */}
          <div className="bg-surface-container-lowest/95 backdrop-blur-md px-3 py-1 rounded-full shadow-xs border border-surface-container-high flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-[11px] font-semibold text-on-surface">
              Rain: <strong>{weather ? `${weather.currentRainMmHr} mm/h` : '18 mm/h'}</strong>
            </span>
            <span className="text-secondary font-bold text-[10px]">
              (R={weather?.rainFactor ?? '0.42'})
            </span>
          </div>

          <div className="flex items-center gap-1 bg-surface-container-lowest/95 backdrop-blur-md p-0.5 rounded-full shadow-xs border border-surface-container-high">
            <button
              onClick={() => setShowRadar(!showRadar)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                showRadar ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">radar</span>
              <span>Radar</span>
            </button>

            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                showHeatmap ? 'bg-error text-white' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">whatshot</span>
              <span>Heatmap</span>
            </button>

            {onOpenAnalytics && (
              <button
                onClick={onOpenAnalytics}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
                title="Pune Ward Hotspots"
              >
                <span className="material-symbols-outlined text-[14px]">bar_chart</span>
                <span>Stats</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Floating Mini Legend Pill (Bottom Left) */}
      <div className="absolute bottom-24 left-3 z-20 pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-md border border-surface-container-high text-[11px]">
        <span className="flex items-center gap-1 font-semibold text-on-surface">
          <span className="w-2.5 h-2.5 rounded-full bg-error" /> Observed
        </span>
        <span className="flex items-center gap-1 font-semibold text-on-surface">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500/70" /> Predicted
        </span>
        <span className="flex items-center gap-1 font-semibold text-on-surface">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary" /> Shelter
        </span>
      </div>

      {/* 4. Floating Recenter Location Button (Bottom Right) */}
      <button
        onClick={handleRecenter}
        title="Recenter on my location"
        className="absolute bottom-24 right-3 z-20 w-11 h-11 rounded-full bg-surface-container-lowest/95 backdrop-blur-md text-primary shadow-lg border border-surface-container-high flex items-center justify-center active:scale-95 transition-transform hover:bg-surface-container"
        type="button"
      >
        <span className="material-symbols-outlined text-[22px]">my_location</span>
      </button>

      {/* 5. Translucent Frosted-Glass Bottom Sheet / Incident Drawer */}
      {(selectedReport || selectedPlace) && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 max-w-lg mx-auto ${
            isSheetCollapsed ? 'translate-y-[calc(100%-42px)]' : 'translate-y-0'
          }`}
        >
          <div className="bg-surface-container-lowest/95 backdrop-blur-2xl border-t border-x border-surface-container-high rounded-t-3xl shadow-2xl p-4 flex flex-col gap-2.5 pb-safe">
            {/* Grab Handle */}
            <button
              onClick={() => setIsSheetCollapsed(!isSheetCollapsed)}
              className="w-12 h-1 rounded-full bg-outline-variant/60 mx-auto -mt-1 cursor-pointer hover:bg-outline-variant transition-colors"
              aria-label="Toggle drawer"
            />

            {/* Case A: Ground Hazard Selected */}
            {selectedReport && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          selectedReport.status === 'severe'
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {selectedReport.status === 'severe'
                          ? 'Observed Waterlogging'
                          : 'Unverified Report'}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">90m TTL</span>
                    </div>
                    <h2 className="font-bold text-sm text-on-surface truncate mt-1">
                      {selectedReport.road_passable
                        ? 'Waterlogged Corridor'
                        : 'ROAD CLOSURE: Submerged Segment'}
                    </h2>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-extrabold text-base text-error capitalize">
                      {selectedReport.depth}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">Water depth</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-surface-container text-xs">
                  <div className="flex items-center gap-1.5 text-on-surface-variant min-w-0">
                    <span className="material-symbols-outlined text-[16px] text-error shrink-0">
                      warning
                    </span>
                    <span className="truncate">
                      {selectedReport.confirms} verifications •{' '}
                      {selectedReport.road_passable ? 'Traffic slow' : 'Avoid underpass'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onVoteStillFlooded?.(selectedReport.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
                    >
                      Confirm
                    </button>

                    <button
                      onClick={() => onOpenReroute?.(selectedReport.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/95 text-on-secondary text-xs font-bold shadow-xs flex items-center gap-1 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">alt_route</span>
                      <span>Reroute</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Case B: Safe Place / Shelter Selected */}
            {selectedPlace && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider w-fit">
                      {selectedPlace.statusText}
                    </span>
                    <h2 className="font-bold text-sm text-on-surface truncate mt-1">
                      {selectedPlace.name}
                    </h2>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      {selectedPlace.address}
                    </span>
                  </div>

                  <div className="w-9 h-9 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {selectedPlace.category === 'shelter' ? 'shield' : 'local_hospital'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant leading-snug">
                  {selectedPlace.advisory}
                </p>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-surface-container">
                  <span className="text-[11px] text-secondary font-bold">
                    Higher ground facility
                  </span>
                  <button
                    onClick={() => onOpenReroute?.()}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[16px]">directions</span>
                    <span>Get Directions</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
