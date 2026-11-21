import React, { useState, useEffect } from 'react';
import { ReportRow } from '../types/database';
import { PRESET_PUNE_ROUTES, calculateAvoidanceRoute } from '../lib/routingService';
import { RerouteResult } from '../types/routing';
import { DemoBadge } from '../components/common/DemoBadge';

interface RerouteViewProps {
  reports: ReportRow[];
  onOpenMap: () => void;
}

export const RerouteView: React.FC<RerouteViewProps> = ({ reports, onOpenMap }) => {
  const [selectedRouteId, setSelectedRouteId] = useState(PRESET_PUNE_ROUTES[0].id);
  const [rerouteResult, setRerouteResult] = useState<RerouteResult | null>(null);
  const [activeTab, setActiveTab] = useState<'alternate' | 'baseline'>('alternate');

  useEffect(() => {
    calculateAvoidanceRoute(selectedRouteId, reports).then((res) => {
      setRerouteResult(res);
    });
  }, [selectedRouteId, reports]);

  const activePreset = PRESET_PUNE_ROUTES.find((r) => r.id === selectedRouteId) || PRESET_PUNE_ROUTES[0];

  const handleSwap = () => {
    const nextIdx = (PRESET_PUNE_ROUTES.findIndex((r) => r.id === selectedRouteId) + 1) % PRESET_PUNE_ROUTES.length;
    setSelectedRouteId(PRESET_PUNE_ROUTES[nextIdx].id);
  };

  return (
    <div className="w-full max-w-md md:max-w-xl mx-auto px-4 py-4 flex flex-col gap-4 pb-24">
      {/* 1. Frosted Search Card (Light surface) */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
            Reroute Planner (Flood Avoidance)
          </span>
          <div className="flex items-center gap-1.5">
            <DemoBadge />
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-container text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              <span>Avoid Polygons Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connector Dots */}
          <div className="flex flex-col items-center justify-center gap-1 py-1 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <span className="w-0.5 h-6 bg-outline-variant rounded-full"></span>
            <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              location_on
            </span>
          </div>

          {/* Inputs */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container-high">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-on-surface-variant font-medium">Origin</span>
                <span className="font-semibold text-xs text-on-surface truncate">
                  {activePreset.origin.name}
                </span>
              </div>
              <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
                my_location
              </span>
            </div>

            <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container-high">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-on-surface-variant font-medium">Destination</span>
                <span className="font-semibold text-xs text-on-surface truncate">
                  {activePreset.destination.name}
                </span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0">
                search
              </span>
            </div>
          </div>

          {/* Preset Cycle / Swap button */}
          <button
            onClick={handleSwap}
            title="Switch demo corridor"
            className="w-10 h-10 rounded-xl bg-surface-container-low border border-surface-container-high text-primary flex items-center justify-center shrink-0 active:scale-95 transition-transform hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">swap_vert</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive SVG Map Visualizer matching Template Graphic */}
      <div className="relative w-full h-56 rounded-2xl overflow-hidden shadow-sm bg-surface-container-low border border-surface-container-high">
        {/* Geographic Base Representation */}
        <div className="absolute inset-0 bg-cover bg-center opacity-85" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>

        {/* Dynamic Route SVG Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 360 224" fill="none">
          {/* Direct Shortest Route (Red Blocked) */}
          <path
            d="M 54 162 Q 130 180 200 140 T 302 68"
            stroke={rerouteResult?.hasFloodingOnBaseline ? '#ba1a1a' : '#717975'}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={rerouteResult?.hasFloodingOnBaseline ? 'none' : '4 4'}
            opacity={activeTab === 'baseline' ? '1.0' : '0.55'}
          />

          {/* Alternate Route Avoiding Flood (Emerald Green) */}
          <path
            d="M 54 162 Q 90 70 180 60 T 302 68"
            stroke="#006c4b"
            strokeWidth="5"
            strokeLinecap="round"
            opacity={activeTab === 'alternate' ? '1.0' : '0.45'}
          />

          {/* Origin Marker */}
          <circle cx="54" cy="162" r="7" fill="#006c4b" stroke="#ffffff" strokeWidth="2.5" />
          {/* Destination Marker */}
          <circle cx="302" cy="68" r="7" fill="#00271d" stroke="#ffffff" strokeWidth="2.5" />
        </svg>

        {/* Floating Hazard Block Badge */}
        {rerouteResult?.hasFloodingOnBaseline && (
          <div className="absolute top-[52%] left-[34%] -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-error text-on-error shadow-sm text-[11px] font-bold">
            <span className="material-symbols-outlined text-[14px]">block</span>
            <span>Flooded Road</span>
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between px-3 py-1.5 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-xs border border-surface-container-high text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-on-surface">
              <span className="w-2.5 h-1.5 rounded-full bg-secondary"></span>
              Reroute
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-on-surface">
              <span className="w-2.5 h-1.5 rounded-full bg-error"></span>
              Blocked
            </span>
          </div>
          <button onClick={onOpenMap} className="text-secondary font-bold text-[11px] flex items-center gap-0.5">
            Full GIS
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </button>
        </div>
      </div>

      {/* 3. Hazard Block Warning Callout (Matching template) */}
      {rerouteResult?.blockingReport && (
        <div className="flex items-stretch gap-3 bg-error-container/80 text-on-error-container rounded-2xl p-3.5 border border-error/30 shadow-xs">
          <div className="w-1 self-stretch rounded-full bg-error shrink-0"></div>
          <span className="material-symbols-outlined text-error text-[22px] shrink-0 self-center" style={{ fontVariationSettings: "'FILL' 1" }}>
            warning
          </span>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs text-on-error-container">
              Direct Road Blocked: {rerouteResult.blockingReport.depth} Waterlogging
            </span>
            <span className="text-[11px] text-on-error-container/90 mt-0.5 leading-snug">
              {rerouteResult.blockingReport.message} Traffic rerouted along higher elevation bypass.
            </span>
          </div>
        </div>
      )}

      {/* 4. Route Comparison Cards (Ground Rule 2 Compliant) */}
      <div className="flex flex-col gap-3">
        {/* Recommended Route Card (Emerald) */}
        {rerouteResult?.alternateRoute && (
          <div
            onClick={() => setActiveTab('alternate')}
            className={`w-full text-left rounded-2xl p-4 border transition-all cursor-pointer flex flex-col gap-2.5 ${
              activeTab === 'alternate'
                ? 'bg-surface-container-lowest border-secondary shadow-md ring-1 ring-secondary/30'
                : 'bg-surface-container-lowest border-surface-container-high hover:border-outline-variant shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-secondary text-[20px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
                <span className="font-bold text-sm text-on-surface truncate">
                  Route Avoiding Reported Flooding
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container text-[10px] font-bold uppercase shrink-0">
                Recommended
              </span>
            </div>

            <div className="flex items-baseline gap-3 text-xs">
              <div>
                <span className="font-bold text-lg text-secondary">
                  {rerouteResult.alternateRoute.durationMinutes} min
                </span>
                <span className="text-on-surface-variant ml-1 font-medium">
                  ({rerouteResult.alternateRoute.distanceKm} km)
                </span>
              </div>
              <span className="text-on-surface-variant text-[11px]">
                +{rerouteResult.deltaDurationMinutes} min (+{rerouteResult.deltaDistanceKm} km bypass)
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-snug">
              {rerouteResult.alternateRoute.summary}. {rerouteResult.alternateRoute.riskDescription}
            </p>

            {/* Mandatory Ground Rule 2 Disclaimer */}
            <div className="pt-2 border-t border-surface-container-high text-[10px] text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-secondary">info</span>
              <span>{rerouteResult.disclaimer}</span>
            </div>
          </div>
        )}

        {/* Baseline Direct Route Card (Blocked in Red) */}
        {rerouteResult && (
          <div
            onClick={() => setActiveTab('baseline')}
            className={`w-full text-left rounded-2xl p-4 border transition-all cursor-pointer flex flex-col gap-2 ${
              activeTab === 'baseline'
                ? 'bg-surface-container-lowest border-error shadow-md ring-1 ring-error/30'
                : 'bg-surface-container-lowest border-surface-container-high hover:border-outline-variant shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-error text-[20px] shrink-0">block</span>
                <span className="font-bold text-sm text-on-surface truncate">
                  Direct Shortest Route
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-bold uppercase shrink-0">
                Flooded / Blocked
              </span>
            </div>

            <div className="flex items-baseline gap-2 text-xs">
              <span className="font-bold text-base text-on-surface">
                {rerouteResult.baselineRoute.durationMinutes} min
              </span>
              <span className="text-on-surface-variant font-medium">
                ({rerouteResult.baselineRoute.distanceKm} km)
              </span>
            </div>

            <p className="text-xs text-error font-medium leading-snug">
              {rerouteResult.baselineRoute.riskDescription}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
