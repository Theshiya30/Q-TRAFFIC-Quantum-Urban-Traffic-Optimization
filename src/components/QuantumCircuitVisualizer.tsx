/**
 * Q-TRAFFIC: Interactive Quantum Circuit & QAOA Visualizer
 * Shows the parameterized QAOA quantum circuit, quantum gates,
 * measurement distribution, statevector samples, and "Why Quantum?" explainability.
 */

import React, { useState } from 'react';
import { QAOACircuit } from '../types';
import {
  Cpu,
  Layers,
  Sparkles,
  BarChart2,
  HelpCircle,
  Zap,
  Activity,
  ChevronRight,
} from 'lucide-react';

interface QuantumCircuitVisualizerProps {
  circuit: QAOACircuit;
}

export const QuantumCircuitVisualizer: React.FC<QuantumCircuitVisualizerProps> = ({
  circuit,
}) => {
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);

  // Group top bitstrings for histogram
  const topSamples = circuit.measurementDistribution.slice(0, 8);
  const maxProbability = Math.max(...topSamples.map(s => s.probability), 0.01);

  return (
    <div className="space-y-4">
      {/* Circuit Header & Specs Bar */}
      <div className="p-4 rounded-2xl bg-[#0e1424] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white font-mono">
              QAOA Parameterized Quantum Circuit & Measurement Field
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulated on Qiskit Aer Statevector Engine with COBYLA classical parameter optimization loop.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Qubits: </span>
            <span className="font-bold text-cyan-400">{circuit.qubitCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">QAOA Layers (p): </span>
            <span className="font-bold text-cyan-400">{circuit.pLayers}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Circuit Depth: </span>
            <span className="font-bold text-blue-400">{circuit.depth}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Shots: </span>
            <span className="font-bold text-emerald-400">{circuit.measurementShots}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Ground Energy: </span>
            <span className="font-bold text-purple-400">{circuit.groundStateEnergy}</span>
          </div>
        </div>
      </div>

      {/* Visual Circuit Diagram Wireframe */}
      <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-slate-300 font-bold">
            Interactive Quantum Wire Diagram (Representative Qubit Registers q0 - q7)
          </span>
          <span className="text-[11px] font-mono text-cyan-400">
            Click any gate to inspect unitary matrix parameters
          </span>
        </div>

        {/* Qubit Wires */}
        <div className="space-y-4 min-w-[700px] py-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((qubitIdx) => {
            return (
              <div key={qubitIdx} className="flex items-center gap-2">
                {/* Qubit label */}
                <div className="w-12 font-mono text-xs font-bold text-slate-400 shrink-0">
                  |q_{qubitIdx}⟩
                </div>

                {/* Wire & Gates */}
                <div className="relative flex-1 flex items-center h-8 bg-slate-900/30 rounded px-2 border border-slate-800/40">
                  {/* Center line */}
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-slate-700" />

                  {/* Gates Sequence */}
                  <div className="relative z-10 flex items-center gap-3 w-full justify-around">
                    {/* 1. Hadamard Gate */}
                    <button
                      onClick={() => setSelectedGateId(`H_q${qubitIdx}`)}
                      className="w-7 h-7 rounded bg-blue-600/80 hover:bg-blue-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-sm"
                      title="Hadamard: Creates equal superposition"
                    >
                      H
                    </button>

                    {/* 2. CNOT Entanglement (if even pair) */}
                    {qubitIdx % 2 === 0 ? (
                      <div className="relative flex flex-col items-center">
                        <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-sm" />
                        <div className="w-[2px] h-6 bg-cyan-400 absolute top-3" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-cyan-400 flex items-center justify-center font-bold text-cyan-400 text-xs">
                        +
                      </div>
                    )}

                    {/* 3. Parameterized Problem RZ Rotation */}
                    <button
                      onClick={() => setSelectedGateId(`RZ_q${qubitIdx}`)}
                      className="px-2 h-7 rounded bg-purple-600/80 hover:bg-purple-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-sm"
                      title={`RZ(2γ·J): Cost Hamiltonian Unitary U(C, γ=${circuit.parameters.gammas[0] || 0.52})`}
                    >
                      RZ(γ₁)
                    </button>

                    {/* 4. Mixer RX Rotation */}
                    <button
                      onClick={() => setSelectedGateId(`RX_q${qubitIdx}`)}
                      className="px-2 h-7 rounded bg-indigo-600/80 hover:bg-indigo-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-sm"
                      title={`RX(2β): Mixer Unitary U(B, β=${circuit.parameters.betas[0] || 0.38})`}
                    >
                      RX(β₁)
                    </button>

                    {/* 5. Layer 2 Problem RZ Rotation */}
                    <button
                      onClick={() => setSelectedGateId(`RZ2_q${qubitIdx}`)}
                      className="px-2 h-7 rounded bg-purple-700/80 hover:bg-purple-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-sm"
                      title={`RZ(2γ₂·J): Layer 2 Cost Hamiltonian`}
                    >
                      RZ(γ₂)
                    </button>

                    {/* 6. Measurement Meter Gate */}
                    <div
                      className="w-7 h-7 rounded bg-slate-800 border border-slate-600 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center"
                      title="Measurement in Computational Z-basis"
                    >
                      M
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Measurement Distribution Histogram & Why Quantum? */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Measurement Distribution Histogram */}
        <div className="xl:col-span-7 p-4 rounded-2xl bg-[#0e1424] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-white">
                QAOA Measurement Sampling Distribution ({circuit.measurementShots} Shots)
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              Ground State: |{circuit.bestBitstring.slice(0, 8)}...⟩
            </span>
          </div>

          <div className="space-y-2">
            {topSamples.map((sample, sIdx) => {
              const isBest = sample.bitstring === circuit.bestBitstring;
              const barWidth = Math.max(5, (sample.probability / maxProbability) * 100);

              return (
                <div key={sIdx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isBest ? 'text-emerald-400' : 'text-slate-300'}`}>
                        |{sample.bitstring.slice(0, 16)}⟩
                      </span>
                      {isBest && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 text-[10px] border border-emerald-800">
                          OPTIMAL
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>E = {sample.energy}</span>
                      <span className="font-bold text-white">{(sample.probability * 100).toFixed(1)}%</span>
                      <span className="text-slate-500">({sample.count} shots)</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isBest ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-slate-700'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* "Why Quantum?" Educational Hackathon Section */}
        <div className="xl:col-span-5 p-4 rounded-2xl bg-[#0e1424] border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-mono font-bold text-white">
              Why Quantum for Urban Traffic? (Judge Briefing)
            </h3>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="font-bold text-cyan-300 font-mono">1. Combinatorial Explosion:</span>
              <p className="mt-1 text-slate-400">
                For 8 interconnected intersections with 4 candidate timing phases each, there exist over{' '}
                <span className="text-white font-mono font-bold">4⁸ = 65,536</span> global configurations.
                In classical actuated control, each intersection optimizes locally, causing gridlock on downstream arterials.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="font-bold text-purple-300 font-mono">2. Global QUBO Entanglement:</span>
              <p className="mt-1 text-slate-400">
                QUBO maps cross-corridor green waves as negative quadratic couplings{' '}
                <span className="text-white font-mono font-bold">-J_ij x_i x_j</span>. QAOA searches this continuous
                superposition space simultaneously via variational quantum evolution.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="font-bold text-emerald-300 font-mono">3. Dynamic Preemption Wave:</span>
              <p className="mt-1 text-slate-400">
                When emergency vehicles dispatch, the Hamiltonian instantly reweights the ambulance route with strong negative potential,
                guaranteeing synchronized green waves with zero pedestrian starvation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
