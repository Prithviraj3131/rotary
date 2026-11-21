import React, { useState } from 'react';
import { ReportRow } from '../../types/database';
import { findBlockingHazard, PRESET_PUNE_ROUTES } from '../../lib/routingService';
import { DemoBadge } from '../common/DemoBadge';

interface SavedRoutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: ReportRow[];
  onSelectRoute: (routeId: string) => void;
}

export const SavedRoutesModal: React.FC<SavedRoutesModalProps> = ({
  isOpen,
  onClose,
  reports,
  onSelectRoute,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState(PRESET_PUNE_ROUTES[0].id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-2xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">
              bookmark_added
            </span>
            <div>
              <h2 className="font-bold text-sm text-on-surface">Saved Commute Corridors</h2>
              <span className="text-[10px] text-on-surface-variant">200m Hazard Proximity Monitor</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <DemoBadge />
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          The system continuously evaluates your saved routes against incoming confirmed reports. If waterlogging occurs within 200m of your path, an alert is automatically triggered.
        </p>

        {/* Routes List */}
        <div className="flex flex-col gap-3">
          {PRESET_PUNE_ROUTES.map((route) => {
            const hazardBlock = findBlockingHazard(route.baselinePath, reports);
            const isBlocked = Boolean(hazardBlock);
            const isSelected = selectedRouteId === route.id;

            return (
              <div
                key={route.id}
                onClick={() => {
                  setSelectedRouteId(route.id);
                  onSelectRoute(route.id);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected ? 'ring-2 ring-primary shadow-sm' : ''
                } ${
                  isBlocked
                    ? 'bg-error-container/30 border-error/40 hover:border-error'
                    : 'bg-surface-container-low border-surface-container-high hover:border-secondary'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-on-surface truncate">{route.name}</span>
                    <span className="text-[10px] text-on-surface-variant">
                      {route.origin.name} $\rightarrow$ {route.destination.name}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      isBlocked ? 'bg-error text-on-error' : 'bg-secondary text-on-secondary'
                    }`}
                  >
                    {isBlocked ? 'CORRIDOR BLOCKED' : 'REPORTED CLEAR'}
                  </span>
                </div>

                {/* Conflict Notice if Hazard Present */}
                {hazardBlock && (
                  <div className="text-[11px] text-error font-medium flex items-center gap-1 bg-white/80 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-[15px]">warning</span>
                    <span>{hazardBlock.message}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
