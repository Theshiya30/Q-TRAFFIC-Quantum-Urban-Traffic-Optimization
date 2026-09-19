/**
 * Q-TRAFFIC: Global Header & Compact Command Bar
 * Aerospace-grade mission control header with system health indicators, navigation consoles,
 * simulation controls, and demo mode trigger.
 */

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Ambulance,
  Cpu,
  Radio,
  Layers,
  Network,
  ShieldAlert,
  BarChart3,
  GitCompare,
  CircuitBoard,
  Activity,
} from 'lucide-react';
import { SimulationConfig } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  config: SimulationConfig;
  onUpdateConfig: (newConfig: Partial<SimulationConfig>) => void;
  onTriggerEmergency: () => void;
  onStartDemoMode: () => void;
  emergencyActive: boolean;
  simulationTime: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isRunning,
  onTogglePlay,
  onReset,
  config,
  onUpdateConfig,
  onTriggerEmergency,
  onStartDemoMode,
  emergencyActive,
  simulationTime,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'network', label: 'Traffic Network', icon: Network },
    { id: 'quantum', label: 'Quantum Engine', icon: Cpu },
    { id: 'emergency', label: 'Emergency Corridor', icon: ShieldAlert },
    { id: 'comparison', label: 'Benchmark', icon: GitCompare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'architecture', label: 'Architecture', icon: CircuitBoard },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-[#070b15]/95 backdrop-blur-md">
      {/* Tier 1: Brand, Status Telemetry & Simulation Controls */}
      <div className="px-3 lg:px-5 py-2.5 max-w-[1920px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Brand Identity & Active Engine Tag */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/10 shrink-0">
              <Cpu className="w-4 h-4 text-slate-950" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base font-mono text-white">
                  Q-TRAFFIC
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 font-mono">
                  QAOA ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block font-mono tracking-tight">
                Adaptive Quantum-Enhanced Urban Traffic Optimization
              </p>
            </div>
          </div>

          {/* Right: Live Telemetry & Control Suite */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 ml-auto">
            {/* System Status Telemetry */}
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 bg-[#090e1a] border border-slate-800 px-2.5 py-1 rounded-lg shrink-0">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
              <span className="text-slate-700">│</span>
              <span className="text-slate-200 font-semibold">T+{formatTime(simulationTime)}</span>
              <span className="text-slate-700 hidden xl:inline">│</span>
              <span className="text-cyan-400 uppercase hidden xl:inline font-medium">Coordinated Grid</span>
            </div>

            {/* Simulation Speed Presets */}
            <div className="flex items-center bg-[#090e1a] border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono shrink-0">
              {([0.5, 1, 2, 5] as const).map((spd) => (
                <button
                  key={spd}
                  id={`speed-${spd}x`}
                  onClick={() => onUpdateConfig({ speed: spd })}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    config.speed === spd
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Play/Pause Button */}
            <button
              id="btn-play-pause"
              onClick={onTogglePlay}
              className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                isRunning
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
              }`}
              title={isRunning ? 'Pause Simulation' : 'Resume Simulation'}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Reset Button */}
            <button
              id="btn-reset-sim"
              onClick={onReset}
              className="p-1.5 rounded-lg border border-slate-800 bg-[#090e1a] text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all shrink-0"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Emergency Ambulance Dispatch */}
            <button
              id="btn-nav-emergency"
              onClick={onTriggerEmergency}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all shrink-0 ${
                emergencyActive
                  ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse'
                  : 'bg-rose-950/30 text-rose-300 border-rose-900/60 hover:bg-rose-900/40'
              }`}
              title="Dispatch Priority Emergency Ambulance AMB-101"
            >
              <Ambulance className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Ambulance</span>
            </button>

            {/* Hackathon Demo Mode Launcher */}
            <button
              id="btn-launch-demo"
              onClick={onStartDemoMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>DEMO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2: Subsystem Navigation Console Strip */}
      <div className="border-t border-slate-800/80 bg-[#050811] px-3 lg:px-5">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none w-full">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 shrink-0 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
