import React from 'react';
import { DemoBadge } from './DemoBadge';

interface NetworkBannerProps {
  isOnline: boolean;
  onOpenOfflineHub: () => void;
}

export const NetworkBanner: React.FC<NetworkBannerProps> = ({ isOnline, onOpenOfflineHub }) => {
  if (isOnline) return null;

  return (
    <div className="w-full bg-slate-900 text-slate-100 border-b border-slate-700 px-4 py-2 flex items-center justify-between text-xs z-40 animate-fade-in shadow-md">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
        <span className="material-symbols-outlined text-[16px] text-amber-400 shrink-0">
          wifi_off
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold truncate">Cellular Offline — P2P Mesh Relay Armed</span>
          <DemoBadge label="OFFLINE IDB" className="bg-slate-800 text-slate-200 border-slate-600 hidden sm:inline" />
        </div>
      </div>

      <button
        onClick={onOpenOfflineHub}
        className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 transition-colors flex items-center gap-1 ml-2"
        type="button"
      >
        <span>Open Mesh Hub</span>
        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
      </button>
    </div>
  );
};
