import React, { useEffect } from 'react';
import { emergencyAudio } from '../../lib/audioAlert';
import { DemoBadge } from '../common/DemoBadge';

interface UrgentAlertModalProps {
  isOpen: boolean;
  landmark: string;
  roadName: string;
  depthText: string;
  secondsRemaining: number;
  onAcknowledge: () => void;
}

export const UrgentAlertModal: React.FC<UrgentAlertModalProps> = ({
  isOpen,
  landmark,
  roadName,
  depthText,
  secondsRemaining,
  onAcknowledge,
}) => {
  useEffect(() => {
    if (isOpen) {
      emergencyAudio.playUrgentTone();
      if ('vibrate' in navigator) {
        navigator.vibrate([500, 200, 500, 200, 800]);
      }
    } else {
      emergencyAudio.stop();
    }
    return () => emergencyAudio.stop();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest border-2 border-error shadow-2xl overflow-hidden flex flex-col animate-bounce-short">
        {/* Urgent Header */}
        <div className="bg-error text-on-error p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[26px] animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              crisis_alert
            </span>
            <div>
              <h2 className="font-extrabold text-sm uppercase tracking-wider">CRITICAL FLOOD ALERT</h2>
              <span className="text-[10px] text-white/90">Immediate Life Safety Notice</span>
            </div>
          </div>
          <DemoBadge className="bg-white/20 text-white border-white/40" />
        </div>

        {/* 25-Second Escalation Timer Bar */}
        <div className="bg-error-container p-2.5 flex items-center justify-between text-xs text-on-error-container border-b border-error/20">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-[16px] text-error animate-spin">
              hourglass_top
            </span>
            <span>SMS Fallback Escalation</span>
          </div>
          <span className="font-mono font-bold bg-white/70 px-2 py-0.5 rounded text-error text-[11px]">
            {secondsRemaining}s remaining
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Affected Location
            </span>
            <span className="text-base font-extrabold text-on-surface">
              {landmark} ({roadName})
            </span>
            <span className="text-xs text-error font-bold mt-0.5">
              Reported Severity: {depthText}
            </span>
          </div>

          {/* Safety Rule 6.12 Requirement */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-300 p-3 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-amber-700 shrink-0 mt-0.5">
              electric_bolt
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-900">Life-Safety Notice</span>
              <p className="text-xs text-amber-800 leading-snug mt-0.5 font-semibold">
                Stay away from electric poles, feeder pillars, and submerged cables near water. Do not attempt to drive through water.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            This alert was pushed to your device based on your proximity to the verified flood hazard zone. Acknowledging this alert confirms receipt and cancels SMS fallback dispatch.
          </p>

          {/* Primary Action Button */}
          <button
            onClick={() => {
              emergencyAudio.stop();
              onAcknowledge();
            }}
            className="w-full py-3.5 rounded-xl bg-error hover:bg-error/90 active:scale-95 text-on-error font-extrabold text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">done_all</span>
            <span>I Acknowledge &amp; Am Safe</span>
          </button>
        </div>
      </div>
    </div>
  );
};
