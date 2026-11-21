import { PUNE_BOUNDS, PUNE_HOTSPOTS } from '../config/puneConfig';
import { GridCellRow } from '../types/database';
import { calculateDistanceMeters } from './geoUtils';
import weightsConfig from '../config/weights.json';

const GRID_ROWS = 20;
const GRID_COLS = 20;

let cachedGrid: GridCellRow[] | null = null;

/**
 * Generates the 20x20 terrain grid over Pune with realistic elevation contours,
 * lowest-neighbor D8 downstream flow vectors, and static susceptibility S.
 */
export function generatePuneTerrainGrid(): GridCellRow[] {
  if (cachedGrid) return cachedGrid;

  const latStep = (PUNE_BOUNDS.maxLat - PUNE_BOUNDS.minLat) / GRID_ROWS;
  const lngStep = (PUNE_BOUNDS.maxLng - PUNE_BOUNDS.minLng) / GRID_COLS;
  const cells: GridCellRow[] = [];

  // 1. Generate base cells with elevation based on Pune's natural topography
  // Pune sits in a river basin: ~540m-560m near Mutha/Mula confluence, rising to 620m+ near Katraj/Sinhagad hills
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const lat = PUNE_BOUNDS.minLat + (r + 0.5) * latStep;
      const lng = PUNE_BOUNDS.minLng + (c + 0.5) * lngStep;
      const id = `pune_c_${r}_${c}`;

      // Distance from Mutha river center (approx lat: 18.52, lng: 73.85)
      const distFromRiverCenter = calculateDistanceMeters(lat, lng, 18.52, 73.85) / 1000;
      // Southern hills (lower row index r is south)
      const southHillFactor = (GRID_ROWS - r) * 3.5;
      const baseElevation = 545 + distFromRiverCenter * 2.8 + southHillFactor;

      // Check proximity to known Pune flood hotspots (within 600m)
      const nearHotspot = PUNE_HOTSPOTS.some(
        (h) => calculateDistanceMeters(lat, lng, h.lat, h.lng) <= 600
      );

      // Check underpass (simulated over known depressed road coordinates)
      const isUnderpass = (r === 9 && (c === 8 || c === 12)) || (r === 12 && c === 10) ? 1 : 0;

      // HAND estimate (Height Above Nearest Drainage)
      const hand = Math.max(0.5, distFromRiverCenter * 1.8);
      const slope = Math.max(1.0, 6.0 - distFromRiverCenter * 0.4);
      const accNorm = Number(Math.min(1.0, Math.max(0.1, 1.2 - distFromRiverCenter * 0.15)).toFixed(2));

      // Calculate S using weights.json formula:
      // S = min(1, 0.40 * HAND_s + 0.25 * ACC_s + 0.20 * SLOPE_s + 0.15 * UNDERPASS + 0.15 * HOTSPOT)
      const hand_s = Math.max(0, Math.min(1, 1 - hand / 5));
      const slope_s = Math.max(0, Math.min(1, 1 - slope / 5));
      const hotspotVal = nearHotspot ? 1 : 0;

      const w = weightsConfig.susceptibility;
      const rawS =
        w.w_hand * hand_s +
        w.w_acc * accNorm +
        w.w_slope * slope_s +
        w.w_underpass * isUnderpass +
        w.w_hotspot * hotspotVal;

      const s = Number(Math.min(1.0, Math.max(0.0, rawS)).toFixed(3));

      cells.push({
        id,
        lat,
        lng,
        elevation: Number(baseElevation.toFixed(1)),
        slope: Number(slope.toFixed(1)),
        hand: Number(hand.toFixed(1)),
        acc_norm: accNorm,
        underpass: isUnderpass,
        hotspot: hotspotVal,
        downstream_cell_id: null,
        s,
      });
    }
  }

  // 2. Establish downstream flow connections (pointing to the lowest elevation neighbor)
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const idx = r * GRID_COLS + c;
      const current = cells[idx];
      let lowestNeighbor: GridCellRow | null = null;
      let minElevation = current.elevation;

      // 8-neighbor scan
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
            const neighbor = cells[nr * GRID_COLS + nc];
            if (neighbor.elevation < minElevation) {
              minElevation = neighbor.elevation;
              lowestNeighbor = neighbor;
            }
          }
        }
      }

      if (lowestNeighbor) {
        current.downstream_cell_id = lowestNeighbor.id;
      }
    }
  }

  cachedGrid = cells;
  return cells;
}
