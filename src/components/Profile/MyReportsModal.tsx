import React, { useState } from 'react';
import { ReportRow } from '../../types/database';
import { DemoBadge } from '../common/DemoBadge';
import weightsConfig from '../../config/weights.json';

interface MyReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: ReportRow[];
  onOpenReportModal: () => void;
  onOpenHelpSupport?: () => void;
  onOpenOnboarding?: () => void;
}

export const MyReportsModal: React.FC<MyReportsModalProps> = ({
  isOpen,
  onClose,
  reports,
  onOpenReportModal,
  onOpenHelpSupport,
  onOpenOnboarding,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'wearable' | 'explainability'>('reports');
  const [smartwatchPaired, setSmartwatchPaired] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [riderAudioEnabled, setRiderAudioEnabled] = useState(true);
  const [meshCarrierMode, setMeshCarrierMode] = useState(true);

  if (!isOpen) return null;

  const verifiedReportsCount = reports.filter((r) => r.status === 'confirmed' || r.status === 'severe').length;
  const resolvedCount = reports.filter((r) => r.status === 'cleared').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-primary/40 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-surface-container-high flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 bg-surface/90 backdrop-blur-xl border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-sm">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-on-surface">Pune Citizen Hub</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
                  Trust Score 1.0
                </span>
              </div>
              <span className="text-xs text-on-surface-variant">ID: FG-PUN-8492 • Deccan Ward</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-surface-container bg-surface-container-low text-xs font-semibold">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-2.5 text-center transition-all ${
              activeTab === 'reports'
                ? 'border-b-2 border-primary text-primary font-bold bg-surface-container-lowest'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            My Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('wearable')}
            className={`flex-1 py-2.5 text-center transition-all ${
              activeTab === 'wearable'
                ? 'border-b-2 border-primary text-primary font-bold bg-surface-container-lowest'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Wearables & Rider
          </button>
          <button
            onClick={() => setActiveTab('explainability')}
            className={`flex-1 py-2.5 text-center transition-all ${
              activeTab === 'explainability'
                ? 'border-b-2 border-primary text-primary font-bold bg-surface-container-lowest'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Weights & Engine
          </button>
        </div>

        {/* Tab 1: Reports List */}
        {activeTab === 'reports' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {/* 3 Metric Pills */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
                <span className="text-[10px] text-on-surface-variant font-medium">Submitted</span>
                <span className="text-lg font-bold text-on-surface mt-0.5">{reports.length}</span>
              </div>
              <div className="flex flex-col p-2.5 rounded-xl bg-secondary-container/40 border border-secondary/20">
                <span className="text-[10px] text-on-secondary-container font-medium">Verified R≥2.0</span>
                <span className="text-lg font-bold text-secondary mt-0.5">{verifiedReportsCount}</span>
              </div>
              <div className="flex flex-col p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
                <span className="text-[10px] text-on-surface-variant font-medium">Resolved</span>
                <span className="text-lg font-bold text-on-surface-variant mt-0.5">{resolvedCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Submitted Inundation Reports
              </span>
              <button
                onClick={() => {
                  onClose();
                  onOpenReportModal();
                }}
                className="text-xs text-secondary font-bold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Submit New</span>
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="p-6 text-center text-xs text-on-surface-variant">
                No reports submitted yet in this session.
              </div>
            ) : (
              reports.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high flex flex-col gap-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-on-surface uppercase">
                      Depth: {r.depth}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        r.status === 'severe'
                          ? 'bg-error-container text-on-error-container'
                          : r.status === 'confirmed'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant flex items-center justify-between">
                    <span>{r.confirms} verifications • {r.clears} cleared votes</span>
                    <span>90-min TTL active</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Wearables & Rider Settings (Section 6.15 Roadmap) */}
        {activeTab === 'wearable' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">watch</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">Smartwatch Companion</span>
                  <span className="text-[11px] text-on-surface-variant">
                    {smartwatchPaired ? 'Wear OS Device Paired' : 'Not Connected (Demo Simulation)'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSmartwatchPaired(!smartwatchPaired)}
                className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface border border-surface-container-high hover:bg-surface-container-high transition-colors shrink-0"
              >
                {smartwatchPaired ? 'Disconnect' : 'Simulate Pair'}
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Alert Preferences
              </span>

              {/* Wrist Haptics */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">Wrist Haptic Siren</span>
                  <span className="text-[10px] text-on-surface-variant">
                    Vibrates watch before stepping into waterlogged street
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hapticEnabled}
                  onChange={(e) => setHapticEnabled(e.target.checked)}
                  className="w-4 h-4 accent-secondary cursor-pointer"
                />
              </div>

              {/* Rider Bluetooth Audio Alerts */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">Gig Worker / Delivery Rider Audio</span>
                  <span className="text-[10px] text-on-surface-variant">
                    Speaks audio alert in helmet intercom 400m before flooded road
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={riderAudioEnabled}
                  onChange={(e) => setRiderAudioEnabled(e.target.checked)}
                  className="w-4 h-4 accent-secondary cursor-pointer"
                />
              </div>

              {/* Mesh Relay Carrier Mode */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">Opportunistic Mesh Carrier Node</span>
                  <span className="text-[10px] text-on-surface-variant">
                    Relay encrypted packets to passing phones when offline
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={meshCarrierMode}
                  onChange={(e) => setMeshCarrierMode(e.target.checked)}
                  className="w-4 h-4 accent-secondary cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Weights & Explainability (Ground Rule 5) */}
        {activeTab === 'explainability' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Hydrological Formula Weights (weights.json)
              </span>
              <DemoBadge label="GROUND RULE 5" />
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              FloodGuard AI rejects black-box neural networks. Every prediction is computed using transparent physics:
              <br />
              <code className="text-primary font-bold">
                P(flood) = min(1.0, Rain_Factor × Drainage_Coefficient × Slope_Coefficient)
              </code>
            </p>

            <pre className="p-3 rounded-xl bg-surface-container-low text-[11px] font-mono text-on-surface overflow-x-auto border border-surface-container">
              {JSON.stringify(weightsConfig, null, 2)}
            </pre>
          </div>
        )}

        {/* Footer Quick Links */}
        <div className="p-3 bg-surface-container-low border-t border-surface-container flex items-center justify-between text-xs">
          {onOpenOnboarding && (
            <button
              onClick={() => {
                onClose();
                onOpenOnboarding();
              }}
              className="text-on-surface-variant hover:text-primary font-semibold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">explore</span>
              <span>Replay App Tour</span>
            </button>
          )}

          {onOpenHelpSupport && (
            <button
              onClick={() => {
                onClose();
                onOpenHelpSupport();
              }}
              className="text-error font-semibold flex items-center gap-1 hover:underline transition-colors ml-auto"
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                emergency
              </span>
              <span>Helplines & Safety</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
