import React, { useState } from 'react';
import { Circle, Popup } from 'react-leaflet';
import { ReportRow } from '../../types/database';
import { DEPTH_LEVELS } from '../../types/reports';
import { DemoBadge } from '../common/DemoBadge';
import { canUserVote } from '../../lib/trustEngine';

interface HazardCirclesProps {
  reports: ReportRow[];
  userLocation?: [number, number] | null;
  onVoteStillFlooded?: (reportId: string) => void;
  onVoteCleared?: (reportId: string) => void;
}

export const HazardCircles: React.FC<HazardCirclesProps> = ({
  reports,
  userLocation,
  onVoteStillFlooded,
  onVoteCleared,
}) => {
  const [voteFeedback, setVoteFeedback] = useState<{ [id: string]: string }>({});
  const now = Date.now();
  const EXPIRY_MS = 90 * 60 * 1000; // 90 minutes lifetime

  // Filter out expired or cleared reports
  const activeReports = reports.filter(r => {
    if (r.status === 'cleared') return false;
    const observedTime = new Date(r.observed_at).getTime();
    return (now - observedTime) < EXPIRY_MS;
  });

  const handleVote = (report: ReportRow, type: 'still_flooded' | 'cleared') => {
    if (userLocation) {
      const check = canUserVote(userLocation[0], userLocation[1], report.lat, report.lng);
      // In demo mode or if within 300m, allow vote
      if (!check.allowed && !report.is_demo) {
        setVoteFeedback(prev => ({
          ...prev,
          [report.id]: `Too far to vote (${check.distanceMeters}m away, must be within 300m)`
        }));
        return;
      }
    }

    if (type === 'still_flooded') {
      onVoteStillFlooded?.(report.id);
      setVoteFeedback(prev => ({
        ...prev,
        [report.id]: 'Voted: Still Flooded (Life extended)'
      }));
    } else {
      onVoteCleared?.(report.id);
      setVoteFeedback(prev => ({
        ...prev,
        [report.id]: 'Voted: Cleared'
      }));
    }
  };

  return (
    <>
      {activeReports.map(report => {
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

        // Color coding: Red for confirmed/severe, Yellow for unverified
        const isSevere = report.status === 'severe';
        const isConfirmed = report.status === 'confirmed';
        const isSevereOrConfirmed = isSevere || isConfirmed;
        const color = isSevere ? '#ba1a1a' : isConfirmed ? '#d94848' : '#d97706';
        const fillColor = isSevereOrConfirmed ? '#ba1a1a' : '#f59e0b';

        const minutesAgo = Math.floor(ageMs / 60000);
        const isUncertain = report.clears > 0 && report.confirms > 0;

        return (
          <Circle
            key={report.id}
            center={[report.lat, report.lng]}
            radius={radius}
            pathOptions={{
              color: color,
              weight: isSevereOrConfirmed ? 3 : 1.5,
              opacity: strokeOpacity,
              fillColor: fillColor,
              fillOpacity: fillOpacity,
            }}
          >
            <Popup className="flood-popup">
              <div className="p-1 space-y-2 max-w-[280px]">
                {/* Header */}
                <div className="flex items-center justify-between gap-1 border-b pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      isSevere ? 'bg-error animate-pulse' : isConfirmed ? 'bg-error' : 'bg-amber-500'
                    }`}></span>
                    <span className="font-bold text-xs uppercase tracking-wider text-on-surface">
                      {report.status} FLOOD
                    </span>
                  </div>
                  {report.is_demo && <DemoBadge />}
                </div>

                {/* Uncertainty chip if conflicting votes */}
                {isUncertain && (
                  <div className="bg-amber-100/80 border border-amber-300 text-amber-900 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">warning</span>
                    Uncertain: Conflicting reports. Confirmations needed.
                  </div>
                )}

                {/* Evidence Photo */}
                {report.photo_url ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-surface-container">
                    <img
                      src={report.photo_url}
                      alt="Flood evidence"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-primary/80 text-[10px] text-on-primary">
                      Live Camera
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-on-surface-variant italic bg-surface-container-low p-2 rounded">
                    No photo attached
                  </div>
                )}

                {/* Telemetry & Depth info */}
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div className="bg-surface-container-low p-1.5 rounded">
                    <span className="text-[10px] text-on-surface-variant block">Depth</span>
                    <span className="font-bold text-on-surface">{depthConfig.label}</span>
                  </div>
                  <div className="bg-surface-container-low p-1.5 rounded">
                    <span className="text-[10px] text-on-surface-variant block">Reported</span>
                    <span className="font-bold text-on-surface">{minutesAgo}m ago</span>
                  </div>
                </div>

                {/* Trust & Confirmations */}
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1">
                  <span>Confirms: <strong className="text-secondary">{report.confirms}</strong></span>
                  <span>Clears: <strong className="text-on-surface">{report.clears}</strong></span>
                  <span>Radius: <strong>{radius}m</strong></span>
                </div>

                {/* Feedback note if any */}
                {voteFeedback[report.id] && (
                  <div className="text-[10px] text-secondary font-medium bg-secondary-container/30 px-2 py-1 rounded">
                    {voteFeedback[report.id]}
                  </div>
                )}

                {/* Crowd Verification Actions */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t">
                  <button
                    onClick={() => handleVote(report, 'still_flooded')}
                    className="py-1.5 px-2 bg-error-container text-on-error-container hover:bg-error/20 active:scale-95 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px]">water_drop</span>
                    Still Flooded
                  </button>
                  <button
                    onClick={() => handleVote(report, 'cleared')}
                    className="py-1.5 px-2 bg-surface-container hover:bg-surface-container-high active:scale-95 text-xs font-semibold rounded text-on-surface flex items-center justify-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    Cleared
                  </button>
                </div>
              </div>
            </Popup>
          </Circle>
        );
      })}
    </>
  );
};
