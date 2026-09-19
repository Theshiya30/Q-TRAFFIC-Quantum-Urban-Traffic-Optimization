/**
 * Q-TRAFFIC: Mission Control High-Density KPI Dashboard
 * Compact, aerospace-grade metric cards with micro-sparklines and contextual deltas.
 */

import React from 'react';
import {
  Clock,
  Car,
  TrendingUp,
  Leaf,
  Fuel,
  Ambulance,
  Zap,
  Gauge,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { ComparisonMetrics, EnvironmentalMetrics, EmergencyVehicle } from '../types';

interface KPIGridProps {
  metrics: ComparisonMetrics;
  environmental: EnvironmentalMetrics;
  emergency: EmergencyVehicle | null;
  networkCongestion: number;
}

export const KPIGrid: React.FC<KPIGridProps> = ({
  metrics,
  environmental,
  emergency,
  networkCongestion,
}) => {
  const { hybridQuantum, classicalAdaptive } = metrics;

  // Congestion status
  const getCongestionCategory = (pct: number) => {
    if (pct < 30) return { label: 'LOW', color: 'text-emerald-400' };
    if (pct < 60) return { label: 'MODERATE', color: 'text-cyan-400' };
    if (pct < 80) return { label: 'HIGH', color: 'text-amber-400' };
    return { label: 'SEVERE', color: 'text-rose-400' };
  };

  const congestionBadge = getCongestionCategory(networkCongestion);

  const kpiItems = [
    {
      id: 'kpi-wait-time',
      label: 'AVERAGE WAIT',
      value: hybridQuantum.avgWaitingTimeSec.toFixed(1),
      unit: 'sec',
      trend: `${Math.round(((hybridQuantum.avgWaitingTimeSec - classicalAdaptive.avgWaitingTimeSec) / classicalAdaptive.avgWaitingTimeSec) * 100)}%`,
      trendGood: true,
      context: 'vs classical adaptive',
      icon: Clock,
      sparkline: 'M0,14 Q8,10 16,12 T32,8 T48,6 T64,4',
      color: '#06b6d4',
    },
    {
      id: 'kpi-queue-length',
      label: 'AVG / MAX QUEUE',
      value: `${hybridQuantum.avgQueueLength} / ${hybridQuantum.maxQueueLength}`,
      unit: 'veh',
      trend: `${Math.round(((hybridQuantum.avgQueueLength - classicalAdaptive.avgQueueLength) / Math.max(1, classicalAdaptive.avgQueueLength)) * 100)}%`,
      trendGood: true,
      context: 'per approach lane',
      icon: Car,
      sparkline: 'M0,15 Q12,14 24,11 T48,8 T64,5',
      color: '#38bdf8',
    },
    {
      id: 'kpi-throughput',
      label: 'THROUGHPUT',
      value: `${hybridQuantum.throughputVehPerHour}`,
      unit: 'veh/h',
      trend: `+${Math.round(((hybridQuantum.throughputVehPerHour - classicalAdaptive.throughputVehPerHour) / classicalAdaptive.throughputVehPerHour) * 100)}%`,
      trendGood: true,
      context: 'cleared stop-lines',
      icon: TrendingUp,
      sparkline: 'M0,12 Q12,11 24,8 T48,5 T64,3',
      color: '#10b981',
    },
    {
      id: 'kpi-co2-avoided',
      label: 'CO₂ AVOIDED',
      value: `${environmental.totalCo2AvoidedKg}`,
      unit: 'kg',
      trend: `${Math.round(((hybridQuantum.co2EmissionsKgPerHour - classicalAdaptive.co2EmissionsKgPerHour) / Math.max(1, classicalAdaptive.co2EmissionsKgPerHour)) * 100)}%`,
      trendGood: true,
      context: 'sim. factor 2.31 kg/L',
      icon: Leaf,
      sparkline: 'M0,16 Q12,13 24,9 T48,6 T64,3',
      color: '#10b981',
    },
    {
      id: 'kpi-fuel-saved',
      label: 'FUEL SAVED',
      value: `${environmental.totalFuelSavedLiters}`,
      unit: 'L',
      trend: `${Math.round(((hybridQuantum.fuelConsumptionLitersPerHour - classicalAdaptive.fuelConsumptionLitersPerHour) / Math.max(1, classicalAdaptive.fuelConsumptionLitersPerHour)) * 100)}%`,
      trendGood: true,
      context: 'idle & kinetic model',
      icon: Fuel,
      sparkline: 'M0,15 Q14,13 28,9 T48,6 T64,4',
      color: '#f59e0b',
    },
    {
      id: 'kpi-emergency-eta',
      label: 'AMBULANCE ETA',
      value: emergency && emergency.status === 'EN_ROUTE'
        ? `${Math.floor(emergency.etaSeconds / 60)}:${String(Math.round(emergency.etaSeconds % 60)).padStart(2, '0')}`
        : emergency && emergency.status === 'ARRIVED'
        ? '00:00'
        : `${Math.floor(hybridQuantum.emergencyTravelTimeSec / 60)}:${String(Math.round(hybridQuantum.emergencyTravelTimeSec % 60)).padStart(2, '0')}`,
      unit: emergency?.status === 'EN_ROUTE' ? 'en route' : 'standby',
      trend: emergency && emergency.status === 'EN_ROUTE'
        ? `${Math.round(((hybridQuantum.emergencyTravelTimeSec - classicalAdaptive.emergencyTravelTimeSec) / classicalAdaptive.emergencyTravelTimeSec) * 100)}%`
        : '-31%',
      trendGood: true,
      context: emergency?.status === 'EN_ROUTE' ? `Node ${emergency.intersectionsCleared}/${emergency.totalIntersections}` : 'Route I1 → Hosp (2.1km)',
      icon: Ambulance,
      sparkline: 'M0,16 Q16,14 32,8 T48,4 T64,2',
      color: emergency?.status === 'EN_ROUTE' ? '#ef4444' : '#f43f5e',
    },
    {
      id: 'kpi-quantum-score',
      label: 'HYBRID GAIN',
      value: `+${hybridQuantum.quantumAdvantagePct}`,
      unit: '%',
      trend: `${hybridQuantum.optimizationTimeMs}ms`,
      trendGood: true,
      context: 'Qiskit Aer CPU QAOA',
      icon: Zap,
      sparkline: 'M0,14 Q10,12 20,8 T40,5 T64,2',
      color: '#8b5cf6',
    },
    {
      id: 'kpi-network-congestion',
      label: 'GRID CONGESTION',
      value: `${networkCongestion}`,
      unit: '%',
      trend: congestionBadge.label,
      trendGood: networkCongestion < 60,
      context: '8-node network load',
      icon: Gauge,
      sparkline: 'M0,8 Q16,9 32,11 T48,13 T64,12',
      color: networkCongestion > 75 ? '#ef4444' : '#06b6d4',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 my-2 select-none">
      {kpiItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.id}
            id={item.id}
            className="group relative flex flex-col justify-between p-2.5 rounded-lg bg-[#0a0f1d] border border-slate-800/90 hover:border-slate-700 transition-all hover:bg-[#0d1427]"
          >
            {/* Top row: Label + Icon */}
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-400 group-hover:text-slate-300">
                {item.label}
              </span>
              <IconComponent className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
            </div>

            {/* Middle row: Main Telemetry Value + Unit + Micro Sparkline */}
            <div className="flex items-baseline justify-between my-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold font-mono text-slate-100 tracking-tight">
                  {item.value}
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-medium">
                  {item.unit}
                </span>
              </div>

              {/* Compact micro-sparkline */}
              <div className="w-10 h-4 opacity-50 group-hover:opacity-90 transition-opacity">
                <svg className="w-full h-full" viewBox="0 0 64 20" fill="none">
                  <path
                    d={item.sparkline}
                    stroke={item.color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Bottom row: Trend Delta + Context */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono mt-0.5 pt-1 border-t border-slate-800/60">
              <span
                className={`inline-flex items-center gap-0.5 font-bold ${
                  item.trendGood ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {item.trendGood ? (
                  <ArrowDownRight className="w-2.5 h-2.5" />
                ) : (
                  <ArrowUpRight className="w-2.5 h-2.5" />
                )}
                {item.trend}
              </span>
              <span className="text-slate-400 truncate max-w-[90px] text-[10px]">
                {item.context}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
