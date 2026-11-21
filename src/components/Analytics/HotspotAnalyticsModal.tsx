import React from 'react';
import { DemoBadge } from '../common/DemoBadge';

interface HotspotAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HISTORICAL_HOTSPOTS = [
  { rank: 1, name: 'Ambil Odha / Katraj Basin', ward: 'Ward 14 (South)', count: 24, lastEvent: '2019 Overflow', status: 'Critical' },
  { rank: 2, name: 'Sinhagad Road / Vitthalwadi Canal', ward: 'Ward 12 (West)', count: 19, lastEvent: '2023 Monsoon', status: 'High' },
  { rank: 3, name: 'Sangamwadi Bridge & Confluence', ward: 'Ward 4 (Central)', count: 14, lastEvent: '2024 Spills', status: 'High' },
  { rank: 4, name: 'Deccan Gymkhana / Karve Rd', ward: 'Ward 8 (Deccan)', count: 12, lastEvent: '2024 Monsoon', status: 'Moderate' },
  { rank: 5, name: 'Yerawada / Shastri Nagar Chowk', ward: 'Ward 2 (East)', count: 9, lastEvent: '2023 Rains', status: 'Moderate' },
];

export const HotspotAnalyticsModal: React.FC<HotspotAnalyticsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-2xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">bar_chart</span>
            <div>
              <h2 className="font-bold text-sm text-on-surface">Pune Flood Analytics &amp; Hotspots</h2>
              <span className="text-[10px] text-on-surface-variant">Historical Inundation Frequency</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <DemoBadge label="PMC SEEDED" />
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Aggregated recurrence counts across Pune municipal wards. Locations with $\ge 3$ past events form the baseline flood-prone heatmap layer.
        </p>

        {/* Hotspot Rankings Table */}
        <div className="flex flex-col gap-2">
          {HISTORICAL_HOTSPOTS.map((spot) => (
            <div
              key={spot.rank}
              className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-surface-container-high text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  #{spot.rank}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-on-surface truncate">{spot.name}</span>
                  <span className="text-[10px] text-on-surface-variant">
                    {spot.ward} • Last: {spot.lastEvent}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-primary text-xs">{spot.count} events</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  spot.status === 'Critical' ? 'bg-error text-on-error' : 'bg-amber-100 text-amber-900'
                }`}>
                  {spot.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-colors mt-1"
        >
          Close Analytics
        </button>
      </div>
    </div>
  );
};
