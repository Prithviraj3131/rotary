// Frozen Types for Offline Message Transfer & Phone-to-Phone Relay (Section 5)

export type RelayMessageKind = 'alert' | 'clear' | 'report_unverified' | 'status_update';

export interface AlertPacket {
  v: number;            // Version (1)
  id: string;           // UUID
  kind: RelayMessageKind;
  cell: string;         // Geohash or grid cell ID
  sev: number;          // Severity 1-4
  issued: string;       // ISO timestamp
  ttl_min: number;      // Time to live in minutes
  hops_left: number;    // Decrements at each peer forward (e.g. 6 -> 5 -> 0)
  sig: string;          // Base64 signature
  payload?: {
    type: 'Emergency Help' | 'Flood Report' | 'Status Update';
    tag: string;
    text: string;
    author: string;
  };
}

export interface OfflineQueuedMessage {
  id: string;
  type: 'Emergency Help' | 'Flood Report' | 'Status Update';
  tag: string;
  text: string;
  priority: 'high' | 'normal';
  expiryHours: number;
  created_at: string;
  status: 'queued_local' | 'relayed_mesh' | 'synced_server';
  hopsTraveled: number;
  peerRelayCount: number;
}
