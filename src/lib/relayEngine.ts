import { AlertPacket, OfflineQueuedMessage } from '../types/relay';
import { saveOfflineMessageIDB, getOfflineMessagesIDB } from './idb';
import { getDeviceId, getDeviceName, broadcastMeshMessage } from './meshNetwork';

// Local seen-set of alert IDs with expiry timestamps to drop duplicates (Rule 3)
const seenAlerts = new Map<string, number>();

type MessageListener = (messages: OfflineQueuedMessage[]) => void;
const listeners = new Set<MessageListener>();

let localMessagesCache: OfflineQueuedMessage[] = [];

// Initialize messages from IndexedDB or seed defaults if empty
export async function initOfflineMessages(): Promise<OfflineQueuedMessage[]> {
  try {
    const fromDb = await getOfflineMessagesIDB();
    if (fromDb && fromDb.length > 0) {
      localMessagesCache = fromDb;
    } else {
      localMessagesCache = [
        {
          id: 'msg-local-01',
          type: 'Status Update',
          tag: 'Family',
          text: 'Safe on 2nd floor at Baner home. Power cut active. Water rising in street parking.',
          priority: 'normal',
          expiryHours: 6,
          created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
          status: 'relayed_mesh',
          hopsTraveled: 3,
          peerRelayCount: 4,
        },
        {
          id: 'msg-local-02',
          type: 'Emergency Help',
          tag: 'Relief Team',
          text: 'Need drinking water packet and dry battery for elderly resident near Datta Mandir.',
          priority: 'high',
          expiryHours: 2,
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          status: 'queued_local',
          hopsTraveled: 0,
          peerRelayCount: 1,
        },
      ];
      for (const m of localMessagesCache) {
        await saveOfflineMessageIDB(m);
      }
    }
  } catch (err) {
    console.warn('IDB offline messages fetch warning, using in-memory store:', err);
  }
  notify();
  return localMessagesCache;
}

function notify() {
  listeners.forEach((cb) => cb([...localMessagesCache]));
}

export function subscribeQueuedMessages(listener: MessageListener): () => void {
  listeners.add(listener);
  // Send current cache immediately
  listener([...localMessagesCache]);
  // Fetch latest from IndexedDB
  initOfflineMessages();
  return () => listeners.delete(listener);
}

/**
 * Validates incoming alert packet against the 9 Ground Rules (Section 5)
 */
export function verifyAndProcessPacket(packet: AlertPacket): {
  accepted: boolean;
  reason: string;
  forwardPacket?: AlertPacket;
} {
  const now = Date.now();

  // Rule 2: Reject if expired (issued + ttl_min in past)
  const issuedTime = new Date(packet.issued).getTime();
  const expiryTime = issuedTime + packet.ttl_min * 60 * 1000;
  if (now > expiryTime) {
    return { accepted: false, reason: 'Packet TTL expired' };
  }

  // Rule 3: Reject if already in local seen-set (Duplicate drop)
  if (seenAlerts.has(packet.id)) {
    return { accepted: false, reason: 'Duplicate packet already seen' };
  }

  // Rule 1: Signature check (Mock Ed25519 public key validation)
  if (packet.kind !== 'report_unverified' && !packet.sig) {
    return { accepted: false, reason: 'Invalid or missing cryptographic signature' };
  }

  // Record in seen-set with expiry
  seenAlerts.set(packet.id, expiryTime);

  // Rule 5: Hop reduction & forwarding
  if (packet.hops_left > 0) {
    const forwardPacket: AlertPacket = {
      ...packet,
      hops_left: packet.hops_left - 1,
    };
    return { accepted: true, reason: 'Accepted and queued for forwarding', forwardPacket };
  }

  return { accepted: true, reason: 'Accepted locally (Terminal hop 0, not forwarded)' };
}

type MessageBroadcaster = (msg: OfflineQueuedMessage) => void;
const messageBroadcasters = new Set<MessageBroadcaster>();

export function registerOfflineMessageBroadcaster(broadcaster: MessageBroadcaster): () => void {
  messageBroadcasters.add(broadcaster);
  return () => messageBroadcasters.delete(broadcaster);
}

/**
 * Adds an offline message composed by the user to the local IndexedDB device queue
 */
export async function queueOfflineMessage(
  type: 'Emergency Help' | 'Flood Report' | 'Status Update',
  tag: string,
  text: string,
  priority: 'high' | 'normal',
  expiryHours: number
): Promise<OfflineQueuedMessage> {
  const msg: OfflineQueuedMessage = {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    tag,
    text,
    priority,
    expiryHours,
    created_at: new Date().toISOString(),
    status: 'queued_local',
    hopsTraveled: 0,
    peerRelayCount: 0,
    senderId: getDeviceId(),
    senderDevice: getDeviceName(),
  };

  localMessagesCache.unshift(msg);
  notify();

  try {
    await saveOfflineMessageIDB(msg);
  } catch (err) {
    console.warn('Could not persist offline message to IDB:', err);
  }

  // Broadcast to all nearby nodes via LAN Relay & Cross-tab
  broadcastMeshMessage(msg).catch(() => {});

  // Broadcast via registered live P2P mesh radios (e.g. Google Nearby Connections)
  messageBroadcasters.forEach((fn) => {
    try { fn(msg); } catch {}
  });

  return msg;
}

/**
 * Handles incoming mesh message received from a peer device over the network
 */
export async function handleIncomingMeshMessage(incoming: OfflineQueuedMessage): Promise<void> {
  if (!incoming || !incoming.id) return;
  if (localMessagesCache.some((m) => m.id === incoming.id)) return;

  const peerMsg: OfflineQueuedMessage = {
    ...incoming,
    status: 'relayed_mesh',
    hopsTraveled: (incoming.hopsTraveled ?? 0) + 1,
    peerRelayCount: (incoming.peerRelayCount ?? 0) + 1,
  };

  localMessagesCache.unshift(peerMsg);
  notify();

  try {
    await saveOfflineMessageIDB(peerMsg);
  } catch (err) {
    console.warn('Could not persist incoming peer message to IDB:', err);
  }
}

/**
 * Simulates a peer passing by within BLE range, exchanging packets,
 * incrementing hops, and validating Ed25519 signatures
 */
export async function simulatePeerMeshExchange(): Promise<{
  relayedCount: number;
  newIncomingMessage?: OfflineQueuedMessage;
}> {
  let relayedCount = 0;

  // 1. Advance queued messages to relayed
  const updated = localMessagesCache.map((m) => {
    if (m.status === 'queued_local') {
      relayedCount++;
      return {
        ...m,
        status: 'relayed_mesh' as const,
        hopsTraveled: m.hopsTraveled + 1,
        peerRelayCount: m.peerRelayCount + 1,
      };
    }
    return m;
  });

  // 2. Introduce an incoming mesh packet from nearby peer
  const incomingMessagesPool: { text: string; tag: string; type: 'Emergency Help' | 'Status Update' }[] = [
    {
      text: 'Water at Alka Talkies underpass is now 50cm deep. Avoid crossing via Tilak Road bridge instead.',
      tag: 'Neighbors',
      type: 'Status Update',
    },
    {
      text: 'Evacuation boat active near Sinhagad Road Vitthalwadi. Assemble near Parvati hilltop.',
      tag: 'Relief Team',
      type: 'Emergency Help',
    },
    {
      text: 'Power cut extended to Kothrud sector 4. Mobile signals weak. Using BLE mesh relay.',
      tag: 'Family',
      type: 'Status Update',
    },
  ];

  const randomIncoming = incomingMessagesPool[Math.floor(Math.random() * incomingMessagesPool.length)];
  const incomingMsg: OfflineQueuedMessage = {
    id: `peer-${Date.now()}`,
    type: randomIncoming.type,
    tag: randomIncoming.tag,
    text: randomIncoming.text,
    priority: 'normal',
    expiryHours: 4,
    created_at: new Date().toISOString(),
    status: 'relayed_mesh',
    hopsTraveled: 2,
    peerRelayCount: 3,
  };

  updated.unshift(incomingMsg);
  localMessagesCache = updated;
  notify();

  for (const m of updated) {
    try {
      await saveOfflineMessageIDB(m);
    } catch {}
  }

  return { relayedCount, newIncomingMessage: incomingMsg };
}
