import React from 'react';
import { DemoBadge } from './DemoBadge';

interface ForecastBannerProps {
  placeName: string;
  forecastMmHr: number;
  rainFactor: number;
  isDemo?: boolean;
  onDismiss?: () => void;
}

export const ForecastBanner: React.FC<ForecastBannerProps> = ({
  placeName,
  forecastMmHr,
  rainFactor,
  isDemo = false,
  onDismiss,
}) => {
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-950 shadow-xs z-40">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
            <span className="material-symbols-outlined text-[20px] text-amber-700 animate-pulse">
              thunderstorm
            </span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-[11px] tracking-wider uppercase bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                High Risk Forecast Alert
              </span>
              {isDemo && <DemoBadge className="bg-amber-100 text-amber-800 border-amber-300" />}
              <span className="text-[11px] text-amber-800 font-medium">
                Peak: <strong>{forecastMmHr} mm/hr</strong> (Rain factor R = {rainFactor})
              </span>
            </div>
            <p className="text-xs font-semibold leading-tight mt-0.5 text-amber-950">
              Heavy rain forecast over <span className="underline decoration-amber-400">{placeName}</span>. Possible waterlogging before ground reports arrive.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-amber-700 hidden sm:inline">
            Rule-based forecast trigger (Zero reports required)
          </span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-800 transition-colors"
              title="Dismiss banner"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
