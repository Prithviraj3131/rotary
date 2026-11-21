import { ReportRow, ReportStatus, VoteType } from '../types/database';
import weightsConfig from '../config/weights.json';
import { calculateDistanceMeters } from './geoUtils';

export interface ReportVoteRecord {
  report_id: string;
  user_id: string;
  vote: VoteType;
  weight: number;
  created_at: string;
}

export interface TrustEvaluationResult {
  reportId: string;
  previousStatus: ReportStatus;
  newStatus: ReportStatus;
  aggregateWeight: number;
  confirmsCount: number;
  clearsCount: number;
  isUncertain: boolean;
  reasons: string[];
}

/**
 * Calculates the trust weight of an individual report or confirmation vote
 * Formula: (1.0 * userTrust) + (0.5 for live camera photo) + (0.5 for accurate road GPS)
 */
export function calculateReportWeight(
  userTrust: number = 1.0,
  hasLivePhoto: boolean = false,
  gpsAccuracyMeters?: number | null
): number {
  const cfg = weightsConfig.trust;
  const clampedTrust = Math.min(cfg.max_trust, Math.max(cfg.min_trust, userTrust));
  
  let weight = cfg.base_weight * clampedTrust;

  if (hasLivePhoto) {
    weight += cfg.camera_bonus;
  }

  // Bonus if GPS accuracy is within reasonable urban threshold (e.g., <= 20m)
  if (gpsAccuracyMeters != null && gpsAccuracyMeters <= 20) {
    weight += cfg.gps_road_bonus;
  }

  return Number(weight.toFixed(2));
}

/**
 * Evaluates the status of a target report based on nearby reports and votes
 * Spatial clustering: within 100m
 * Temporal window: last 30 minutes
 */
export function evaluateReportStatus(
  targetReport: ReportRow,
  allReports: ReportRow[],
  votes: ReportVoteRecord[] = []
): TrustEvaluationResult {
  const cfg = weightsConfig.trust;
  const now = Date.now();
  const windowMs = cfg.window_minutes * 60 * 1000;
  const clusterRadius = cfg.cluster_radius_m;

  const reasons: string[] = [];

  // Filter nearby reports created within 30 minutes
  const nearbyReports = allReports.filter(r => {
    if (r.id === targetReport.id) return true;
    const reportTime = new Date(r.created_at).getTime();
    if (now - reportTime > windowMs) return false;

    const dist = calculateDistanceMeters(targetReport.lat, targetReport.lng, r.lat, r.lng);
    return dist <= clusterRadius;
  });

  // Sum weights from nearby reports
  let totalWeight = 0;
  nearbyReports.forEach(r => {
    const hasPhoto = Boolean(r.photo_url);
    const weight = calculateReportWeight(1.0, hasPhoto, r.gps_accuracy);
    totalWeight += weight;
  });

  // Incorporate votes on this report
  const reportVotes = votes.filter(v => v.report_id === targetReport.id);
  const stillFloodedVotes = reportVotes.filter(v => v.vote === 'still_flooded');
  const clearedVotes = reportVotes.filter(v => v.vote === 'cleared');

  stillFloodedVotes.forEach(v => {
    totalWeight += v.weight;
  });

  totalWeight = Number(totalWeight.toFixed(2));

  const totalConfirms = targetReport.confirms + stillFloodedVotes.length;
  const totalClears = targetReport.clears + clearedVotes.length;

  reasons.push(`${nearbyReports.length} reports within 100m, total cluster weight: ${totalWeight}`);

  // Check cleared condition (2 clears or expired)
  if (totalClears >= cfg.thresholds.clears_needed) {
    reasons.push(`${totalClears} 'Cleared' votes received (threshold is ${cfg.thresholds.clears_needed})`);
    return {
      reportId: targetReport.id,
      previousStatus: targetReport.status,
      newStatus: 'cleared',
      aggregateWeight: totalWeight,
      confirmsCount: totalConfirms,
      clearsCount: totalClears,
      isUncertain: false,
      reasons,
    };
  }

  // Conflict / Uncertainty detection
  const isUncertain = totalClears > 0 && totalConfirms > 0;
  if (isUncertain) {
    reasons.push('Conflicting votes detected between flooded and cleared reports');
  }

  // Severe threshold: weight >= 4.0 or vehicle_stalls with weight >= 2.5
  const hasVehicleStall = nearbyReports.some(r => r.depth === 'vehicle_stalls') || targetReport.depth === 'vehicle_stalls';
  if (totalWeight >= cfg.thresholds.severe_min || (hasVehicleStall && totalWeight >= cfg.thresholds.severe_vehicle_stalls_min)) {
    reasons.push(hasVehicleStall 
      ? `Vehicle stall reported with weight ${totalWeight} >= ${cfg.thresholds.severe_vehicle_stalls_min}` 
      : `Cluster weight ${totalWeight} >= ${cfg.thresholds.severe_min}`);
    return {
      reportId: targetReport.id,
      previousStatus: targetReport.status,
      newStatus: 'severe',
      aggregateWeight: totalWeight,
      confirmsCount: totalConfirms,
      clearsCount: totalClears,
      isUncertain,
      reasons,
    };
  }

  // Confirmed threshold: weight >= 2.0
  if (totalWeight >= cfg.thresholds.confirmed_min) {
    reasons.push(`Cluster weight ${totalWeight} >= ${cfg.thresholds.confirmed_min}`);
    return {
      reportId: targetReport.id,
      previousStatus: targetReport.status,
      newStatus: 'confirmed',
      aggregateWeight: totalWeight,
      confirmsCount: totalConfirms,
      clearsCount: totalClears,
      isUncertain,
      reasons,
    };
  }

  // Otherwise unverified
  return {
    reportId: targetReport.id,
    previousStatus: targetReport.status,
    newStatus: 'unverified',
    aggregateWeight: totalWeight,
    confirmsCount: totalConfirms,
    clearsCount: totalClears,
    isUncertain,
    reasons,
  };
}

/**
 * Checks if a user is within the required 300m voting radius
 */
export function canUserVote(
  userLat: number,
  userLng: number,
  reportLat: number,
  reportLng: number
): { allowed: boolean; distanceMeters: number } {
  const cfg = weightsConfig.trust;
  const distanceMeters = Math.round(calculateDistanceMeters(userLat, userLng, reportLat, reportLng));
  return {
    allowed: distanceMeters <= cfg.vote_distance_m,
    distanceMeters,
  };
}
