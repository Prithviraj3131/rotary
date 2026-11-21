import React, { useState } from 'react';
import { DemoBadge } from '../common/DemoBadge';
import { localReportsStore } from '../../lib/supabase';
import { broadcastReportUpsert } from '../../lib/realtimeSync';
import { ReportRow } from '../../types/database';

interface HeavyRainSimulatorProps {
  onSetRainOverride: (mmHr: number | null) => void;
  isSimulating: boolean;
}

export const HeavyRainSimulator: React.FC<HeavyRainSimulatorProps> = ({
  onSetRainOverride,
  isSimulating,
}) => {
  const [stepText, setStepText] = useState<string | null>(null);

  const runSimulationScript = async () => {
    // 1. Set rain override to 42 mm/hr
    onSetRainOverride(42.0);
    setStepText('1/4: Heavy monsoon rain override (42 mm/hr). Predicted orange zones activating...');

    // 2. Unverified report arrives at Deccan Gymkhana
    setTimeout(async () => {
      const nowIso = new Date().toISOString();
      const expIso = new Date(Date.now() + 90 * 60 * 1000).toISOString();
      
      const unverifiedReport: ReportRow = {
        id: `demo-scripted-01`,
        client_uuid: 'c0000000-0000-0000-0000-000000000010',
        user_id: 'demo-runner',
        lat: 18.5165,
        lng: 73.8425,
        gps_accuracy: 5.5,
        depth: 'ankle',
        photo_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
        observed_at: nowIso,
        created_at: nowIso,
        last_verified_at: nowIso,
        expires_at: expIso,
        confirms: 1,
        clears: 0,
        road_passable: true,
        source: 'user_app',
        status: 'unverified',
        is_demo: true
      };
      await broadcastReportUpsert(unverifiedReport);
      setStepText('2/4: Unverified report at Deccan Gymkhana (Ankle deep, Yellow circle)...');
    }, 1500);

    // 3. Second report promotes to confirmed (turns RED)
    setTimeout(async () => {
      const rep = localReportsStore.get('demo-scripted-01');
      if (rep) {
        const confirmed: ReportRow = {
          ...rep,
          confirms: 2,
          status: 'confirmed',
          depth: 'knee',
          last_verified_at: new Date().toISOString()
        };
        await broadcastReportUpsert(confirmed);
        setStepText('3/4: Second report confirmed Deccan Gymkhana! Promoted to Confirmed (Red circle)...');
      }
    }, 4500);

    // 4. Severe report arrives on Sinhagad Road corridor (blocks reroute)
    setTimeout(async () => {
      const nowIso = new Date().toISOString();
      const expIso = new Date(Date.now() + 90 * 60 * 1000).toISOString();
      
      const severeReport: ReportRow = {
        id: `demo-scripted-02`,
        client_uuid: 'c0000000-0000-0000-0000-000000000020',
        user_id: 'demo-runner',
        lat: 18.4835,
        lng: 73.8340,
        gps_accuracy: 6.0,
        depth: 'vehicle_stalls',
        photo_url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
        observed_at: nowIso,
        created_at: nowIso,
        last_verified_at: nowIso,
        expires_at: expIso,
        confirms: 4,
        clears: 0,
        road_passable: false,
        source: 'user_app',
        status: 'severe',
        is_demo: true
      };
      await broadcastReportUpsert(severeReport);
      setStepText('4/4: Severe vehicle submersion at Sinhagad Road! Rerouting and emergency dispatch active.');
    }, 7500);
  };

  const handleReset = () => {
    onSetRainOverride(null);
    setStepText(null);
    localReportsStore.delete('demo-scripted-01');
    localReportsStore.delete('demo-scripted-02');
  };

  return (
    <div className="w-full max-w-md md:max-w-xl mx-auto px-4 py-2">
      <div className="rounded-2xl bg-amber-500/10 border border-amber-300 p-3.5 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <span className="material-symbols-outlined text-[18px] text-amber-700 animate-pulse">
              thunderstorm
            </span>
            <span>Simulate Heavy Rain (Hackathon Demo Path)</span>
          </div>
          <DemoBadge />
        </div>

        <p className="text-[11px] text-amber-900 leading-snug">
          Executes the complete demo loop: sets 42 mm/hr rain override $\rightarrow$ orange forecast prediction $\rightarrow$ unverified $\rightarrow$ confirmed $\rightarrow$ severe $\rightarrow$ reroute.
        </p>

        {stepText && (
          <div className="p-2 rounded-lg bg-white/80 font-mono text-[10px] text-amber-950 border border-amber-200">
            {stepText}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={runSimulationScript}
            disabled={isSimulating}
            className="flex-1 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">play_circle</span>
            <span>Trigger Heavy Rain Loop</span>
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-white text-on-surface font-semibold text-xs border border-amber-300 hover:bg-amber-50 transition-colors"
          >
            Reset Demo
          </button>
        </div>
      </div>
    </div>
  );
};
