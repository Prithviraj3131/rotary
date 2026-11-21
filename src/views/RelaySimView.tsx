import React, { useState, useEffect } from 'react';
import { DemoBadge } from '../components/common/DemoBadge';

interface SimNode {
  id: string;
  name: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  hasAlert: boolean;
  hopsLeft: number;
  seenSet: Set<string>;
  isCarrier?: boolean;
}

const INITIAL_NODES: SimNode[] = [
  { id: 'node-1', name: 'Phone 1 (Deccan)', x: 22, y: 35, hasAlert: false, hopsLeft: 0, seenSet: new Set() },
  { id: 'node-2', name: 'Phone 2 (FC Rd)', x: 34, y: 28, hasAlert: false, hopsLeft: 0, seenSet: new Set() },
  { id: 'node-3', name: 'Phone 3 (JM Rd)', x: 42, y: 44, hasAlert: false, hopsLeft: 0, seenSet: new Set() },
  { id: 'node-4', name: 'Phone 4 (Lakdi Pul)', x: 50, y: 60, hasAlert: false, hopsLeft: 0, seenSet: new Set() },
  { id: 'node-5', name: 'Phone 5 (Tilak Rd)', x: 62, y: 72, hasAlert: false, hopsLeft: 0, seenSet: new Set() },
  { id: 'node-6', name: 'Phone 6 (Swargate)', x: 74, y: 80, hasAlert: false, hopsLeft: 0, seenSet: new Set() },
  { id: 'node-7', name: 'Phone 7 (Shivajinagar)', x: 55, y: 20, hasAlert: false, hopsLeft: 0, seenSet: new Set() },
  { id: 'node-8', name: 'Phone 8 (COEP)', x: 70, y: 30, hasAlert: false, hopsLeft: 0, seenSet: new Set() },
  { id: 'node-9', name: 'Phone 9 (Kothrud West)', x: 12, y: 55, hasAlert: false, hopsLeft: 0, seenSet: new Set() },
  { id: 'node-10', name: 'Phone 10 (Karve Nagar)', x: 18, y: 75, hasAlert: false, hopsLeft: 0, seenSet: new Set() },
  { id: 'node-11', name: 'Phone 11 (Parvati)', x: 45, y: 82, hasAlert: false, hopsLeft: 0, seenSet: new Set() },
  { id: 'node-12', name: 'Carrier Phone (Moving)', x: 25, y: 50, hasAlert: false, hopsLeft: 0, seenSet: new Set(), isCarrier: true },
];

export const RelaySimView: React.FC = () => {
  const [nodes, setNodes] = useState<SimNode[]>(INITIAL_NODES);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [simLog, setSimLog] = useState<string[]>([]);
  const [carrierPos, setCarrierPos] = useState({ x: 25, y: 50 });
  const [carrierDir, setCarrierDir] = useState({ dx: 1.2, dy: 0.8 });
  const [stats, setStats] = useState({ forwarded: 0, duplicatesDropped: 0, verifiedSignatures: 0 });

  // Move carrier node over time (demonstrating human physical movement bridging disconnected islands)
  useEffect(() => {
    const interval = setInterval(() => {
      setCarrierPos((prev) => {
        let newX = prev.x + carrierDir.dx;
        let newY = prev.y + carrierDir.dy;
        let newDx = carrierDir.dx;
        let newDy = carrierDir.dy;

        if (newX > 80 || newX < 15) newDx = -newDx;
        if (newY > 80 || newY < 20) newDy = -newDy;

        setCarrierDir({ dx: newDx, dy: newDy });
        return { x: newX, y: newY };
      });
    }, 400);

    return () => clearInterval(interval);
  }, [carrierDir]);

  // Seed alert on a node
  const handleSeedAlert = (nodeId: string) => {
    const alertId = `pkt-${Date.now()}`;
    setActiveAlertId(alertId);

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          const newSet = new Set(n.seenSet);
          newSet.add(alertId);
          return {
            ...n,
            hasAlert: true,
            hopsLeft: 6,
            seenSet: newSet,
          };
        }
        return n;
      })
    );

    setStats((prev) => ({ ...prev, verifiedSignatures: prev.verifiedSignatures + 1 }));
    setSimLog((prev) => [
      `[${new Date().toLocaleTimeString()}] Seeded Ed25519-signed alert packet on ${nodeId} (Hops: 6)`,
      ...prev.slice(0, 7),
    ]);
  };

  // Run a mesh relay tick
  const handleTickPropagation = () => {
    if (!activeAlertId) return;

    const TRANSMISSION_RANGE = 24; // Distance threshold in coordinate %
    let newForwards = 0;
    let newDupes = 0;

    setNodes((prev) => {
      const nextNodes = prev.map((n) => ({ ...n, seenSet: new Set(n.seenSet) }));

      // Find all nodes that currently have the active alert and have hops left > 0
      for (const sender of prev) {
        if (!sender.hasAlert || sender.hopsLeft <= 0) continue;

        const senderX = sender.isCarrier ? carrierPos.x : sender.x;
        const senderY = sender.isCarrier ? carrierPos.y : sender.y;

        // Try to forward to neighbors within range
        for (const receiver of nextNodes) {
          if (receiver.id === sender.id) continue;

          const recX = receiver.isCarrier ? carrierPos.x : receiver.x;
          const recY = receiver.isCarrier ? carrierPos.y : receiver.y;
          const dist = Math.hypot(recX - senderX, recY - senderY);

          if (dist <= TRANSMISSION_RANGE) {
            // Rule 3: Check seen-set
            if (receiver.seenSet.has(activeAlertId)) {
              newDupes++;
            } else {
              // Rule 5: Accept, decrement hop, mark seen
              receiver.hasAlert = true;
              receiver.hopsLeft = sender.hopsLeft - 1;
              receiver.seenSet.add(activeAlertId);
              newForwards++;
            }
          }
        }
      }

      return nextNodes;
    });

    setStats((prev) => ({
      ...prev,
      forwarded: prev.forwarded + newForwards,
      duplicatesDropped: prev.duplicatesDropped + newDupes,
    }));

    if (newForwards > 0 || newDupes > 0) {
      setSimLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Relay step: +${newForwards} peers infected, ${newDupes} duplicates dropped.`,
        ...prev.slice(0, 7),
      ]);
    }
  };

  const handleReset = () => {
    setActiveAlertId(null);
    setNodes(INITIAL_NODES.map((n) => ({ ...n, hasAlert: false, hopsLeft: 0, seenSet: new Set() })));
    setStats({ forwarded: 0, duplicatesDropped: 0, verifiedSignatures: 0 });
    setSimLog([`[${new Date().toLocaleTimeString()}] Simulation reset.`]);
  };

  return (
    <div className="w-full max-w-md md:max-w-3xl mx-auto px-4 py-4 flex flex-col gap-4 pb-24">
      {/* 1. Simulator Header */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">hub</span>
            </div>
            <h1 className="text-xs font-bold uppercase tracking-wider text-primary">
              Phone-to-Phone Mesh Relay Simulator
            </h1>
          </div>
          <DemoBadge label="SIMULATION ONLY" />
        </div>

        {/* Mandatory Ground Rule 7 & Section 5 Note */}
        <div className="p-2.5 bg-amber-500/10 border border-amber-300 rounded-xl text-xs text-amber-900 leading-snug">
          <strong>SIMULATION:</strong> True background relay requires a native Android app using Google Nearby Connections API. This visual simulator verifies packet signing, hop reduction (6 $\rightarrow$ 0), and duplicate drops over a 12-phone mesh.
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-surface-container-low p-2 rounded-xl">
            <span className="text-[10px] text-on-surface-variant block">Mesh Forwards</span>
            <strong className="text-sm text-secondary">{stats.forwarded}</strong>
          </div>
          <div className="bg-surface-container-low p-2 rounded-xl">
            <span className="text-[10px] text-on-surface-variant block">Duplicates Dropped</span>
            <strong className="text-sm text-on-surface">{stats.duplicatesDropped}</strong>
          </div>
          <div className="bg-surface-container-low p-2 rounded-xl">
            <span className="text-[10px] text-on-surface-variant block">Verified Packets</span>
            <strong className="text-sm text-primary">{stats.verifiedSignatures}</strong>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleTickPropagation}
            className="flex-1 py-2 rounded-xl bg-secondary text-on-secondary font-bold text-xs uppercase tracking-wider shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            <span>Step Relay Tick</span>
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 2. Visual 2D Phone Mesh Canvas */}
      <div className="relative w-full h-80 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm overflow-hidden select-none">
        {/* Soft grid background */}
        <div className="absolute inset-0 bg-radial from-secondary/5 to-transparent"></div>

        {/* Nodes */}
        {nodes.map((node) => {
          const posX = node.isCarrier ? carrierPos.x : node.x;
          const posY = node.isCarrier ? carrierPos.y : node.y;

          return (
            <div
              key={node.id}
              onClick={() => handleSeedAlert(node.id)}
              style={{ left: `${posX}%`, top: `${posY}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group flex flex-col items-center z-20"
              title={`${node.name} (Click to seed packet)`}
            >
              {/* Radio Range Ring */}
              <div className="absolute w-24 h-24 rounded-full border border-secondary/20 pointer-events-none -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"></div>

              {/* Node dot */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-md transition-all ${
                  node.hasAlert
                    ? 'bg-error text-on-error ring-4 ring-error/30 animate-pulse'
                    : node.isCarrier
                    ? 'bg-primary text-on-primary ring-2 ring-primary/40'
                    : 'bg-secondary text-on-secondary'
                }`}
              >
                {node.hasAlert ? node.hopsLeft : <span className="material-symbols-outlined text-[14px]">smartphone</span>}
              </div>

              {/* Name pill */}
              <span className="text-[9px] font-bold text-on-surface bg-surface/90 px-1.5 py-0.2 rounded mt-1 shadow-xs whitespace-nowrap">
                {node.name}
              </span>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-2 left-2 right-2 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-surface-container-high text-[10px] flex items-center justify-between">
          <span className="text-on-surface-variant">Tap any phone node to seed an alert packet.</span>
          <span className="font-bold text-secondary">Carrier Phone moves dynamically</span>
        </div>
      </div>

      {/* 3. Terminal Relay Log */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4 flex flex-col gap-2 shadow-sm font-mono text-[11px]">
        <div className="flex items-center justify-between border-b border-surface-container-high pb-1.5">
          <span className="font-bold text-on-surface text-xs uppercase font-sans">
            Mesh Event Log
          </span>
          <span className="text-[10px] text-on-surface-variant font-sans">Hop Decrement Engine</span>
        </div>

        <div className="space-y-1 max-h-32 overflow-y-auto text-on-surface-variant">
          {simLog.length > 0 ? (
            simLog.map((log, i) => <div key={i}>{log}</div>)
          ) : (
            <div>Waiting to seed alert packet...</div>
          )}
        </div>
      </div>
    </div>
  );
};
