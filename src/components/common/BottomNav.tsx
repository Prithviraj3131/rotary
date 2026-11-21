import React from 'react';

export type NavTab = 'home' | 'map' | 'reroute' | 'offline' | 'shelters' | 'sos';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenReport: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenReport,
}) => {
  return (
    <nav className="fixed bottom-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-t border-surface-container-high shadow-[0_-1px_10px_rgba(0,0,0,0.04)] pb-safe">
      <div className="max-w-md md:max-w-2xl mx-auto flex justify-between items-center h-16 px-3">
        {/* Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[42px] py-1 transition-all ${
            activeTab === 'home' ? 'text-primary font-bold scale-105' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'home' ? "'FILL' 1" : "'FILL' 0" }}>
            home
          </span>
          <span className="text-[9px]">Home</span>
        </button>

        {/* Map */}
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[42px] py-1 transition-all ${
            activeTab === 'map' ? 'text-primary font-bold scale-105' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'map' ? "'FILL' 1" : "'FILL' 0" }}>
            map
          </span>
          <span className="text-[9px]">Map</span>
        </button>

        {/* Reroute */}
        <button
          onClick={() => setActiveTab('reroute')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[42px] py-1 transition-all ${
            activeTab === 'reroute' ? 'text-primary font-bold scale-105' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'reroute' ? "'FILL' 1" : "'FILL' 0" }}>
            alt_route
          </span>
          <span className="text-[9px]">Reroute</span>
        </button>

        {/* Center Report Action (Floating Emerald Button) */}
        <button
          onClick={onOpenReport}
          className="flex flex-col items-center justify-center gap-0.5 -mt-5 min-w-[50px] min-h-[50px] px-2.5 rounded-full bg-secondary text-on-secondary shadow-[0_4px_14px_rgba(0,108,75,0.35)] active:scale-95 hover:bg-secondary/95 transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
          <span className="text-[8px] font-bold uppercase tracking-wider">Report</span>
        </button>

        {/* Offline Mesh (NEW) */}
        <button
          onClick={() => setActiveTab('offline')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[42px] py-1 transition-all ${
            activeTab === 'offline' ? 'text-primary font-bold scale-105' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'offline' ? "'FILL' 1" : "'FILL' 0" }}>
            wifi_off
          </span>
          <span className="text-[9px]">Offline</span>
        </button>

        {/* Shelters */}
        <button
          onClick={() => setActiveTab('shelters')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[42px] py-1 transition-all ${
            activeTab === 'shelters' ? 'text-primary font-bold scale-105' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'shelters' ? "'FILL' 1" : "'FILL' 0" }}>
            shield
          </span>
          <span className="text-[9px]">Shelters</span>
        </button>

        {/* SOS */}
        <button
          onClick={() => setActiveTab('sos')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[38px] py-1 transition-all ${
            activeTab === 'sos' ? 'text-error font-bold scale-105' : 'text-error/80 hover:text-error'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            crisis_alert
          </span>
          <span className="text-[9px] font-bold">SOS</span>
        </button>
      </div>
    </nav>
  );
};
