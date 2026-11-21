import React, { useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { PUNE_BOUNDS } from '../../config/puneConfig';
import { ReportRow, CellRiskRow } from '../../types/database';
import { HazardCircles } from './HazardCircles';
import { MapLegend } from './MapLegend';
import { RainRadarLayer } from './RainRadarLayer';
import { PredictedCells } from './PredictedCells';
import { HeatmapLayer } from './HeatmapLayer';
import { WeatherData } from '../../lib/weather';
import { DemoBadge } from '../common/DemoBadge';

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
}

const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
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
}) => {
  const [showRadar, setShowRadar] = useState(false);
  const [showPredictions, setShowPredictions] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  const initialCenter: [number, number] = userLocation || [PUNE_BOUNDS.center.lat, PUNE_BOUNDS.center.lng];

  return (
    <div className="relative w-full h-full bg-surface-container-low overflow-hidden">
      {/* Leaflet Map Canvas */}
      <MapContainer
        center={initialCenter}
        zoom={PUNE_BOUNDS.zoom}
        zoomControl={false}
        className="w-full h-full z-10"
        maxBounds={[
          [PUNE_BOUNDS.minLat - 0.1, PUNE_BOUNDS.minLng - 0.1],
          [PUNE_BOUNDS.maxLat + 0.1, PUNE_BOUNDS.maxLng + 0.1]
        ]}
      >
        <MapController center={initialCenter} />
        <ZoomControl position="bottomright" />

        {/* Free OpenStreetMap Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* RainViewer Live Radar Tile Overlay */}
        {showRadar && <RainRadarLayer opacity={0.6} />}

        {/* Historical Flood Heatmap Layer (Section 6.8) */}
        {showHeatmap && <HeatmapLayer opacity={0.55} />}

        {/* Predicted Risk Zones (Orange Dashed Outline, Never 'Flooded') */}
        {showPredictions && <PredictedCells cells={predictedCells} />}

        {/* Ground flood reports (Red / Yellow Circles) */}
        <HazardCircles
          reports={reports}
          userLocation={userLocation}
          onVoteStillFlooded={onVoteStillFlooded}
          onVoteCleared={onVoteCleared}
        />
      </MapContainer>

      {/* Floating Top Bar (Live Telemetry & Controls) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Weather Telemetry Pill */}
        <div className="pointer-events-auto bg-surface-container-lowest/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-surface-container-high flex items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
            </span>
            <span className="font-semibold text-on-surface">Pune Live:</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">rainy</span>
            <strong className="text-primary font-bold">
              {weather ? `${weather.currentRainMmHr} mm/hr` : '18 mm/hr'}
            </strong>
          </div>

          {weather && (
            <>
              <span className="text-outline-variant">•</span>
              <span className="text-secondary font-bold text-[11px]">
                R = {weather.rainFactor}
              </span>
              {weather.isDemo && <DemoBadge />}
            </>
          )}
        </div>

        {/* Layer Switchers */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-surface-container-lowest/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-surface-container-high">
          {/* Prediction Layer Toggle */}
          <button
            onClick={() => setShowPredictions(!showPredictions)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              showPredictions ? 'bg-orange-600 text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">model_training</span>
            Predictions
          </button>

          {/* Historical Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              showHeatmap ? 'bg-error text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">whatshot</span>
            Heatmap
          </button>

          {/* Analytics Drawer Button */}
          {onOpenAnalytics && (
            <button
              onClick={onOpenAnalytics}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-all flex items-center gap-1"
              title="View Ward Flood Analytics"
            >
              <span className="material-symbols-outlined text-[15px]">bar_chart</span>
              <span>Stats</span>
            </button>
          )}

          {/* Rain Radar Toggle */}
          <button
            onClick={() => setShowRadar(!showRadar)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              showRadar ? 'bg-secondary text-on-secondary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">radar</span>
          </button>

          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
              showLegend ? 'bg-surface-container text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Toggle Legend"
          >
            <span className="material-symbols-outlined text-[18px]">layers</span>
          </button>
        </div>
      </div>

      {/* Floating Legend */}
      {showLegend && (
        <div className="absolute bottom-6 left-4 z-20 pointer-events-auto">
          <MapLegend />
        </div>
      )}

      {/* Footer Ground Rule Disclaimer */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="bg-surface/90 backdrop-blur-md px-3 py-1 rounded-full border border-surface-container-high shadow-xs text-[10px] text-on-surface-variant text-center max-w-sm sm:max-w-md">
          Predicted from rain and terrain. Not a confirmed flood and not an official warning.
        </div>
      </div>
    </div>
  );
};
