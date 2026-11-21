import React, { useState } from 'react';
import { DemoBadge } from './DemoBadge';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ isOpen, onClose }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  if (!isOpen) return null;

  const HELPLINES = [
    {
      name: 'India Emergency (Police, Fire, Medical)',
      number: '112',
      badge: 'NATIONAL 24/7',
      icon: 'emergency',
      color: 'bg-error text-on-error',
    },
    {
      name: 'Pune Disaster Management Cell (PMC)',
      number: '1077',
      badge: 'PMC FLOOD DESK',
      icon: 'support_agent',
      color: 'bg-primary text-on-primary',
    },
    {
      name: 'Pune Fire & Rescue Services',
      number: '101',
      badge: 'WATER RESCUE',
      icon: 'fire_extinguisher',
      color: 'bg-orange-600 text-white',
    },
    {
      name: 'Pune Traffic Control Room',
      number: '1095',
      badge: 'ROAD DIVERSIONS',
      icon: 'traffic',
      color: 'bg-amber-600 text-white',
    },
    {
      name: 'NDRF 5th Battalion (Pune/Talegaon)',
      number: '011-24363260',
      badge: 'DISASTER RESCUE',
      icon: 'shield',
      color: 'bg-secondary text-on-secondary',
    },
  ];

  const FAQS = [
    {
      q: 'Why should I never drive through a flooded underpass?',
      a: 'Underpasses like Alka Talkies and Pulgate accumulate water rapidly due to basin convergence. Just 30cm (1 foot) of flowing water can stall most car engines, and 60cm (2 feet) can sweep away heavy SUVs.',
    },
    {
      q: 'How does FloodGuard AI predict waterlogging?',
      a: 'We use open-source hydrological mathematics: P(flood) = min(1.0, Rain_Factor × Drainage_Coefficient × Slope_Factor) combined with downstream Ambil Odha and Mutha basin propagation. All weights are public in weights.json.',
    },
    {
      q: 'How do reports reach authorities when cell towers fail?',
      a: 'Reports are stored in your phone’s IndexedDB and opportunistically broadcast to passing devices via our peer-to-peer mesh relay protocol with Ed25519 signatures, hopping up to 6 times until reaching an online node.',
    },
    {
      q: 'What is the mandatory 90-minute TTL?',
      a: 'Floodwaters recede or worsen rapidly. To prevent stale misinformation, report markers start fading in opacity and automatically vanish after 90 minutes unless re-confirmed by another citizen nearby.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-primary/40 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-surface-container-high flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 bg-surface/90 backdrop-blur-xl border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                contact_support
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-base text-on-surface">Emergency Help & Support</h2>
                <DemoBadge label="PUNE 24/7" />
              </div>
              <span className="text-xs text-on-surface-variant">
                Verified Pune disaster helplines & safety protocols
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Emergency Helplines Section */}
          <section className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                emergency
              </span>
              <span>1-Tap Emergency Helplines</span>
            </span>

            <div className="flex flex-col gap-2">
              {HELPLINES.map((h, i) => (
                <a
                  key={i}
                  href={`tel:${h.number}`}
                  className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary flex items-center justify-between gap-3 transition-all shadow-xs active:scale-98"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-on-surface">
                      <span className="material-symbols-outlined text-[18px]">{h.icon}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-on-surface truncate">{h.name}</span>
                      <span className="text-[10px] text-on-surface-variant">{h.badge}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0 ${h.color}`}>
                    {h.number}
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* Critical Flood Safety Essentials */}
          <section className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span className="material-symbols-outlined text-[16px] text-amber-700" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              <span>Pune Flood Safety Protocol</span>
            </div>
            <ul className="text-[11px] list-disc list-inside space-y-1 text-amber-800 leading-relaxed">
              <li><strong>Turn Around, Don't Drown:</strong> 15cm (ankle deep) moving water can knock an adult off their feet; 60cm will float a vehicle.</li>
              <li><strong>Electrical Hazard:</strong> Maintain a minimum 10m distance from fallen power cables and flooded MSEDCL junction boxes.</li>
              <li><strong>Stalled Vehicle:</strong> If water rises around your car, unbuckle and abandon the vehicle immediately to reach higher ground.</li>
            </ul>
          </section>

          {/* FAQs Accordion */}
          <section className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Frequently Asked Questions
            </span>

            <div className="flex flex-col gap-2">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-surface-container-lowest border border-surface-container-high overflow-hidden shadow-xs"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full p-3 text-left flex items-center justify-between gap-2 hover:bg-surface-container-low transition-colors"
                  >
                    <span className="text-xs font-bold text-on-surface">{faq.q}</span>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">
                      {activeFaq === idx ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {activeFaq === idx && (
                    <div className="px-3 pb-3 text-xs text-on-surface-variant leading-relaxed border-t border-surface-container pt-2">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
