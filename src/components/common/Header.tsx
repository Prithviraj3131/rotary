import React from 'react';
import { DemoBadge } from './DemoBadge';

export type TopMode = 'consumer' | 'authority' | 'relay-sim';

interface HeaderProps {
  topMode: TopMode;
  setTopMode: (mode: TopMode) => void;
  locality?: string;
  onOpenAlerts?: () => void;
  onOpenProfile?: () => void;
  onOpenHelp?: () => void;
  activeAlertCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  topMode,
  setTopMode,
  locality = 'Pune Operations',
  onOpenAlerts,
  onOpenProfile,
  onOpenHelp,
  activeAlertCount = 0,
}) => {
  return (
    <header className="fixed top-0 w-full z-40 bg-surface/85 backdrop-blur-xl border-b border-surface-container-high shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="h-16 px-3 sm:px-4 max-w-md md:max-w-4xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-on-primary text-[18px] sm:text-[20px]">flood</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-primary">
                FLOODGUARD AI
              </span>
              <DemoBadge />
            </div>
            <span className="font-semibold text-[11px] sm:text-xs text-on-surface truncate">
              {topMode === 'consumer' ? locality : topMode === 'authority' ? 'Authority Console' : 'Mesh Relay Sim'}
            </span>
          </div>
        </div>

        {/* Right Controls: Alerts Bell + Profile + Help + Mode Switcher */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Consumer Mode Shortcuts */}
          {topMode === 'consumer' && (
            <>
              {onOpenAlerts && (
                <button
                  onClick={onOpenAlerts}
                  className="relative w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                  title="Alerts Feed"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">notifications</span>
                  {activeAlertCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-error text-on-error text-[9px] font-bold flex items-center justify-center animate-pulse">
                      {activeAlertCount}
                    </span>
                  )}
                </button>
              )}

              {onOpenHelp && (
                <button
                  onClick={onOpenHelp}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors"
                  title="Emergency Helplines & Support"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">help_outline</span>
                </button>
              )}

              {onOpenProfile && (
                <button
                  onClick={onOpenProfile}
                  className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
                  title="Citizen Profile & My Reports"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </button>
              )}
            </>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center gap-0.5 bg-surface-container-low p-0.5 sm:p-1 rounded-xl border border-surface-container-high text-[10px] sm:text-xs">
            <button
              onClick={() => setTopMode('consumer')}
              className={`px-2 py-0.5 sm:py-1 rounded-lg font-bold transition-all ${
                topMode === 'consumer'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              App
            </button>
            <button
              onClick={() => setTopMode('authority')}
              className={`px-2 py-0.5 sm:py-1 rounded-lg font-bold transition-all ${
                topMode === 'authority'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Auth
            </button>
            <button
              onClick={() => setTopMode('relay-sim')}
              className={`px-2 py-0.5 sm:py-1 rounded-lg font-bold transition-all ${
                topMode === 'relay-sim'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Relay
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
