import React, { useState, useEffect } from 'react';
import { DemoBadge } from '../components/common/DemoBadge';
import {
  queueOfflineMessage,
  subscribeQueuedMessages
} from '../lib/relayEngine';
import { OfflineQueuedMessage } from '../types/relay';

const TAGS = ['Family', 'Neighbors', 'Relief Team'];
const QUICK_CHIPS = ['+ Water rising', '+ Need evacuation', '+ Safe & sheltered', '+ Medical assistance needed'];

export const OfflineCommView: React.FC = () => {
  const [messages, setMessages] = useState<OfflineQueuedMessage[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [msgType, setMsgType] = useState<'Emergency Help' | 'Flood Report' | 'Status Update'>('Status Update');
  const [selectedTag, setSelectedTag] = useState(TAGS[0]);
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [expiryHours, setExpiryHours] = useState<2 | 6>(2);
  const [messageText, setMessageText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeQueuedMessages((data) => {
      setMessages(data);
    });
    return unsub;
  }, []);

  const handleSaveMessage = () => {
    if (!messageText.trim()) return;

    queueOfflineMessage(msgType, selectedTag, messageText.trim(), isHighPriority ? 'high' : 'normal', expiryHours);
    setMessageText('');
    setIsComposing(false);
    setToastMessage('Message queued in local IndexedDB. Broadcasting via simulated Nearby BLE/Wi-Fi mesh.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="w-full max-w-md md:max-w-xl mx-auto px-4 py-4 flex flex-col gap-4 pb-24">
      {/* 1. Header Banner & Status Strip (Matching Template) */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-sm bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">wifi_off</span>
            </div>
            <h1 className="text-xs font-bold uppercase tracking-wider text-primary">
              Offline Mesh Communication
            </h1>
          </div>
          <DemoBadge label="BLE RELAY DEMO" />
        </div>

        {/* 3 Telemetry Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* Internet */}
          <div className="flex flex-col p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="text-[10px] text-on-surface-variant font-medium">Internet</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-xs font-bold text-on-surface">OFFLINE</span>
            </div>
          </div>

          {/* Bluetooth Mesh */}
          <div className="flex flex-col p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="text-[10px] text-on-surface-variant font-medium">Nearby Relay</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="text-xs font-bold text-secondary">Active</span>
            </div>
          </div>

          {/* Last Sync */}
          <div className="flex flex-col p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="text-[10px] text-on-surface-variant font-medium">Last Sync</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
              <span className="text-xs font-bold text-on-surface">14:22 IST</span>
            </div>
          </div>
        </div>

        {/* Assurance Banner */}
        <div className="rounded-xl bg-secondary-container/30 border border-secondary/20 p-3 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[14px]">offline_pin</span>
          </div>
          <p className="text-xs text-on-surface font-medium leading-snug">
            Messages are preserved on this phone’s IndexedDB. Passing Android peers relay signed packets without cellular data.
          </p>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-secondary text-on-secondary rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 animate-bounce-short">
          <span className="material-symbols-outlined text-[18px]">bluetooth_audio</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Compose Trigger / Drawer */}
      {!isComposing ? (
        <button
          onClick={() => setIsComposing(true)}
          className="w-full rounded-2xl bg-primary text-on-primary py-3.5 px-4 shadow-md flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider hover:bg-primary/95 active:scale-98 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">edit_note</span>
          <span>Compose Offline Message</span>
        </button>
      ) : (
        <div className="w-full rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-on-surface">
              New Offline Message
            </span>
            <button onClick={() => setIsComposing(false)} className="text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Type Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase">Message Type</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Emergency Help', 'Flood Report', 'Status Update'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMsgType(t)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-semibold transition-all ${
                    msgType === t
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedTag === tag
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* High Priority Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[18px] ${isHighPriority ? 'text-error' : 'text-on-surface-variant'}`}>
                priority_high
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">High Priority Packet</span>
                <span className="text-[10px] text-on-surface-variant">Forwarded first via mesh relay</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isHighPriority}
              onChange={(e) => setIsHighPriority(e.target.checked)}
              className="w-4 h-4 text-error rounded focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Text Area */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] text-on-surface-variant">
              <span>Message (Max 240 chars)</span>
              <span>{messageText.length} / 240</span>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value.slice(0, 240))}
              placeholder="e.g. Safe at home on 2nd floor, water rising at gate, 2 people..."
              rows={3}
              className="w-full rounded-xl bg-surface-container-low p-3 text-xs text-on-surface placeholder:text-outline focus:outline-none border border-surface-container-high resize-none"
            />

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {QUICK_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessageText((prev) => (prev ? `${prev} ${chip}` : chip))}
                  className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] text-on-surface-variant hover:text-on-surface"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Expiry Selector */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Packet Expiry TTL:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setExpiryHours(2)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  expiryHours === 2 ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                2 Hours
              </button>
              <button
                type="button"
                onClick={() => setExpiryHours(6)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  expiryHours === 6 ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                6 Hours
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSaveMessage}
            className="w-full py-3 rounded-xl bg-secondary text-on-secondary font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-secondary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5 mt-1"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>Save to Device Queue</span>
          </button>
        </div>
      )}

      {/* 3. Pending Messages List (Stored in IndexedDB) */}
      <div className="w-full rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">outbox</span>
            <h2 className="font-bold text-xs uppercase tracking-wider text-on-surface">
              Pending &amp; Relayed Messages ({messages.length})
            </h2>
          </div>
          <span className="text-[10px] text-on-surface-variant font-medium">Device IndexedDB</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                    {msg.tag}
                  </span>
                  <span className="font-semibold text-on-surface text-[11px]">{msg.type}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase ${
                  msg.status === 'relayed_mesh' ? 'text-secondary' : 'text-amber-800'
                }`}>
                  {msg.status === 'relayed_mesh' ? `Relayed via ${msg.peerRelayCount} Peers` : 'Saved Locally'}
                </span>
              </div>

              <p className="text-xs text-on-surface leading-snug font-medium">
                {msg.text}
              </p>

              <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-1 border-t border-surface-container-high/60">
                <span>Hops: {msg.hopsTraveled} / 6 max</span>
                <span>TTL: {msg.expiryHours}h</span>
                <span className="font-mono">Ed25519 Signed</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ground Rule Note */}
      <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container-high text-[10px] text-on-surface-variant leading-relaxed text-center">
        <strong>Ground Rule 7 Note:</strong> True background phone-to-phone mesh requires a native Android foreground service using Google Nearby Connections API. This browser module implements the identical Ed25519 cryptographic packet validation and hop propagation logic in simulation mode.
      </div>
    </div>
  );
};
