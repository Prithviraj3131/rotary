import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { DemoBadge } from '../common/DemoBadge';

export interface MapPlace {
  id: string;
  name: string;
  category: 'shelter' | 'emergency';
  lat: number;
  lng: number;
  address: string;
  advisory: string;
  statusText: string;
}

export const PUNE_MAP_PLACES: MapPlace[] = [
  {
    id: 'shelter-1',
    name: 'Tilak Road Sports Complex (Higher Ground)',
    category: 'shelter',
    lat: 18.5042,
    lng: 73.8525,
    address: 'Near Swargate / Tilak Road, Pune',
    advisory: 'Elevated community center (+18m above Mutha basin grade). Dry hall & power generator.',
    statusText: 'Verified Relief Shelter',
  },
  {
    id: 'shelter-2',
    name: 'Fergusson College Main Amphitheatre',
    category: 'shelter',
    lat: 18.5222,
    lng: 73.8415,
    address: 'FC Road, Deccan Gymkhana, Pune',
    advisory: 'Institutional relief point (+15m natural ridge). Sheltered seating & drinking water.',
    statusText: 'Verified Relief Shelter',
  },
  {
    id: 'shelter-3',
    name: 'Aundh Relief Shelter',
    category: 'shelter',
    lat: 18.5582,
    lng: 73.8065,
    address: 'Near Bremen Chowk, Aundh, Pune',
    advisory: 'High capacity municipal flood relief facility with medical first-aid desk.',
    statusText: 'Open (Verified)',
  },
  {
    id: 'emerg-1',
    name: 'PMC Fire & Rescue HQ, Aundh',
    category: 'emergency',
    lat: 18.5520,
    lng: 73.8120,
    address: 'Aundh Fire Station, Pune',
    advisory: '24/7 rapid water rescue unit & inflatable boats stationed.',
    statusText: 'Active Emergency Unit',
  },
  {
    id: 'emerg-2',
    name: 'Sassoon General Hospital Emergency Desk',
    category: 'emergency',
    lat: 18.5270,
    lng: 73.8730,
    address: 'Near Pune Railway Station, Pune',
    advisory: 'Level-1 Trauma & emergency medical casualty ward.',
    statusText: '24/7 Medical Emergency',
  },
];

// Custom HTML Icons matching UI template
const shelterIcon = L.divIcon({
  className: 'custom-shelter-marker',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      <div style="width: 36px; height: 36px; border-radius: 50%; background: #006c4b; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,108,75,0.4); border: 2.5px solid white;">
        <span class="material-symbols-outlined" style="font-size: 20px;">shield</span>
      </div>
      <span style="margin-top: 2px; padding: 1px 6px; border-radius: 9999px; background: #006c4b; color: white; font-size: 9px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">Shelter</span>
    </div>
  `,
  iconSize: [40, 50],
  iconAnchor: [20, 48],
});

const emergencyIcon = L.divIcon({
  className: 'custom-emergency-marker',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      <div style="width: 36px; height: 36px; border-radius: 50%; background: #00271d; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,39,29,0.4); border: 2.5px solid white;">
        <span class="material-symbols-outlined" style="font-size: 20px;">local_hospital</span>
      </div>
      <span style="margin-top: 2px; padding: 1px 6px; border-radius: 9999px; background: #00271d; color: white; font-size: 9px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">Rescue</span>
    </div>
  `,
  iconSize: [40, 50],
  iconAnchor: [20, 48],
});

interface ShelterMapMarkersProps {
  showShelters: boolean;
  showEmergency: boolean;
  onSelectPlace: (place: MapPlace) => void;
}

export const ShelterMapMarkers: React.FC<ShelterMapMarkersProps> = ({
  showShelters,
  showEmergency,
  onSelectPlace,
}) => {
  const visiblePlaces = PUNE_MAP_PLACES.filter((p) => {
    if (p.category === 'shelter' && showShelters) return true;
    if (p.category === 'emergency' && showEmergency) return true;
    return false;
  });

  return (
    <>
      {visiblePlaces.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={place.category === 'shelter' ? shelterIcon : emergencyIcon}
          eventHandlers={{
            click: () => onSelectPlace(place),
          }}
        >
          <Popup className="shelter-popup">
            <div className="p-1 space-y-1.5 max-w-[260px] text-xs">
              <div className="flex items-center justify-between border-b pb-1">
                <span className="font-bold text-on-surface">{place.name}</span>
                <DemoBadge label="OFFICIAL" />
              </div>
              <p className="text-on-surface-variant text-[11px] leading-snug">{place.advisory}</p>
              <div className="pt-1 flex items-center justify-between text-[10px] text-secondary font-semibold">
                <span>{place.statusText}</span>
                <span className="underline cursor-pointer" onClick={() => onSelectPlace(place)}>
                  View Details
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};
