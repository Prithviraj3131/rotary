import { ReportDepth } from './database';

export interface PendingReport {
  client_uuid: string;
  lat: number;
  lng: number;
  gps_accuracy: number;
  depth: ReportDepth;
  road_passable: boolean;
  photo_blob?: Blob | null;
  photo_url?: string | null;
  observed_at: string;
  created_at: string;
  is_demo: boolean;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error_message?: string;
  retry_count: number;
}

export interface DepthConfig {
  key: ReportDepth;
  label: string;
  radius_m: number;
  severity: number;
  description: string;
  icon: string;
}

export const DEPTH_LEVELS: Record<ReportDepth, DepthConfig> = {
  ankle: {
    key: 'ankle',
    label: 'Ankle Deep (~15cm)',
    radius_m: 40,
    severity: 0.4,
    description: 'Pedestrians slowed. Two-wheelers cautious.',
    icon: 'water_drop'
  },
  knee: {
    key: 'knee',
    label: 'Knee Deep (~45cm)',
    radius_m: 80,
    severity: 0.7,
    description: 'Motorbikes flooded. Hatchbacks stall.',
    icon: 'waves'
  },
  waist: {
    key: 'waist',
    label: 'Waist Deep (~90cm)',
    radius_m: 150,
    severity: 1.0,
    description: 'Impassable for all road vehicles.',
    icon: 'flood'
  },
  vehicle_stalls: {
    key: 'vehicle_stalls',
    label: 'Vehicle Stalled / Submerged',
    radius_m: 150,
    severity: 1.0,
    description: 'Active vehicle submersion reported. Hard block.',
    icon: 'car_crash'
  }
};
