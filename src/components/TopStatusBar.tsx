/**
 * Q-TRAFFIC: Mission Control Top Status Strip
 * Compact telemetry bar providing at-a-glance operational status across the metropolitan grid.
 */

import React from 'react';
import { Radio, Cpu, Activity, AlertCircle, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import { EmergencyVehicle, SimulationConfig } from '../types';

interface TopStatusBarProps {
  networkCongestion: number;
  emergency: EmergencyVehicle | null;
  optimizationTimeMs: number;
  lastOptimizationTimeSec: number;
  config: SimulationConfig;
  activeEventsCount: number;
  totalVehicles: number;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  networkCongestion,
  emergency,
  optimizationTimeMs,
  lastOptimizationTimeSec,
  config,
  activeEventsCount,
  totalVehicles,
}) => {
  // Determine traffic severity label and style
  const getTrafficStatus = (congestion: number) => {
    if (congestion < 30) return { label: 'LOW FLOW', color: 'text-emerald-400', badge: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400' };
    if (congestion < 60) return { label: 'MODERATE', color: 'text-cyan-400', badge: 'bg-cyan-950/60 border-cyan-800/80 text-cyan-400' };
    if (congestion < 80) return { label: 'HIGH LOAD', color: 'text-amber-400', badge: 'bg-amber-950/60 border-amber-800/80 text-amber-400' };
    return { label: 'SEVERE CONGESTION', color: 'text-rose-400', badge: 'bg-rose-950/60 border-rose-800/80 text-rose-400 animate-pulse' };
  };

  const trafficStatus = getTrafficStatus(networkCongestion);
  const isEmergency = emergency && emergency.status === 'EN_ROUTE';

  return (
    <div className="w-full bg-[#080d19] border-y border-slate-800/80 px-4 py-1.5 flex items-center justify-between overflow-x-auto text-[11px] font-mono select-none scrollbar-none gap-4">
      {/* Left items: Core Grid Status */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-sans text-[10px] tracking-wider uppercase font-semibold">GRID</span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            OPERATIONAL
          </span>
        </div>

        <span className="text-slate-800">│</span>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-sans text-[10px] tracking-wider uppercase font-semibold">OPTIMIZER</span>
          <span className="flex items-center gap-1 text-cyan-300 font-bold">
            <Cpu className="w-3 h-3 text-cyan-400" />
            QAOA HYBRID (Qiskit Aer)
          </span>
        </div>

        <span className="text-slate-800">│</span>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-sans text-[10px] tracking-wider uppercase font-semibold">TRAFFIC STATE</span>
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${trafficStatus.badge}`}>
            {trafficStatus.label} ({networkCongestion}%)
          </span>
        </div>
      </div>

      {/* Center item: Live Emergency Indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-slate-500 font-sans text-[10px] tracking-wider uppercase font-semibold">EMERGENCY</span>
        {isEmergency ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded border bg-rose-950/80 border-rose-600 text-rose-300 font-bold animate-pulse">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            AMB-101 CORRIDOR ACTIVE (ETA: {Math.round(emergency.etaSeconds)}s)
          </span>
        ) : (
          <span className="text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            STANDBY
          </span>
        )}
      </div>

      {/* Right items: Telemetry numbers */}
      <div className="flex items-center gap-4 shrink-0 text-slate-400">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="text-slate-500">LAST QAOA:</span>
          <span className="text-slate-200 font-bold">{optimizationTimeMs.toFixed(1)}ms</span>
        </div>

        <span className="text-slate-800">│</span>

        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-slate-500" />
          <span className="text-slate-500">VEHICLES:</span>
          <span className="text-slate-200 font-bold">{totalVehicles}</span>
        </div>

        {activeEventsCount > 0 && (
          <>
            <span className="text-slate-800">│</span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <AlertCircle className="w-3 h-3" />
              {activeEventsCount} ACTIVE {activeEventsCount === 1 ? 'EVENT' : 'EVENTS'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
