import React from 'react';
import { Circle } from 'react-leaflet';
import { PUNE_HOTSPOTS } from '../../config/puneConfig';

interface HeatmapLayerProps {
  opacity?: number;
}

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ opacity = 0.5 }) => {
  // Historical hotspot cluster radii based on flood recurrence in Pune
  return (
    <>
      {PUNE_HOTSPOTS.map((spot) => {
        const isSevere = spot.historicalSeverity === 'severe';
        const color = isSevere ? '#dc2626' : '#ea580c';
        const radius = isSevere ? 750 : 500;

        return (
          <React.Fragment key={spot.id}>
            {/* Outer halo */}
            <Circle
              center={[spot.lat, spot.lng]}
              radius={radius}
              pathOptions={{
                color: 'transparent',
                fillColor: color,
                fillOpacity: opacity * 0.25,
                stroke: false,
              }}
            />
            {/* Core heat intensity */}
            <Circle
              center={[spot.lat, spot.lng]}
              radius={radius * 0.45}
              pathOptions={{
                color: color,
                weight: 1,
                fillColor: color,
                fillOpacity: opacity * 0.6,
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};
