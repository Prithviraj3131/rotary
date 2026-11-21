import React, { useState, useEffect } from 'react';
import { DemoBadge } from '../components/common/DemoBadge';
import { nearbyMeshService, MeshSystemState } from '../lib/nearbyMeshService';
import { getDeviceId } from '../lib/meshNetwork';

const QUICK_ALERTS = [
  'Water level rising at Alka Talkies underpass. Avoid crossing.',
  'Tilak Road bridge traffic blocked by standing floodwaters.',
  'Sinhagad Road Vitthalwadi relief boat active. Moving to high ground.',
  'Power station shutdown in Kothrud. Mobile towers down. Relay active.',
];

export const RelaySimView: React.FC = () => {
  const [meshState, setMeshState] = useState<MeshSystemState>(() => nearbyMeshService.getState());
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<'Neighbors' | 'Family' | 'Relief Team'>('Neighbors');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Auto-start mesh on mount
    nearbyMeshService.startLiveMesh();

    const unsub = nearbyMeshService.subscribe((state) => {
      setMeshState(state);
    });

    return () => {
      unsub();
    };
  }, []);

  const handleToggleMesh = async () => {
    if (meshState.isMeshActive) {
      await nearbyMeshService.stopLiveMesh();
    } else {
      await nearbyMeshService.startLiveMesh();
    }
  };

  const handleSendBroadcast = async () => {
    if (!inputText.trim()) return;

    setIsBroadcasting(true);
    await nearbyMeshService.broadcastPacket(inputText.trim(), selectedTag, 'high');
    setInputText('');
    setIsBroadcasting(false);

    setToastMessage('✓ Ed25519-signed packet broadcast across Google Nearby Cluster & LAN!');
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleQuickSend = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="w-full max-w-md md:max-w-4xl mx-auto px-4 py-4 flex flex-col gap-4 pb-24">
      {/* 1. Header & Live Radio Status */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">nearby</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-on-surface">
                  Live Phone-to-Phone Mesh Relay
                </h1>
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${meshState.isMeshActive ? 'bg-secondary' : 'bg-outline'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${meshState.isMeshActive ? 'bg-secondary' : 'bg-outline'}`}></span>
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant font-mono">
                Google Nearby Connections • Strategy: P2P_CLUSTER
              </p>
            </div>
          </div>

          <DemoBadge label={meshState.isNativeSupported ? 'GOOGLE PLAY NEARBY' : 'LIVE LAN + P2P'} />
        </div>

        {/* Live Protocol Status Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col">
            <span className="text-[10px] text-on-surface-variant">Radio Subsystem</span>
            <strong className="text-secondary font-bold text-xs mt-0.5">
              {meshState.isNativeSupported ? 'Android Nearby GMS' : 'LAN Mesh + P2P Bridge'}
            </strong>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col">
            <span className="text-[10px] text-on-surface-variant">BLE Advertising</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${meshState.isAdvertising ? 'bg-secondary' : 'bg-outline'}`}></span>
              <strong className="text-xs text-on-surface">{meshState.isAdvertising ? 'Active' : 'Off'}</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col">
            <span className="text-[10px] text-on-surface-variant">Wi-Fi Direct Discovery</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${meshState.isDiscovering ? 'bg-secondary' : 'bg-outline'}`}></span>
              <strong className="text-xs text-on-surface">{meshState.isDiscovering ? 'Scanning' : 'Off'}</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col">
            <span className="text-[10px] text-on-surface-variant">Discovered Peer Phones</span>
            <strong className="text-xs text-primary font-bold mt-0.5">
              {meshState.discoveredPeers.length} Found ({meshState.connectedPeers.length} Linked)
            </strong>
          </div>
        </div>

        {/* Live Ground Rules Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-surface-container-high">
          <div className="bg-surface-container-low p-2 rounded-xl">
            <span className="text-[10px] text-on-surface-variant block">Packets Relayed</span>
            <strong className="text-base text-secondary">{meshState.packetsRelayed}</strong>
          </div>
          <div className="bg-surface-container-low p-2 rounded-xl">
            <span className="text-[10px] text-on-surface-variant block">Rule 3: Dupes Dropped</span>
            <strong className="text-base text-on-surface">{meshState.duplicatesDropped}</strong>
          </div>
          <div className="bg-surface-container-low p-2 rounded-xl">
            <span className="text-[10px] text-on-surface-variant block">Rule 1: Ed25519 Verified</span>
            <strong className="text-base text-primary">{meshState.verifiedSignatures}</strong>
          </div>
        </div>

        {/* Radio Control Bar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-surface-container-high">
          <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-mono">
            <span>Node ID:</span>
            <strong className="text-on-surface">{getDeviceId()}</strong>
          </div>

          <button
            onClick={handleToggleMesh}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              meshState.isMeshActive
                ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                : 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {meshState.isMeshActive ? 'sensors' : 'sensors_off'}
            </span>
            <span>{meshState.isMeshActive ? 'Radio Armed (P2P Cluster)' : 'Turn On Radio'}</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-surface-container-lowest text-on-surface rounded-xl text-xs font-semibold shadow-md border border-secondary/30 flex items-center gap-2 animate-bounce-short">
          <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Broadcast Live Packet Section */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">cell_tower</span>
            <h2 className="font-bold text-xs uppercase tracking-wider text-on-surface">
              Broadcast Emergency Packet Across Peer Mesh
            </h2>
          </div>
          <span className="text-[10px] text-secondary font-mono font-bold">Rule 5: Hops 6 → 0</span>
        </div>

        {/* Audience Tag Selectors */}
        <div className="flex gap-2">
          {(['Neighbors', 'Relief Team', 'Family'] as const).map((tag) => (
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

        {/* Text Input */}
        <div className="flex flex-col gap-1.5">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={2}
            placeholder="Type emergency alert to transmit to nearby physical phones..."
            className="w-full rounded-xl bg-surface-container-low p-3 text-xs text-on-surface placeholder:text-outline focus:outline-none border border-surface-container-high resize-none"
          />

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_ALERTS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickSend(preset)}
                className="px-2 py-0.5 rounded-lg bg-surface-container text-[10px] text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors text-left"
              >
                + {preset.slice(0, 38)}...
              </button>
            ))}
          </div>
        </div>

        {/* Broadcast Action Button */}
        <button
          onClick={handleSendBroadcast}
          disabled={!inputText.trim() || isBroadcasting}
          className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-wider shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">podcasts</span>
          <span>
            {isBroadcasting
              ? 'Transmitting...'
              : `Transmit to ${Math.max(1, meshState.connectedPeers.length)} Nearby Phones`}
          </span>
        </button>
      </div>

      {/* 3. Live 2D Mesh Topology Canvas */}
      <div className="relative w-full h-72 sm:h-80 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm overflow-hidden select-none">
        {/* Radar Rings Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full border border-secondary/15 animate-ping opacity-25"></div>
          <div className="w-48 h-48 rounded-full border border-secondary/20"></div>
          <div className="w-32 h-32 rounded-full border border-secondary/25"></div>
        </div>

        {/* Center Node (This Device) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30">
          <div className="w-11 h-11 rounded-2xl bg-primary text-on-primary shadow-lg flex items-center justify-center ring-4 ring-primary/20 animate-pulse">
            <span className="material-symbols-outlined text-[22px]">phone_android</span>
          </div>
          <span className="text-[10px] font-bold text-on-surface bg-surface-container/90 px-2 py-0.5 rounded-md mt-1 shadow-xs font-mono">
            This Device (Hub)
          </span>
        </div>

        {/* Discovered & Connected Nearby Peers Placed in Orbit */}
        {meshState.discoveredPeers.map((peer, idx) => {
          const total = Math.max(1, meshState.discoveredPeers.length);
          const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
          const radius = 100; // px in orbit
          const xOffset = Math.cos(angle) * radius;
          const yOffset = Math.sin(angle) * radius;

          return (
            <div
              key={peer.endpointId}
              style={{
                left: `calc(50% + ${xOffset}px)`,
                top: `calc(50% + ${yOffset}px)`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 group cursor-pointer"
              onClick={() => handleQuickSend(`Direct ping to ${peer.name}: Floodwaters receding in sector.`)}
            >
              {/* Node Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shadow-md transition-transform group-hover:scale-110 ${
                  peer.connected
                    ? 'bg-secondary text-on-secondary ring-2 ring-secondary/40'
                    : 'bg-surface-container-highest text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {peer.connected ? 'wifi_tethering' : 'device_unknown'}
                </span>
              </div>

              {/* Peer Label */}
              <span className="text-[9px] font-bold text-on-surface bg-surface-container-lowest px-1.5 py-0.5 rounded shadow-xs mt-1 border border-surface-container-high max-w-[110px] truncate">
                {peer.name}
              </span>
            </div>
          );
        })}

        {/* Legend Overlay */}
        <div className="absolute bottom-2 left-2 right-2 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-surface-container-high text-[10px] flex items-center justify-between">
          <span className="text-on-surface-variant">
            Tap any discovered node to send an instant ping packet.
          </span>
          <span className="font-bold text-secondary font-mono">
            {meshState.connectedPeers.length} P2P Linked Phones
          </span>
        </div>
      </div>

      {/* 4. Live Radio Terminal Event Log */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-2 shadow-sm font-mono text-[11px]">
        <div className="flex items-center justify-between border-b border-surface-container-high pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>
            <span className="font-bold text-on-surface text-xs uppercase font-sans">
              Google Nearby Event Log
            </span>
          </div>
          <span className="text-[10px] text-secondary font-sans font-bold">
            Live Stream
          </span>
        </div>

        <div className="space-y-1 max-h-36 overflow-y-auto text-on-surface-variant">
          {meshState.logs.map((log, i) => (
            <div key={i} className="leading-snug">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
