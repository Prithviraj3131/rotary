import { GridCellRow, CellRiskRow, ReportRow, RiskBand } from '../types/database';
import { generatePuneTerrainGrid } from './puneGridGenerator';
import { calculateDistanceMeters } from './geoUtils';
import weightsConfig from '../config/weights.json';

const SEVERITY_FACTORS: Record<string, number> = {
  ankle: 0.4,
  knee: 0.7,
  waist: 1.0,
  vehicle_stalls: 1.0,
};

/**
 * Computes downstream hydrological risk spread from active confirmed/severe reports
 */
function computeDownstreamSpread(
  gridMap: Map<string, GridCellRow>,
  activeReports: ReportRow[]
): Map<string, number> {
  const spreadMap = new Map<string, number>();
  const cfg = weightsConfig.spread;

  // Filter confirmed or severe reports within 90 minutes
  const now = Date.now();
  const validReports = activeReports.filter(r => {
    if (r.status !== 'confirmed' && r.status !== 'severe') return false;
    const age = now - new Date(r.observed_at).getTime();
    return age < 90 * 60 * 1000;
  });

  for (const report of validReports) {
    const sev = SEVERITY_FACTORS[report.depth] || 0.4;

    // Find closest cell to report
    let closestCell: GridCellRow | null = null;
    let minDist = Infinity;

    for (const cell of gridMap.values()) {
      const dist = calculateDistanceMeters(report.lat, report.lng, cell.lat, cell.lng);
      if (dist < minDist) {
        minDist = dist;
        closestCell = cell;
      }
    }

    if (!closestCell) continue;

    // Walk downstream along downstream_cell_id up to 1.5 km
    let currentCell: GridCellRow | null = closestCell;
    let accumulatedDist = 0;

    while (currentCell && accumulatedDist <= cfg.max_distance_m) {
      const downhill = currentCell.elevation <= closestCell.elevation ? cfg.downhill_factor : cfg.uphill_factor;
      const cellSpread = sev * Math.exp(-accumulatedDist / cfg.decay_distance_m) * downhill;

      const existing = spreadMap.get(currentCell.id) || 0;
      spreadMap.set(currentCell.id, Math.max(existing, cellSpread));

      if (!currentCell.downstream_cell_id) break;

      const nextCell = gridMap.get(currentCell.downstream_cell_id);
      if (!nextCell || nextCell.id === currentCell.id) break;

      accumulatedDist += calculateDistanceMeters(
        currentCell.lat,
        currentCell.lng,
        nextCell.lat,
        nextCell.lng
      );
      currentCell = nextCell;
    }
  }

  return spreadMap;
}

/**
 * Computes transparent, explainable risk score for every cell in the Pune grid
 */
export function calculatePuneCellRisks(
  rainFactor: number,
  rainMmHr: number,
  activeReports: ReportRow[] = []
): (CellRiskRow & { lat: number; lng: number; s: number; elevation: number })[] {
  const grid = generatePuneTerrainGrid();
  const gridMap = new Map<string, GridCellRow>();
  grid.forEach((c) => gridMap.set(c.id, c));

  const spreadMap = computeDownstreamSpread(gridMap, activeReports);
  const nowIso = new Date().toISOString();

  const results: (CellRiskRow & { lat: number; lng: number; s: number; elevation: number })[] = [];

  for (const cell of grid) {
    const s = cell.s;
    const spread = spreadMap.get(cell.id) || 0;

    // Formula: risk = min(1, S * (0.4 + 0.6 * R) + 0.5 * spread)
    const baseRainTerm = s * (0.4 + 0.6 * rainFactor);
    const spreadTerm = 0.5 * spread;
    const totalRisk = Number(Math.min(1.0, Math.max(0.0, baseRainTerm + spreadTerm)).toFixed(3));

    // Determine band: >= 0.7 likely_affected, 0.4 - 0.7 possible, < 0.4 none
    let band: RiskBand = 'none';
    if (totalRisk >= weightsConfig.risk_bands.likely_min) {
      band = 'likely_affected';
    } else if (totalRisk >= weightsConfig.risk_bands.possible_min) {
      band = 'possible';
    }

    results.push({
      cell_id: cell.id,
      risk: totalRisk,
      band,
      computed_at: nowIso,
      lat: cell.lat,
      lng: cell.lng,
      s,
      elevation: cell.elevation,
      inputs: {
        s,
        r: rainFactor,
        spread: Number(spread.toFixed(3)),
        rain_source: 'Open-Meteo Pune',
        rain_mm_hr: rainMmHr,
      },
    });
  }

  return results;
}
