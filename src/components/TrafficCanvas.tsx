/**
 * Q-TRAFFIC: Mission Control Interactive Traffic Simulation Canvas & Metro Grid
 * High-definition, aspect-ratio preserved vector canvas for urban traffic simulation.
 * Optimized for screen sizes, free of squeezing or stretching distortion.
 * Features interactive zoom/pan, fullscreen mode, road segment inspection,
 * directional multi-lane roads, crosswalks, dual signal heads, and emergency wave routing.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Intersection,
  RoadSegment,
  Vehicle,
  EmergencyVehicle,
  TrafficEvent,
} from '../types';
import {
  Ambulance,
  AlertTriangle,
  Flame,
  UserCheck,
  Ban,
  Radio,
  Clock,
  Zap,
  Layers,
  Shield,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Activity,
  Car,
  Crosshair,
  Compass,
  Gauge,
  Sliders,
  MapPin,
  X,
} from 'lucide-react';

interface TrafficCanvasProps {
  intersections: Intersection[];
  roads: RoadSegment[];
  vehicles: Vehicle[];
  emergency: EmergencyVehicle | null;
  activeEvents: TrafficEvent[];
  selectedIntersectionId: string | null;
  onSelectIntersection: (id: string) => void;
  onTriggerAccident: () => void;
  onToggleRoadClosure: () => void;
  onTriggerSurge: () => void;
  onTriggerEmergency: () => void;
  onTriggerPedestrian: () => void;
}

// Geometric layout in 1200 x 720 coordinate space
// Clean 3x3 metropolitan grid: Columns 220, 600, 980; Rows 140, 360, 580
const METRO_NODES: Record<string, { x: number; y: number; name: string; sector: string }> = {
  I1: { x: 220, y: 140, name: 'North-West Gateway', sector: 'Sector 1 - North Arterial' },
  I2: { x: 600, y: 140, name: 'North Central Spine', sector: 'Sector 1 - North Arterial' },
  I3: { x: 980, y: 140, name: 'East Harbor Terminal', sector: 'Sector 2 - Harbor Link' },
  I4: { x: 220, y: 360, name: 'West Commercial Hub', sector: 'Sector 3 - Commercial Zone' },
  I5: { x: 600, y: 360, name: 'Central Metro Core', sector: 'Sector 4 - Downtown Core' },
  I6: { x: 980, y: 360, name: 'East Tech Park', sector: 'Sector 5 - Innovation Zone' },
  I7: { x: 220, y: 580, name: 'Southwest Gateway', sector: 'Sector 6 - South Corridor' },
  I8: { x: 600, y: 580, name: 'Medical Boulevard', sector: 'Sector 7 - Hospital Zone' },
  HOSPITAL: { x: 980, y: 580, name: 'Metropolitan Trauma Center', sector: 'Sector 7 - Medical Campus' },
};

export const TrafficCanvas: React.FC<TrafficCanvasProps> = ({
  intersections,
  roads,
  vehicles,
  emergency,
  activeEvents,
  selectedIntersectionId,
  onSelectIntersection,
  onTriggerAccident,
  onToggleRoadClosure,
  onTriggerSurge,
  onTriggerEmergency,
  onTriggerPedestrian,
}) => {
  // View Controls
  const [filterMode, setFilterMode] = useState<'ALL' | 'CONGESTION' | 'SIGNALS' | 'CORRIDOR' | 'SPEED'>('ALL');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layer Visibility
  const [showVehicles, setShowVehicles] = useState<boolean>(true);
  const [showRoadBadges, setShowRoadBadges] = useState<boolean>(true);
  const [showDistricts, setShowDistricts] = useState<boolean>(true);
  const [showGridlines, setShowGridlines] = useState<boolean>(true);

  // Hover & Quick Inspection
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredRoadId, setHoveredRoadId] = useState<string | null>(null);
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Position resolver
  const getNodePos = (id: string) => {
    if (METRO_NODES[id]) return METRO_NODES[id];
    const found = intersections.find((i) => i.id === id);
    if (found) {
      if (METRO_NODES[found.id]) return METRO_NODES[found.id];
      return {
        x: 220 + ((found.x - 20) / 60) * 760,
        y: 140 + ((found.y - 20) / 60) * 440,
        name: found.name,
        sector: 'Metropolitan District',
      };
    }
    return { x: 600, y: 360, name: id, sector: 'City Grid' };
  };

  // Road styling helper based on status, congestion & active filter
  const getRoadVisuals = (road: RoadSegment) => {
    const isCorridor = road.status === 'EMERGENCY_CORRIDOR';
    const isClosed = road.status === 'CLOSED';
    const isAccident = road.status === 'ACCIDENT';

    if (isClosed) {
      return {
        stroke: '#ef4444',
        dash: '8,6',
        width: 14,
        color: '#ef4444',
        label: 'ROAD CLOSED',
        glow: true,
      };
    }
    if (isAccident) {
      return {
        stroke: '#f97316',
        dash: '6,4',
        width: 16,
        color: '#f97316',
        label: 'ACCIDENT',
        glow: true,
      };
    }
    if (isCorridor) {
      return {
        stroke: '#10b981',
        dash: '',
        width: 18,
        color: '#10b981',
        label: 'EMERGENCY CORRIDOR',
        glow: true,
      };
    }

    // Congestion based
    if (road.congestionLevel < 35) {
      return {
        stroke: '#10b981',
        dash: '',
        width: 10,
        color: '#10b981',
        label: 'FLOW OPTIMAL',
        glow: false,
      };
    }
    if (road.congestionLevel < 65) {
      return {
        stroke: '#06b6d4',
        dash: '',
        width: 12,
        color: '#06b6d4',
        label: 'MODERATE',
        glow: false,
      };
    }
    if (road.congestionLevel < 82) {
      return {
        stroke: '#f59e0b',
        dash: '',
        width: 14,
        color: '#f59e0b',
        label: 'CONGESTED',
        glow: false,
      };
    }
    return {
      stroke: '#ef4444',
      dash: '',
      width: 16,
      color: '#ef4444',
      label: 'CRITICAL',
      glow: true,
    };
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.75, +(z - 0.25).toFixed(2)));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedRoadId(null);
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (zoomLevel > 1 || e.altKey)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Key shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        setSelectedRoadId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const hoveredIntersection = intersections.find((i) => i.id === hoveredNodeId) || null;
  const selectedRoad = roads.find((r) => r.id === selectedRoadId) || null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl bg-[#060a14] border border-slate-800/90 overflow-hidden shadow-2xl transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-none h-screen w-screen flex flex-col'
          : 'aspect-[16/10] sm:aspect-[16/9.5] min-h-[540px] max-h-[760px] flex flex-col'
      }`}
    >
      {/* 1. Tactical Command Header & Layer Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 bg-[#0a0f1d] border-b border-slate-800/90 text-xs shrink-0 select-none">
        {/* Left Title & Status */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-extrabold tracking-wide text-white">METRO ARTERIAL GRID</span>
            <span className="text-slate-600">│</span>
            <span className="text-cyan-400 font-semibold">8 NODES + TRAUMA HUB</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            <span>LAT 37.77°N</span>
            <span className="text-slate-600">│</span>
            <span>LON -122.42°W</span>
          </div>
        </div>

        {/* Center: Interactive Filters & View Modes */}
        <div className="flex items-center gap-2">
          {/* Mode Tabs */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
            {(
              [
                { id: 'ALL', label: 'All Layers' },
                { id: 'CONGESTION', label: 'Congestion Heatmap' },
                { id: 'SIGNALS', label: 'Signal Phases' },
                { id: 'CORRIDOR', label: 'Green Corridor' },
                { id: 'SPEED', label: 'Velocity (km/h)' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setFilterMode(m.id)}
                className={`px-2.5 py-1 rounded transition-all whitespace-nowrap ${
                  filterMode === m.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Incident Simulation Injections */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-950/90 border border-slate-800/80 rounded-lg p-0.5 text-[11px] font-mono">
            <button
              onClick={onTriggerSurge}
              className="flex items-center gap-1 px-2 py-1 rounded text-amber-300 hover:bg-amber-950/40 transition-colors"
              title="Trigger Rush Hour Traffic Surge"
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Surge</span>
            </button>
            <button
              onClick={onTriggerAccident}
              className="flex items-center gap-1 px-2 py-1 rounded text-orange-300 hover:bg-orange-950/40 transition-colors"
              title="Report Accident on R4"
            >
              <AlertTriangle className="w-3 h-3 text-orange-400" />
              <span>Accident R4</span>
            </button>
            <button
              onClick={onToggleRoadClosure}
              className="flex items-center gap-1 px-2 py-1 rounded text-rose-300 hover:bg-rose-950/40 transition-colors"
              title="Toggle Road Closure on R5"
            >
              <Ban className="w-3 h-3 text-rose-400" />
              <span>Closure R5</span>
            </button>
            <button
              onClick={onTriggerPedestrian}
              className="flex items-center gap-1 px-2 py-1 rounded text-indigo-300 hover:bg-indigo-950/40 transition-colors"
              title="Trigger Pedestrian Wave at I5"
            >
              <UserCheck className="w-3 h-3 text-indigo-400" />
              <span>Pedestrians</span>
            </button>
          </div>

          {/* Zoom, Pan & Fullscreen Toolbar */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-slate-300">
            <button
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-500 w-8 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-700">│</span>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Command Display'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Vector Canvas Stage */}
      <div
        className={`relative flex-1 w-full h-full bg-[#060a14] overflow-hidden select-none cursor-${
          isDragging ? 'grabbing' : zoomLevel > 1 ? 'grab' : 'default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Preserved Aspect Ratio SVG: 1200 x 720 */}
        <svg
          className="w-full h-full"
          viewBox="0 0 1200 720"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: '50% 50%',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            {/* Glowing filters */}
            <filter id="glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.0" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-amber" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4.0" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Linear background grid pattern */}
            <pattern id="tactical-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#10192e" strokeWidth="0.8" opacity="0.6" />
              <circle cx="0" cy="0" r="1.0" fill="#1e293b" />
            </pattern>

            {/* Asphalt Texture */}
            <pattern id="asphalt-texture" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="#0c1322" />
              <circle cx="5" cy="5" r="0.5" fill="#162032" />
              <circle cx="15" cy="15" r="0.5" fill="#162032" />
            </pattern>
          </defs>

          {/* Background Grid Pattern */}
          {showGridlines && (
            <rect x="0" y="0" width="1200" height="720" fill="url(#tactical-grid)" />
          )}

          {/* City District Blocks & Geographic Context */}
          {showDistricts && (
            <g className="districts-layer pointer-events-none opacity-40">
              {/* Sector 1: North District */}
              <rect x="140" y="70" width="920" height="140" rx="16" fill="#0c1629" stroke="#1e293b" strokeWidth="1" />
              <text x="160" y="100" fill="#475569" fontSize="11" fontFamily="monospace" fontWeight="bold">
                SECTOR 1 — NORTH ARTERIAL CORRIDOR
              </text>

              {/* Sector 4: Downtown Core */}
              <rect x="520" y="280" width="160" height="160" rx="16" fill="#0f1f38" stroke="#1d4ed8" strokeWidth="1" strokeDasharray="4,4" opacity="0.7" />
              <text x="600" y="305" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                METRO CORE
              </text>

              {/* Sector 2: East Harbor Link */}
              <path d="M 1060 40 C 1090 180, 1100 380, 1070 680" fill="none" stroke="#0e7490" strokeWidth="18" strokeLinecap="round" opacity="0.2" />
              <text x="1110" y="240" fill="#0891b2" fontSize="10" fontFamily="monospace" fontWeight="bold" transform="rotate(90 1110 240)">
                EAST HARBOR CHANNEL
              </text>

              {/* Sector 7: Medical Campus */}
              <rect x="900" y="500" width="160" height="160" rx="16" fill="#042724" stroke="#0d9488" strokeWidth="1.2" strokeDasharray="4,4" />
              <text x="980" y="525" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontFamily="monospace" fontWeight="bold">
                TRAUMA CAMPUS
              </text>
            </g>
          )}

          {/* 3. Multi-Lane Road Network (Asphalt Beds, Shoulders, Markings) */}
          <g className="roads-layer">
            {roads.map((road) => {
              const p1 = getNodePos(road.fromIntersectionId);
              const p2 = getNodePos(road.toIntersectionId);
              const visuals = getRoadVisuals(road);
              const isSelected = selectedRoadId === road.id;
              const isHovered = hoveredRoadId === road.id;
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              // Road angle & length
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
              const isHorizontal = Math.abs(dy) < 5;

              return (
                <g
                  key={road.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedRoadId(selectedRoadId === road.id ? null : road.id)}
                  onMouseEnter={() => setHoveredRoadId(road.id)}
                  onMouseLeave={() => setHoveredRoadId(null)}
                >
                  {/* Road Sub-Base / Curb Border */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={isSelected ? '#38bdf8' : isHovered ? '#0ea5e9' : '#1e293b'}
                    strokeWidth="38"
                    strokeLinecap="round"
                    className="transition-colors duration-150"
                  />

                  {/* Main Asphalt Bed */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#0b1220"
                    strokeWidth="32"
                    strokeLinecap="round"
                  />

                  {/* Road Outer Lane Guidelines */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#1e293b"
                    strokeWidth="28"
                    strokeLinecap="round"
                    strokeDasharray="none"
                    opacity="0.3"
                  />

                  {/* Yellow/White Center Dividing Line (Dashed) */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#334155"
                    strokeWidth="2.5"
                    strokeDasharray="12,14"
                    strokeLinecap="butt"
                  />

                  {/* Dynamic Traffic Flow State Overlay */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={visuals.stroke}
                    strokeWidth={visuals.width}
                    strokeDasharray={visuals.dash}
                    strokeLinecap="round"
                    opacity={visuals.glow ? 0.95 : 0.8}
                    filter={visuals.glow ? `url(#glow-${visuals.color === '#10b981' ? 'emerald' : visuals.color === '#ef4444' ? 'red' : visuals.color === '#f97316' ? 'amber' : 'cyan'})` : undefined}
                    className={road.status === 'EMERGENCY_CORRIDOR' ? 'animate-pulse' : ''}
                  />

                  {/* Directional Traffic Chevrons along Road */}
                  <g transform={`translate(${midX}, ${midY}) rotate(${angleDeg})`} opacity="0.35">
                    <path d="M -18 -5 L -10 0 L -18 5" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M 10 -5 L 18 0 L 10 5" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
                  </g>

                  {/* Road Center ID & Capacity Badge */}
                  {showRoadBadges && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      {/* Background pill */}
                      <rect
                        x="-30"
                        y="-12"
                        width="60"
                        height="24"
                        rx="12"
                        fill="#070d19"
                        stroke={isSelected ? '#38bdf8' : visuals.color}
                        strokeWidth={isSelected ? '2' : '1.2'}
                        className="transition-all"
                      />
                      {/* Road ID & Speed or Count */}
                      <text
                        x="0"
                        y="-1"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {road.id}
                      </text>
                      <text
                        x="0"
                        y="8"
                        textAnchor="middle"
                        fill={visuals.color}
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {filterMode === 'SPEED'
                          ? `${road.averageSpeedKmh}km/h`
                          : `${road.currentVehicleCount}/${road.capacity}`}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* 4. Moving Vehicle Particles with Directional Rotation */}
          {showVehicles && (
            <g className="vehicles-layer">
              {vehicles.map((v) => {
                const road = roads.find((r) => r.id === v.currentRoadId);
                if (!road || road.status === 'CLOSED') return null;

                const p1 = getNodePos(road.fromIntersectionId);
                const p2 = getNodePos(road.toIntersectionId);

                // Interpolate along road
                const curX = p1.x + (p2.x - p1.x) * v.progressOnRoad;
                const curY = p1.y + (p2.y - p1.y) * v.progressOnRoad;

                // Vehicle heading angle
                const angleDeg = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
                const isBus = v.type === 'BUS';

                return (
                  <g
                    key={v.id}
                    transform={`translate(${curX}, ${curY}) rotate(${angleDeg})`}
                    className="transition-transform duration-75"
                  >
                    {/* Vehicle Shadow */}
                    <rect
                      x={isBus ? -12 : -7}
                      y={isBus ? -6 : -4.5}
                      width={isBus ? 24 : 14}
                      height={isBus ? 12 : 9}
                      rx={isBus ? 3 : 2.5}
                      fill="#000000"
                      opacity="0.4"
                    />

                    {/* Vehicle Chassis */}
                    <rect
                      x={isBus ? -11 : -6.5}
                      y={isBus ? -5.5 : -4}
                      width={isBus ? 22 : 13}
                      height={isBus ? 11 : 8}
                      rx={isBus ? 2.5 : 2}
                      fill={isBus ? '#f59e0b' : v.color || '#38bdf8'}
                      stroke="#0f172a"
                      strokeWidth="1.2"
                    />

                    {/* Windshield */}
                    <rect
                      x={isBus ? 4 : 1.5}
                      y={isBus ? -4 : -3}
                      width={isBus ? 4 : 3}
                      height={isBus ? 8 : 6}
                      rx="1"
                      fill="#0f172a"
                    />

                    {/* Headlights beam */}
                    <polygon
                      points={`${isBus ? 11 : 6.5},-3 ${isBus ? 18 : 12},-6 ${isBus ? 18 : 12},6 ${isBus ? 11 : 6.5},3`}
                      fill="#fef08a"
                      opacity="0.25"
                    />

                    {/* Queued indicator */}
                    {v.isQueued && (
                      <circle cx="0" cy="0" r="10" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" className="animate-spin" />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* 5. Emergency Ambulance Unit (when en-route) */}
          {emergency && emergency.status === 'EN_ROUTE' && (
            (() => {
              const currentInterId = emergency.routeIntersectionIds[emergency.currentRouteIndex] || 'I1';
              const nextInterId = emergency.routeIntersectionIds[emergency.currentRouteIndex + 1] || 'HOSPITAL';
              const pA = getNodePos(currentInterId);
              const pB = getNodePos(nextInterId);
              const ambX = pA.x + (pB.x - pA.x) * emergency.progressToNext;
              const ambY = pA.y + (pB.y - pA.y) * emergency.progressToNext;
              const angleDeg = Math.atan2(pB.y - pA.y, pB.x - pA.x) * (180 / Math.PI);

              return (
                <g transform={`translate(${ambX}, ${ambY})`}>
                  {/* Rotating Emergency Wave Aura */}
                  <circle cx="0" cy="0" r="28" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.7" className="animate-ping" />
                  <circle cx="0" cy="0" r="18" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,3" className="animate-spin" />

                  {/* Vehicle Body rotated */}
                  <g transform={`rotate(${angleDeg})`}>
                    <rect x="-14" y="-8" width="28" height="16" rx="4" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                    <rect x="-8" y="-7" width="16" height="14" rx="2" fill="#ef4444" />
                    <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      +
                    </text>
                    {/* Flashing Beacon */}
                    <circle cx="-2" cy="-6" r="2" fill="#3b82f6" className="animate-pulse" />
                    <circle cx="2" cy="-6" r="2" fill="#ef4444" className="animate-pulse" />
                  </g>
                </g>
              );
            })()
          )}

          {/* 6. Metropolitan Trauma Center (Hospital Hub) */}
          {(() => {
            const pos = getNodePos('HOSPITAL');
            return (
              <g
                key="HOSPITAL"
                id="node-HOSPITAL"
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer group"
                onClick={() => onSelectIntersection('I8')}
              >
                {/* Helipad Ring */}
                <circle r="46" fill="#04201e" stroke="#0d9488" strokeWidth="2.5" />
                <circle r="36" fill="#052e2b" stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="6,4" />

                {/* Helipad "H" */}
                <text x="0" y="9" textAnchor="middle" fill="#5eead4" fontSize="26" fontWeight="bold" fontFamily="monospace">
                  H
                </text>

                {/* Medical Cross Badge */}
                <rect x="-12" y="-38" width="24" height="24" rx="6" fill="#0f766e" stroke="#2dd4bf" strokeWidth="1.5" />
                <text x="0" y="-22" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold" fontFamily="monospace">
                  +
                </text>

                {/* Facility Label */}
                <rect x="-65" y="48" width="130" height="22" rx="6" fill="#041a18" stroke="#0d9488" strokeWidth="1" />
                <text x="0" y="63" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  METRO TRAUMA CENTER
                </text>
              </g>
            );
          })()}

          {/* 7. 8 Intersection Nodes (Clean Geometric Layout, Dual Signal Heads, Timers) */}
          {intersections.map((intersection) => {
            const pos = getNodePos(intersection.id);
            const isSelected = selectedIntersectionId === intersection.id;
            const isHovered = hoveredNodeId === intersection.id;
            const isCorridor = intersection.isEmergencyCorridor;
            const isNSGreen = intersection.currentPhase === 'PHASE_A';
            const isEWGreen = intersection.currentPhase === 'PHASE_C';
            const isEmergencyGreen = intersection.currentPhase === 'EMERGENCY_GREEN';

            const nsColor = isEmergencyGreen ? '#10b981' : isNSGreen ? '#10b981' : '#ef4444';
            const ewColor = isEmergencyGreen ? '#10b981' : isEWGreen ? '#10b981' : '#ef4444';

            return (
              <g
                key={intersection.id}
                id={`node-${intersection.id}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectIntersection(intersection.id)}
                onMouseEnter={() => setHoveredNodeId(intersection.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer group select-none"
              >
                {/* Emergency Wave Rotation Aura */}
                {isCorridor && (
                  <circle
                    r="52"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeDasharray="8,6"
                    className="animate-spin"
                  />
                )}

                {/* Selection Ring */}
                {isSelected && (
                  <circle
                    r="48"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3.0"
                    strokeDasharray="6,4"
                    className="animate-pulse"
                  />
                )}

                {/* Hover Aura */}
                {isHovered && !isSelected && (
                  <circle r="46" fill="none" stroke="#0ea5e9" strokeWidth="1.8" opacity="0.6" />
                )}

                {/* Crosswalk Zebra Stripes around Intersection Approaches */}
                <g className="crosswalks opacity-50 pointer-events-none">
                  {/* North Crosswalk */}
                  <line x1="-24" y1="-38" x2="24" y2="-38" stroke="#f8fafc" strokeWidth="4" strokeDasharray="4,4" />
                  {/* South Crosswalk */}
                  <line x1="-24" y1="38" x2="24" y2="38" stroke="#f8fafc" strokeWidth="4" strokeDasharray="4,4" />
                  {/* West Crosswalk */}
                  <line x1="-38" y1="-24" x2="-38" y2="24" stroke="#f8fafc" strokeWidth="4" strokeDasharray="4,4" />
                  {/* East Crosswalk */}
                  <line x1="38" y1="-24" x2="38" y2="24" stroke="#f8fafc" strokeWidth="4" strokeDasharray="4,4" />
                </g>

                {/* Junction Housing Box (Rounded Square) */}
                <rect
                  x="-34"
                  y="-34"
                  width="68"
                  height="68"
                  rx="14"
                  fill="#070c18"
                  stroke={isSelected ? '#38bdf8' : isCorridor ? '#10b981' : isHovered ? '#0ea5e9' : '#1e293b'}
                  strokeWidth={isSelected ? '2.5' : '1.8'}
                  className="transition-all duration-150 group-hover:stroke-cyan-400"
                />

                {/* Dual LED Signal Lights Bar: North-South & East-West */}
                {/* NS Light */}
                <g transform="translate(-16, -18)">
                  <circle r="8" fill="#030712" stroke="#1f293d" strokeWidth="1.2" />
                  <circle r="5" fill={nsColor} filter={nsColor === '#10b981' ? 'url(#glow-emerald)' : 'url(#glow-red)'} />
                  <text x="0" y="14" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                    NS
                  </text>
                </g>

                {/* EW Light */}
                <g transform="translate(16, -18)">
                  <circle r="8" fill="#030712" stroke="#1f293d" strokeWidth="1.2" />
                  <circle r="5" fill={ewColor} filter={ewColor === '#10b981' ? 'url(#glow-emerald)' : 'url(#glow-red)'} />
                  <text x="0" y="14" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                    EW
                  </text>
                </g>

                {/* Center Node ID */}
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="14"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {intersection.id}
                </text>

                {/* Countdown Timer Pill */}
                <rect
                  x="-24"
                  y="12"
                  width="48"
                  height="16"
                  rx="5"
                  fill="#030712"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="24"
                  textAnchor="middle"
                  fill={isEmergencyGreen ? '#34d399' : '#38bdf8'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {Math.round(intersection.phaseTimeRemaining)}s
                </text>

                {/* Pedestrian Crossing Active Icon */}
                {intersection.pedestrianCrossing?.active && (
                  <g transform="translate(24, -24)">
                    <circle r="7" fill="#4338ca" stroke="#ffffff" strokeWidth="1" />
                    <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                      🚶
                    </text>
                  </g>
                )}

                {/* Queue Summary Pill Beneath Node */}
                <rect
                  x="-32"
                  y="38"
                  width="64"
                  height="16"
                  rx="6"
                  fill="#060c18"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="50"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {Math.round(
                    intersection.northSouthLane.queueLength + intersection.eastWestLane.queueLength
                  )}{' '}
                  veh
                </text>
              </g>
            );
          })}
        </svg>

        {/* 8. Floating Hover Telemetry Card */}
        {hoveredIntersection && (
          <div
            className="absolute z-20 pointer-events-none p-3 rounded-xl bg-[#0a101f]/95 border border-cyan-500/50 shadow-2xl backdrop-blur-md text-xs font-mono text-slate-200 transition-all duration-150 min-w-[260px]"
            style={{
              left: `${Math.min(72, Math.max(8, (getNodePos(hoveredIntersection.id).x / 1200) * 100))}%`,
              top: `${Math.min(65, Math.max(12, (getNodePos(hoveredIntersection.id).y / 720) * 100 - 15))}%`,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5 mb-2">
              <div>
                <span className="font-extrabold text-cyan-400 text-sm">{hoveredIntersection.id}</span>
                <span className="text-slate-400 ml-1.5 text-[11px] font-sans">
                  {METRO_NODES[hoveredIntersection.id]?.name || hoveredIntersection.name}
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold">
                {Math.round(hoveredIntersection.phaseTimeRemaining)}s remain
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div>
                <span className="text-slate-500">NS Queue: </span>
                <span className="text-white font-bold">
                  {Math.round(hoveredIntersection.northSouthLane.queueLength)} veh
                </span>
              </div>
              <div>
                <span className="text-slate-500">EW Queue: </span>
                <span className="text-white font-bold">
                  {Math.round(hoveredIntersection.eastWestLane.queueLength)} veh
                </span>
              </div>
              <div>
                <span className="text-slate-500">Avg Wait: </span>
                <span className="text-cyan-300 font-bold">
                  {Math.round(hoveredIntersection.northSouthLane.waitingTime)}s
                </span>
              </div>
              <div>
                <span className="text-slate-500">Opt Green: </span>
                <span className="text-emerald-400 font-bold">
                  {hoveredIntersection.optimizedGreenDuration}s
                </span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span className="text-cyan-400">Click node for deep inspection drawer</span>
              <span className="text-emerald-400 font-bold">QAOA Synced</span>
            </div>
          </div>
        )}

        {/* 9. Selected Road Quick Action Popover */}
        {selectedRoad && (
          <div className="absolute bottom-4 right-4 z-30 p-3.5 rounded-xl bg-[#090f1d]/95 border border-cyan-500/70 shadow-2xl backdrop-blur-md max-w-sm text-xs font-mono text-slate-200">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold text-xs">
                  {selectedRoad.id}
                </span>
                <span className="font-bold text-white text-xs">{selectedRoad.name}</span>
              </div>
              <button
                onClick={() => setSelectedRoadId(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
              <div>
                <span className="text-slate-500">Vehicles: </span>
                <span className="text-white font-bold">
                  {selectedRoad.currentVehicleCount} / {selectedRoad.capacity}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Avg Speed: </span>
                <span className="text-cyan-400 font-bold">{selectedRoad.averageSpeedKmh} km/h</span>
              </div>
              <div>
                <span className="text-slate-500">Congestion: </span>
                <span className={`font-bold ${selectedRoad.congestionLevel > 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedRoad.congestionLevel}%
                </span>
              </div>
              <div>
                <span className="text-slate-500">Status: </span>
                <span className="text-amber-300 font-bold">{selectedRoad.status}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
              <button
                onClick={onTriggerAccident}
                className="flex-1 px-2 py-1.5 rounded bg-orange-950/80 border border-orange-700/60 text-orange-300 hover:bg-orange-900 text-[11px] transition-colors"
              >
                Simulate Accident
              </button>
              <button
                onClick={onToggleRoadClosure}
                className="flex-1 px-2 py-1.5 rounded bg-rose-950/80 border border-rose-700/60 text-rose-300 hover:bg-rose-900 text-[11px] transition-colors"
              >
                Toggle Closure
              </button>
            </div>
          </div>
        )}

        {/* 10. Emergency Wave Active Banner */}
        {emergency && emergency.status === 'EN_ROUTE' && (
          <div className="absolute top-3 left-3 bg-[#13070b]/95 border border-red-500/80 text-white px-3.5 py-2.5 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-3 animate-pulse max-w-md">
            <div className="p-2.5 rounded-lg bg-red-600">
              <Ambulance className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-extrabold tracking-wide uppercase flex items-center gap-2 text-red-200 font-mono">
                <span>GREEN WAVE CORRIDOR ENGAGED</span>
                <span className="px-1.5 py-0.2 rounded bg-red-900 text-[10px]">PRIORITY</span>
              </div>
              <p className="text-[11px] text-red-300 font-mono mt-0.5">
                Path: I1 → I2 → I5 → I8 → Trauma Hub. Intersections cleared: {emergency.intersectionsCleared}/{emergency.totalIntersections}. ETA: {Math.round(emergency.etaSeconds)}s.
              </p>
            </div>
          </div>
        )}

        {/* 11. Bottom Technical Legend & Layer Toggles */}
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 bg-[#090e1a]/95 border border-slate-800/90 px-3 py-1.5 rounded-xl text-[11px] text-slate-400 font-mono backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
            <span>Optimal (&lt;35%)</span>
          </div>
          <span className="text-slate-700">│</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/40" />
            <span>Moderate (35-65%)</span>
          </div>
          <span className="text-slate-700">│</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/40" />
            <span>Heavy (65-82%)</span>
          </div>
          <span className="text-slate-700">│</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/40" />
            <span>Critical (&gt;82%)</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">│</span>
          <span className="text-slate-300 hidden sm:inline">
            Click any node or road to inspect
          </span>
        </div>
      </div>
    </div>
  );
};
