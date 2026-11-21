import React from 'react';
import { AlertDeliveryState } from '../../lib/deliveryStateMachine';
import { DemoBadge } from '../common/DemoBadge';

interface DeliveryTrackerModalProps {
  deliveryState: AlertDeliveryState | null;
  onClose: () => void;
}

export const DeliveryTrackerModal: React.FC<DeliveryTrackerModalProps> = ({
  deliveryState,
  onClose,
}) => {
  if (!deliveryState) return null;

  return (
    <div className="fixed bottom-20 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl border border-surface-container-high shadow-2xl p-4 flex flex-col gap-3 text-xs select-none animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[18px]">
            send_time_extension
          </span>
          <span className="font-bold text-on-surface text-xs uppercase tracking-wide">
            Alert Delivery State Machine
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <DemoBadge />
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>

      {/* State Machine Steps */}
      <div className="space-y-2">
        {/* Step 1: Web Push */}
        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-surface-container-low">
          <div className="w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
            1
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-on-surface">Web Push Notification</span>
              <span className="text-[10px] text-secondary font-bold uppercase">Sent</span>
            </div>
            <span className="text-[10px] text-on-surface-variant">
              Vibration pattern: [500, 200, 500, 200, 800] ms
            </span>
          </div>
        </div>

        {/* Step 2: 25-Second Ack Timer */}
        <div className={`flex items-start gap-2.5 p-2 rounded-xl transition-all ${
          deliveryState.status === 'push_acknowledged'
            ? 'bg-secondary-container/40 text-on-secondary-container'
            : deliveryState.status === 'sms_fallback_sent'
            ? 'bg-amber-100 text-amber-900'
            : 'bg-surface-container-low text-on-surface'
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
            deliveryState.status === 'push_acknowledged'
              ? 'bg-secondary text-on-secondary'
              : 'bg-primary text-on-primary'
          }`}>
            2
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold">25s Acknowledgment Gate</span>
              <span className="text-[10px] font-mono font-bold">
                {deliveryState.status === 'push_acknowledged'
                  ? 'Acknowledged'
                  : deliveryState.status === 'sms_fallback_sent'
                  ? 'Expired'
                  : `${deliveryState.secondsRemaining}s`}
              </span>
            </div>
            <span className="text-[10px] opacity-80">
              {deliveryState.status === 'push_acknowledged'
                ? 'User acknowledged. SMS fallback cancelled.'
                : deliveryState.status === 'sms_fallback_sent'
                ? 'No acknowledgment in 25s. SMS triggered.'
                : 'Waiting for client acknowledgment callback.'}
            </span>
          </div>
        </div>

        {/* Step 3: SMS Fallback */}
        {deliveryState.smsRecord && (
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-error-container/50 border border-error/20">
            <div className="w-5 h-5 rounded-full bg-error text-on-error flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              3
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-on-error-container">SMS Fallback Dispatched</span>
                <span className="text-[10px] font-bold uppercase text-error">
                  {deliveryState.smsRecord.status}
                </span>
              </div>
              <div className="mt-1 p-1.5 rounded bg-white text-[10px] text-on-surface font-mono border border-error/20 leading-tight">
                {deliveryState.smsRecord.messageText}
              </div>
              <span className="text-[9px] text-on-error-container mt-1 font-semibold">
                Character count: {deliveryState.smsRecord.charCount}/160 chars (100% compliant)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
