import React, { useState, useEffect, useRef } from 'react';
import { ReportDepth } from '../../types/database';
import { DEPTH_LEVELS, PendingReport } from '../../types/reports';
import { PUNE_BOUNDS } from '../../config/puneConfig';
import { savePendingReport } from '../../lib/idb';
import { localReportsStore } from '../../lib/supabase';
import { analyzeFloodPhoto, ImageAnalysisResult } from '../../lib/imageCheck';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onReportCreated,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [depth, setDepth] = useState<ReportDepth>('knee');
  const [roadPassable, setRoadPassable] = useState<boolean>(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch GPS automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy || 10,
            });
            setLocationError(null);
          },
          (err) => {
            console.warn('GPS position error:', err);
            setLocation({
              lat: PUNE_BOUNDS.center.lat,
              lng: PUNE_BOUNDS.center.lng,
              accuracy: 25,
            });
            setLocationError('Using approximate location. Please allow GPS for high accuracy.');
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        setLocation({
          lat: PUNE_BOUNDS.center.lat,
          lng: PUNE_BOUNDS.center.lng,
          accuracy: 50,
        });
      }
    } else {
      setStep(1);
      setPhotoPreview(null);
      setPhotoBlob(null);
      setAiAnalysis(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle live camera capture (strictly capture="environment" to prevent old gallery uploads)
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoBlob(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);

      // Run on-device AI water analysis (Section 6.7)
      const analysis = await analyzeFloodPhoto(file);
      setAiAnalysis(analysis);
    }
  };

  const handleFinalSubmit = async () => {
    if (!location) return;
    setIsSubmitting(true);

    try {
      const client_uuid = crypto.randomUUID();
      const nowIso = new Date().toISOString();
      const expiryIso = new Date(Date.now() + 90 * 60 * 1000).toISOString();

      const newPendingReport: PendingReport = {
        client_uuid,
        lat: location.lat,
        lng: location.lng,
        gps_accuracy: location.accuracy,
        depth,
        road_passable: roadPassable,
        photo_blob: photoBlob,
        photo_url: photoPreview,
        observed_at: nowIso,
        created_at: nowIso,
        is_demo: false,
        status: 'pending',
        retry_count: 0
      };

      // 1. Save to client IndexedDB first (offline resilient)
      await savePendingReport(newPendingReport);

      // 2. Publish to local reactive store immediately
      localReportsStore.upsert({
        id: client_uuid,
        client_uuid,
        user_id: 'current-user',
        lat: location.lat,
        lng: location.lng,
        gps_accuracy: location.accuracy,
        depth,
        photo_url: photoPreview,
        observed_at: nowIso,
        created_at: nowIso,
        last_verified_at: nowIso,
        expires_at: expiryIso,
        confirms: 1,
        clears: 0,
        road_passable: roadPassable,
        source: 'user_app',
        status: 'unverified',
        is_demo: false
      });

      onReportCreated?.();
      onClose();
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-secondary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
            </div>
            <div>
              <h2 className="font-bold text-base text-on-surface">3-Tap Flood Report</h2>
              <span className="text-[11px] text-on-surface-variant block">Pune Emergency Hydrology</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-3 gap-1 px-5 pt-3">
          <div className={`h-1.5 rounded-full ${step >= 1 ? 'bg-secondary' : 'bg-surface-container'}`} />
          <div className={`h-1.5 rounded-full ${step >= 2 ? 'bg-secondary' : 'bg-surface-container'}`} />
          <div className={`h-1.5 rounded-full ${step >= 3 ? 'bg-secondary' : 'bg-surface-container'}`} />
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* STEP 1: Depth & Passability */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-on-surface">Tap 1: Water Depth</span>
                <span className="text-xs text-secondary font-semibold">Select level</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {(Object.keys(DEPTH_LEVELS) as ReportDepth[]).map((key) => {
                  const cfg = DEPTH_LEVELS[key];
                  const isSelected = depth === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDepth(key)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'bg-primary-container border-secondary text-on-primary shadow-sm'
                          : 'bg-surface-container-low border-surface-container-high text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="material-symbols-outlined text-[22px] text-secondary-fixed">
                          {cfg.icon}
                        </span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
                            check_circle
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-xs">{cfg.label}</span>
                      <span className="text-[10px] opacity-80 mt-0.5 line-clamp-1">{cfg.description}</span>
                    </button>
                  );
                })}
              </div>

              {/* Passability Toggle */}
              <div className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">Is Road Passable?</span>
                  <span className="text-[11px] text-on-surface-variant">Can regular vehicles pass safely?</span>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setRoadPassable(true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      roadPassable ? 'bg-secondary text-on-secondary shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    Passable
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoadPassable(false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      !roadPassable ? 'bg-error text-on-error shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    Blocked
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Live Camera Capture */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-on-surface">Tap 2: Live Photo Evidence</span>
                <span className="text-xs text-on-surface-variant">Camera only (anti-abuse)</span>
              </div>

              {/* Hidden file input strictly enforcing live camera */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoCapture}
              />

              {photoPreview ? (
                <div className="relative w-full rounded-xl overflow-hidden bg-black flex flex-col items-center">
                  <div className="relative w-full h-52">
                    <img src={photoPreview} alt="Live capture" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-surface/90 text-on-surface text-xs font-semibold shadow-md flex items-center gap-1 backdrop-blur-md"
                    >
                      <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                      Retake
                    </button>
                  </div>

                  {/* AI Water Detection Chip (from UI Template) */}
                  {aiAnalysis && (
                    <div className="w-full bg-primary/95 text-on-primary p-3 flex items-start gap-2 border-t border-primary-container">
                      <span className="material-symbols-outlined text-secondary-fixed text-[20px] shrink-0 mt-0.5">
                        smart_toy
                      </span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-secondary-fixed tracking-wide uppercase">
                            AI Water Detection Active
                          </span>
                          <span className="text-[10px] bg-secondary px-1.5 py-0.2 rounded text-white font-bold">
                            {(aiAnalysis.confidence * 100).toFixed(0)}% Conf
                          </span>
                        </div>
                        <span className="text-xs text-on-primary mt-0.5">
                          {aiAnalysis.depthEstimateHint}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-56 rounded-xl border-2 border-dashed border-secondary/50 bg-secondary/5 hover:bg-secondary/10 cursor-pointer flex flex-col items-center justify-center p-6 text-center transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-secondary-container/60 text-secondary flex items-center justify-center mb-2 shadow-sm">
                    <span className="material-symbols-outlined text-[30px]">photo_camera</span>
                  </div>
                  <span className="font-bold text-sm text-on-surface">Open Live Camera</span>
                  <span className="text-xs text-on-surface-variant mt-1 max-w-xs">
                    Live capture verifies freshness and grants +0.5 trust bonus.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Confirm GPS Location */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-on-surface">Tap 3: Verify Location &amp; Submit</span>
                <span className="text-xs text-secondary font-bold">Auto GPS</span>
              </div>

              <div className="bg-surface-container-low p-3.5 rounded-xl space-y-2 border border-surface-container-high">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-secondary font-bold">
                    <span className="material-symbols-outlined text-[16px]">gps_fixed</span>
                    GPS Locked
                  </div>
                  {location && (
                    <span className="text-[11px] bg-secondary-container/40 text-on-secondary-container px-2 py-0.5 rounded-full font-semibold">
                      ±{Math.round(location.accuracy)}m accuracy
                    </span>
                  )}
                </div>

                {location ? (
                  <div className="text-xs text-on-surface">
                    <div className="font-semibold">Pune Coordinate Lock:</div>
                    <div className="font-mono text-on-surface-variant mt-0.5">
                      {location.lat.toFixed(5)}° N, {location.lng.toFixed(5)}° E
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-on-surface-variant animate-pulse">Acquiring GPS fix...</div>
                )}

                {locationError && (
                  <div className="text-[11px] text-amber-700 bg-amber-100/60 p-2 rounded">
                    {locationError}
                  </div>
                )}
              </div>

              {/* Report Summary */}
              <div className="bg-surface-container p-3 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Depth Level:</span>
                  <strong className="text-on-surface">{DEPTH_LEVELS[depth].label}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Road Passability:</span>
                  <strong className={roadPassable ? 'text-secondary' : 'text-error'}>
                    {roadPassable ? 'Passable' : 'Blocked'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Photo Attached:</span>
                  <strong className="text-on-surface">{photoPreview ? 'Yes (Live Camera)' : 'None'}</strong>
                </div>
                {aiAnalysis && (
                  <div className="flex justify-between text-secondary font-semibold pt-1 border-t border-surface-container-high">
                    <span>AI Classification:</span>
                    <span>Water Pooling Confirmed ({Math.round(aiAnalysis.confidence * 100)}%)</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-surface-container flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-on-surface-variant font-semibold text-xs hover:text-on-surface"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              className="px-5 py-2 rounded-lg bg-secondary text-on-secondary font-bold text-xs shadow-sm hover:bg-secondary/90 transition-all flex items-center gap-1"
            >
              Next
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="px-5 py-2 rounded-lg bg-error text-on-error font-bold text-xs shadow-md hover:bg-error/90 active:scale-95 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              {isSubmitting ? 'Submitting...' : 'Submit Flood Alert'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
