import React from 'react';
import { OfflineQueuedMessage } from '../../types/relay';

interface IncomingMeshAlertModalProps {
  message: OfflineQueuedMessage | null;
  onClose: () => void;
  onOpenMeshHub: () => void;
}

export const IncomingMeshAlertModal: React.FC<IncomingMeshAlertModalProps> = ({
  message,
  onClose,
  onOpenMeshHub,
}) => {
  if (!message) return null;

  const isHigh = message.priority === 'high';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border-2 border-primary/40 overflow-hidden flex flex-col animate-scale-up">
        {/* Top Accent Header */}
        <div className={`p-4 ${isHigh ? 'bg-error-container/30 border-b border-error/20' : 'bg-primary-container/20 border-b border-primary/20'} flex items-start justify-between gap-3`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isHigh ? 'bg-error text-on-error animate-pulse' : 'bg-primary text-on-primary'}`}>
              <span className="material-symbols-outlined text-[24px]">wifi_tethering</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface">
                  NEARBY PEER ALERT
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                </span>
              </div>
              <h3 className="text-sm font-bold text-on-surface mt-0.5">
                {message.type}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col gap-3">
          {/* Metadata Chips */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-surface-container font-semibold text-on-surface">
              👥 {message.tag}
            </span>
            {isHigh && (
              <span className="px-2.5 py-1 rounded-lg bg-error-container text-on-error-container font-bold text-[11px] uppercase tracking-wider">
                ⚡ High Urgency
              </span>
            )}
            <span className="text-[11px] text-on-surface-variant ml-auto font-mono">
              Just now
            </span>
          </div>

          {/* Message Text Banner */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface font-medium text-sm leading-relaxed">
            "{message.text}"
          </div>

          {/* Telemetry info */}
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1 font-mono">
            <span>Node: <strong className="text-on-surface">{message.senderId || 'Nearby Device'}</strong></span>
            <span>Relayed via: <strong className="text-secondary">P2P Mesh Link</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-surface-container-low border-t border-surface-container-high flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl border border-surface-container-highest text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenMeshHub();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">forum</span>
            <span>Open Mesh Hub</span>
          </button>
        </div>
      </div>
    </div>
  );
};
