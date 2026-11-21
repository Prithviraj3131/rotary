import { OfflineQueuedMessage } from '../types/relay';
import { ReportRow } from '../types/database';
import { emergencyAudio } from './audioAlert';

const BROADCAST_CHANNEL_NAME = 'floodguard_mesh_p2p';
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
}

// Unique device identifier
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'node-server';
  let id = localStorage.getItem('floodguard_device_id');
  if (!id) {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    id = `${isMobile ? 'Mobile' : 'Web'}-Node-${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem('floodguard_device_id', id);
  }
  return id;
}

export function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Citizen Web Terminal';
  let name = localStorage.getItem('floodguard_device_name');
  if (!name || name === 'Android Mobile Peer' || name === 'Citizen Web Terminal') {
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    name = isMobile ? `Phone-${suffix}` : `Web-${suffix}`;
    localStorage.setItem('floodguard_device_name', name);
  }
  return name;
}

// Resolves local LAN Relay Hub URL
export function getMeshRelayUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3000';
  
  const saved = localStorage.getItem('floodguard_relay_url');
  if (saved && saved.trim()) return saved.trim();

  // If running on phone/tablet or localhost inside Capacitor WebView, point to LAN server IP
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || !hostname) {
    // If running in Capacitor Android, default to PC LAN server
    if ((window as any).Capacitor) {
      return 'http://192.168.1.2:3000';
    }
    return window.location.origin;
  }

  return window.location.origin;
}

export function setMeshRelayUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('floodguard_relay_url', url.trim());
  }
}

// Broadcasts an offline message to all devices on LAN & cross-tab
export async function broadcastMeshMessage(msg: OfflineQueuedMessage): Promise<void> {
  // 1. Cross-tab BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'PEER_MESSAGE', payload: msg });
    } catch {}
  }

  // 2. HTTP Relay Endpoint (Vite server / LAN hub)
  const relayBase = getMeshRelayUrl();
  try {
    const res = await fetch(`${relayBase}/api/mesh/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    if (!res.ok) {
      console.warn('Mesh HTTP broadcast returned non-200:', res.status);
    }
  } catch (err) {
    console.warn('Mesh HTTP broadcast network notice (peer offline):', err);
  }
}

// Broadcasts a flood report to all connected devices
export async function broadcastMeshReport(report: ReportRow): Promise<void> {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'REPORT_UPSERT', payload: report });
    } catch {}
  }

  const relayBase = getMeshRelayUrl();
  try {
    await fetch(`${relayBase}/api/mesh/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
  } catch {}
}

type IncomingMessageCallback = (msg: OfflineQueuedMessage) => void;
type IncomingReportCallback = (report: ReportRow) => void;

// Starts SSE stream and periodic polling for incoming mesh packets
export function initMeshNetwork(
  onIncomingMessage: IncomingMessageCallback,
  onIncomingReport?: IncomingReportCallback
): () => void {
  const myId = getDeviceId();
  let isStopped = false;
  const relayBase = getMeshRelayUrl();
  const seenIds = new Set<string>();

  const processIncomingMessage = (msg: OfflineQueuedMessage) => {
    if (!msg || !msg.id || seenIds.has(msg.id)) return;
    seenIds.add(msg.id);

    // If sent by this device, don't trigger incoming peer alert
    if (msg.senderId === myId) return;

    // Trigger audio chime & haptic vibration on phone
    emergencyAudio.playPeerChime();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([250, 100, 250, 100, 500]);
      } catch {}
    }

    onIncomingMessage(msg);
  };

  // 1. BroadcastChannel Listener (Tabs on same machine)
  const handleBcMessage = (event: MessageEvent) => {
    if (event.data?.type === 'PEER_MESSAGE') {
      processIncomingMessage(event.data.payload);
    } else if (event.data?.type === 'REPORT_UPSERT' && onIncomingReport) {
      onIncomingReport(event.data.payload);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBcMessage);
  }

  // 2. Server-Sent Events (SSE) Listener for sub-100ms real-time push
  let eventSource: EventSource | null = null;
  const connectSSE = () => {
    if (isStopped || typeof EventSource === 'undefined') return;
    try {
      eventSource = new EventSource(`${relayBase}/api/mesh/events`);
      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === 'MESH_MESSAGE') {
            processIncomingMessage(parsed.payload);
          } else if (parsed.type === 'REPORT_UPSERT' && onIncomingReport) {
            onIncomingReport(parsed.payload);
          }
        } catch {}
      };
      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Retry SSE in 5s
        if (!isStopped) {
          setTimeout(connectSSE, 5000);
        }
      };
    } catch {}
  };

  connectSSE();

  // 3. Fallback Periodic Polling (Guarantees sync if SSE is interrupted by mobile power save)
  const pollInterval = setInterval(async () => {
    if (isStopped) return;
    try {
      const res = await fetch(`${relayBase}/api/mesh/messages`);
      if (res.ok) {
        const list: OfflineQueuedMessage[] = await res.json();
        list.forEach((msg) => processIncomingMessage(msg));
      }
    } catch {}
  }, 2500);

  // Initial fetch
  fetch(`${relayBase}/api/mesh/messages`)
    .then((r) => r.json())
    .then((list: OfflineQueuedMessage[]) => {
      list.forEach((msg) => processIncomingMessage(msg));
    })
    .catch(() => {});

  // Cleanup
  return () => {
    isStopped = true;
    clearInterval(pollInterval);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBcMessage);
    }
    if (eventSource) {
      eventSource.close();
    }
  };
}
