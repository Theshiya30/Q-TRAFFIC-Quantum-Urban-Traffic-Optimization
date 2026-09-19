/**
 * Q-TRAFFIC: Mission Control Intersection Inspection Drawer
 * Slide-in telemetry panel for deep-inspection of intersection queues, signal phases, and QUBO parameters.
 */

import React, { useState } from 'react';
import {
  X,
  Radio,
  Clock,
  Car,
  UserCheck,
  Zap,
  ArrowUpDown,
  ArrowLeftRight,
  ShieldAlert,
  Activity,
  Layers,
  RotateCw,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import { Intersection } from '../types';

interface IntersectionInspectionDrawerProps {
  intersection: Intersection | null;
  onClose: () => void;
  onForcePhase: (intersectionId: string, phase: 'PHASE_A' | 'PHASE_C') => void;
  onTriggerPedestrian: (intersectionId: string) => void;
  onViewQubo?: () => void;
}

export const IntersectionInspectionDrawer: React.FC<IntersectionInspectionDrawerProps> = ({
  intersection,
  onClose,
  onForcePhase,
  onTriggerPedestrian,
  onViewQubo,
}) => {
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'QUBO_VARS' | 'TIMELINE'>('TELEMETRY');
  const [reoptimizing, setReoptimizing] = useState(false);

  if (!intersection) return null;

  const { northSouthLane, eastWestLane, pedestrianCrossing } = intersection;
  const avgDensity = Math.round((northSouthLane.density + eastWestLane.density) / 2);
  const totalQueue = Math.round(northSouthLane.queueLength + eastWestLane.queueLength);
  const totalCapacity = northSouthLane.capacity + eastWestLane.capacity;
  const capacityPct = Math.round((totalQueue / totalCapacity) * 100);

  // Phase name & orientation
  const isNSGreen = intersection.currentPhase === 'PHASE_A';
  const isEWGreen = intersection.currentPhase === 'PHASE_C';
  const isEmergencyGreen = intersection.currentPhase === 'EMERGENCY_GREEN';

  // Improvement calculation
  const optImpactPct = Math.round(
    ((intersection.currentGreenDuration - intersection.optimizedGreenDuration) /
      Math.max(1, intersection.currentGreenDuration)) * 100
  );

  const handleSimulateReoptimize = () => {
    setReoptimizing(true);
    setTimeout(() => {
      setReoptimizing(false);
    }, 600);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#090e1a] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0c1322] border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800 font-mono font-bold text-sm">
            {intersection.id}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100 font-mono tracking-tight">{intersection.name}</h3>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Arterial Node Telemetry & Actuation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {intersection.isEmergencyCorridor ? (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-700 font-mono font-bold animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              PRIORITY
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/70 font-mono font-bold">
              ● OPTIMIZED
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-[#070b14] px-3 pt-1 gap-1 text-xs font-mono">
        <button
          onClick={() => setActiveTab('TELEMETRY')}
          className={`px-3 py-1.5 border-b-2 font-medium transition-colors ${
            activeTab === 'TELEMETRY'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          TELEMETRY
        </button>
        <button
          onClick={() => setActiveTab('QUBO_VARS')}
          className={`px-3 py-1.5 border-b-2 font-medium transition-colors ${
            activeTab === 'QUBO_VARS'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          QUBO ENCODING
        </button>
        <button
          onClick={() => setActiveTab('TIMELINE')}
          className={`px-3 py-1.5 border-b-2 font-medium transition-colors ${
            activeTab === 'TIMELINE'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          SIGNAL TIMELINE
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {activeTab === 'TELEMETRY' && (
          <>
            {/* 12 Core Audited Telemetry Attributes Matrix */}
            <div className="p-3 rounded-lg bg-[#0e1526] border border-slate-800 space-y-2 font-mono">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-cyan-400 font-bold uppercase tracking-wider">Node Operational Telemetry (12 Attributes)</span>
                <span className="text-[10px] text-slate-400">Live Municipal Feed</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 text-[9px] block uppercase">1. Intersection ID</span>
                  <span className="text-slate-200 font-bold">{intersection.id}</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 text-[9px] block uppercase">2. Traffic Density</span>
                  <span className={`font-bold ${avgDensity > 70 ? 'text-rose-400' : 'text-cyan-300'}`}>{avgDensity}%</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 text-[9px] block uppercase">3. Queue Length</span>
                  <span className="text-amber-300 font-bold">{totalQueue} veh</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 text-[9px] block uppercase">4. Road Capacity</span>
                  <span className="text-slate-200 font-bold">{totalCapacity} veh</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 text-[9px] block uppercase">5. Current Phase</span>
                  <span className="text-cyan-400 font-bold truncate block">{intersection.currentPhase}</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 text-[9px] block uppercase">6. Current Green</span>
                  <span className="text-slate-200 font-bold">{intersection.currentGreenDuration}s</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 text-[9px] block uppercase">7. Optimized Green</span>
                  <span className="text-emerald-400 font-bold">{intersection.optimizedGreenDuration}s</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 text-[9px] block uppercase">8. Pedestrian Demand</span>
                  <span className="text-indigo-300 font-bold">{pedestrianCrossing.waitingCount} wait ({Math.round(pedestrianCrossing.countdown)}s)</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 text-[9px] block uppercase">9. Avg Waiting Time</span>
                  <span className="text-cyan-300 font-bold">{Math.round((northSouthLane.waitingTime + eastWestLane.waitingTime) / 2)}s</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 text-[9px] block uppercase">10. Vehicles/Hour</span>
                  <span className="text-emerald-300 font-bold">{Math.round(480 + (avgDensity * 3.8) + (totalCapacity - totalQueue) * 4)} vph</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 text-[9px] block uppercase">11. Signal Status</span>
                  <span className="text-emerald-400 font-bold truncate block">
                    {isEmergencyGreen ? 'PREEMPTED' : isNSGreen ? 'NS ACTIVE' : isEWGreen ? 'EW ACTIVE' : 'TRANSITION'}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 text-[9px] block uppercase">12. Opt Status</span>
                  <span className="text-cyan-300 font-bold truncate block">
                    {intersection.isEmergencyCorridor ? 'CORRIDOR LOCKED' : 'QAOA CONVERGED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-[#0e1526] border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-500 uppercase">Traffic Density</span>
                <div className="text-sm font-extrabold text-white mt-0.5">{avgDensity}%</div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${avgDensity > 70 ? 'bg-rose-500' : avgDensity > 45 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                    style={{ width: `${avgDensity}%` }}
                  />
                </div>
              </div>

              <div className="p-2 rounded-lg bg-[#0e1526] border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-500 uppercase">Queue Load</span>
                <div className="text-sm font-extrabold text-white mt-0.5">{totalQueue} veh</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{capacityPct}% capacity</div>
              </div>

              <div className="p-2 rounded-lg bg-[#0e1526] border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-500 uppercase">Opt Impact</span>
                <div className="text-sm font-extrabold text-emerald-400 mt-0.5 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  -24%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">delay cleared</div>
              </div>
            </div>

            {/* Active Signal State Banner */}
            <div className="p-3 rounded-lg bg-[#0d1424] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 uppercase font-semibold">Current Active Phase</span>
                <span className="text-cyan-400 font-bold">
                  {Math.round(intersection.phaseTimeRemaining)}s remaining
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isEmergencyGreen ? 'bg-emerald-400 animate-ping' : isNSGreen || isEWGreen ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-sm font-bold text-white font-mono">
                    {isEmergencyGreen
                      ? 'EMERGENCY PREEMPTION WAVE'
                      : isNSGreen
                      ? 'PHASE A: NORTH / SOUTH GREEN'
                      : isEWGreen
                      ? 'PHASE C: EAST / WEST GREEN'
                      : 'YELLOW ALL-RED TRANSITION'}
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full transition-all duration-300"
                  style={{
                    width: `${Math.max(5, Math.min(100, (intersection.phaseTimeRemaining / intersection.currentGreenDuration) * 100))}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span>Green Duration: {intersection.currentGreenDuration}s</span>
                <span className="text-emerald-400 font-semibold">QAOA Optimized: {intersection.optimizedGreenDuration}s</span>
              </div>
            </div>

            {/* Approach Comparison NS vs EW */}
            <div className="space-y-2 font-mono">
              {/* North-South */}
              <div className="p-3 rounded-lg bg-[#0a0f1d] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span>North-South Approach</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${northSouthLane.density > 70 ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-300'}`}>
                    {northSouthLane.density}% Density
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">QUEUE</span>
                    <span className="font-bold">{Math.round(northSouthLane.queueLength)} / {northSouthLane.capacity}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">AVG WAIT</span>
                    <span className="font-bold text-cyan-300">{Math.round(northSouthLane.waitingTime)}s</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">APPROACH</span>
                    <span className="font-bold">{northSouthLane.approachingVehicles} veh</span>
                  </div>
                </div>
              </div>

              {/* East-West */}
              <div className="p-3 rounded-lg bg-[#0a0f1d] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
                    <span>East-West Approach</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${eastWestLane.density > 70 ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-300'}`}>
                    {eastWestLane.density}% Density
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">QUEUE</span>
                    <span className="font-bold">{Math.round(eastWestLane.queueLength)} / {eastWestLane.capacity}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">AVG WAIT</span>
                    <span className="font-bold text-blue-300">{Math.round(eastWestLane.waitingTime)}s</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">APPROACH</span>
                    <span className="font-bold">{eastWestLane.approachingVehicles} veh</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pedestrian Crossing Telemetry */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c1322] border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-slate-400">Pedestrian Crosswalk: </span>
                  <span className={pedestrianCrossing.active ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {pedestrianCrossing.active ? `WALK (${Math.round(pedestrianCrossing.countdown)}s)` : "DON'T WALK"}
                  </span>
                </div>
              </div>
              <span className="text-slate-400">
                Waiting: {pedestrianCrossing.waitingCount}
              </span>
            </div>
          </>
        )}

        {activeTab === 'QUBO_VARS' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-[#0e1526] border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-cyan-400 uppercase">Binary Decision Variables for {intersection.id}</span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Each intersection is allocated 2 binary qubits representing phase selection and green extension:
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-300">x_{intersection.id}_NS (North-South Phase):</span>
                  <span className="text-emerald-400 font-bold">1 (Active)</span>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-300">x_{intersection.id}_EW (East-West Phase):</span>
                  <span className="text-slate-400">0 (Inactive)</span>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-300">Qubit Linear Weight c_i:</span>
                  <span className="text-cyan-400 font-bold">-{(northSouthLane.queueLength * 1.5).toFixed(1)}</span>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-300">Corridor Coupling Q_ij:</span>
                  <span className="text-purple-400 font-bold">{intersection.isEmergencyCorridor ? '-25.0 (Preempted)' : '-8.4'}</span>
                </div>
              </div>
            </div>

            {onViewQubo && (
              <button
                onClick={onViewQubo}
                className="w-full py-2 rounded-lg bg-cyan-950/70 border border-cyan-800 text-cyan-300 hover:bg-cyan-900/60 font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Inspect Full 16x16 QUBO Matrix</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'TIMELINE' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-[#0e1526] border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-200">Coordinated 60-Second Cycle Progression</span>
              <div className="space-y-2 pt-2">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Phase A (NS Green): 0s - 34s</span>
                    <span className="text-emerald-400">34s green</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded overflow-hidden flex">
                    <div className="bg-emerald-500 h-full w-[56%]" />
                    <div className="bg-amber-400 h-full w-[6%]" />
                    <div className="bg-rose-500 h-full w-[38%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Phase C (EW Green): 38s - 56s</span>
                    <span className="text-blue-400">18s green</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded overflow-hidden flex">
                    <div className="bg-rose-500 h-full w-[56%]" />
                    <div className="bg-amber-400 h-full w-[6%]" />
                    <div className="bg-blue-500 h-full w-[38%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Manual Overrides */}
      <div className="p-3 bg-[#0c1322] border-t border-slate-800 shrink-0 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Manual Preemption Controls:</span>
          <button
            onClick={handleSimulateReoptimize}
            disabled={reoptimizing}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
          >
            <RotateCw className={`w-3 h-3 ${reoptimizing ? 'animate-spin' : ''}`} />
            <span>Re-optimize</span>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onForcePhase(intersection.id, 'PHASE_A')}
            className="py-1.5 px-2 rounded-lg text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors"
          >
            Force NS
          </button>
          <button
            onClick={() => onForcePhase(intersection.id, 'PHASE_C')}
            className="py-1.5 px-2 rounded-lg text-xs font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-800 hover:bg-blue-900 transition-colors"
          >
            Force EW
          </button>
          <button
            onClick={() => onTriggerPedestrian(intersection.id)}
            className="py-1.5 px-2 rounded-lg text-xs font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 transition-colors"
          >
            Walk Call
          </button>
        </div>
      </div>
    </div>
  );
};
