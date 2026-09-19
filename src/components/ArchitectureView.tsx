/**
 * Q-TRAFFIC: Technical Architecture & System Dataflow
 * Interactive interactive block diagram tracing sensor telemetry through QUBO,
 * QAOA execution, signal actuation, and analytics verification.
 */

import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Activity,
  ArrowDown,
  ArrowRight,
  Database,
  Radio,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(4); // Default on QUBO/QAOA

  const stages = [
    {
      id: 0,
      title: '1. Traffic Sensors & Roadside Units',
      tech: 'IoT Radar, Induction Loops & Camera Feeds',
      description: 'Collects real-time vehicle arrival rates, departure counts, average velocities, and queue lengths across all 8 intersections.',
      icon: Radio,
      category: 'DATA_INGESTION',
    },
    {
      id: 1,
      title: '2. Traffic State Engine',
      tech: 'Microscopic Traffic Simulator & Statevector Estimator',
      description: 'Maintains running moving averages of lane densities, queue starvation metrics, pedestrian crossing requests, and vehicle headway.',
      icon: Activity,
      category: 'SIMULATION',
    },
    {
      id: 2,
      title: '3. Network Graph Model',
      tech: 'Directed Spatial Graph (NetworkX Topology)',
      description: 'Represents 8 interconnected nodes (I1-I8) and 12 connecting arterial roads with capacities, free-flow speeds, and directional links.',
      icon: Layers,
      category: 'TOPOLOGY',
    },
    {
      id: 3,
      title: '4. Classical Baseline Controller',
      tech: 'Webster Fixed-Timing & Actuated Gap-Out Heuristic',
      description: 'Runs parallel deterministic control on identical traffic scenario to compute benchmark waiting times, queues, and fuel baselines.',
      icon: Sliders,
      category: 'CLASSICAL',
    },
    {
      id: 4,
      title: '5. QUBO Generator',
      tech: 'Qiskit Optimization & QuadraticProgram',
      description: 'Transforms multi-intersection objective into min x^T Q x with linear queue/delay weights, adjacent green wave couplers, and phase exclusivity penalties.',
      icon: Cpu,
      category: 'QUANTUM_FORMULATION',
    },
    {
      id: 5,
      title: '6. QAOA & Hybrid Quantum Layer',
      tech: 'Qiskit AerSimulator (CPU) & Parameterized Circuit',
      description: 'Quantum simulation executed using Qiskit Aer on a classical CPU. Applies alternating cost unitary U(C, γ) and mixer unitary U(B, β) parameterized circuits with classical COBYLA optimizer searching for the ground state.',
      icon: Cpu,
      category: 'QUANTUM_EXECUTION',
    },
    {
      id: 6,
      title: '7. Signal Actuation Engine',
      tech: 'NTCIP Protocol & Dynamic Signal Controllers',
      description: 'Decodes optimal bitstring into coordinated green allocations, phase offsets, and emergency preemption wave timings.',
      icon: CheckCircle2,
      category: 'ACTUATION',
    },
    {
      id: 7,
      title: '8. Environmental & Telemetry Dashboard',
      tech: 'React, Recharts, Express REST API & WebSockets',
      description: 'Presents real-time 60fps traffic map, verified classical vs quantum metrics, CO2 emissions avoided, and live emergency tracking.',
      icon: Database,
      category: 'ANALYTICS',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-[#0e1424] border border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white font-mono">
            System Architecture & Hybrid Quantum-Classical Pipeline
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          End-to-end dataflow tracing roadside telemetry to QUBO formulation, QAOA simulation, and signal actuation.
        </p>
      </div>

      {/* Architecture Flow Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Sequential Pipeline */}
        <div className="lg:col-span-7 space-y-2.5">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isSelected = activeStep === stage.id;

            return (
              <div key={stage.id} className="relative">
                <button
                  onClick={() => setActiveStep(stage.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/70 shadow-lg shadow-cyan-500/10'
                      : 'bg-[#0b101d] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 font-mono text-xs font-bold ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-mono font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {stage.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 shrink-0">
                        {stage.tech}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {stage.description}
                    </p>
                  </div>
                </button>

                {/* Connecting Arrow */}
                {idx < stages.length - 1 && (
                  <div className="flex justify-center my-1 text-slate-700">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Deep Dive of Selected Stage */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0e1424] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-400">
              MODULE SPECIFICATION
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              Stage {stages[activeStep].id + 1} of 8
            </span>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-white font-mono">
              {stages[activeStep].title}
            </h3>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
              Stack: {stages[activeStep].tech}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {stages[activeStep].description}
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2 font-mono">
              <span className="text-slate-300 font-bold">Input Contract:</span>
              <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
                {activeStep === 4
                  ? 'TrafficState { density: [0-100], queue: [0-45], emergencyRoute: ["I1","I2","I5","I8"] }'
                  : activeStep === 5
                  ? 'QUBO { matrix: 16x16, linearTerms, quadraticCouplers: 12 }'
                  : 'RoadTelemetryStream { timestamp: epoch, nodeId, vehicles }'}
              </div>

              <span className="text-slate-300 font-bold pt-1 block">Output Contract:</span>
              <div className="text-[11px] text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800">
                {activeStep === 4
                  ? 'QuadraticProgram { binary_vars: 16, objective: min C(x) }'
                  : activeStep === 5
                  ? 'QAOAResult { bitstring: "10011001...", energy: -42.8, hybridImprovement: +28.5% }'
                  : 'ActuationPayload { phaseA_sec: 42, offset_sec: 4 }'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
