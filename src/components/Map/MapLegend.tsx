import React from 'react';

export const MapLegend: React.FC = () => {
  return (
    <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-3 border border-surface-container-high shadow-md text-xs space-y-2 select-none max-w-[260px]">
      <div className="flex items-center justify-between border-b border-surface-container-high pb-1.5">
        <span className="font-bold text-on-surface uppercase tracking-wide text-[11px]">Map Legend</span>
        <span className="text-[10px] text-on-surface-variant">90m Expiry</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-error border-2 border-surface-container-lowest shadow-sm shrink-0"></div>
          <div className="flex flex-col">
            <span className="font-semibold text-on-surface">Confirmed / Severe</span>
            <span className="text-[10px] text-on-surface-variant">Ground fact (Verified $\ge 2$)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-surface-container-lowest shadow-sm shrink-0"></div>
          <div className="flex flex-col">
            <span className="font-semibold text-on-surface">Unverified Report</span>
            <span className="text-[10px] text-on-surface-variant">Needs nearby confirmation</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-md border-2 border-dashed border-orange-500 bg-orange-500/20 shrink-0"></div>
          <div className="flex flex-col">
            <span className="font-semibold text-orange-800">Predicted Risk</span>
            <span className="text-[10px] text-on-surface-variant">"Possible" or "Likely affected"</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3.5 h-1.5 rounded-full bg-secondary shrink-0"></div>
          <div className="flex flex-col">
            <span className="font-semibold text-secondary">Avoidance Route</span>
            <span className="text-[10px] text-on-surface-variant">No confirmed flood reported</span>
          </div>
        </div>
      </div>

      <div className="pt-1 border-t border-surface-container-high text-[10px] text-on-surface-variant leading-tight">
        Circles sized by depth: 40m ankle, 80m knee, 150m waist/vehicle.
      </div>
    </div>
  );
};
