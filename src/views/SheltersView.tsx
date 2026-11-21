import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { DemoBadge } from '../components/common/DemoBadge';
import { PUNE_MAP_PLACES, MapPlace } from '../components/Map/ShelterMapMarkers';
import { calculateDistanceMeters } from '../lib/geoUtils';

interface SheltersViewProps {
  userLocation?: [number, number] | null;
  onNavigateToShelter?: (shelter: { name: string; lat: number; lng: number }) => void;
}

// Custom DivIcons for Shelters Map
const shelterOfficialIcon = L.divIcon({
  className: 'custom-shelter-icon',
  html: `
    <div style="background-color: #006c4b; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0, 108, 75, 0.4); border: 2.5px solid white;">
      <span class="material-symbols-outlined" style="font-size: 18px; font-variation-settings: 'FILL' 1;">shield</span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const shelterFacilityIcon = L.divIcon({
  className: 'custom-facility-icon',
  html: `
    <div style="background-color: #003861; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0, 56, 97, 0.35); border: 2.5px solid white;">
      <span class="material-symbols-outlined" style="font-size: 17px;">apartment</span>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const emergencyUnitIcon = L.divIcon({
  className: 'custom-emerg-icon',
  html: `
    <div style="background-color: #ba1a1a; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(186, 26, 26, 0.4); border: 2.5px solid white;">
      <span class="material-symbols-outlined" style="font-size: 17px; font-variation-settings: 'FILL' 1;">medical_services</span>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export const SheltersView: React.FC<SheltersViewProps> = ({
  userLocation,
  onNavigateToShelter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'shelter' | 'high-ground' | 'emergency'>('all');

  // Compute live distances from user's current GPS position
  const enrichedPlaces = useMemo(() => {
    return PUNE_MAP_PLACES.map((place) => {
      let distanceKm: number = 1.2;
      let distanceFormatted = '1.2 km';

      if (userLocation) {
        const distMeters = calculateDistanceMeters(
          userLocation[0],
          userLocation[1],
          place.lat,
          place.lng
        );
        distanceKm = Number((distMeters / 1000).toFixed(1));
        distanceFormatted = distMeters < 1000 ? `${Math.round(distMeters)} m` : `${distanceKm} km`;
      }

      const isHighGround = place.advisory.includes('+') || place.advisory.toLowerCase().includes('ridge') || place.advisory.toLowerCase().includes('elevated');

      return {
        ...place,
        distanceKm,
        distanceFormatted,
        isHighGround,
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userLocation]);

  const filteredPlaces = useMemo(() => {
    return enrichedPlaces.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.advisory.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (categoryFilter === 'shelter') return p.category === 'shelter';
      if (categoryFilter === 'emergency') return p.category === 'emergency';
      if (categoryFilter === 'high-ground') return p.isHighGround;
      return true;
    });
  }, [enrichedPlaces, searchTerm, categoryFilter]);

  const handleStartRoute = (place: MapPlace) => {
    if (onNavigateToShelter) {
      onNavigateToShelter({
        name: place.name,
        lat: place.lat,
        lng: place.lng,
      });
    }
  };

  const centerCoords: [number, number] = userLocation || [18.5204, 73.8567];

  return (
    <div className="w-full max-w-md md:max-w-xl mx-auto px-4 py-4 flex flex-col gap-4 pb-28">
      {/* 1. Header & Live Locality Status */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col min-w-0">
          <h1 className="font-extrabold text-xl text-on-surface truncate">
            Elevated Relief Shelters
          </h1>
          <span className="text-xs text-on-surface-variant">
            Pune Municipal District • Higher-ground refuges
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DemoBadge label="VERIFIED GIS" />
        </div>
      </div>

      {/* 2. Search & Locality Filter */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs">
        <span className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0">
          search
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search shelters in Swargate, Aundh, Deccan..."
          className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-hidden min-w-0 font-medium"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* 3. Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap text-[11px] font-semibold transition-all ${
            categoryFilter === 'all'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          All Locations ({enrichedPlaces.length})
        </button>
        <button
          onClick={() => setCategoryFilter('shelter')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap text-[11px] font-semibold transition-all ${
            categoryFilter === 'shelter'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          Official Shelters
        </button>
        <button
          onClick={() => setCategoryFilter('high-ground')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap text-[11px] font-semibold transition-all ${
            categoryFilter === 'high-ground'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          High Ground (+15m Ridge)
        </button>
        <button
          onClick={() => setCategoryFilter('emergency')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap text-[11px] font-semibold transition-all ${
            categoryFilter === 'emergency'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          Emergency Rescue Desks
        </button>
      </div>

      {/* 4. Interactive Leaflet Shelters Map */}
      <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-xs bg-surface-container-low border border-surface-container-high z-0">
        <MapContainer
          center={centerCoords}
          zoom={13}
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
            maxZoom={19}
          />

          {/* User Location Pulse Marker */}
          {userLocation && (
            <CircleMarker
              center={userLocation}
              radius={8}
              pathOptions={{
                fillColor: '#006c4b',
                fillOpacity: 0.9,
                color: '#ffffff',
                weight: 2.5,
              }}
            >
              <Popup>
                <div className="text-xs font-bold text-secondary">Your Current Location</div>
              </Popup>
            </CircleMarker>
          )}

          {/* Shelter & Rescue Markers */}
          {filteredPlaces.map((place) => {
            const icon =
              place.category === 'emergency'
                ? emergencyUnitIcon
                : place.statusText.includes('Verified')
                ? shelterOfficialIcon
                : shelterFacilityIcon;

            return (
              <Marker key={place.id} position={[place.lat, place.lng]} icon={icon}>
                <Popup>
                  <div className="flex flex-col gap-1 min-w-[180px] p-0.5">
                    <span className="font-bold text-xs text-on-surface">{place.name}</span>
                    <span className="text-[11px] text-on-surface-variant">{place.address}</span>
                    <span className="text-[10px] text-secondary font-semibold">{place.advisory}</span>
                    <button
                      onClick={() => handleStartRoute(place)}
                      className="mt-1.5 w-full py-1 rounded-lg bg-secondary text-on-secondary text-[11px] font-bold shadow-xs hover:bg-secondary/95 flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">directions</span>
                      <span>Navigate Here</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Map Legend */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between px-3 py-1.5 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-xs border border-surface-container-high text-xs z-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-on-surface">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              Official Shelter
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-on-surface">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
              Public Facility
            </span>
          </div>
          <span className="text-[10px] text-secondary font-bold">
            {filteredPlaces.length} Refuges
          </span>
        </div>
      </div>

      {/* 5. Direct Emergency Helplines Callout */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-3.5 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">emergency</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs text-on-surface truncate">
              Immediate Rescue: Dial 112
            </span>
            <span className="text-[10px] text-on-surface-variant truncate">
              PMC Disaster Control: 020-25501269
            </span>
          </div>
        </div>
        <a
          href="tel:112"
          className="px-3 py-1.5 rounded-xl bg-error text-on-error font-bold text-xs shrink-0 active:scale-95 transition-transform flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[15px]">call</span>
          <span>Call 112</span>
        </a>
      </div>

      {/* 6. List of Filtered Shelters */}
      <div className="flex flex-col gap-3">
        {filteredPlaces.map((place) => {
          const isOfficial = place.statusText.includes('Verified');
          const isEmergency = place.category === 'emergency';

          return (
            <article
              key={place.id}
              className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-3 shadow-xs hover:border-secondary transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                  {/* Status chip */}
                  <span
                    className={`inline-flex items-center gap-1 self-start px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      isEmergency
                        ? 'bg-error-container text-on-error-container'
                        : isOfficial
                        ? 'bg-secondary text-on-secondary'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {isEmergency ? 'medical_services' : isOfficial ? 'verified' : 'apartment'}
                    </span>
                    <span>
                      {isEmergency
                        ? 'Rapid Emergency Rescue Desk'
                        : isOfficial
                        ? 'Officially Designated Shelter'
                        : 'Listed Facility — Higher Ground'}
                    </span>
                  </span>

                  <h2 className="font-bold text-sm text-on-surface truncate mt-0.5">
                    {place.name}
                  </h2>
                  <span className="text-xs text-on-surface-variant truncate">
                    {place.address}
                  </span>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-container-low text-xs font-bold text-on-surface shrink-0">
                  <span className="material-symbols-outlined text-[15px] text-secondary">near_me</span>
                  <span>{place.distanceFormatted}</span>
                </div>
              </div>

              {/* Advisory Details */}
              <div className="p-2.5 rounded-xl bg-surface-container-low text-xs text-on-surface-variant leading-relaxed flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">
                  terrain
                </span>
                <span>{place.advisory}</span>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-1 border-t border-surface-container-high">
                <span className="text-[11px] text-on-surface-variant">
                  {place.statusText}
                </span>
                <button
                  onClick={() => handleStartRoute(place)}
                  className="px-3.5 py-1.5 rounded-xl bg-secondary text-on-secondary font-bold text-xs shadow-xs hover:bg-secondary/90 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">navigation</span>
                  <span>Directions (Avoid Floods)</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
