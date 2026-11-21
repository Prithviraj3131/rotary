import React, { useState } from 'react';
import { ReportRow, AuthorityLogRow } from '../types/database';
import { DemoBadge } from '../components/common/DemoBadge';

interface AuthorityViewProps {
  reports: ReportRow[];
}

const DEFAULT_RECIPIENTS = [
  'MSEDCL (Electricity Distributor)',
  'Pune Fire Brigade Emergency Dispatch',
  'PMC Disaster Management Cell',
  'Pune City Traffic Police Control Room',
];

export const AuthorityView: React.FC<AuthorityViewProps> = ({ reports }) => {
  const [auditLogs, setAuditLogs] = useState<AuthorityLogRow[]>([
    {
      id: 'auth-log-01',
      alert_id: 'seed-rep-sinhagad-02',
      confirmed_by: 'Operator Sharma (PMC Disaster Cell)',
      recipients: DEFAULT_RECIPIENTS,
      sent_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      message:
        'SEVERE FLOOD CONFIRMED near Sinhagad Road (18.4828, 73.8344). Severity: WAIST DEEP. 5 independent reports, latest 25 min ago. Possible electrical hazard: check poles and cables. Map: https://floodguard.pune.gov.in/map',
    },
  ]);

  const [confirmedReports, setConfirmedReports] = useState<Set<string>>(new Set(['seed-rep-sinhagad-02']));
  const [operatorName, setOperatorName] = useState('Operator Rao (Shift 1)');

  // Severe reports requiring authority action
  const severeReports = reports.filter((r) => r.status === 'severe');

  const handleConfirmAndDispatch = (report: ReportRow) => {
    const latLngStr = `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`;
    const mapLink = `https://floodguard.pune.gov.in/map?lat=${report.lat}&lng=${report.lng}`;
    
    // Message template (Section 6.11)
    const message = `SEVERE FLOOD CONFIRMED near ${report.depth.toUpperCase()} flooding (${latLngStr}). Severity: ${report.depth}. ${report.confirms} independent reports. Possible electrical hazard: check poles and feeder pillars near water. Map: ${mapLink}`;

    const newLog: AuthorityLogRow = {
      id: `auth-log-${Date.now()}`,
      alert_id: report.id,
      confirmed_by: operatorName,
      recipients: DEFAULT_RECIPIENTS,
      sent_at: new Date().toISOString(),
      message,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    setConfirmedReports((prev) => new Set(prev).add(report.id));
  };

  return (
    <div className="w-full max-w-md md:max-w-3xl mx-auto px-4 py-4 flex flex-col gap-4 pb-24">
      {/* 1. Authority Header Banner */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">local_police</span>
            </div>
            <h1 className="text-xs font-bold uppercase tracking-wider text-primary">
              PMC &amp; Emergency Authority Console
            </h1>
          </div>
          <DemoBadge label="SIMULATED DISPATCH" />
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Human-in-the-loop dispatch gate. Automated emergency dispatches are only routed to municipal services (MSEDCL electricity, Fire, Police) after a designated human operator confirms the verified severe flood.
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-surface-container-high text-xs">
          <span className="text-on-surface-variant">Logged in as:</span>
          <input
            type="text"
            value={operatorName}
            onChange={(e) => setOperatorName(e.target.value)}
            className="px-2 py-0.5 rounded bg-surface-container-low font-semibold text-xs border border-surface-container-high text-on-surface"
          />
        </div>
      </div>

      {/* 2. Severe Floods Pending Action */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span>
            <span className="font-bold text-xs uppercase tracking-wide text-on-surface">
              Verified Severe Incidents ({severeReports.length})
            </span>
          </div>
          <span className="text-[10px] text-error font-bold uppercase">Human Gate Active</span>
        </div>

        {severeReports.length > 0 ? (
          <div className="flex flex-col gap-3">
            {severeReports.map((report) => {
              const isDispatched = confirmedReports.has(report.id);
              return (
                <div
                  key={report.id}
                  className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-on-surface">
                        {report.depth.toUpperCase()} INUNDATION REPORTED
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        Coordinates: {report.lat.toFixed(4)}° N, {report.lng.toFixed(4)}° E • {report.confirms} Confirmed Votes
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isDispatched
                          ? 'bg-secondary text-on-secondary'
                          : 'bg-error text-on-error animate-pulse'
                      }`}
                    >
                      {isDispatched ? 'DISPATCHED' : 'AWAITING APPROVAL'}
                    </span>
                  </div>

                  <div className="text-[11px] text-amber-900 bg-amber-100/70 p-2 rounded-lg flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-amber-800">
                      electric_bolt
                    </span>
                    <span>Action rule: Notify MSEDCL to isolate local substation/feeder lines.</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-on-surface-variant">
                      Recipients: MSEDCL, Fire, Police, PMC
                    </span>
                    <button
                      disabled={isDispatched}
                      onClick={() => handleConfirmAndDispatch(report)}
                      className={`px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 ${
                        isDispatched
                          ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                          : 'bg-error text-on-error hover:bg-error/90 active:scale-95 shadow-sm'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>{isDispatched ? 'Dispatched' : 'Confirm & Dispatch Webhook'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-on-surface-variant p-4 text-center">
            No severe floods currently awaiting operator confirmation.
          </div>
        )}
      </div>

      {/* 3. Dispatch Audit Trail */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
          <span className="font-bold text-xs uppercase tracking-wide text-on-surface">
            Dispatch Audit Log
          </span>
          <span className="text-[10px] text-on-surface-variant">{auditLogs.length} Records</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high text-xs flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-on-surface">{log.confirmed_by}</span>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  {new Date(log.sent_at).toLocaleTimeString()}
                </span>
              </div>
              <div className="p-2 rounded bg-surface-container-lowest text-[11px] font-mono text-on-surface border border-surface-container-high leading-tight">
                {log.message}
              </div>
              <div className="flex flex-wrap gap-1 text-[9px] text-on-surface-variant">
                {log.recipients.map((r, i) => (
                  <span key={i} className="px-1.5 py-0.2 rounded bg-surface-container">
                    ✓ {r}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
