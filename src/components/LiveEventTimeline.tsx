/**
 * Q-TRAFFIC: Live Event Timeline Bar
 * Real-time event log tracking traffic incidents, preemption activations, and quantum re-optimizations.
 */

import React from 'react';
import { AlertTriangle, Ambulance, Flame, Ban, Cpu, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { TrafficEvent, EmergencyVehicle } from '../types';

interface LiveEventTimelineProps {
  activeEvents: TrafficEvent[];
  emergency: EmergencyVehicle | null;
  lastOptimizationTimeMs: number;
  simulationTime: number;
}

export const LiveEventTimeline: React.FC<LiveEventTimelineProps> = ({
  activeEvents,
  emergency,
  lastOptimizationTimeMs,
  simulationTime,
}) => {
  // Format simulation second to HH:MM:SS
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Build combined live timeline items
  const timelineItems: Array<{
    id: string;
    time: string;
    type: 'AMBULANCE' | 'ACCIDENT' | 'SURGE' | 'CLOSURE' | 'QAOA' | 'NORMAL';
    title: string;
    detail: string;
  }> = [];

  if (emergency && emergency.status === 'EN_ROUTE') {
    timelineItems.push({
      id: 'evt-amb-corridor',
      time: formatTime(simulationTime),
      type: 'AMBULANCE',
      title: 'GREEN CORRIDOR ACTIVE',
      detail: `Ambulance AMB-101 en route (ETA ${Math.round(emergency.etaSeconds)}s)`,
    });
  }

  activeEvents.forEach((evt) => {
    timelineItems.push({
      id: evt.id,
      time: formatTime(simulationTime - 4),
      type: evt.type === 'ACCIDENT' ? 'ACCIDENT' : evt.type === 'SURGE' ? 'SURGE' : 'CLOSURE',
      title: evt.name.toUpperCase(),
      detail: evt.description || `Target: ${evt.targetId}`,
    });
  });

  // Always include latest QAOA optimization state
  timelineItems.push({
    id: 'evt-qaoa-sync',
    time: formatTime(Math.max(0, simulationTime - 8)),
    type: 'QAOA',
    title: 'QAOA ARTERIAL RE-OPTIMIZATION',
    detail: `Variational ground state solved in ${lastOptimizationTimeMs.toFixed(1)}ms (p=2 depth)`,
  });

  // Default steady state if empty
  if (timelineItems.length === 1) {
    timelineItems.push({
      id: 'evt-steady-state',
      time: formatTime(Math.max(0, simulationTime - 20)),
      type: 'NORMAL',
      title: 'NETWORK STEADY-STATE SYNC',
      detail: '8 intersection controllers locked in synchronized phase offset',
    });
  }

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'AMBULANCE':
        return { icon: Ambulance, color: 'text-rose-400 bg-rose-950/70 border-rose-800' };
      case 'ACCIDENT':
        return { icon: AlertTriangle, color: 'text-amber-400 bg-amber-950/70 border-amber-800' };
      case 'SURGE':
        return { icon: Flame, color: 'text-orange-400 bg-orange-950/70 border-orange-800' };
      case 'CLOSURE':
        return { icon: Ban, color: 'text-red-400 bg-red-950/70 border-red-800' };
      case 'QAOA':
        return { icon: Cpu, color: 'text-cyan-400 bg-cyan-950/70 border-cyan-800' };
      default:
        return { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-950/70 border-emerald-800' };
    }
  };

  return (
    <div className="w-full rounded-xl bg-[#090e1a] border border-slate-800/80 p-2.5">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-[11px] font-bold text-slate-300 uppercase font-mono tracking-wider">
            Operational Event Stream
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">LIVE TELEMETRY FEED</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {timelineItems.slice(0, 4).map((item) => {
          const { icon: Icon, color } = getBadgeStyle(item.type);
          return (
            <div
              key={item.id}
              className="flex items-center gap-2.5 bg-[#0e1526] border border-slate-800/90 hover:border-slate-700 px-3 py-1.5 rounded-lg shrink-0 text-xs transition-colors"
            >
              <div className={`p-1 rounded border ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">{item.time}</span>
                  <span className="text-[11px] font-bold text-slate-200 uppercase font-mono">
                    {item.title}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[280px]">
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
