import React, { useState } from 'react';
import { ReportRow } from '../../types/database';
import { DemoBadge } from '../common/DemoBadge';

interface AlertsCentreModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: ReportRow[];
  onViewOnMap: (report: ReportRow) => void;
  onFindReroute: (report: ReportRow) => void;
}

type FilterType = 'all' | 'radius' | 'critical' | 'closures';

export const AlertsCentreModal: React.FC<AlertsCentreModalProps> = ({
  isOpen,
  onClose,
  reports,
  onViewOnMap,
  onFindReroute,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

  if (!isOpen) return null;

  // Filter logic
  const filteredReports = reports.filter((r) => {
    if (filter === 'critical') return r.status === 'severe' || r.depth === 'waist';
    if (filter === 'closures') return !r.road_passable;
    if (filter === 'radius') return true; // All in Pune bounds demo
    return true;
  });

  const criticalCount = reports.filter((r) => r.status === 'severe' || r.depth === 'waist').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-primary/40 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-surface-container-high flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 bg-surface/90 backdrop-blur-xl border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                campaign
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-base text-on-surface truncate">Pune Alert Centre</h2>
                <DemoBadge label="LIVE FEED" />
              </div>
              <span className="text-xs text-on-surface-variant truncate">
                {criticalCount} Critical Inundation Advisories Active
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2.5 bg-surface-container-low border-b border-surface-container flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
              filter === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All ({reports.length})
          </button>
          <button
            onClick={() => setFilter('radius')}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
              filter === 'radius'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
            }`}
          >
            500m Radius
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
              filter === 'critical'
                ? 'bg-error text-on-error shadow-xs'
                : 'bg-surface-container-lowest text-error hover:bg-error-container'
            }`}
          >
            Critical Only ({criticalCount})
          </button>
          <button
            onClick={() => setFilter('closures')}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
              filter === 'closures'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Road Closures
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {filteredReports.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[36px] text-secondary">verified</span>
              <span>No flood advisories matching current filter.</span>
            </div>
          ) : (
            filteredReports.map((report) => {
              const isCritical = report.status === 'severe' || report.depth === 'waist';
              return (
                <div
                  key={report.id}
                  className="rounded-xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-2.5 shadow-xs hover:border-secondary transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCritical
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isCritical ? 'crisis_alert' : 'warning'}
                      </span>
                      {isCritical ? 'CRITICAL FLOOD WARNING' : 'HAZARD REPORT'}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      TTL: 90m active
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="font-bold text-sm text-on-surface">
                      {report.road_passable ? 'Impeded Roadway' : 'ROAD CLOSURE: Submerged Segment'}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                      Depth: <span className="font-semibold capitalize text-on-surface">{report.depth}</span> • {report.confirms} community verifications • Status: <span className="font-semibold capitalize">{report.status}</span>.
                      {!report.road_passable && ' Vehicles stalled; avoid crossing moving water.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-surface-container mt-1">
                    <button
                      onClick={() => onViewOnMap(report)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">map</span>
                      <span>View on map</span>
                    </button>
                    <button
                      onClick={() => onFindReroute(report)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">alt_route</span>
                      <span>Find reroute</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
