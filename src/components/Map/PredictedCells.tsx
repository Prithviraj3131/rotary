import React from 'react';
import { Rectangle, Popup } from 'react-leaflet';
import { CellRiskRow } from '../../types/database';
import { PUNE_BOUNDS } from '../../config/puneConfig';

interface PredictedCellItem extends CellRiskRow {
  lat: number;
  lng: number;
  s: number;
  elevation: number;
}

interface PredictedCellsProps {
  cells: PredictedCellItem[];
}

const LAT_STEP = (PUNE_BOUNDS.maxLat - PUNE_BOUNDS.minLat) / 20;
const LNG_STEP = (PUNE_BOUNDS.maxLng - PUNE_BOUNDS.minLng) / 20;

export const PredictedCells: React.FC<PredictedCellsProps> = ({ cells }) => {
  // Only render cells with risk >= 0.4 (Ground Rule: below 0.4 shows nothing)
  const visibleCells = cells.filter((c) => c.band !== 'none');

  return (
    <>
      {visibleCells.map((cell) => {
        const isLikely = cell.band === 'likely_affected';
        const scoreOutOf100 = Math.round(cell.risk * 100);

        // Rectangular cell bounds
        const southWest: [number, number] = [cell.lat - LAT_STEP / 2, cell.lng - LNG_STEP / 2];
        const northEast: [number, number] = [cell.lat + LAT_STEP / 2, cell.lng + LNG_STEP / 2];

        // Orange dashed outline and lighter fill (Ground Rule 1)
        const strokeColor = isLikely ? '#c2410c' : '#ea580c';
        const fillColor = isLikely ? '#ea580c' : '#f97316';
        const fillOpacity = isLikely ? 0.35 : 0.20;

        return (
          <Rectangle
            key={cell.cell_id}
            bounds={[southWest, northEast]}
            pathOptions={{
              color: strokeColor,
              dashArray: '6, 6',
              weight: isLikely ? 2.5 : 1.5,
              fillColor: fillColor,
              fillOpacity: fillOpacity,
            }}
          >
            <Popup className="predicted-cell-popup">
              <div className="p-1 space-y-2 max-w-[280px] text-xs">
                {/* Header */}
                <div className="border-b border-surface-container-high pb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm border-2 border-dashed border-orange-600 bg-orange-500/30"></span>
                    <span className="font-bold text-xs uppercase tracking-wide text-orange-900">
                      {isLikely ? 'Likely Affected (Predicted)' : 'Possible (Predicted)'}
                    </span>
                  </div>
                  <span className="text-[10px] bg-orange-100 text-orange-900 px-1.5 py-0.2 rounded font-bold">
                    PREDICTION
                  </span>
                </div>

                {/* Score as a number out of 100 (Ground Rule: Never percentage chance) */}
                <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-xl flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-orange-800 font-medium uppercase tracking-wider">
                      Composite Risk Score
                    </span>
                    <span className="font-extrabold text-base text-orange-950">
                      Score {scoreOutOf100} / 100
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-orange-800 px-2 py-0.5 rounded bg-orange-200/60">
                    {isLikely ? 'Likely Affected' : 'Possible'}
                  </span>
                </div>

                {/* Top 3 Input Breakdown (Ground Rule 5: Show inputs for every number) */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Model Input Contributions
                  </span>
                  <div className="space-y-1 text-[11px] bg-surface-container-low p-2 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">1. Susceptibility (S):</span>
                      <strong className="text-on-surface">{cell.inputs.s}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">2. Rain Factor (R):</span>
                      <strong className="text-on-surface">{cell.inputs.r} ({cell.inputs.rain_mm_hr} mm/h)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">3. Downstream Spread:</span>
                      <strong className="text-on-surface">+{cell.inputs.spread}</strong>
                    </div>
                  </div>
                </div>

                {/* Telemetry info */}
                <div className="flex items-center justify-between text-[10px] text-on-surface-variant px-1">
                  <span>Elevation: <strong>{cell.elevation}m</strong></span>
                  <span>Source: <strong>{cell.inputs.rain_source}</strong></span>
                </div>

                {/* Mandatory Disclaimer (Ground Rule 1 & Section 3) */}
                <div className="pt-1.5 border-t border-surface-container-high text-[9px] text-on-surface-variant leading-tight text-center italic">
                  "Predicted from rain and terrain. Not a confirmed flood and not an official warning."
                </div>
              </div>
            </Popup>
          </Rectangle>
        );
      })}
    </>
  );
};
