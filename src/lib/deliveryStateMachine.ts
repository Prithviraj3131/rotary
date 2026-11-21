import { sendEmergencySMS, SMSRecord, isUserInCooldown } from './smsService';

export interface AlertDeliveryState {
  deliveryId: string;
  alertId: string;
  landmark: string;
  roadName: string;
  severity: 'severe' | 'confirmed';
  channel: 'push' | 'sms';
  status: 'push_sent' | 'push_acknowledged' | 'sms_fallback_sent' | 'cooldown_suppressed';
  sentAt: number;
  secondsRemaining: number;
  ackedAt?: number | null;
  smsRecord?: SMSRecord | null;
}

type DeliveryListener = (state: AlertDeliveryState) => void;

class DeliveryStateMachine {
  private activeDeliveries = new Map<string, AlertDeliveryState>();
  private intervals = new Map<string, number>();
  private listeners = new Set<DeliveryListener>();

  /**
   * Dispatches high-urgency alert: fires Web Push with aggressive vibration,
   * then arms a 25-second acknowledgment timer.
   */
  public triggerAlertFlow(
    alertId: string,
    landmark: string,
    roadName: string,
    severity: 'severe' | 'confirmed',
    phone: string = '+91 98201 44510',
    cellId: string = 'pune_cell_1'
  ): string {
    const deliveryId = `deliv-${Date.now()}`;

    // Check 10-minute cooldown suppression
    if (isUserInCooldown('current-user', cellId)) {
      const suppressedState: AlertDeliveryState = {
        deliveryId,
        alertId,
        landmark,
        roadName,
        severity,
        channel: 'push',
        status: 'cooldown_suppressed',
        sentAt: Date.now(),
        secondsRemaining: 0
      };
      this.notify(suppressedState);
      return deliveryId;
    }

    // 1. Dispatch Web Push & Vibration Pattern [500, 200, 500, 200, 800]
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 800]);
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`CRITICAL FLOOD ALERT: ${landmark}`, {
          body: `Severe waterlogging near ${landmark}. Avoid ${roadName}. Stay away from poles and cables.`,
          requireInteraction: true,
          icon: '/favicon.ico'
        });
      } catch (err) {
        console.warn('Notification construction warning:', err);
      }
    }

    const state: AlertDeliveryState = {
      deliveryId,
      alertId,
      landmark,
      roadName,
      severity,
      channel: 'push',
      status: 'push_sent',
      sentAt: Date.now(),
      secondsRemaining: 25
    };

    this.activeDeliveries.set(deliveryId, state);
    this.notify(state);

    // 2. Start 25-second countdown timer
    const intervalId = window.setInterval(async () => {
      const current = this.activeDeliveries.get(deliveryId);
      if (!current || current.status !== 'push_sent') {
        this.clearInterval(deliveryId);
        return;
      }

      const nextRemaining = current.secondsRemaining - 1;

      if (nextRemaining <= 0) {
        this.clearInterval(deliveryId);
        // Timeout reached with no acknowledgment: Escalate to SMS fallback!
        const sms = await sendEmergencySMS(phone, landmark, roadName, cellId);
        const updated: AlertDeliveryState = {
          ...current,
          channel: 'sms',
          status: 'sms_fallback_sent',
          secondsRemaining: 0,
          smsRecord: sms
        };
        this.activeDeliveries.set(deliveryId, updated);
        this.notify(updated);
      } else {
        const updated: AlertDeliveryState = {
          ...current,
          secondsRemaining: nextRemaining
        };
        this.activeDeliveries.set(deliveryId, updated);
        this.notify(updated);
      }
    }, 1000);

    this.intervals.set(deliveryId, intervalId);
    return deliveryId;
  }

  /**
   * User acknowledges alert in UI or service worker callback: cancels SMS escalation!
   */
  public acknowledgeAlert(deliveryId: string): void {
    const current = this.activeDeliveries.get(deliveryId);
    if (!current) return;

    this.clearInterval(deliveryId);

    const updated: AlertDeliveryState = {
      ...current,
      status: 'push_acknowledged',
      ackedAt: Date.now(),
      secondsRemaining: 0
    };

    this.activeDeliveries.set(deliveryId, updated);
    this.notify(updated);
  }

  public subscribe(listener: DeliveryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private clearInterval(deliveryId: string): void {
    const id = this.intervals.get(deliveryId);
    if (id) {
      window.clearInterval(id);
      this.intervals.delete(deliveryId);
    }
  }

  private notify(state: AlertDeliveryState): void {
    this.listeners.forEach(cb => cb(state));
  }
}

export const deliveryStateMachine = new DeliveryStateMachine();
