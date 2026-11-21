import React from 'react';
import { DemoBadge } from './DemoBadge';

interface NetworkBannerProps {
  isOnline: boolean;
  onOpenOfflineHub: () => void;
}

export const NetworkBanner: React.FC<NetworkBannerProps> = ({ isOnline, onOpenOfflineHub }) => {
  if (isOnline) return null;

  return (
    <div className="w-full bg-amber-50 text-amber-950 border-b border-amber-200/90 px-4 py-2 flex items-center justify-between text-xs z-40 animate-fade-in shadow-xs">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
        <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0">
          wifi_off
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold truncate">Cellular Offline — P2P Mesh Relay Armed</span>
          <DemoBadge label="OFFLINE IDB" className="bg-amber-100 text-amber-900 border-amber-300 hidden sm:inline" />
        </div>
      </div>

      <button
        onClick={onOpenOfflineHub}
        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition-colors flex items-center gap-1 ml-2 shadow-xs"
        type="button"
      >
        <span>Open Mesh Hub</span>
        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
      </button>
    </div>
  );
};
