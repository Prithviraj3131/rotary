import React from 'react';
import { DemoBadge } from './DemoBadge';

export type TopMode = 'consumer' | 'authority' | 'relay-sim';

interface HeaderProps {
  topMode: TopMode;
  setTopMode: (mode: TopMode) => void;
  locality?: string;
}

export const Header: React.FC<HeaderProps> = ({
  topMode,
  setTopMode,
  locality = 'Pune Operations',
}) => {
  return (
    <header className="fixed top-0 w-full z-40 bg-surface/85 backdrop-blur-xl border-b border-surface-container-high shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="h-16 px-4 max-w-md md:max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-on-primary text-[20px]">flood</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                FLOODGUARD AI
              </span>
              <DemoBadge />
            </div>
            <span className="font-semibold text-xs text-on-surface truncate">
              {topMode === 'consumer' ? locality : topMode === 'authority' ? 'Authority Console' : 'Mesh Relay Sim'}
            </span>
          </div>
        </div>

        {/* Console View Switcher Pills */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container-high text-xs">
          <button
            onClick={() => setTopMode('consumer')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
              topMode === 'consumer'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            App
          </button>
          <button
            onClick={() => setTopMode('authority')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
              topMode === 'authority'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Authority
          </button>
          <button
            onClick={() => setTopMode('relay-sim')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
              topMode === 'relay-sim'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Relay Sim
          </button>
        </div>
      </div>
    </header>
  );
};
