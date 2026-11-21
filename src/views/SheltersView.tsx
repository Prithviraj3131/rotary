import React, { useState } from 'react';
import { DemoBadge } from '../components/common/DemoBadge';

interface ShelterItem {
  id: string;
  name: string;
  category: string;
  distanceKm: number;
  verification: 'official_shelter' | 'listed' | 'unverified';
  address: string;
  elevation: string;
  features: string[];
}

const SEED_SHELTERS: ShelterItem[] = [
  {
    id: 'shelter-1',
    name: 'Tilak Road Sports Complex (Higher Ground)',
    category: 'Elevated Community Center',
    distanceKm: 0.8,
    verification: 'official_shelter',
    address: 'Near Swargate / Tilak Road, Pune',
    elevation: '+18m above Mutha basin grade',
    features: ['High Capacity Hall', 'First Aid Station', 'Emergency Generator']
  },
  {
    id: 'shelter-2',
    name: 'Fergusson College Main Amphitheatre & Hall',
    category: 'Institutional Relief Point',
    distanceKm: 1.2,
    verification: 'official_shelter',
    address: 'FC Road, Deccan Gymkhana, Pune',
    elevation: '+15m elevated natural ridge',
    features: ['Sheltered Seating', 'Restrooms', 'Drinking Water']
  },
  {
    id: 'shelter-3',
    name: 'Swargate Bus Station Upper Concourse',
    category: 'Transport Infrastructure',
    distanceKm: 1.5,
    verification: 'listed',
    address: 'Swargate Flyover Concourse, Pune',
    elevation: '+8m bridge deck level',
    features: ['Covered Platform', 'Listed Public Site']
  },
  {
    id: 'shelter-4',
    name: 'COEP Technological University North Quad',
    category: 'Educational Campus',
    distanceKm: 2.4,
    verification: 'listed',
    address: 'Shivajinagar, Pune',
    elevation: '+12m elevated campus ground',
    features: ['Auditorium Hall', 'Listed Facility']
  },
  {
    id: 'shelter-5',
    name: 'Sinhagad College Hilltop Campus',
    category: 'Elevated Campus',
    distanceKm: 3.8,
    verification: 'unverified',
    address: 'Sinhagad Road Highlands, Pune',
    elevation: '+35m hill grade',
    features: ['High ground', 'Unverified status']
  }
];

export const SheltersView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = SEED_SHELTERS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDirections = (name: string) => {
    setToastMessage(`Walking route to ${name} generated (avoiding cells $\\ge 0.4$).`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="w-full max-w-md md:max-w-xl mx-auto px-4 py-4 flex flex-col gap-4 pb-24">
      {/* 1. Search Bar */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm">
        <span className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0">
          search
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search higher ground & shelters in Pune..."
          className="w-full bg-transparent text-xs md:text-sm text-on-surface placeholder:text-outline focus:outline-none min-w-0"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* 2. Banner with Disclaimer */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
            Pune Elevated Relief Locations
          </span>
          <DemoBadge label="SEEDED LIST" />
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Curated high-ground relief points. Sites marked <em>Official Shelter</em> are designated by municipal authorities; other listed buildings are marked <em>listed, not verified safe</em>.
        </p>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3 bg-secondary text-on-secondary rounded-xl text-xs font-semibold shadow-md flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">navigation</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. List of Shelters */}
      <div className="flex flex-col gap-3">
        {filtered.map((shelter) => {
          const isOfficial = shelter.verification === 'official_shelter';
          const isListed = shelter.verification === 'listed';

          return (
            <article
              key={shelter.id}
              className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-3 shadow-xs hover:border-secondary transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                  {/* Status chip */}
                  <span
                    className={`inline-flex items-center gap-1 self-start px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      isOfficial
                        ? 'bg-secondary text-on-secondary'
                        : isListed
                        ? 'bg-surface-container text-on-surface-variant'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {isOfficial ? 'verified' : 'info'}
                    </span>
                    <span>
                      {isOfficial
                        ? 'Officially Designated Shelter'
                        : isListed
                        ? 'Listed Public Facility'
                        : 'Unverified Elevation Site'}
                    </span>
                  </span>

                  <h2 className="font-bold text-sm text-on-surface truncate mt-0.5">
                    {shelter.name}
                  </h2>
                  <span className="text-xs text-on-surface-variant truncate">
                    {shelter.address} • {shelter.elevation}
                  </span>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-container-low text-xs font-bold text-on-surface shrink-0">
                  <span className="material-symbols-outlined text-[15px] text-secondary">near_me</span>
                  <span>{shelter.distanceKm} km</span>
                </div>
              </div>

              {/* Feature Chips */}
              <div className="flex flex-wrap gap-1.5">
                {shelter.features.map((f, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-surface-container-low text-[10px] text-on-surface-variant font-medium"
                  >
                    {f}
                  </span>
                ))}
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-2 border-t border-surface-container-high">
                <span className="text-[11px] text-on-surface-variant">
                  {shelter.category}
                </span>
                <button
                  onClick={() => handleDirections(shelter.name)}
                  className="px-3.5 py-1.5 rounded-xl bg-secondary text-on-secondary font-bold text-xs shadow-xs hover:bg-secondary/90 active:scale-95 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">directions_walk</span>
                  <span>Foot Route</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
