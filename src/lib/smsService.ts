// SMS Service & Delivery Layer (Section 5, Layer 2)

export interface SMSMessagePayload {
  toPhone: string;
  landmark: string;
  roadName: string;
  severityText: string;
}

export interface SMSRecord {
  id: string;
  toPhone: string;
  messageText: string;
  sentAt: string;
  status: 'sent' | 'simulated' | 'failed';
  charCount: number;
  isDemo: boolean;
}

// User-cell cooldown tracking (10-minute cooldown rule)
const cooldownMap = new Map<string, number>();

/**
 * Formats standard Pune emergency SMS strictly keeping character count under 160 characters
 * Template: "FLOOD ALERT: severe flooding near <landmark>. Avoid <road>. Stay away from poles and cables near water."
 */
export function formatEmergencySMS(landmark: string, roadName: string): string {
  const truncatedLandmark = landmark.slice(0, 28);
  const truncatedRoad = roadName.slice(0, 24);
  const text = `FLOOD ALERT: severe flooding near ${truncatedLandmark}. Avoid ${truncatedRoad}. Stay away from poles and cables near water.`;
  // Ensure strict adherence to 160 GSM character limit
  return text.length > 160 ? text.slice(0, 157) + '...' : text;
}

/**
 * Validates 10-minute cooldown per user per cell
 */
export function isUserInCooldown(userId: string, cellId: string): boolean {
  const key = `${userId}:${cellId}`;
  const lastSent = cooldownMap.get(key);
  if (!lastSent) return false;

  const now = Date.now();
  const TEN_MINUTES_MS = 10 * 60 * 1000;
  return now - lastSent < TEN_MINUTES_MS;
}

export function recordUserCooldown(userId: string, cellId: string): void {
  const key = `${userId}:${cellId}`;
  cooldownMap.set(key, Date.now());
}

/**
 * Dispatches emergency SMS with simulated trial fallback
 */
export async function sendEmergencySMS(
  toPhone: string,
  landmark: string,
  roadName: string,
  cellId: string = 'pune_cell_default'
): Promise<SMSRecord> {
  const text = formatEmergencySMS(landmark, roadName);
  const nowIso = new Date().toISOString();
  const id = `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  recordUserCooldown('current-user', cellId);

  // In production with Twilio / Fast2SMS credentials:
  // e.g. await fetch('/api/send-sms', { ... })
  // For the hackathon prototype: 1 real teammate phone or clearly labeled simulation:
  const isRealDispatch = false; // Set to true if trial API keys configured

  return {
    id,
    toPhone: toPhone || '+91 98201 44510',
    messageText: text,
    sentAt: nowIso,
    status: isRealDispatch ? 'sent' : 'simulated',
    charCount: text.length,
    isDemo: true
  };
}
