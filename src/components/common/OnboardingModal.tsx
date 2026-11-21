import React, { useState } from 'react';
import { DemoBadge } from './DemoBadge';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Slide {
  title: string;
  desc: string;
  icon: string;
  badge: string;
}

const SLIDES: Slide[] = [
  {
    title: 'Know Before It Floods',
    desc: 'Hydrological predictions anticipate waterlogging at low-lying Pune underpasses (Alka Talkies, Pulgate, Ambil Odha) before ground reports arrive.',
    icon: 'rainy',
    badge: 'HYDROLOGICAL AI',
  },
  {
    title: 'Reroute Around Hazards',
    desc: 'Get navigation vectors actively avoiding reported flood zones with an automatic +50m safety clearance buffer.',
    icon: 'alt_route',
    badge: 'ACTIVE RESILIENCE',
  },
  {
    title: 'Stay Connected Offline',
    desc: 'When cellular networks saturate or power feeders trip, opportunistic peer-to-peer mesh relays transfer encrypted emergency packets across passing phones.',
    icon: 'wifi_off',
    badge: 'ZERO INTERNET MESH',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('floodguard_onboarded', 'true');
    onClose();
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-primary/50 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-surface rounded-3xl shadow-2xl border border-surface-container-high flex flex-col overflow-hidden animate-scale-up">
        {/* Top Bar with Skip */}
        <div className="p-4 flex items-center justify-between border-b border-surface-container bg-surface/80 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">flood</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              FLOODGUARD AI • PUNE
            </span>
          </div>

          <button
            onClick={handleComplete}
            className="text-xs text-on-surface-variant hover:text-on-surface font-semibold px-2.5 py-1 rounded-full hover:bg-surface-container transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Content Box */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-secondary-container/40 border border-secondary/20 flex items-center justify-center shadow-inner">
            <span
              className="material-symbols-outlined text-[42px] text-secondary transition-transform duration-300"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {slide.icon}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary px-2 py-0.5 rounded-full bg-secondary-container">
                {slide.badge}
              </span>
              <DemoBadge label="PUNE PLATFORM" />
            </div>
            <h2 className="font-extrabold text-xl text-on-surface">{slide.title}</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">
              {slide.desc}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5 py-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-6 bg-primary' : 'w-2 bg-surface-container-high'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={handleNext}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/95 text-on-primary font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
          >
            <span>{currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}</span>
            <span className="material-symbols-outlined text-[18px]">
              {currentSlide === SLIDES.length - 1 ? 'check' : 'arrow_forward'}
            </span>
          </button>
        </div>

        {/* Bottom Safety Disclaimer (Ground Rule 2 & 4) */}
        <div className="p-3 bg-surface-container-low text-[10px] text-on-surface-variant text-center border-t border-surface-container">
          Disclaimer: Conditions change rapidly. Never drive or walk into moving floodwater.
        </div>
      </div>
    </div>
  );
};
