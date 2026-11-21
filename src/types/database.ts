// Frozen Supabase Database TypeScript Interfaces (Section 7)

export type ReportDepth = 'ankle' | 'knee' | 'waist' | 'vehicle_stalls';
export type ReportStatus = 'unverified' | 'confirmed' | 'severe' | 'cleared';
export type VoteType = 'still_flooded' | 'cleared';
export type RiskBand = 'none' | 'possible' | 'likely_affected';
export type AlertKind = 'alert' | 'clear' | 'report_unverified';
export type DeliveryChannel = 'push' | 'sms';
export type DeliveryStatus = 'pending' | 'sent' | 'acknowledged' | 'failed';
export type ShelterVerification = 'official_shelter' | 'listed' | 'unverified';

export interface UserRow {
  id: string;
  trust: number;
  geohash6?: string | null;
  phone?: string | null;
  push_subscription?: Record<string, unknown> | null;
  saved_routes?: Array<{ name: string; origin: [number, number]; destination: [number, number] }>;
  created_at?: string;
  updated_at?: string;
}

export interface ReportRow {
  id: string;
  client_uuid: string;
  user_id?: string | null;
  lat: number;
  lng: number;
  gps_accuracy?: number | null;
  depth: ReportDepth;
  photo_url?: string | null;
  observed_at: string;
  created_at: string;
  last_verified_at: string;
  expires_at: string;
  confirms: number;
  clears: number;
  road_passable: boolean;
  source: string;
  status: ReportStatus;
  is_demo: boolean;
}

export interface ReportVoteRow {
  id: string;
  report_id: string;
  user_id?: string | null;
  vote: VoteType;
  weight: number;
  created_at: string;
}

export interface GridCellRow {
  id: string;
  lat: number;
  lng: number;
  elevation: number;
  slope: number;
  hand: number;
  acc_norm: number;
  underpass: number;
  hotspot: number;
  downstream_cell_id?: string | null;
  s: number;
}

export interface CellRiskRow {
  cell_id: string;
  risk: number;
  band: RiskBand;
  computed_at: string;
  inputs: {
    s: number;
    r: number;
    spread: number;
    rain_source: string;
    rain_mm_hr: number;
  };
}

export interface AlertRow {
  id: string;
  report_id?: string | null;
  cell: string;
  severity: number;
  issued_at: string;
  ttl_min: number;
  signature: string;
  kind: AlertKind;
}

export interface AlertDeliveryRow {
  id: string;
  alert_id: string;
  user_id: string;
  channel: DeliveryChannel;
  sent_at: string;
  acked_at?: string | null;
  status: DeliveryStatus;
}

export interface SafePlaceRow {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  source: string;
  verification: ShelterVerification;
  last_checked: string;
  is_demo: boolean;
}

export interface SOSRecordRow {
  id: string;
  user_id?: string | null;
  lat: number;
  lng: number;
  created_at: string;
  incident_type: string;
  photo_url?: string | null;
  contact?: string | null;
}

export interface AuthorityLogRow {
  id: string;
  alert_id?: string | null;
  confirmed_by: string;
  recipients: string[];
  sent_at: string;
  message: string;
}
