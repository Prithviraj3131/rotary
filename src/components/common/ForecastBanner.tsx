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
    <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-md z-40 border-b border-amber-800">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[20px] text-white animate-pulse">
              thunderstorm
            </span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs tracking-wider uppercase bg-black/25 px-2 py-0.5 rounded">
                High Risk Forecast Alert
              </span>
              {isDemo && <DemoBadge className="bg-white/20 text-white border-white/40" />}
              <span className="text-[11px] opacity-90">
                Peak: <strong>{forecastMmHr} mm/hr</strong> (Rain factor R = {rainFactor})
              </span>
            </div>
            <p className="text-xs font-semibold leading-tight mt-0.5">
              Heavy rain forecast over <span className="underline decoration-white/60">{placeName}</span>. Possible waterlogging before ground reports arrive.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-white/80 hidden sm:inline">
            Rule-based forecast trigger (Zero reports required)
          </span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
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
