import React, { useState, useEffect } from 'react';
import { Header, TopMode } from './components/common/Header';
import { BottomNav, NavTab } from './components/common/BottomNav';
import { ForecastBanner } from './components/common/ForecastBanner';
import { FloodMap } from './components/Map/FloodMap';
import { ReportModal } from './components/Report/ReportModal';
import { UrgentAlertModal } from './components/Alerts/UrgentAlertModal';
import { DeliveryTrackerModal } from './components/Alerts/DeliveryTrackerModal';
import { HeavyRainSimulator } from './components/Demo/HeavyRainSimulator';
import { HotspotAnalyticsModal } from './components/Analytics/HotspotAnalyticsModal';
import { SavedRoutesModal } from './components/Routing/SavedRoutesModal';
import { HomeView } from './views/HomeView';
import { RerouteView } from './views/RerouteView';
import { SheltersView } from './views/SheltersView';
import { SOSView } from './views/SOSView';
import { OfflineCommView } from './views/OfflineCommView';
import { AuthorityView } from './views/AuthorityView';
import { RelaySimView } from './views/RelaySimView';
import { ReportRow } from './types/database';
import { PUNE_BOUNDS } from './config/puneConfig';
import { localReportsStore } from './lib/supabase';
import { initRealtimeSubscriptions, broadcastReportUpsert } from './lib/realtimeSync';
import { evaluateReportStatus } from './lib/trustEngine';
import { fetchPunePrecipitation, checkForecastHotspotAlert, WeatherData } from './lib/weather';
import { calculatePuneCellRisks } from './lib/predictionEngine';
import { deliveryStateMachine, AlertDeliveryState } from './lib/deliveryStateMachine';

export const App: React.FC = () => {
  const [topMode, setTopMode] = useState<TopMode>('consumer');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showSavedRoutesModal, setShowSavedRoutesModal] = useState(false);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [rainOverride, setRainOverride] = useState<number | null>(null);
  const [showForecastBanner, setShowForecastBanner] = useState(true);
  const [activeDelivery, setActiveDelivery] = useState<AlertDeliveryState | null>(null);
  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>([
    PUNE_BOUNDS.center.lat,
    PUNE_BOUNDS.center.lng,
  ]);

  // Acquire user GPS location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn('Geolocation warning, defaulting to Pune center:', err);
          setUserLocation([PUNE_BOUNDS.center.lat, PUNE_BOUNDS.center.lng]);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Weather telemetry fetching (handles demo rain override)
  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      const data = await fetchPunePrecipitation(rainOverride ?? undefined);
      if (isMounted) {
        setWeather(data);
      }
    };

    loadWeather();
    const interval = setInterval(loadWeather, 10 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [rainOverride]);

  // Subscribe to real-time sync (Supabase + cross-tab BroadcastChannel)
  useEffect(() => {
    const unsubscribe = initRealtimeSubscriptions((updatedReports) => {
      setReports(updatedReports);
    });
    return unsubscribe;
  }, []);

  // Subscribe to Alert Delivery State Machine
  useEffect(() => {
    const unsub = deliveryStateMachine.subscribe((state) => {
      setActiveDelivery(state);
      if (state.status === 'push_sent') {
        setShowUrgentModal(true);
        setShowTrackerModal(true);
      }
    });
    return unsub;
  }, []);

  const handleAcknowledgeAlert = () => {
    if (activeDelivery) {
      deliveryStateMachine.acknowledgeAlert(activeDelivery.deliveryId);
    }
    setShowUrgentModal(false);
  };

  const handleVoteStillFlooded = async (reportId: string) => {
    const report = localReportsStore.get(reportId);
    if (!report) return;

    const allReports = localReportsStore.getAll();
    const voteRecord = {
      report_id: reportId,
      user_id: 'current-user',
      vote: 'still_flooded' as const,
      weight: 1.0,
      created_at: new Date().toISOString(),
    };

    const evaluation = evaluateReportStatus(report, allReports, [voteRecord]);

    const updated: ReportRow = {
      ...report,
      confirms: evaluation.confirmsCount,
      status: evaluation.newStatus,
      last_verified_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    };

    await broadcastReportUpsert(updated);

    if (evaluation.newStatus === 'severe' && report.status !== 'severe') {
      deliveryStateMachine.triggerAlertFlow(
        report.id,
        'Pune Incident Area',
        'Nearby Arterial Road',
        'severe'
      );
    }
  };

  const handleVoteCleared = async (reportId: string) => {
    const report = localReportsStore.get(reportId);
    if (!report) return;

    const allReports = localReportsStore.getAll();
    const voteRecord = {
      report_id: reportId,
      user_id: 'current-user',
      vote: 'cleared' as const,
      weight: 1.0,
      created_at: new Date().toISOString(),
    };

    const evaluation = evaluateReportStatus(report, allReports, [voteRecord]);

    const updated: ReportRow = {
      ...report,
      clears: evaluation.clearsCount,
      status: evaluation.newStatus,
    };

    await broadcastReportUpsert(updated);
  };

  const forecastAlert = weather ? checkForecastHotspotAlert(weather.forecastPeakMmHr) : null;

  // Compute dynamic prediction grid using Highlight 1 model
  const predictedCells = calculatePuneCellRisks(
    weather?.rainFactor || 0.42,
    weather?.currentRainMmHr || 18,
    reports
  );

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative select-none">
      {/* Top Header with Console Switcher */}
      <Header
        topMode={topMode}
        setTopMode={setTopMode}
        locality="Pune Operations"
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col pt-16">
        {/* Proactive Forecast Heads-Up Banner */}
        {forecastAlert && showForecastBanner && (
          <ForecastBanner
            placeName={forecastAlert.placeName}
            forecastMmHr={forecastAlert.forecastMmHr}
            rainFactor={weather?.rainFactor || 0.65}
            isDemo={weather?.isDemo}
            onDismiss={() => setShowForecastBanner(false)}
          />
        )}

        {/* Demo Controls Strip */}
        {topMode === 'consumer' && (
          <div className="w-full max-w-md md:max-w-xl mx-auto px-4 pt-2 flex items-center justify-between text-xs gap-2">
            <button
              onClick={() => setShowSavedRoutesModal(true)}
              className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-semibold text-[11px] border border-surface-container-high hover:bg-surface-container-high transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px] text-secondary">bookmark</span>
              <span>Saved Corridors (200m Monitor)</span>
            </button>

            <button
              onClick={() => setShowAnalyticsModal(true)}
              className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-semibold text-[11px] border border-surface-container-high hover:bg-surface-container-high transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px] text-primary">bar_chart</span>
              <span>Pune Hotspots</span>
            </button>
          </div>
        )}

        {/* Heavy Rain Simulator Script Runner (Hackathon Demo Path) */}
        {topMode === 'consumer' && (
          <HeavyRainSimulator
            onSetRainOverride={(val) => setRainOverride(val)}
            isSimulating={rainOverride !== null}
          />
        )}

        {/* MODE: Authority Console */}
        {topMode === 'authority' && <AuthorityView reports={reports} />}

        {/* MODE: Relay Mesh Simulator */}
        {topMode === 'relay-sim' && <RelaySimView />}

        {/* MODE: Consumer App Views */}
        {topMode === 'consumer' && (
          <>
            {activeTab === 'home' && (
              <HomeView
                weather={weather}
                reports={reports}
                setActiveTab={setActiveTab}
                onOpenReport={() => setIsReportModalOpen(true)}
              />
            )}

            {activeTab === 'map' && (
              <main className="flex-1 w-full relative min-h-[calc(100vh-140px)]">
                <FloodMap
                  reports={reports}
                  predictedCells={predictedCells}
                  userLocation={userLocation}
                  weather={weather}
                  onVoteStillFlooded={handleVoteStillFlooded}
                  onVoteCleared={handleVoteCleared}
                  onOpenAnalytics={() => setShowAnalyticsModal(true)}
                />
              </main>
            )}

            {activeTab === 'reroute' && (
              <RerouteView
                reports={reports}
                onOpenMap={() => setActiveTab('map')}
              />
            )}

            {activeTab === 'offline' && <OfflineCommView />}

            {activeTab === 'shelters' && <SheltersView />}

            {activeTab === 'sos' && <SOSView />}
          </>
        )}
      </div>

      {/* Bottom Navigation Bar (Visible in Consumer App mode) */}
      {topMode === 'consumer' && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenReport={() => setIsReportModalOpen(true)}
        />
      )}

      {/* 3-Tap Flood Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Urgent Alert Modal (Siren & Vibration) */}
      <UrgentAlertModal
        isOpen={showUrgentModal}
        landmark={activeDelivery?.landmark || 'Sinhagad Road Basin'}
        roadName={activeDelivery?.roadName || 'Canal Underpass'}
        depthText="Waist Deep / Vehicle Stalled"
        secondsRemaining={activeDelivery?.secondsRemaining ?? 25}
        onAcknowledge={handleAcknowledgeAlert}
      />

      {/* Delivery State Machine Inspector */}
      {showTrackerModal && (
        <DeliveryTrackerModal
          deliveryState={activeDelivery}
          onClose={() => setShowTrackerModal(false)}
        />
      )}

      {/* Hotspot Analytics Modal */}
      <HotspotAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />

      {/* Saved Routes Modal */}
      <SavedRoutesModal
        isOpen={showSavedRoutesModal}
        onClose={() => setShowSavedRoutesModal(false)}
        reports={reports}
        onSelectRoute={(_id) => {
          setActiveTab('reroute');
        }}
      />
    </div>
  );
};

export default App;
