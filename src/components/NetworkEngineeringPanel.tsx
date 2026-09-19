/**
 * Q-TRAFFIC: Network Engineering & Arterial Corridor Workbench
 * 
 * Deep microscopic traffic engineering dashboard displaying:
 * - All 12 Road Link Segments (v/c saturation ratio, velocity, bottleneck alerts)
 * - Complete 8-Intersection Signal Controller Matrix (NS vs EW green split, Webster vs QAOA)
 * - Microscopic link-level incident actuation (closures, clearance)
 */

import React, { useState } from 'react';
import {
  Intersection,
  RoadSegment,
  Vehicle,
  EmergencyVehicle,
  TrafficEvent,
  SignalPhaseType,
} from '../types';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Gauge,
  Layers,
  Radio,
  Sliders,
  UserCheck,
  Zap,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

interface NetworkEngineeringPanelProps {
  intersections: Intersection[];
  roads: RoadSegment[];
  vehicles: Vehicle[];
  emergency: EmergencyVehicle | null;
  selectedIntersectionId: string | null;
  onSelectIntersection: (id: string) => void;
  onToggleRoadClosure: (roadId: string) => void;
  onForcePhase: (intersectionId: string, phase: 'PHASE_A' | 'PHASE_C') => void;
  onTriggerPedestrian: (intersectionId: string) => void;
}

export const NetworkEngineeringPanel: React.FC<NetworkEngineeringPanelProps> = ({
  intersections,
  roads,
  vehicles,
  emergency,
  selectedIntersectionId,
  onSelectIntersection,
  onToggleRoadClosure,
  onForcePhase,
  onTriggerPedestrian,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'LINKS' | 'CONTROLLERS'>('LINKS');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'BOTTLENECK' | 'INCIDENT'>('ALL');

  // Network link statistics
  const congestedRoads = roads.filter(r => r.congestionLevel > 70 || r.status === 'ACCIDENT');
  const closedRoads = roads.filter(r => r.status === 'CLOSED');
  const avgVelocity = Math.round(
    roads.reduce((acc, r) => acc + (r.status === 'CLOSED' ? 0 : r.currentSpeedKmh), 0) /
      Math.max(1, roads.filter(r => r.status !== 'CLOSED').length)
  );
  const saturatedLinksCount = roads.filter(r => (r.currentVehicles / r.capacity) > 0.75).length;

  const filteredRoads = roads.filter(r => {
    if (filterStatus === 'BOTTLENECK') return (r.currentVehicles / r.capacity) > 0.7 || r.congestionLevel > 70;
    if (filterStatus === 'INCIDENT') return r.status === 'ACCIDENT' || r.status === 'CLOSED';
    return true;
  });

  return (
    <div className="space-y-3 font-sans">
      {/* Network Engineering Header & KPI Strip */}
      <div className="p-3.5 rounded-2xl bg-[#0a0f1d] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
              <span>Arterial Infrastructure & Controller Diagnostics</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-normal">
                12 Road Segments · 8 Signal Controllers
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Microscopic volume-to-capacity (v/c) ratios, Webster signal splits, and actuator overrides.
            </p>
          </div>
        </div>

        {/* Diagnostic Metrics Pills */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">AVG NETWORK VELOCITY</span>
            <span className="text-cyan-300 font-bold">{avgVelocity} km/h</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">SATURATED LINKS (v/c &gt; 0.75)</span>
            <span className={`font-bold ${saturatedLinksCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {saturatedLinksCount} / 12
            </span>
          </div>
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">ACTIVE CLOSURES</span>
            <span className={`font-bold ${closedRoads.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {closedRoads.length}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('LINKS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              activeSubTab === 'LINKS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            Road Segments & Arterial Links (R1–R12)
          </button>
          <button
            onClick={() => setActiveSubTab('CONTROLLERS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              activeSubTab === 'CONTROLLERS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            Signal Controllers & Timing Schedules (I1–I8)
          </button>
        </div>

        {activeSubTab === 'LINKS' && (
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <span className="text-slate-500 mr-1">Filter:</span>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2 py-0.5 rounded ${filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
            >
              All (12)
            </button>
            <button
              onClick={() => setFilterStatus('BOTTLENECK')}
              className={`px-2 py-0.5 rounded ${filterStatus === 'BOTTLENECK' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-slate-300'}`}
            >
              Bottlenecks ({congestedRoads.length})
            </button>
            <button
              onClick={() => setFilterStatus('INCIDENT')}
              className={`px-2 py-0.5 rounded ${filterStatus === 'INCIDENT' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-slate-300'}`}
            >
              Incidents ({congestedRoads.filter(r => r.status === 'ACCIDENT').length + closedRoads.length})
            </button>
          </div>
        )}
      </div>

      {/* Sub-tab 1: Road Segments Link Table */}
      {activeSubTab === 'LINKS' && (
        <div className="rounded-2xl bg-[#090e1a] border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0c1322] border-b border-slate-800 text-[11px] text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Segment</th>
                  <th className="py-2.5 px-3">Endpoints</th>
                  <th className="py-2.5 px-3">Length</th>
                  <th className="py-2.5 px-3">Velocity</th>
                  <th className="py-2.5 px-3">Volume / Cap (v/c)</th>
                  <th className="py-2.5 px-3">Congestion</th>
                  <th className="py-2.5 px-3">Physical Status</th>
                  <th className="py-2.5 px-3 text-right">Engineering Actuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRoads.map((road) => {
                  const vcRatio = parseFloat((road.currentVehicles / road.capacity).toFixed(2));
                  const isEmergencyRoute = road.isEmergencyRoute;

                  return (
                    <tr
                      key={road.id}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        road.status === 'CLOSED'
                          ? 'bg-rose-950/10'
                          : road.status === 'ACCIDENT'
                          ? 'bg-amber-950/10'
                          : isEmergencyRoute
                          ? 'bg-emerald-950/15'
                          : ''
                      }`}
                    >
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{road.id}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{road.name}</span>
                        </div>
                      </td>

                      <td className="py-2 px-3 text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {road.fromIntersectionId}
                        </span>
                        <span className="text-slate-600 mx-1">↔</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {road.toIntersectionId}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-slate-400">
                        {road.lengthMeters}m ({road.lanes} lanes)
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              road.status === 'CLOSED'
                                ? 'text-slate-600'
                                : road.currentSpeedKmh < 25
                                ? 'text-rose-400'
                                : road.currentSpeedKmh < 40
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {road.status === 'CLOSED' ? '0' : road.currentSpeedKmh}
                          </span>
                          <span className="text-[10px] text-slate-500">/ {road.speedLimitKmh} km/h</span>
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <div className="space-y-1 min-w-[110px]">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">
                              {road.currentVehicles} / {road.capacity}
                            </span>
                            <span
                              className={`font-bold ${
                                vcRatio > 0.85 ? 'text-rose-400' : vcRatio > 0.65 ? 'text-amber-400' : 'text-cyan-300'
                              }`}
                            >
                              v/c {vcRatio}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                vcRatio > 0.85 ? 'bg-rose-500' : vcRatio > 0.65 ? 'bg-amber-500' : 'bg-cyan-500'
                              }`}
                              style={{ width: `${Math.min(100, vcRatio * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            road.congestionLevel > 75
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : road.congestionLevel > 50
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-900 text-slate-300'
                          }`}
                        >
                          {road.congestionLevel}%
                        </span>
                      </td>

                      <td className="py-2 px-3">
                        {road.status === 'CLOSED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 font-bold">
                            CLOSED (LOCKED)
                          </span>
                        ) : road.status === 'ACCIDENT' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-bold animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> ACCIDENT
                          </span>
                        ) : isEmergencyRoute ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-bold">
                            <ShieldAlert className="w-3 h-3" /> WAVE CORRIDOR
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">OPERATIONAL</span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => onToggleRoadClosure(road.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            road.status === 'CLOSED'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {road.status === 'CLOSED' ? 'Reopen Road' : 'Simulate Closure'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Signal Controllers Schedule Matrix */}
      {activeSubTab === 'CONTROLLERS' && (
        <div className="rounded-2xl bg-[#090e1a] border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0c1322] border-b border-slate-800 text-[11px] text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Node</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Current Active Phase</th>
                  <th className="py-2.5 px-3">Cycle Remaining</th>
                  <th className="py-2.5 px-3">Classical Webster Split</th>
                  <th className="py-2.5 px-3">QAOA Optimized Split</th>
                  <th className="py-2.5 px-3">Pedestrian Demand</th>
                  <th className="py-2.5 px-3 text-right">Manual Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {intersections.map((inter) => {
                  const isSelected = selectedIntersectionId === inter.id;
                  const isEmergency = inter.isEmergencyCorridor;
                  const isNS = inter.currentPhase === 'PHASE_A';
                  const isEW = inter.currentPhase === 'PHASE_C';

                  return (
                    <tr
                      key={inter.id}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/20 border-l-2 border-l-cyan-400'
                          : isEmergency
                          ? 'bg-emerald-950/15'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => onSelectIntersection(inter.id)}
                          className="flex items-center gap-2 group text-left"
                        >
                          <div className="w-6 h-6 rounded bg-slate-800 group-hover:bg-cyan-950 border border-slate-700 group-hover:border-cyan-700 flex items-center justify-center font-bold text-slate-200 group-hover:text-cyan-300">
                            {inter.id}
                          </div>
                          <span className="font-bold text-white group-hover:text-cyan-300">{inter.name}</span>
                        </button>
                      </td>

                      <td className="py-2.5 px-3 text-slate-400">
                        {inter.district}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isEmergency
                                ? 'bg-emerald-400 animate-ping'
                                : isNS || isEW
                                ? 'bg-emerald-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          <span
                            className={`font-bold ${
                              isEmergency
                                ? 'text-emerald-400 font-extrabold'
                                : isNS
                                ? 'text-cyan-300'
                                : isEW
                                ? 'text-blue-300'
                                : 'text-amber-300'
                            }`}
                          >
                            {isEmergency ? 'EMERGENCY GREEN' : isNS ? 'PHASE A (NS)' : isEW ? 'PHASE C (EW)' : 'TRANSITION'}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-slate-300 font-bold">
                        {Math.round(inter.phaseTimeRemaining)}s / {inter.currentGreenDuration}s
                      </td>

                      <td className="py-2.5 px-3 text-slate-400">
                        <span>NS: 30s</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span>EW: 26s</span>
                        <span className="text-[10px] text-slate-500 block">Cycle: 60s (Fixed)</span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">
                            {inter.optimizedGreenDuration}s
                          </span>
                          <span className="text-[10px] text-emerald-500/80 px-1 py-0.2 rounded bg-emerald-950/40 border border-emerald-900">
                            QAOA
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => onTriggerPedestrian(inter.id)}
                          className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-indigo-300"
                        >
                          <UserCheck className="w-3 h-3 text-indigo-400" />
                          <span>
                            {inter.pedestrianCrossing.waitingCount} waiting
                            {inter.pedestrianCrossing.active ? ` (${Math.round(inter.pedestrianCrossing.countdown)}s)` : ''}
                          </span>
                        </button>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onForcePhase(inter.id, 'PHASE_A')}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-[10px] text-slate-300 transition-colors"
                            title="Force North-South Phase A"
                          >
                            NS Green
                          </button>
                          <button
                            onClick={() => onForcePhase(inter.id, 'PHASE_C')}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-950 hover:text-blue-300 text-[10px] text-slate-300 transition-colors"
                            title="Force East-West Phase C"
                          >
                            EW Green
                          </button>
                          <button
                            onClick={() => onSelectIntersection(inter.id)}
                            className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px] font-bold hover:bg-cyan-900 transition-colors"
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
