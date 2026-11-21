import React, { useState } from 'react';
import { Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ReportRow } from '../../types/database';
import { DEPTH_LEVELS } from '../../types/reports';
import { DemoBadge } from '../common/DemoBadge';
import { canUserVote } from '../../lib/trustEngine';

interface HazardCirclesProps {
  reports: ReportRow[];
  userLocation?: [number, number] | null;
  onVoteStillFlooded?: (reportId: string) => void;
  onVoteCleared?: (reportId: string) => void;
  onSelectReport?: (report: ReportRow) => void;
}

const DEPTH_DISPLAY: Record<string, string> = {
  ankle: '15cm',
  knee: '35cm',
  waist: '60cm',
  vehicle_stalls: '80cm+',
};

export const HazardCircles: React.FC<HazardCirclesProps> = ({
  reports,
  userLocation,
  onVoteStillFlooded,
  onVoteCleared,
  onSelectReport,
}) => {
  const [voteFeedback, setVoteFeedback] = useState<{ [id: string]: string }>({});
  const now = Date.now();
  const EXPIRY_MS = 90 * 60 * 1000; // 90 minutes lifetime

  // Filter out expired or cleared reports
  const activeReports = reports.filter((r) => {
    if (r.status === 'cleared') return false;
    const observedTime = new Date(r.observed_at).getTime();
    return now - observedTime < EXPIRY_MS;
  });

  const handleVote = (report: ReportRow, type: 'still_flooded' | 'cleared') => {
    if (userLocation) {
      const check = canUserVote(userLocation[0], userLocation[1], report.lat, report.lng);
      if (!check.allowed && !report.is_demo) {
        setVoteFeedback((prev) => ({
          ...prev,
          [report.id]: `Too far to vote (${check.distanceMeters}m away, must be within 300m)`,
        }));
        return;
      }
    }

    if (type === 'still_flooded') {
      onVoteStillFlooded?.(report.id);
      setVoteFeedback((prev) => ({
        ...prev,
        [report.id]: 'Voted: Still Flooded (Life extended)',
      }));
    } else {
      onVoteCleared?.(report.id);
      setVoteFeedback((prev) => ({
        ...prev,
        [report.id]: 'Voted: Cleared',
      }));
    }
  };

  return (
    <>
      {activeReports.map((report) => {
        const observedTime = new Date(report.observed_at).getTime();
        const ageMs = Math.max(0, now - observedTime);
        const ageFraction = ageMs / EXPIRY_MS; // 0 (brand new) -> 1 (expired)

        // Opacity falls with age and reaches near zero at 90m
        const baseOpacity = report.status === 'unverified' ? 0.35 : 0.65;
        const fillOpacity = Math.max(0.1, baseOpacity * (1 - ageFraction));
        const strokeOpacity = Math.max(0.2, 0.9 * (1 - ageFraction));

        // Depth radius
        const depthConfig = DEPTH_LEVELS[report.depth] || DEPTH_LEVELS.ankle;
        const radius = depthConfig.radius_m;

        // Color coding
        const isSevere = report.status === 'severe';
        const isConfirmed = report.status === 'confirmed';
        const isSevereOrConfirmed = isSevere || isConfirmed;
        const color = isSevere ? '#ba1a1a' : isConfirmed ? '#d94848' : '#d97706';
        const fillColor = isSevereOrConfirmed ? '#ba1a1a' : '#f59e0b';

        const depthText = DEPTH_DISPLAY[report.depth] || '30cm';

        // Custom Leaflet DivIcon matching template: solid red pin with depth pill or outlined unverified pin
        const markerIcon = L.divIcon({
          className: 'custom-hazard-pin',
          html: isSevereOrConfirmed
            ? `
              <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                <div style="width: 38px; height: 38px; border-radius: 50%; background: #ba1a1a; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(186,26,26,0.5); border: 2.5px solid white;">
                  <span class="material-symbols-outlined" style="font-size: 22px;">water_damage</span>
                </div>
                <span style="margin-top: 3px; padding: 1.5px 7px; border-radius: 9999px; background: #ba1a1a; color: white; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">${depthText}</span>
              </div>
            `
            : `
              <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                <div style="width: 34px; height: 34px; border-radius: 50%; background: #ffffff; color: #191c1c; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.15); border: 2.5px solid #d97706;">
                  <span class="material-symbols-outlined" style="font-size: 18px; color: #d97706;">report</span>
                </div>
                <span style="margin-top: 3px; padding: 1px 6px; border-radius: 9999px; background: #ffffff; color: #191c1c; font-size: 9px; font-weight: bold; border: 1px solid #d97706; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Unverified</span>
              </div>
            `,
          iconSize: [44, 56],
          iconAnchor: [22, 54],
        });

        return (
          <React.Fragment key={report.id}>
            {/* 1. Inundation Spread Perimeter (Depth-Scaled Circle) */}
            <Circle
              center={[report.lat, report.lng]}
              radius={radius}
              eventHandlers={{
                click: () => onSelectReport?.(report),
              }}
              pathOptions={{
                color: color,
                weight: isSevereOrConfirmed ? 3 : 1.5,
                opacity: strokeOpacity,
                fillColor: fillColor,
                fillOpacity: fillOpacity,
              }}
            />

            {/* 2. Floating Marker Pin with Depth Badge */}
            <Marker
              position={[report.lat, report.lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => onSelectReport?.(report),
              }}
            >
              <Popup className="flood-popup">
                <div className="p-1 space-y-2 max-w-[280px]">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-1 border-b pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isSevere ? 'bg-error animate-pulse' : isConfirmed ? 'bg-error' : 'bg-amber-500'
                        }`}
                      ></span>
                      <span className="font-bold text-xs uppercase tracking-wider text-on-surface">
                        {report.status} FLOOD
                      </span>
                    </div>
                    {report.is_demo && <DemoBadge />}
                  </div>

                  {/* Photo */}
                  {report.photo_url ? (
                    <div className="relative w-full h-28 rounded-lg overflow-hidden bg-surface-container">
                      <img
                        src={report.photo_url}
                        alt="Flood evidence"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-primary/80 text-[10px] text-on-primary">
                        Live Camera
                      </div>
                    </div>
                  ) : null}

                  {/* Telemetry & Depth info */}
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant font-medium">Water Depth:</span>
                      <span className="font-bold text-error uppercase">{report.depth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant font-medium">Road Status:</span>
                      <span className="font-semibold text-on-surface">
                        {report.road_passable ? 'Impeded' : 'Impassable'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant font-medium">Verifications:</span>
                      <span className="font-semibold text-on-surface">
                        {report.confirms} confirms • {report.clears} clears
                      </span>
                    </div>
                  </div>

                  {/* Feedback Message */}
                  {voteFeedback[report.id] && (
                    <div className="p-1.5 bg-surface-container rounded text-[11px] text-primary font-semibold text-center">
                      {voteFeedback[report.id]}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 border-t flex gap-1.5">
                    <button
                      onClick={() => handleVote(report, 'still_flooded')}
                      className="flex-1 py-1 px-2 rounded bg-error/10 hover:bg-error/20 text-error font-bold text-[11px] transition-colors"
                    >
                      Still Flooded
                    </button>
                    <button
                      onClick={() => handleVote(report, 'cleared')}
                      className="flex-1 py-1 px-2 rounded bg-secondary/10 hover:bg-secondary/20 text-secondary font-bold text-[11px] transition-colors"
                    >
                      Cleared
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
};
