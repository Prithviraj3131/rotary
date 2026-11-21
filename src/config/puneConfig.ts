// Pune Geo Bounds, Known Trouble Hotspots, and Coordinate Constants
export const PUNE_BOUNDS = {
  minLat: 18.42,
  maxLat: 18.62,
  minLng: 73.74,
  maxLng: 73.96,
  center: {
    lat: 18.5204,
    lng: 73.8567
  },
  zoom: 13
};

// Known Pune flood-prone trouble spots (Ambil Odha, Sinhagad Rd, Katraj, etc.)
export interface PuneHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  historicalSeverity: 'severe' | 'confirmed';
}

export const PUNE_HOTSPOTS: PuneHotspot[] = [
  {
    id: 'spot-ambil-odha',
    name: 'Ambil Odha / Katraj Stream Basin',
    lat: 18.4908,
    lng: 73.8541,
    description: 'Catastrophic 2019 overflow site. Low-lying storm runoff corridor.',
    historicalSeverity: 'severe'
  },
  {
    id: 'spot-sinhagad-rd',
    name: 'Sinhagad Road / Vitthalwadi Canal',
    lat: 18.4831,
    lng: 73.8340,
    description: 'Khadakwasla dam spillway backwater zone and low road grade.',
    historicalSeverity: 'severe'
  },
  {
    id: 'spot-deccan-gymkhana',
    name: 'Deccan Gymkhana / Karve Road Junction',
    lat: 18.5175,
    lng: 73.8415,
    description: 'Submerged underpasses and Mutha riverbank flood line.',
    historicalSeverity: 'confirmed'
  },
  {
    id: 'spot-sangamwadi',
    name: 'Sangamwadi Bridge & Underpass',
    lat: 18.5367,
    lng: 73.8698,
    description: 'Confluence point of Mula and Mutha rivers with depressed roadway.',
    historicalSeverity: 'severe'
  },
  {
    id: 'spot-yerawada-shastri',
    name: 'Yerawada / Shastri Nagar Chowk',
    lat: 18.5521,
    lng: 73.8824,
    description: 'Chronic urban drainage stagnation during continuous rain.',
    historicalSeverity: 'confirmed'
  },
  {
    id: 'spot-katraj-tunnel-approach',
    name: 'Katraj Ghat Approach & Underpass',
    lat: 18.4485,
    lng: 73.8580,
    description: 'High runoff velocity from southern Pune hills.',
    historicalSeverity: 'confirmed'
  }
];
