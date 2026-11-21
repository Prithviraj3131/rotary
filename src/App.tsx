import React, { useState, useEffect } from 'react';
import { Header, TopMode } from './components/common/Header';
import { BottomNav, NavTab } from './components/common/BottomNav';
import { ForecastBanner } from './components/common/ForecastBanner';
import { NetworkBanner } from './components/common/NetworkBanner';
import { FloodMap } from './components/Map/FloodMap';
import { ReportModal } from './components/Report/ReportModal';
import { ReportConfirmationModal } from './components/Report/ReportConfirmationModal';
import { UrgentAlertModal } from './components/Alerts/UrgentAlertModal';
import { DeliveryTrackerModal } from './components/Alerts/DeliveryTrackerModal';
import { AlertsCentreModal } from './components/Alerts/AlertsCentreModal';
import { MyReportsModal } from './components/Profile/MyReportsModal';
import { OnboardingModal } from './components/common/OnboardingModal';
import { HelpSupportModal } from './components/common/HelpSupportModal';
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
import { networkState } from './lib/networkState';
import { IncomingMeshAlertModal } from './components/common/IncomingMeshAlertModal';
import { initMeshNetwork } from './lib/meshNetwork';
import { handleIncomingMeshMessage } from './lib/relayEngine';
import { OfflineQueuedMessage } from './types/relay';

export const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => networkState.isOnline());
  const [incomingMeshAlert, setIncomingMeshAlert] = useState<OfflineQueuedMessage | null>(null);
  const [topMode, setTopMode] = useState<TopMode>('consumer');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('floodguard_onboarded') !== 'true';
  });
  const [confirmationReport, setConfirmationReport] = useState<{
    id: string;
    depth: string;
    landmark: string;
  } | null>(null);

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

  const [targetShelterDestination, setTargetShelterDestination] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);

  // Network connectivity listener
  useEffect(() => {
    const unsub = networkState.subscribe((online) => {
      setIsOnline(online);
    });
    return () => unsub();
  }, []);

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
    setReports(localReportsStore.getAll());

    const unsubscribe = initRealtimeSubscriptions((updatedReports) => {
      setReports(updatedReports);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Subscribe to Peer-to-Peer Mesh Network across devices on LAN / Web
  useEffect(() => {
    const unsubMesh = initMeshNetwork(
      (incomingMsg) => {
        handleIncomingMeshMessage(incomingMsg);
        setIncomingMeshAlert(incomingMsg);
      },
      (incomingReport) => {
        localReportsStore.upsert(incomingReport);
      }
    );

    return () => {
      unsubMesh();
    };
  }, []);

  // Listen to Alert Delivery State Machine
  useEffect(() => {
    const unsub = deliveryStateMachine.subscribe((state) => {
      setActiveDelivery(state);
      if (state.status === 'push_sent' || state.status === 'sms_fallback_sent') {
        setShowUrgentModal(true);
      } else {
        setShowUrgentModal(false);
      }
    });

    return () => {
      unsub();
    };
  }, []);

  // Compute hydrological grid predictions based on live weather rainFactor
  const predictedCells = calculatePuneCellRisks(
    weather?.rainFactor ?? 0.4,
    weather?.currentRainMmHr ?? 18,
    reports
  );

  // Forecast hotspot check (e.g., Sinhagad / Katraj basin > 15 mm/hr)
  const forecastAlert = weather ? checkForecastHotspotAlert(weather.forecastPeakMmHr) : null;

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
      last_verified_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    };

    await broadcastReportUpsert(updated);
  };

  const criticalAlertsCount = reports.filter(
    (r) => r.status === 'severe' || r.depth === 'waist'
  ).length;

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface font-sans selection:bg-secondary/20 relative">
      {/* Light Atmospheric Backdrop from UI/UX template */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDEOhQOX9OhPBhd7wtGA5KS1PBJEntk9oX3WHQi2VAwmetm3Fkj6NEbJBI7_2DKiLT-rl2ptPaThepI9RuYXcLIYISrAx6wzYQI-AUB1OlOhEp-AFE03iRz3FjQx-SKQj-bDtceGk-B-ilX5p9qiAffYpYByrAgoE1wEr0Ao4aI1PHpD94_4Raep4zjHGnPf8AulL33YAtQ4Eq4CW5Ap7g8Ope6w3DP4lghX2GpRGT4')",
        }}
      />

      {/* Top Header with Console Switcher, Alert Bell, Help & Profile */}
      <Header
        topMode={topMode}
        setTopMode={setTopMode}
        locality="Pune Operations"
        onOpenAlerts={() => setShowAlertsModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenHelp={() => setShowHelpModal(true)}
        activeAlertCount={criticalAlertsCount}
      />

      <div className="flex-1 flex flex-col pt-16 pb-20 relative">
        {/* Offline Mesh Network Banner */}
        <NetworkBanner
          isOnline={isOnline}
          onOpenOfflineHub={() => setActiveTab('offline')}
        />

        {/* Proactive Forecast Alert Banner (Shows when rainfall > 15 mm/hr) */}
        {forecastAlert && showForecastBanner && (
          <ForecastBanner
            placeName={forecastAlert.placeName}
            forecastMmHr={forecastAlert.forecastMmHr}
            rainFactor={weather?.rainFactor ?? 0.5}
            onDismiss={() => setShowForecastBanner(false)}
          />
        )}

        {/* Floating Quick Action Utility Toolbar */}
        {topMode === 'consumer' && (
          <div className="max-w-md md:max-w-xl mx-auto w-full px-4 pt-2.5 flex items-center justify-between gap-2 overflow-x-auto">
            <button
              onClick={() => setShowSavedRoutesModal(true)}
              className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-semibold text-[11px] border border-surface-container-high hover:bg-surface-container-high transition-colors flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[14px] text-secondary">bookmark</span>
              <span>Saved Corridors (200m Monitor)</span>
            </button>

            <button
              onClick={() => setShowAnalyticsModal(true)}
              className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-semibold text-[11px] border border-surface-container-high hover:bg-surface-container-high transition-colors flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[14px] text-primary">bar_chart</span>
              <span>Pune Hotspots</span>
            </button>

            <button
              onClick={() => setShowAlertsModal(true)}
              className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-semibold text-[11px] border border-surface-container-high hover:bg-surface-container-high transition-colors flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[14px] text-error">campaign</span>
              <span>Alert Centre</span>
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
                onOpenAlerts={() => setShowAlertsModal(true)}
                isOnline={isOnline}
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
                  onOpenReroute={(_reportId) => setActiveTab('reroute')}
                />
              </main>
            )}

            {activeTab === 'reroute' && (
              <RerouteView
                reports={reports}
                userLocation={userLocation}
                targetDestination={targetShelterDestination}
                onClearTargetDestination={() => setTargetShelterDestination(null)}
                onOpenMap={() => setActiveTab('map')}
              />
            )}

            {activeTab === 'offline' && <OfflineCommView />}

            {activeTab === 'shelters' && (
              <SheltersView
                userLocation={userLocation}
                onNavigateToShelter={(shelter) => {
                  setTargetShelterDestination(shelter);
                  setActiveTab('reroute');
                }}
              />
            )}

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
        onReportCreated={(report) => setConfirmationReport(report)}
      />

      {/* Report Confirmation Modal */}
      {confirmationReport && (
        <ReportConfirmationModal
          isOpen={Boolean(confirmationReport)}
          onClose={() => setConfirmationReport(null)}
          reportId={confirmationReport.id}
          depth={confirmationReport.depth}
          locationName={confirmationReport.landmark}
          onViewOnMap={() => {
            setConfirmationReport(null);
            setActiveTab('map');
          }}
        />
      )}

      {/* First-time Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Emergency Help & Helplines Modal */}
      <HelpSupportModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Pune Alerts Centre Modal */}
      <AlertsCentreModal
        isOpen={showAlertsModal}
        onClose={() => setShowAlertsModal(false)}
        reports={reports}
        onViewOnMap={(_report) => {
          setShowAlertsModal(false);
          setActiveTab('map');
        }}
        onFindReroute={(_report) => {
          setShowAlertsModal(false);
          setActiveTab('reroute');
        }}
      />

      {/* Citizen Profile & My Reports Modal */}
      <MyReportsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        reports={reports}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenHelpSupport={() => {
          setShowProfileModal(false);
          setShowHelpModal(true);
        }}
        onOpenOnboarding={() => {
          setShowProfileModal(false);
          setShowOnboarding(true);
        }}
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

      {/* Incoming Peer Mesh Alert Popup */}
      <IncomingMeshAlertModal
        message={incomingMeshAlert}
        onClose={() => setIncomingMeshAlert(null)}
        onOpenMeshHub={() => {
          setIncomingMeshAlert(null);
          setActiveTab('offline');
        }}
      />
    </div>
  );
};

export default App;
