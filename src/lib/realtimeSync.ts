import { supabase, isSupabaseConfigured, localReportsStore } from './supabase';
import { ReportRow } from '../types/database';
import { broadcastMeshReport } from './meshNetwork';

// BroadcastChannel for instant multi-tab sync when running in mock / PWA offline mode
const BROADCAST_CHANNEL_NAME = 'floodguard_pune_realtime';
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
}

/**
 * Initializes real-time synchronization across Supabase and/or browser tabs
 */
export function initRealtimeSubscriptions(
  onReportChange: (reports: ReportRow[]) => void
): () => void {
  // 1. Subscribe to local reactive store
  const unsubLocal = localReportsStore.subscribe((reports) => {
    onReportChange(reports);
  });

  // 2. BroadcastChannel listener (Cross-tab sync for testing two tabs side by side)
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'REPORT_UPSERT') {
      const incoming: ReportRow = event.data.payload;
      localReportsStore.upsert(incoming);
    } else if (event.data?.type === 'REPORT_DELETE') {
      localReportsStore.delete(event.data.id);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // 3. Supabase Realtime channel subscription (if remote Supabase credentials provided)
  let supabaseChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;

  if (isSupabaseConfigured && supabase) {
    supabaseChannel = supabase
      .channel('public:reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as ReportRow;
            localReportsStore.upsert(row);
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as { id: string };
            localReportsStore.delete(oldRow.id);
          }
        }
      )
      .subscribe();
  }

  // Cleanup
  return () => {
    unsubLocal();
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    if (supabaseChannel && supabase) {
      supabase.removeChannel(supabaseChannel);
    }
  };
}

/**
 * Broadcasts an upserted report to other tabs & Supabase
 */
export async function broadcastReportUpsert(report: ReportRow): Promise<void> {
  // Update local store
  localReportsStore.upsert(report);

  // Broadcast cross-tab
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'REPORT_UPSERT',
      payload: report,
    });
  }

  // Broadcast across LAN mesh
  broadcastMeshReport(report).catch(() => {});

  // Sync to remote Supabase if active
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('reports').upsert(report);
    } catch (err) {
      console.warn('Supabase upsert sync failed (will rely on offline queue):', err);
    }
  }
}
