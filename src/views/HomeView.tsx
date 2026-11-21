import React, { useState } from 'react';
import { NavTab } from '../components/common/BottomNav';
import { WeatherData } from '../lib/weather';
import { DemoBadge } from '../components/common/DemoBadge';
import { ReportRow } from '../types/database';

interface HomeViewProps {
  weather: WeatherData | null;
  reports: ReportRow[];
  setActiveTab: (tab: NavTab) => void;
  onOpenReport: () => void;
}

const LOCALITIES = ['Deccan Gymkhana, Pune', 'Sinhagad Road, Pune', 'Baner, Pune', 'Kothrud, Pune'];

export const HomeView: React.FC<HomeViewProps> = ({
  weather,
  reports,
  setActiveTab,
  onOpenReport,
}) => {
  const [localityIndex, setLocalityIndex] = useState(0);
  const currentLocality = LOCALITIES[localityIndex];

  // Active confirmed or severe alerts nearby
  const activeConfirmedReports = reports.filter(
    (r) => r.status === 'confirmed' || r.status === 'severe'
  );

  return (
    <div className="w-full max-w-md md:max-w-xl mx-auto px-4 py-4 flex flex-col gap-4 pb-24">
      {/* 1. Header greeting & Locality switcher */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex flex-col min-w-0">
          <h1 className="font-bold text-xl text-on-surface truncate">Pune Flood Advisory</h1>
          <button
            onClick={() => setLocalityIndex((prev) => (prev + 1) % LOCALITIES.length)}
            className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-xs mt-0.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
              location_on
            </span>
            <span className="font-semibold underline decoration-dotted">{currentLocality}</span>
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container text-xs font-semibold shrink-0">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span>ONLINE</span>
        </div>
      </div>

      {/* 2. Your Local Flood Status Card (Light Glassmorphism) */}
      <div className="w-full rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Hydrological Watch Status
          </span>
          <DemoBadge label="REALTIME METRICS" />
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-bold text-base text-on-surface">{currentLocality}</span>
            <span className="text-xs text-on-surface-variant">Updated 2 minutes ago</span>
          </div>

          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
            <span className="material-symbols-outlined text-[16px] text-amber-700" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
            <span className="text-xs font-bold uppercase tracking-wide">
              {weather && weather.rainFactor > 0.5 ? 'ELEVATED' : 'MODERATE'}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-low p-3 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-secondary shrink-0">
            rainy
          </span>
          <p className="text-xs text-on-surface leading-snug">
            {weather
              ? `Rainfall at ${weather.currentRainMmHr} mm/hr (3h total: ${weather.rain3hMm} mm). Mutha river basin monitored.`
              : 'Rainfall telemetry loading. Surface runoff active in low corridors.'}
          </p>
        </div>

        {/* 3 Telemetry stats */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="flex flex-col bg-surface-container-low rounded-xl p-2.5">
            <span className="text-[10px] text-on-surface-variant font-medium">Precipitation</span>
            <span className="font-bold text-sm text-on-surface mt-0.5">
              {weather ? `${weather.currentRainMmHr} mm/h` : '18 mm/h'}
            </span>
          </div>
          <div className="flex flex-col bg-surface-container-low rounded-xl p-2.5">
            <span className="text-[10px] text-on-surface-variant font-medium">Rain Factor R</span>
            <span className="font-bold text-sm text-secondary mt-0.5">
              {weather ? weather.rainFactor : '0.42'}
            </span>
          </div>
          <div className="flex flex-col bg-surface-container-low rounded-xl p-2.5">
            <span className="text-[10px] text-on-surface-variant font-medium">Active Floods</span>
            <span className="font-bold text-sm text-error mt-0.5">
              {activeConfirmedReports.length} Active
            </span>
          </div>
        </div>
      </div>

      {/* 3. Action Grid (4 Primary 1-Tap CTAs) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Map */}
        <button
          onClick={() => setActiveTab('map')}
          className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col items-start gap-2 text-left hover:border-secondary transition-all shadow-xs active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-container text-secondary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">map</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-on-surface">View Flood Map</span>
            <span className="text-[11px] text-on-surface-variant">Live radar & hazard circles</span>
          </div>
        </button>

        {/* Report */}
        <button
          onClick={onOpenReport}
          className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col items-start gap-2 text-left hover:border-secondary transition-all shadow-xs active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-on-surface">Report Flood</span>
            <span className="text-[11px] text-on-surface-variant">3-tap live camera alert</span>
          </div>
        </button>

        {/* Reroute */}
        <button
          onClick={() => setActiveTab('reroute')}
          className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col items-start gap-2 text-left hover:border-secondary transition-all shadow-xs active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">alt_route</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-on-surface">Find Reroute</span>
            <span className="text-[11px] text-on-surface-variant">Avoid reported water</span>
          </div>
        </button>

        {/* SOS */}
        <button
          onClick={() => setActiveTab('sos')}
          className="rounded-2xl bg-error-container/60 border border-error/30 p-4 flex flex-col items-start gap-2 text-left hover:bg-error-container transition-all shadow-xs active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-error text-on-error flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              sos
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-on-error-container">Emergency SOS</span>
            <span className="text-[11px] text-on-error-container/80">Call 112 emergency</span>
          </div>
        </button>
      </div>

      {/* 4. Active Ground Flood Hazards Preview */}
      <div className="w-full rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-on-surface">Reported Waterlogged Roads</span>
          <span className="text-xs text-secondary font-semibold cursor-pointer" onClick={() => setActiveTab('map')}>
            View on Map
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {activeConfirmedReports.length > 0 ? (
            activeConfirmedReports.slice(0, 3).map((r) => (
              <div
                key={r.id}
                onClick={() => setActiveTab('map')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-error-container text-error flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">water_drop</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-on-surface truncate">
                      {r.depth.toUpperCase()} Deep Waterlogging
                    </span>
                    <span className="text-[10px] text-on-surface-variant truncate">
                      {r.confirms} verifications • {r.status}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-error font-bold uppercase shrink-0">Blocked</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-on-surface-variant p-2 text-center">
              No severe flood reports active in immediate vicinity.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
