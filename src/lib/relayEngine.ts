import { AlertPacket, OfflineQueuedMessage } from '../types/relay';

// Local seen-set of alert IDs with expiry timestamps to drop duplicates (Rule 3)
const seenAlerts = new Map<string, number>();

// In-memory queue of user-composed offline messages
const queuedMessages: OfflineQueuedMessage[] = [
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
    peerRelayCount: 4
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
    peerRelayCount: 1
  }
];

type MessageListener = (messages: OfflineQueuedMessage[]) => void;
const listeners = new Set<MessageListener>();

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

/**
 * Adds an offline message composed by the user to the local device queue
 */
export function queueOfflineMessage(
  type: 'Emergency Help' | 'Flood Report' | 'Status Update',
  tag: string,
  text: string,
  priority: 'high' | 'normal',
  expiryHours: number
): OfflineQueuedMessage {
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
    peerRelayCount: 0
  };

  queuedMessages.unshift(msg);
  notify();

  // Simulate nearby peer relay pickup after 4 seconds for demonstration
  setTimeout(() => {
    msg.status = 'relayed_mesh';
    msg.hopsTraveled = 1;
    msg.peerRelayCount = 2;
    notify();
  }, 4000);

  return msg;
}

export function getQueuedMessages(): OfflineQueuedMessage[] {
  return [...queuedMessages];
}

export function subscribeQueuedMessages(listener: MessageListener): () => void {
  listeners.add(listener);
  listener(getQueuedMessages());
  return () => listeners.delete(listener);
}

function notify(): void {
  const data = getQueuedMessages();
  listeners.forEach(cb => cb(data));
}
