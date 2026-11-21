import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ReportRow, ReportVoteRow, CellRiskRow } from '../types/database';

// Read environment variables (optional - graceful fallback if unconfigured)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ============================================================================
// REACTIVE LOCAL FALLBACK STORE (Works offline & without remote keys)
// ============================================================================
type ChangeListener<T> = (data: T[]) => void;

class ReactiveStore<T extends { id: string }> {
  private items: Map<string, T> = new Map();
  private listeners: Set<ChangeListener<T>> = new Set();

  constructor(initialItems: T[] = []) {
    initialItems.forEach(item => this.items.set(item.id, item));
  }

  getAll(): T[] {
    return Array.from(this.items.values());
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  upsert(item: T): void {
    this.items.set(item.id, item);
    this.notify();
  }

  delete(id: string): void {
    if (this.items.delete(id)) {
      this.notify();
    }
  }

  subscribe(listener: ChangeListener<T>): () => void {
    this.listeners.add(listener);
    listener(this.getAll());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const data = this.getAll();
    this.listeners.forEach(cb => cb(data));
  }
}

// Initial seed reports around Pune for instant realistic demonstration
const nowIso = new Date().toISOString();
const expIso = new Date(Date.now() + 85 * 60 * 1000).toISOString();

const SEED_REPORTS: ReportRow[] = [
  {
    id: 'seed-rep-ambil-01',
    client_uuid: 'b0000000-0000-0000-0000-000000000001',
    user_id: 'user-demo-1',
    lat: 18.4912,
    lng: 73.8538,
    gps_accuracy: 6.2,
    depth: 'knee',
    photo_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
    observed_at: nowIso,
    created_at: nowIso,
    last_verified_at: nowIso,
    expires_at: expIso,
    confirms: 3,
    clears: 0,
    road_passable: false,
    source: 'user_app',
    status: 'confirmed',
    is_demo: true
  },
  {
    id: 'seed-rep-sinhagad-02',
    client_uuid: 'b0000000-0000-0000-0000-000000000002',
    user_id: 'user-demo-2',
    lat: 18.4828,
    lng: 73.8344,
    gps_accuracy: 8.5,
    depth: 'waist',
    photo_url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
    observed_at: nowIso,
    created_at: nowIso,
    last_verified_at: nowIso,
    expires_at: expIso,
    confirms: 5,
    clears: 0,
    road_passable: false,
    source: 'user_app',
    status: 'severe',
    is_demo: true
  },
  {
    id: 'seed-rep-deccan-03',
    client_uuid: 'b0000000-0000-0000-0000-000000000003',
    user_id: 'user-demo-3',
    lat: 18.5180,
    lng: 73.8420,
    gps_accuracy: 4.8,
    depth: 'ankle',
    photo_url: null,
    observed_at: nowIso,
    created_at: nowIso,
    last_verified_at: nowIso,
    expires_at: expIso,
    confirms: 1,
    clears: 0,
    road_passable: true,
    source: 'user_app',
    status: 'unverified',
    is_demo: true
  }
];

export const localReportsStore = new ReactiveStore<ReportRow>(SEED_REPORTS);
export const localVotesStore = new ReactiveStore<ReportVoteRow>([]);
export const localRiskStore = new ReactiveStore<CellRiskRow & { id: string }>([]);
