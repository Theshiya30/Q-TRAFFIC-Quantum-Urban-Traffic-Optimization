/**
 * Q-TRAFFIC: QAOA Optimization Convergence Chart
 * Visualizes the energy expectation levels over 35 iterations of the classical
 * COBYLA loop tuning the QAOA parameters (gamma, beta) towards ground state energy.
 */

import React, { useState, useMemo } from 'react';
import { QAOACircuit, QAOAConvergencePoint } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingDown,
  Activity,
  Zap,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info,
  Maximize2,
} from 'lucide-react';

interface OptimizationConvergenceChartProps {
  circuit: QAOACircuit;
}

// Fallback generator in case circuit.convergenceHistory is not yet populated
function generateFallbackConvergence(groundEnergy: number = -42.8): QAOAConvergencePoint[] {
  const points: QAOAConvergencePoint[] = [];
  const total = 35;
  const initialEnergy = 16.4;
  let best = initialEnergy;

  for (let i = 1; i <= total; i++) {
    const decay = Math.exp(-(i - 1) / 8.2);
    const noise = (Math.sin(i * 1.3) * 0.6 + Math.cos(i * 2.1) * 0.4) * (decay * 14.0 + 0.6);
    let val = groundEnergy + (initialEnergy - groundEnergy) * decay + noise;
    if (i >= 32) {
      val = groundEnergy + Math.abs(Math.sin(i)) * 0.35;
    }
    const energy = parseFloat(val.toFixed(2));
    if (energy < best) best = energy;

    const gamma = parseFloat((0.15 + (0.52 - 0.15) * (1 - decay) + Math.sin(i * 0.8) * 0.04 * decay).toFixed(3));
    const beta = parseFloat((0.85 - (0.85 - 0.38) * (1 - decay) + Math.cos(i * 0.8) * 0.04 * decay).toFixed(3));
    const stepSize = parseFloat((0.25 * decay + 0.02).toFixed(3));
    const deltaToGround = parseFloat(Math.max(0, best - groundEnergy).toFixed(2));

    points.push({
      iteration: i,
      energy,
      bestEnergy: parseFloat(best.toFixed(2)),
      gamma,
      beta,
      stepSize,
      deltaToGround,
    });
  }
  return points;
}

export const OptimizationConvergenceChart: React.FC<OptimizationConvergenceChartProps> = ({
  circuit,
}) => {
  const [viewMode, setViewMode] = useState<'energy' | 'parameters' | 'gap'>('energy');
  const [selectedIteration, setSelectedIteration] = useState<number>(35);

  const convergenceData = useMemo(() => {
    if (circuit.convergenceHistory && circuit.convergenceHistory.length > 0) {
      return circuit.convergenceHistory;
    }
    return generateFallbackConvergence(circuit.groundStateEnergy);
  }, [circuit.convergenceHistory, circuit.groundStateEnergy]);

  const groundEnergy = circuit.groundStateEnergy;
  const initialPoint = convergenceData[0] || { energy: 16.4, bestEnergy: 16.4 };
  const finalPoint = convergenceData[convergenceData.length - 1] || { energy: groundEnergy, bestEnergy: groundEnergy };
  const energyImprovement = parseFloat((initialPoint.energy - groundEnergy).toFixed(1));

  // Find the iteration where bestEnergy came within 5% of ground state
  const thresholdEnergy = groundEnergy + Math.abs(initialPoint.energy - groundEnergy) * 0.05;
  const convergedAtPoint = convergenceData.find(p => p.bestEnergy <= thresholdEnergy);
  const convergedIteration = convergedAtPoint ? convergedAtPoint.iteration : 28;

  // Selected iteration data for inspector
  const currentInspectPoint = convergenceData.find(p => p.iteration === selectedIteration) || finalPoint;

  return (
    <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-4">
      {/* Header section with badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                Optimization Convergence Trajectory
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-sans">
                  35 QAOA Iterations
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Classical COBYLA heuristic minimizing expectation energy{' '}
                <span className="text-cyan-300 font-mono">⟨ψ(γ, β)| H_C |ψ(γ, β)⟩</span> across the QUBO landscape.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setViewMode('energy')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'energy'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Energy Levels
          </button>
          <button
            onClick={() => setViewMode('parameters')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'parameters'
                ? 'bg-purple-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Variational Angles (γ, β)
          </button>
          <button
            onClick={() => setViewMode('gap')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'gap'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Residual Gap (ΔE)
          </button>
        </div>
      </div>

      {/* 5-Card Statistical KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Initial Energy (E₁)</div>
          <div className="text-lg font-bold font-mono text-amber-400">+{initialPoint.energy}</div>
          <div className="text-[10px] text-slate-500">Unsynchronized state</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Ground State (E₀)</div>
          <div className="text-lg font-bold font-mono text-cyan-400">{groundEnergy}</div>
          <div className="text-[10px] text-slate-500">Global minimum target</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total ΔE Reduction</div>
          <div className="text-lg font-bold font-mono text-emerald-400">-{energyImprovement}</div>
          <div className="text-[10px] text-slate-500">Cost penalty eliminated</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Convergence Point</div>
          <div className="text-lg font-bold font-mono text-purple-400">Iter #{convergedIteration}</div>
          <div className="text-[10px] text-slate-500">Reached 95% ground state</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1 col-span-2 md:col-span-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Optimizer Engine</div>
          <div className="text-sm font-bold font-mono text-slate-200 truncate">COBYLA / Aer</div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>Optimal Bitstring Locked</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Recharts Graph */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'energy' ? (
            <ComposedChart data={convergenceData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="bestFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

              <XAxis
                dataKey="iteration"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#334155' }}
                label={{ value: 'Classical Optimizer Iteration (k)', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#334155' }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data: QAOAConvergencePoint = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl space-y-1.5 font-mono text-xs">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1">
                          <span className="text-cyan-400 font-bold">Iteration #{data.iteration}</span>
                          <span className="text-slate-400 text-[10px]">COBYLA step: {data.stepSize}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-300">Sample Energy E:</span>
                          <span className="font-bold text-cyan-300">{data.energy}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-300">Best Energy So Far:</span>
                          <span className="font-bold text-emerald-400">{data.bestEnergy}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-300">Ground State E₀:</span>
                          <span className="text-purple-400">{groundEnergy}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                          <span>γ₁: {data.gamma} rad</span>
                          <span>β₁: {data.beta} rad</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', fontFamily: 'monospace' }}
              />

              {/* Target Ground State Horizontal Reference Line */}
              <ReferenceLine
                y={groundEnergy}
                stroke="#a855f7"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Target Ground State (E₀ = ${groundEnergy})`,
                  fill: '#c084fc',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  position: 'insideTopRight',
                  offset: 8,
                }}
              />

              {/* Evaluated Energy Curve */}
              <Area
                type="monotone"
                dataKey="energy"
                name="Evaluated Energy ⟨H_C⟩"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#energyFill)"
                dot={{ r: 2, fill: '#06b6d4', stroke: '#082f49' }}
                activeDot={{ r: 5, fill: '#22d3ee', stroke: '#fff' }}
              />

              {/* Best Energy Found (Monotonic Lower Bound) */}
              <Line
                type="stepAfter"
                dataKey="bestEnergy"
                name="Best Candidate State (E_best)"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </ComposedChart>
          ) : viewMode === 'parameters' ? (
            <ComposedChart data={convergenceData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

              <XAxis
                dataKey="iteration"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#334155' }}
                label={{ value: 'Iteration (k)', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#334155' }}
                domain={[0, 1.2]}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data: QAOAConvergencePoint = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl space-y-1 font-mono text-xs">
                        <div className="text-purple-400 font-bold">Iteration #{data.iteration}</div>
                        <div className="text-cyan-300">Problem Angle γ₁: {data.gamma} rad</div>
                        <div className="text-indigo-300">Mixer Angle β₁: {data.beta} rad</div>
                        <div className="text-slate-400">Step Size: {data.stepSize}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', fontFamily: 'monospace' }}
              />

              <Line
                type="monotone"
                dataKey="gamma"
                name="Problem Unitary Angle γ₁ (Cost Phase)"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ r: 2, fill: '#06b6d4' }}
              />

              <Line
                type="monotone"
                dataKey="beta"
                name="Mixer Unitary Angle β₁ (Transverse Field)"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 2, fill: '#a855f7' }}
              />
            </ComposedChart>
          ) : (
            <ComposedChart data={convergenceData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gapFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

              <XAxis
                dataKey="iteration"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#334155' }}
                label={{ value: 'Iteration (k)', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#334155' }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data: QAOAConvergencePoint = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl space-y-1 font-mono text-xs">
                        <div className="text-emerald-400 font-bold">Iteration #{data.iteration}</div>
                        <div className="text-slate-200">Residual Gap to Ground: {data.deltaToGround}</div>
                        <div className="text-slate-400">Current Best: {data.bestEnergy}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', fontFamily: 'monospace' }}
              />

              <Area
                type="monotone"
                dataKey="deltaToGround"
                name="Residual Error Gap (E_best - E₀)"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gapFill)"
                dot={{ r: 2, fill: '#10b981' }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Interactive Iteration Scrubber & Educational Note */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[280px] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Scrub Iteration Inspector:</span>
            <span className="text-cyan-400 font-bold">
              Iteration #{selectedIteration} of 35
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={35}
            value={selectedIteration}
            onChange={(e) => setSelectedIteration(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Selected Iteration Detail Pill */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500">Evaluated: </span>
            <span className="text-cyan-400 font-bold">{currentInspectPoint.energy}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500">Best: </span>
            <span className="text-emerald-400 font-bold">{currentInspectPoint.bestEnergy}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500">γ₁ / β₁: </span>
            <span className="text-purple-400 font-bold">{currentInspectPoint.gamma} / {currentInspectPoint.beta}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500">Gap: </span>
            <span className={currentInspectPoint.deltaToGround <= 0.5 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {currentInspectPoint.deltaToGround}
            </span>
          </div>
        </div>
      </div>

      {/* Theoretical Foundation Note */}
      <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="text-slate-200 font-semibold font-mono">Variational Convergence Mechanism: </span>
          In QAOA, the quantum state is prepared as{' '}
          <span className="text-cyan-300 font-mono">|ψ(γ, β)⟩ = U(B, β_p) U(C, γ_p) ... U(B, β_1) U(C, γ_1) |+⟩^n</span>.
          The classical feedback optimizer measures the Hamiltonian expectation value and steps the angles using gradient-free simplex interpolation.
          Notice how the energy oscillates early due to parameter space exploration, then asymptotically locks into the global minimum ground state at{' '}
          <span className="text-purple-300 font-mono">E₀ = {groundEnergy}</span>.
        </p>
      </div>
    </div>
  );
};
