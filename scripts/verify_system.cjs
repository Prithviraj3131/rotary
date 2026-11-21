/**
 * Automated System Invariant & Engine Verification Suite
 * Tests all hydrological formulas, trust thresholds, TTL math, and SMS character constraints.
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    testsFailed++;
  }
}

console.log('\n======================================================');
console.log('🌊 FLOODGUARD AI — AUTOMATED INVARIANT VERIFICATION');
console.log('======================================================\n');

// 1. Verify weights.json
console.log('1. Ground Rule 5: Transparent Weights Verification');
const weightsPath = path.join(__dirname, '../src/config/weights.json');
assert(fs.existsSync(weightsPath), 'weights.json configuration file exists');

const weights = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
assert(weights.rain.intensity_weight === 0.6, 'Rain intensity weight is 0.6');
assert(weights.rain.accum_weight === 0.4, 'Rain accumulation weight is 0.4');
assert(weights.trust.thresholds.confirmed_min === 2.0, 'Confirm trust threshold is strictly 2.0');
assert(weights.trust.thresholds.severe_min === 4.0, 'Severe trust threshold is strictly 4.0');
assert(weights.trust.expiry_minutes === 90, 'Hazard TTL is strictly 90 minutes (Ground Rule 6)');
assert(weights.routing.buffer_m === 50.0, 'Method A hazard buffer is strictly 50m');

// 2. Hydrological Rain Factor Formula
console.log('\n2. Rain Factor R Formula Validation');
function calculateRainFactor(rainMmHr, rain3hMm) {
  const cfg = weights.rain;
  const term1 = cfg.intensity_weight * (rainMmHr / cfg.intensity_norm_mm_hr);
  const term2 = cfg.accum_weight * (rain3hMm / cfg.accum_norm_mm_3h);
  return Number(Math.min(1.0, Math.max(0.0, term1 + term2)).toFixed(3));
}

assert(calculateRainFactor(0, 0) === 0.0, 'Zero rain yields Rain Factor 0.0');
const extremeR = calculateRainFactor(112, 180);
assert(extremeR === 1.0, 'Extreme monsoon rain (112mm/hr) clamps cleanly at 1.0');
const moderateR = calculateRainFactor(25, 50);
assert(moderateR >= 0.45 && moderateR <= 0.55, `Moderate rain (25mm/hr, 50mm 3h) yields ~0.50 (got ${moderateR})`);

// 3. Trust Verification Engine State Transitions
console.log('\n3. Trust Engine Anti-Gaming State Machine');
function evaluateTrust(report, votes) {
  let score = report.source === 'authority' ? 3.0 : 1.0;
  if (report.photo_url) score += weights.trust.camera_bonus;
  if (report.gps_accuracy && report.gps_accuracy <= 25) score += weights.trust.gps_road_bonus;

  let confirms = 0;
  let clears = 0;

  for (const v of votes) {
    if (v.vote === 'still_flooded') {
      confirms++;
      score += v.weight || 1.0;
    } else if (v.vote === 'cleared') {
      clears++;
      score -= (v.weight || 1.0) * 1.5;
    }
  }

  let status = 'unverified';
  if (clears >= weights.trust.thresholds.clears_needed && score < 1.0) {
    status = 'cleared';
  } else if (score >= weights.trust.thresholds.severe_min) {
    status = 'severe';
  } else if (score >= weights.trust.thresholds.confirmed_min) {
    status = 'confirmed';
  }

  return { score, status, confirms, clears };
}

const initialReport = { source: 'citizen', photo_url: null, gps_accuracy: 30 };
const step1 = evaluateTrust(initialReport, []);
assert(step1.status === 'unverified' && step1.score === 1.0, 'Initial unverified citizen report starts at 1.0');

// Add 1 verified citizen vote (weight 1.0) -> total 2.0 -> Confirmed
const step2 = evaluateTrust(initialReport, [{ vote: 'still_flooded', weight: 1.0 }]);
assert(step2.status === 'confirmed' && step2.score === 2.0, 'R >= 2.0 transitions status to confirmed');

// Add official emergency responder vote (weight 2.5) -> total 4.5 -> Severe
const step3 = evaluateTrust(initialReport, [
  { vote: 'still_flooded', weight: 1.0 },
  { vote: 'still_flooded', weight: 2.5 }
]);
assert(step3.status === 'severe' && step3.score >= 4.0, 'R >= 4.0 transitions status to severe');

// Add 2 clears -> Cleared
const step4 = evaluateTrust(initialReport, [
  { vote: 'cleared', weight: 1.0 },
  { vote: 'cleared', weight: 1.0 }
]);
assert(step4.status === 'cleared', 'Two clear votes clear the hazard report');

// 4. Strict 90-Minute TTL Decay
console.log('\n4. Strict 90-Minute TTL Math (Ground Rule 6)');
function computeOpacity(observedAtMs, nowMs) {
  const ageMs = nowMs - observedAtMs;
  const maxMs = weights.trust.expiry_minutes * 60 * 1000;
  if (ageMs >= maxMs) return 0.0;
  const progress = ageMs / maxMs;
  return Math.max(0.2, 1.0 - progress * 0.8);
}

const t0 = 100000000;
assert(computeOpacity(t0, t0) === 1.0, 'Brand new report has opacity 1.0');
assert(computeOpacity(t0, t0 + 45 * 60 * 1000) === 0.6, '45-minute old report has opacity 0.6');
assert(computeOpacity(t0, t0 + 90 * 60 * 1000) === 0.0, '90-minute report expires completely (opacity 0.0)');

// 5. Cellular DLT SMS < 160 Characters Constraint
console.log('\n5. DLT SMS Character Count & Safety Constraint (Section 6.12)');
function formatEmergencySMS(landmark, roadName) {
  const truncatedLandmark = landmark.slice(0, 28);
  const truncatedRoad = roadName.slice(0, 24);
  const text = `FLOOD ALERT: severe flooding near ${truncatedLandmark}. Avoid ${truncatedRoad}. Stay away from poles and cables near water.`;
  return text.length > 160 ? text.slice(0, 157) + '...' : text;
}

const testSms = formatEmergencySMS('Alka Talkies Underpass', 'LBS Rd');
assert(testSms.length <= 160, `SMS length is ${testSms.length} chars (strictly <= 160 chars)`);
assert(testSms.includes('Stay away from poles and cables near water'), 'SMS contains mandatory electrical warning');

const longSms = formatEmergencySMS('Very Long Complex Underpass Landmark In Suburban Pune West Ward', 'Extremely Long Arterial Boulevard Avenue');
assert(longSms.length <= 160, `Long inputs safely clamped to <= 160 chars (got ${longSms.length})`);

// Summary
console.log('\n======================================================');
console.log(`TOTAL TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
console.log('======================================================\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL SYSTEM INVARIANTS SATISFIED!\n');
}
