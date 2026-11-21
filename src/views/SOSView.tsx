import React, { useState } from 'react';
import { DemoBadge } from '../components/common/DemoBadge';

const EMERGENCY_CATEGORIES = [
  { id: 'trapped', label: 'Trapped due to flooding', icon: 'water_damage' },
  { id: 'medical', label: 'Medical emergency', icon: 'medical_services' },
  { id: 'rescue', label: 'Rescue required', icon: 'support' },
  { id: 'vehicle', label: 'Vehicle stranded', icon: 'directions_car' },
  { id: 'other', label: 'Other emergency', icon: 'warning' },
];

export const SOSView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState(EMERGENCY_CATEGORIES[0].id);
  const [details, setDetails] = useState('');
  const [sosSent, setSosSent] = useState(false);
  const [sosId, setSosId] = useState('');
  const [quickUpdate, setQuickUpdate] = useState<string | null>(null);

  const handleCall112 = () => {
    const id = `#SOS-${Math.floor(1000 + Math.random() * 9000)}`;
    setSosId(id);
    setSosSent(true);
    // Launch standard phone dialer to 112
    window.location.href = 'tel:112';
  };

  const handleQuickUpdate = (text: string) => {
    setQuickUpdate(text);
  };

  return (
    <div className="w-full max-w-md md:max-w-xl mx-auto px-4 py-4 flex flex-col gap-4 pb-24">
      {/* 1. Live GPS Sharing Status */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-secondary/30 animate-ping"></span>
            <span className="material-symbols-outlined text-[20px]">my_location</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
              Live Location GPS
            </span>
            <span className="text-xs font-semibold text-on-surface truncate">
              Pune Operations Zone (±8m fix)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DemoBadge label="GPS LOCK" />
          <span className="bg-secondary-container text-on-secondary-container text-[11px] font-bold px-2 py-0.5 rounded-full">
            ONLINE
          </span>
        </div>
      </div>

      {!sosSent ? (
        <>
          {/* 2. Large High-Urgency SOS Push Button */}
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-56 h-56 rounded-full bg-error/15 animate-pulse pointer-events-none"></div>
              <button
                onClick={handleCall112}
                type="button"
                className="relative w-44 h-44 rounded-full bg-error text-on-error shadow-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform select-none cursor-pointer border-4 border-white/40"
              >
                <span className="material-symbols-outlined text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  crisis_alert
                </span>
                <span className="font-extrabold text-base tracking-wider text-center px-2 leading-tight">
                  CALL 112 EMERGENCY
                </span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant text-center max-w-xs leading-snug">
              Tap button to dial 112 immediately. Your GPS coordinates will be captured locally.
            </p>
          </div>

          {/* Disclaimer on dispatch (Ground Rule 4) */}
          <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0 mt-0.5">
              info
            </span>
            <p className="leading-snug">
              <strong>Important (Ground Rule 4):</strong> Pressing this button connects to emergency services via phone (112). This prototype does <em>not</em> dispatch emergency units automatically.
            </p>
          </div>

          {/* 3. Emergency Category Selector */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-on-surface uppercase tracking-wide">
                Emergency Category
              </span>
              <span className="text-[11px] text-on-surface-variant">Select situation</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {EMERGENCY_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container border border-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Optional Details */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-sm flex flex-col gap-2">
            <label className="text-xs font-bold text-on-surface" htmlFor="sos-details">
              Optional Incident Details
            </label>
            <textarea
              id="sos-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Floor level, water depth, number of persons stranded..."
              rows={2}
              className="w-full bg-surface-container-low rounded-xl p-3 text-xs text-on-surface placeholder:text-outline focus:outline-none border border-surface-container-high resize-none"
            />
          </div>
        </>
      ) : (
        /* SOS Confirmation & Live Beacon Mode */
        <div className="flex flex-col gap-4 animate-scale-up">
          <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-md p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                  Transmission Confirmed
                </span>
                <h2 className="font-extrabold text-base text-on-surface">
                  SOS Request Logged & Transmitted
                </h2>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-low p-3 flex flex-col gap-2 border border-surface-container">
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-medium">Request ID</span>
                <span className="text-xs font-mono font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded">
                  {sosId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-medium">Category</span>
                <span className="text-xs font-bold text-on-surface capitalize">
                  {EMERGENCY_CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-medium">Location</span>
                <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">location_on</span>
                  <span>Deccan Gymkhana / Mutha Basin</span>
                </span>
              </div>
            </div>

            {/* Quick Status Update Chips */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-xs font-bold text-on-surface">Quick Situation Update:</span>
              <div className="flex flex-wrap gap-1.5">
                {['Water level rising', 'Moved to higher floor', 'Battery below 15%'].map((txt) => (
                  <button
                    key={txt}
                    onClick={() => handleQuickUpdate(txt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      quickUpdate === txt
                        ? 'bg-secondary text-on-secondary border-secondary font-bold'
                        : 'bg-surface-container-lowest text-on-surface border-surface-container hover:bg-surface-container-low'
                    }`}
                  >
                    {txt}
                  </button>
                ))}
              </div>
              {quickUpdate && (
                <span className="text-[11px] text-secondary font-semibold mt-1">
                  ✓ Broadcasted: "{quickUpdate}"
                </span>
              )}
            </div>

            {/* Direct Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-surface-container">
              <a
                href="tel:112"
                className="flex-1 py-2.5 rounded-xl bg-error hover:bg-error/90 text-on-error font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm text-center"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                <span>Call 112 Again</span>
              </a>
              <button
                onClick={() => setSosSent(false)}
                className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs flex items-center justify-center transition-colors"
              >
                Resolve & Clear SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Guideline Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[20px]">electric_bolt</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xs text-on-surface">Electrical Hazard Warning</span>
          <span className="text-[11px] text-on-surface-variant leading-snug">
            Stay away from electric poles, feeder pillars, and submerged cables near water.
          </span>
        </div>
      </div>
    </div>
  );
};
