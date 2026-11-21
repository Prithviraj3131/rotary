import React, { useState } from 'react';
import { DemoBadge } from '../common/DemoBadge';

interface ReportConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  depth: string;
  locationName: string;
  onViewOnMap: () => void;
}

export const ReportConfirmationModal: React.FC<ReportConfirmationModalProps> = ({
  isOpen,
  onClose,
  reportId,
  depth,
  locationName,
  onViewOnMap,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const displayId = `#FG-PUN-${reportId.slice(-4).toUpperCase()}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(displayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-primary/45 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-surface rounded-3xl shadow-2xl border border-surface-container-high flex flex-col overflow-hidden animate-scale-up">
        {/* Top Celebration Icon */}
        <div className="p-6 pb-2 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-secondary-container/60 flex items-center justify-center shadow-inner">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-md">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <h2 className="font-extrabold text-xl text-on-surface">Report Logged</h2>
              <DemoBadge label="REALTIME SYNC" />
            </div>
            <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
              Thank you for alerting your Pune neighborhood. Nearby commuters and authorities have received the hazard marker.
            </p>
          </div>

          {/* Copy Report ID Pill */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-xs font-mono font-semibold text-primary"
            type="button"
          >
            <span className="text-[10px] text-on-surface-variant uppercase font-sans">Report ID</span>
            <span>{displayId}</span>
            <span className="material-symbols-outlined text-[15px] text-secondary">
              {copied ? 'done' : 'content_copy'}
            </span>
          </button>
        </div>

        {/* Incident Summary Card */}
        <div className="px-6 py-3 flex flex-col gap-2.5">
          <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-3.5 flex flex-col gap-2 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-secondary-container/50 text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">water_damage</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold">Severity</span>
                  <span className="text-xs font-bold text-on-surface capitalize">{depth} Waterlogging</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                Unverified (R=1.0)
              </span>
            </div>

            <div className="h-px bg-surface-container w-full" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-surface-container text-on-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold">Location</span>
                <span className="text-xs font-medium text-on-surface truncate">{locationName}</span>
              </div>
            </div>
          </div>

          {/* 3-Step Verification Pipeline */}
          <div className="rounded-2xl bg-surface-container-low p-3 flex flex-col gap-2 border border-surface-container">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Verification State Machine
            </span>
            <div className="flex items-center justify-between text-center text-[10px]">
              <div className="flex flex-col items-center gap-1 flex-1">
                <span className="w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-[10px]">
                  ✓
                </span>
                <span className="font-bold text-secondary">Logged</span>
              </div>
              <div className="h-0.5 flex-1 bg-surface-container-high -mt-3 mx-1">
                <div className="h-full bg-secondary w-2/3" />
              </div>
              <div className="flex flex-col items-center gap-1 flex-1">
                <span className="w-5 h-5 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-[10px]">
                  2
                </span>
                <span className="text-on-surface-variant">Nearby Votes</span>
              </div>
              <div className="h-0.5 flex-1 bg-surface-container-high -mt-3 mx-1" />
              <div className="flex flex-col items-center gap-1 flex-1">
                <span className="w-5 h-5 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-[10px]">
                  3
                </span>
                <span className="text-on-surface-variant">Confirmed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 pt-2 bg-surface flex items-center gap-2 border-t border-surface-container">
          <button
            onClick={onViewOnMap}
            className="flex-1 py-2.5 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">map</span>
            <span>View on Map</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/95 text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
