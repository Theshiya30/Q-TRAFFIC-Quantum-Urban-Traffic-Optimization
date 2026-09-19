/**
 * Q-TRAFFIC: Gate Depth Analysis Gauge
 * Visualizes total circuit depth versus logical qubit connectivity,
 * hardware transpilation overhead, and NISQ coherence budget.
 */

import React, { useState } from 'react';
import { QAOACircuit } from '../types';
import {
  Gauge,
  Network,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
  Sliders,
} from 'lucide-react';

interface GateDepthAnalysisGaugeProps {
  circuit: QAOACircuit;
}

export const GateDepthAnalysisGauge: React.FC<GateDepthAnalysisGaugeProps> = ({
  circuit,
}) => {
  const [hardwareTopology, setHardwareTopology] = useState<'ALL_TO_ALL' | 'HEAVY_HEX' | 'LINEAR_CHAIN'>('HEAVY_HEX');

  // Baseline metrics derived from circuit and 16-variable QUBO formulation
  const qubitCount = circuit.qubitCount || 16;
  const pLayers = circuit.pLayers || 2;
  const logicalDepth = circuit.depth || 18;

  // Maximum possible couplings in an all-to-all graph: N * (N - 1) / 2
  const maxPossibleCouplers = (qubitCount * (qubitCount - 1)) / 2; // 120 for 16 qubits
  // Active Ising couplings: 8 mutual-exclusion pairs + 14 arterial street couplings + 2 emergency links
  const activeCouplers = 24;
  const connectivityDensity = parseFloat(((activeCouplers / maxPossibleCouplers) * 100).toFixed(1)); // 20.0%
  const avgDegree = parseFloat(((2 * activeCouplers) / qubitCount).toFixed(1)); // 3.0 couplers per qubit
  const maxDegree = 4; // Central Spine I2 & I5 connect to up to 4 neighbors

  // Topology-specific routing multiplier & transpiled depth calculations
  const topologyMultipliers = {
    ALL_TO_ALL: { multiplier: 1.0, swapCount: 0, label: 'Unconstrained (Ideal)', desc: 'Direct coupling without SWAP insertion' },
    HEAVY_HEX: { multiplier: 1.33, swapCount: 8, label: 'Heavy-Hex (Superconducting)', desc: 'IBM Eagle/Heron grid architecture' },
    LINEAR_CHAIN: { multiplier: 1.85, swapCount: 22, label: 'Linear Chain (1D)', desc: 'Nearest-neighbor bus routing' },
  };

  const currentTopology = topologyMultipliers[hardwareTopology];
  const transpiledDepth = Math.round(logicalDepth * currentTopology.multiplier);
  const swapGates = currentTopology.swapCount * pLayers;

  // Gate breakdown counts
  const singleQubitGates = qubitCount * (1 + 2 * pLayers); // 16 H + 16*2*p = 80
  const twoQubitCxGates = activeCouplers * 2 * pLayers + (swapGates * 3); // 2 CX per ZZ coupler + 3 CX per SWAP
  const totalGates = singleQubitGates + twoQubitCxGates;

  // Coherence budget estimation (assumes 200ns per two-qubit gate, 50ns per single-qubit gate)
  const estimatedExecutionTimeUs = parseFloat(((transpiledDepth * 0.20)).toFixed(2)); // ~4.8 µs
  const coherenceTimeT2Us = 120; // 120 µs average T2 for superconducting transmon
  const coherenceBudgetUsedPct = parseFloat(((estimatedExecutionTimeUs / coherenceTimeT2Us) * 100).toFixed(1)); // ~4.0%

  // Gauge calculations for SVG semi-circle arcs (Angles: -90 to +90 deg, Radius 70)
  const depthMax = 60;
  const depthFraction = Math.min(1, transpiledDepth / depthMax);
  const depthAngle = -90 + depthFraction * 180;

  const connMax = 100;
  const connFraction = Math.min(1, connectivityDensity / connMax);
  const connAngle = -90 + connFraction * 180;

  return (
    <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              Gate Depth vs. Qubit Connectivity Analysis
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-sans">
                NISQ Circuit Profiler
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluates compiled circuit duration, logical coupling sparsity, and physical device transpilation overhead.
            </p>
          </div>
        </div>

        {/* Hardware Architecture Selector */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <span className="text-slate-500 px-2 hidden sm:inline">Target Topology:</span>
          <button
            onClick={() => setHardwareTopology('ALL_TO_ALL')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              hardwareTopology === 'ALL_TO_ALL'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All-to-All
          </button>
          <button
            onClick={() => setHardwareTopology('HEAVY_HEX')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              hardwareTopology === 'HEAVY_HEX'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Heavy-Hex
          </button>
          <button
            onClick={() => setHardwareTopology('LINEAR_CHAIN')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              hardwareTopology === 'LINEAR_CHAIN'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Linear Chain
          </button>
        </div>
      </div>

      {/* Dual Radial Gauges Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Gauge: Circuit Gate Depth */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Total Circuit Gate Depth
            </span>
            <span className="text-cyan-400 font-bold">
              {transpiledDepth} <span className="text-slate-500 text-[10px]">layers</span>
            </span>
          </div>

          {/* SVG Gauge Graphic */}
          <div className="relative w-48 h-28 flex items-center justify-center">
            <svg viewBox="0 0 160 90" className="w-full h-full overflow-visible">
              {/* Background Arc */}
              <path
                d="M 15 80 A 65 65 0 0 1 145 80"
                fill="none"
                stroke="#1e293b"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Colored Safety Zones */}
              <path
                d="M 15 80 A 65 65 0 0 1 75 22"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="12"
                strokeDasharray="4 2"
                opacity={0.3}
              />
              <path
                d="M 75 22 A 65 65 0 0 1 120 38"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="12"
                strokeDasharray="4 2"
                opacity={0.3}
              />
              <path
                d="M 120 38 A 65 65 0 0 1 145 80"
                fill="none"
                stroke="#ef4444"
                strokeWidth="12"
                strokeDasharray="4 2"
                opacity={0.3}
              />

              {/* Needle Indicator */}
              <g transform={`rotate(${depthAngle}, 80, 80)`}>
                <line
                  x1="80"
                  y1="80"
                  x2="80"
                  y2="24"
                  stroke="#22d3ee"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="80" cy="80" r="6" fill="#0891b2" stroke="#e0f2fe" strokeWidth="1.5" />
              </g>

              {/* Min/Max ticks */}
              <text x="12" y="88" fill="#64748b" fontSize="9" fontFamily="monospace">0</text>
              <text x="75" y="14" fill="#64748b" fontSize="9" fontFamily="monospace">30</text>
              <text x="140" y="88" fill="#64748b" fontSize="9" fontFamily="monospace">60</text>
            </svg>
          </div>

          {/* Depth Breakdown metrics below gauge */}
          <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800 text-center font-mono">
            <div>
              <div className="text-[10px] text-slate-500">Logical Depth</div>
              <div className="text-xs font-bold text-slate-200">{logicalDepth}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Transpiled (+SWAP)</div>
              <div className="text-xs font-bold text-cyan-400">{transpiledDepth}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Decoherence Cap</div>
              <div className="text-xs font-bold text-slate-400">{depthMax}</div>
            </div>
          </div>
        </div>

        {/* Right Gauge: Logical Qubit Connectivity */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Network className="w-4 h-4 text-purple-400" />
              Logical Qubit Connectivity Density
            </span>
            <span className="text-purple-400 font-bold">
              {connectivityDensity}% <span className="text-slate-500 text-[10px]">density</span>
            </span>
          </div>

          {/* SVG Gauge Graphic */}
          <div className="relative w-48 h-28 flex items-center justify-center">
            <svg viewBox="0 0 160 90" className="w-full h-full overflow-visible">
              {/* Background Arc */}
              <path
                d="M 15 80 A 65 65 0 0 1 145 80"
                fill="none"
                stroke="#1e293b"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Active Density Range */}
              <path
                d="M 15 80 A 65 65 0 0 1 55 35"
                fill="none"
                stroke="#a855f7"
                strokeWidth="12"
                strokeDasharray="4 2"
                opacity={0.3}
              />
              <path
                d="M 55 35 A 65 65 0 0 1 145 80"
                fill="none"
                stroke="#6366f1"
                strokeWidth="12"
                strokeDasharray="4 2"
                opacity={0.2}
              />

              {/* Needle Indicator */}
              <g transform={`rotate(${connAngle}, 80, 80)`}>
                <line
                  x1="80"
                  y1="80"
                  x2="80"
                  y2="24"
                  stroke="#c084fc"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="80" cy="80" r="6" fill="#9333ea" stroke="#f3e8ff" strokeWidth="1.5" />
              </g>

              {/* Min/Max ticks */}
              <text x="12" y="88" fill="#64748b" fontSize="9" fontFamily="monospace">0%</text>
              <text x="72" y="14" fill="#64748b" fontSize="9" fontFamily="monospace">50%</text>
              <text x="135" y="88" fill="#64748b" fontSize="9" fontFamily="monospace">100%</text>
            </svg>
          </div>

          {/* Connectivity Breakdown metrics below gauge */}
          <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800 text-center font-mono">
            <div>
              <div className="text-[10px] text-slate-500">Active Couplers</div>
              <div className="text-xs font-bold text-slate-200">{activeCouplers} / {maxPossibleCouplers}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Avg Qubit Degree</div>
              <div className="text-xs font-bold text-purple-400">{avgDegree} edges</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Max Degree (Spine)</div>
              <div className="text-xs font-bold text-slate-400">{maxDegree} links</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantitative Synthesis & Transpilation Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-slate-400 text-[11px]">Hardware SWAP Penalty</span>
          <div className="text-base font-bold text-amber-400 flex items-center gap-1.5">
            <span>+{Math.round((currentTopology.multiplier - 1) * 100)}%</span>
            <span className="text-[10px] font-normal text-slate-400">({swapGates} SWAPs)</span>
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">
            {currentTopology.desc}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-slate-400 text-[11px]">Total Quantum Gate Count</span>
          <div className="text-base font-bold text-cyan-400">
            {totalGates} <span className="text-xs font-normal text-slate-400">gates</span>
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">
            {twoQubitCxGates} 2-qubit CX + {singleQubitGates} 1-qubit gates
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-slate-400 text-[11px]">Estimated Pulse Execution</span>
          <div className="text-base font-bold text-emerald-400">
            {estimatedExecutionTimeUs} <span className="text-xs font-normal text-slate-400">µs</span>
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">
            Critical path gate latency
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-slate-400 text-[11px]">Coherence Budget (T₂)</span>
          <div className="text-base font-bold text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{coherenceBudgetUsedPct}% used</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 leading-tight">
            Safe NISQ execution regime
          </div>
        </div>
      </div>

      {/* Engineering Insight Footer */}
      <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-start gap-2.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="text-slate-200 font-bold font-mono">Topological Trade-Off: </span>
          The urban traffic network yields a naturally sparse planar graph (20% connectivity density). Because adjacent street
          intersections only couple to immediate physical neighbors and one-hot mutual exclusion pairs, circuit depth scales as{' '}
          <span className="text-cyan-300 font-mono">O(p · Δ)</span> where maximum degree <span className="text-white font-mono">Δ = 4</span>,
          avoiding the <span className="text-amber-300 font-mono">O(N²)</span> depth explosion of all-to-all QUBOs.
        </p>
      </div>
    </div>
  );
};
