import React, { useState, useEffect } from 'react';
import { DemoBadge } from '../components/common/DemoBadge';
import {
  queueOfflineMessage,
  subscribeQueuedMessages,
  simulatePeerMeshExchange,
} from '../lib/relayEngine';
import { OfflineQueuedMessage } from '../types/relay';
import { getDeviceId, getMeshRelayUrl, setMeshRelayUrl } from '../lib/meshNetwork';

const TAGS = ['Family', 'Neighbors', 'Relief Team'];
const QUICK_CHIPS = [
  '+ Water rising at gate',
  '+ Need drinking water',
  '+ Safe on 2nd floor',
  '+ Elderly resident needs aid',
];

export const OfflineCommView: React.FC = () => {
  const [messages, setMessages] = useState<OfflineQueuedMessage[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [msgType, setMsgType] = useState<'Emergency Help' | 'Flood Report' | 'Status Update'>('Status Update');
  const [selectedTag, setSelectedTag] = useState(TAGS[0]);
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [expiryHours, setExpiryHours] = useState<2 | 6>(2);
  const [messageText, setMessageText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [relayUrl, setRelayUrlState] = useState<string>(() => getMeshRelayUrl());
  const [isEditingRelay, setIsEditingRelay] = useState(false);
  const [tempRelayUrl, setTempRelayUrl] = useState('');

  useEffect(() => {
    const unsub = subscribeQueuedMessages((data) => {
      setMessages(data);
    });
    return unsub;
  }, []);

  const handleSaveMessage = async () => {
    if (!messageText.trim()) return;

    await queueOfflineMessage(
      msgType,
      selectedTag,
      messageText.trim(),
      isHighPriority ? 'high' : 'normal',
      expiryHours
    );

    setMessageText('');
    setIsComposing(false);
    setToastMessage('✓ Message broadcast across LAN mesh & stored in IndexedDB. Nearby peers alerted!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSimulateSync = async () => {
    setIsSyncing(true);
    setToastMessage('Scanning for nearby BLE / Wi-Fi Direct peer carrier nodes...');

    setTimeout(async () => {
      const res = await simulatePeerMeshExchange();
      setIsSyncing(false);
      setToastMessage(
        `✓ Peer handshake complete! Relayed ${res.relayedCount} local packets & received 1 signed incoming peer alert.`
      );
      setTimeout(() => setToastMessage(null), 5000);
    }, 1200);
  };

  return (
    <div className="w-full max-w-md md:max-w-xl mx-auto px-4 py-4 flex flex-col gap-4 pb-24">
      {/* 1. Header Banner & Status Strip */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-sm bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">wifi_off</span>
            </div>
            <h1 className="text-xs font-bold uppercase tracking-wider text-primary">
              Offline Mesh Communication
            </h1>
          </div>
          <DemoBadge label="P2P BLE RELAY" />
        </div>

        {/* 3 Telemetry Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* Internet */}
          <div className="flex flex-col p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="text-[10px] text-on-surface-variant font-medium">Cellular Link</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span className="text-xs font-bold text-on-surface">OFFLINE</span>
            </div>
          </div>

          {/* Bluetooth Mesh */}
          <div className="flex flex-col p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="text-[10px] text-on-surface-variant font-medium">Nearby Relay</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="text-xs font-bold text-secondary">Armed (12 Peers)</span>
            </div>
          </div>

          {/* Stored Packets */}
          <div className="flex flex-col p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="text-[10px] text-on-surface-variant font-medium">IndexedDB Queue</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[13px] text-primary">inventory_2</span>
              <span className="text-xs font-bold text-on-surface">{messages.length} Packets</span>
            </div>
          </div>
        </div>

        {/* Node & Relay Hub Connectivity Strip */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-surface-container border border-surface-container-high text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-on-surface-variant font-medium">
              This Node: <strong className="text-on-surface font-mono">{getDeviceId()}</strong>
            </span>
            <span className="flex items-center gap-1 text-[10px] text-secondary font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Live Peer Mesh
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 border-t border-surface-container-high">
            <span>Relay Hub: <strong className="text-primary font-mono">{relayUrl}</strong></span>
            {!isEditingRelay ? (
              <button
                onClick={() => {
                  setTempRelayUrl(relayUrl);
                  setIsEditingRelay(true);
                }}
                className="text-[10px] text-primary hover:underline font-semibold"
              >
                Change IP
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempRelayUrl}
                  onChange={(e) => setTempRelayUrl(e.target.value)}
                  className="px-1.5 py-0.5 rounded bg-surface-container-lowest border border-surface-container-highest text-[10px] font-mono text-on-surface w-32"
                  placeholder="http://192.168.1.2:3000"
                />
                <button
                  onClick={() => {
                    if (tempRelayUrl.trim()) {
                      setMeshRelayUrl(tempRelayUrl.trim());
                      setRelayUrlState(tempRelayUrl.trim());
                    }
                    setIsEditingRelay(false);
                  }}
                  className="px-1.5 py-0.5 rounded bg-primary text-on-primary text-[10px] font-bold"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar: Peer Sync Trigger */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-surface-container">
          <span className="text-[11px] text-on-surface-variant">
            Opportunistic store-and-forward mesh
          </span>

          <button
            onClick={handleSimulateSync}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-xl bg-secondary text-on-secondary font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-secondary/90 active:scale-95 transition-all shrink-0"
          >
            <span className={`material-symbols-outlined text-[16px] ${isSyncing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isSyncing ? 'Syncing...' : 'Simulate Peer Mesh Sync'}</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-surface-container-lowest text-on-surface rounded-xl text-xs font-semibold shadow-md border border-secondary/30 flex items-center gap-2 animate-bounce-short">
          <span className="material-symbols-outlined text-[18px] text-secondary">bluetooth_audio</span>
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
          <span>Compose New Offline Message</span>
        </button>
      ) : (
        <div className="w-full rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 shadow-sm flex flex-col gap-3 animate-scale-up">
          <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-on-surface">
              New Offline Message
            </span>
            <button onClick={() => setIsComposing(false)} className="text-on-surface-variant hover:text-on-surface">
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

          {/* Audience Tags */}
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
              className="w-4 h-4 accent-error rounded cursor-pointer"
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
                  onClick={() => setMessageText((prev) => (prev ? `${prev} ${chip.replace('+', '')}` : chip.replace('+', '')))}
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
            <span>Save to Device Queue &amp; Broadcast</span>
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
          {messages.length === 0 ? (
            <div className="p-6 text-center text-xs text-on-surface-variant">
              No messages queued yet. Tap compose to create an offline packet.
            </div>
          ) : (
            messages.map((msg) => (
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
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      msg.status === 'relayed_mesh'
                        ? 'bg-secondary-container/80 text-secondary'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {msg.status === 'relayed_mesh'
                      ? `Relayed via ${msg.peerRelayCount} Peers`
                      : 'Saved Locally in IDB'}
                  </span>
                </div>

                <p className="text-xs text-on-surface leading-snug font-medium">
                  {msg.text}
                </p>

                <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-1 border-t border-surface-container-high/60">
                  <span>Node: <strong className="text-on-surface font-mono">{msg.senderId || 'This Device'}</strong></span>
                  <span>Hops: {msg.hopsTraveled} / 6</span>
                  <span>TTL: {msg.expiryHours}h</span>
                  <span className="font-mono text-secondary font-semibold">Ed25519</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
