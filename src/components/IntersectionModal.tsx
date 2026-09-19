/**
 * Q-TRAFFIC: Detailed Intersection Telemetry Modal / Drawer
 */

import React from 'react';
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
} from 'lucide-react';
import { Intersection } from '../types';

interface IntersectionModalProps {
  intersection: Intersection | null;
  onClose: () => void;
  onForcePhase: (intersectionId: string, phase: 'PHASE_A' | 'PHASE_C') => void;
  onTriggerPedestrian: (intersectionId: string) => void;
}

export const IntersectionModal: React.FC<IntersectionModalProps> = ({
  intersection,
  onClose,
  onForcePhase,
  onTriggerPedestrian,
}) => {
  if (!intersection) return null;

  const { northSouthLane, eastWestLane, pedestrianCrossing } = intersection;

  const getPhaseName = (phase: string) => {
    switch (phase) {
      case 'PHASE_A':
        return 'Phase A: North-South Green (East-West Red)';
      case 'PHASE_B':
        return 'Phase B: North-South Yellow Transition';
      case 'PHASE_C':
        return 'Phase C: East-West Green (North-South Red)';
      case 'PHASE_D':
        return 'Phase D: East-West Yellow Transition';
      case 'EMERGENCY_GREEN':
        return 'EMERGENCY GREEN CORRIDOR PREEMPTION';
      default:
        return phase;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id={`modal-${intersection.id}`}
        className="w-full max-w-2xl bg-[#0e1424] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/40">
              {intersection.id}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{intersection.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                Coordinated Signal Controller Node
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {intersection.isEmergencyCorridor && (
              <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 font-mono animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>CORRIDOR ACTIVE</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Phase Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-mono">ACTIVE SIGNAL STATE</span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {Math.round(intersection.phaseTimeRemaining)}s remaining
              </span>
            </div>
            <div className="text-sm font-bold text-white mb-2 font-mono">
              {getPhaseName(intersection.currentPhase)}
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full transition-all duration-300"
                style={{
                  width: `${Math.max(5, Math.min(100, (intersection.phaseTimeRemaining / intersection.currentGreenDuration) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Lane Telemetry: NS vs EW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* North-South Lane */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <ArrowUpDown className="w-4 h-4 text-cyan-400" />
                  <span>North-South Approach</span>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Density: {northSouthLane.density}%
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Queue Length:</span>
                  <span className="font-bold text-white">
                    {Math.round(northSouthLane.queueLength)} / {northSouthLane.capacity} veh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Wait:</span>
                  <span className="font-bold text-white">{Math.round(northSouthLane.waitingTime)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Approaching:</span>
                  <span className="font-bold text-white">{northSouthLane.approachingVehicles} veh</span>
                </div>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${northSouthLane.density > 75 ? 'bg-rose-500' : 'bg-cyan-500'}`}
                  style={{ width: `${Math.min(100, northSouthLane.density)}%` }}
                />
              </div>
            </div>

            {/* East-West Lane */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                  <span>East-West Approach</span>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Density: {eastWestLane.density}%
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Queue Length:</span>
                  <span className="font-bold text-white">
                    {Math.round(eastWestLane.queueLength)} / {eastWestLane.capacity} veh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Wait:</span>
                  <span className="font-bold text-white">{Math.round(eastWestLane.waitingTime)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Approaching:</span>
                  <span className="font-bold text-white">{eastWestLane.approachingVehicles} veh</span>
                </div>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${eastWestLane.density > 75 ? 'bg-rose-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, eastWestLane.density)}%` }}
                />
              </div>
            </div>
          </div>

          {/* QAOA Optimization Comparison Bar */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-slate-400">Current Green Duration: </span>
                <span className="font-bold text-white">{intersection.currentGreenDuration}s</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-400">QAOA Optimized Green: </span>
              <span className="font-bold text-emerald-400">{intersection.optimizedGreenDuration}s</span>
            </div>
          </div>

          {/* Pedestrian Crossing Telemetry */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="font-semibold text-slate-200">Pedestrian Crosswalk: </span>
                <span className={pedestrianCrossing.active ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {pedestrianCrossing.active ? `WALK (${Math.round(pedestrianCrossing.countdown)}s)` : "DON'T WALK"}
                </span>
              </div>
            </div>
            <span className="text-slate-400 font-mono">
              Waiting: {pedestrianCrossing.waitingCount} persons
            </span>
          </div>

          {/* Manual Control Overrides */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-400">Manual Signal Preemption:</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onForcePhase(intersection.id, 'PHASE_A')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
              >
                Force NS Green
              </button>
              <button
                onClick={() => onForcePhase(intersection.id, 'PHASE_C')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30"
              >
                Force EW Green
              </button>
              <button
                onClick={() => onTriggerPedestrian(intersection.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30"
              >
                Call Walk Phase
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
