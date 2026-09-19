/**
 * Q-TRAFFIC: Emergency Green Corridor Command Panel
 * Controls and visualizes dynamic emergency vehicle routing,
 * priority wave progression, and response time reductions.
 */

import React from 'react';
import { EmergencyVehicle, ComparisonMetrics } from '../types';
import {
  Ambulance,
  CheckCircle2,
  Clock,
  Navigation,
  ShieldAlert,
  Zap,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

interface EmergencyCorridorPanelProps {
  emergency: EmergencyVehicle | null;
  comparison?: ComparisonMetrics;
  onTriggerEmergency: (startId?: string, destId?: string) => void;
  onClearEmergency: () => void;
}

export const EmergencyCorridorPanel: React.FC<EmergencyCorridorPanelProps> = ({
  emergency,
  comparison,
  onTriggerEmergency,
  onClearEmergency,
}) => {
  const isEnRoute = emergency && emergency.status === 'EN_ROUTE';
  const isArrived = emergency && emergency.status === 'ARRIVED';

  const routeNodes = emergency ? emergency.routeIntersectionIds : ['I1', 'I2', 'I5', 'I8'];

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const fixedSecs = comparison?.classicalFixed?.emergencyTravelTimeSec ?? 385;
  const adaptiveSecs = comparison?.classicalAdaptive?.emergencyTravelTimeSec ?? 310;
  const hybridSecs = comparison?.hybridQuantum?.emergencyTravelTimeSec ?? 215;

  return (
    <div className="space-y-4">
      {/* Emergency Status Banner */}
      <div className="p-5 rounded-2xl bg-[#0e1424] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-2xl ${
              isEnRoute
                ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30'
                : isArrived
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Ambulance className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono">
                AMB-101 Emergency Green Corridor
              </h2>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                  isEnRoute
                    ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                    : isArrived
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {emergency ? emergency.status : 'STANDBY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous dynamic priority preemption connecting Metropolitan Trauma Network.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isEnRoute ? (
            <button
              onClick={() => onTriggerEmergency('I1', 'I8')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all"
            >
              <Ambulance className="w-4 h-4" />
              <span>Dispatch Ambulance (I1 → Hospital)</span>
            </button>
          ) : (
            <button
              onClick={onClearEmergency}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>De-escalate Corridor</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Telemetry & Route Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left: Live Vehicle Dashboard */}
        <div className="xl:col-span-5 p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-4">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Vehicle Telemetry & Target
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-400">Unit Type</span>
              <div className="text-sm font-bold text-white">Tier-1 Trauma Ambulance</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-400">Priority Level</span>
              <div className="text-sm font-bold text-rose-400">CRITICAL (Preempt All)</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-400">Current Position</span>
              <div className="text-sm font-bold text-cyan-400">
                {emergency ? `${emergency.currentLocationId} Approach` : 'Depot 1 (I1)'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-400">Destination</span>
              <div className="text-sm font-bold text-emerald-400">City Hospital ER</div>
            </div>
          </div>

          {/* ETA Live Comparison */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Green Corridor Live ETA:</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {isEnRoute
                  ? `${formatSecs(emergency.etaSeconds)} remaining`
                  : isArrived
                  ? `00:00 (ARRIVED - Transit: ${formatSecs(hybridSecs)})`
                  : `${formatSecs(hybridSecs)} (Planned Wave)`}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Classical Fixed Signals ETA:</span>
                <span className="text-rose-400 font-bold">
                  {formatSecs(fixedSecs)} (+{formatSecs(Math.max(0, fixedSecs - hybridSecs))} delay)
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Rule-Based Actuated ETA:</span>
                <span className="text-amber-400 font-bold">
                  {formatSecs(adaptiveSecs)} (+{formatSecs(Math.max(0, adaptiveSecs - hybridSecs))} delay)
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Hybrid QAOA Green Wave:</span>
                <span className="text-emerald-400 font-bold">
                  {formatSecs(hybridSecs)} (Optimal Wave)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Route Timeline & Clearance Wave */}
        <div className="xl:col-span-7 p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Green Corridor Progression Timeline
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {emergency
                ? `Cleared ${emergency.intersectionsCleared} of ${emergency.totalIntersections} Intersections`
                : '4 Intersections Scheduled'}
            </span>
          </div>

          {/* Stepper / Timeline */}
          <div className="flex items-center justify-between py-6 px-2 overflow-x-auto">
            {routeNodes.map((nodeId, idx) => {
              const isCleared = emergency ? idx < emergency.intersectionsCleared : false;
              const isCurrent = emergency ? idx === emergency.currentRouteIndex && isEnRoute : false;

              return (
                <React.Fragment key={nodeId}>
                  <div className="flex flex-col items-center gap-2 min-w-[70px]">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono font-bold text-xs transition-all ${
                        isCleared
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                          : isCurrent
                          ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isCleared ? <CheckCircle2 className="w-5 h-5" /> : nodeId}
                    </div>

                    <div className="text-center">
                      <div className="text-[11px] font-mono font-bold text-white">{nodeId}</div>
                      <div className="text-[9px] font-mono text-slate-500">
                        {isCleared ? 'CLEARED' : isCurrent ? 'PREEMPTING' : 'RESERVED'}
                      </div>
                    </div>
                  </div>

                  {idx < routeNodes.length - 1 && (
                    <div className="flex-1 h-1 bg-slate-800 mx-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          idx < (emergency?.intersectionsCleared || 0)
                            ? 'bg-emerald-500'
                            : 'bg-slate-800'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Final Destination Hospital */}
            <div className="flex flex-col items-center gap-2 min-w-[80px] ml-2">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono font-bold text-xs ${
                  isArrived
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40'
                    : 'bg-teal-950 text-teal-300 border border-teal-800'
                }`}
              >
                ER
              </div>
              <div className="text-center">
                <div className="text-[11px] font-mono font-bold text-teal-300">HOSPITAL</div>
                <div className="text-[9px] font-mono text-slate-500">DESTINATION</div>
              </div>
            </div>
          </div>

          {/* Explainability note */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              The QUBO Hamiltonian dynamically applies a heavy negative cost coefficient (-12.0) to green phases along the emergency path,
              while cross-streets receive orderly yellow transitions. This creates a friction-free arterial green wave that clears queued cars before the ambulance arrives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
