/**
 * Q-TRAFFIC: Quantum-Enhanced Adaptive Urban Traffic Optimization
 * Global Type Definitions
 */

export type TrafficCondition = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

export type SignalPhaseType = 'PHASE_A' | 'PHASE_B' | 'PHASE_C' | 'PHASE_D' | 'EMERGENCY_GREEN';

export interface SignalPhase {
  id: SignalPhaseType;
  name: string;
  northSouth: 'GREEN' | 'YELLOW' | 'RED';
  eastWest: 'GREEN' | 'YELLOW' | 'RED';
  pedestrian: 'WALK' | 'DONT_WALK';
  durationSeconds: number;
}

export interface Intersection {
  id: string;
  name: string;
  x: number; // visual coordinates (0-100% or pixels)
  y: number;
  northSouthLane: {
    queueLength: number;
    density: number; // 0 - 100%
    capacity: number;
    waitingTime: number; // seconds
    approachingVehicles: number;
  };
  eastWestLane: {
    queueLength: number;
    density: number;
    capacity: number;
    waitingTime: number;
    approachingVehicles: number;
  };
  pedestrianCrossing: {
    active: boolean;
    waitingCount: number;
    countdown: number;
  };
  currentPhase: SignalPhaseType;
  phaseTimeRemaining: number;
  currentGreenDuration: number;
  currentRedDuration: number;
  currentYellowDuration: number;
  optimizedGreenDuration: number;
  optimizedPhase: SignalPhaseType;
  isEmergencyCorridor: boolean;
  connectedRoadIds: string[];
}

export interface RoadSegment {
  id: string;
  name: string;
  fromIntersectionId: string;
  toIntersectionId: string;
  lengthMeters: number;
  capacity: number;
  currentVehicleCount: number;
  averageSpeedKmh: number;
  congestionLevel: number; // 0 - 100%
  status: 'OPEN' | 'CONGESTED' | 'ACCIDENT' | 'CLOSED' | 'EMERGENCY_CORRIDOR';
  direction: 'TWO_WAY' | 'ONE_WAY_FORWARD' | 'ONE_WAY_BACKWARD';
}

export interface Vehicle {
  id: string;
  type: 'CAR' | 'BUS' | 'TRUCK' | 'AMBULANCE';
  currentRoadId: string;
  targetIntersectionId: string;
  originIntersectionId: string;
  destinationIntersectionId: string;
  progressOnRoad: number; // 0 to 1
  speedKmh: number;
  waitingTimeSeconds: number;
  isQueued: boolean;
  color: string;
}

export interface EmergencyVehicle {
  id: string;
  type: 'AMBULANCE';
  status: 'IDLE' | 'DISPATCHED' | 'EN_ROUTE' | 'ARRIVED';
  startIntersectionId: string;
  destinationId: string;
  currentLocationId: string;
  routeIntersectionIds: string[];
  currentRouteIndex: number;
  progressToNext: number; // 0 to 1
  etaSeconds: number;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  greenCorridorActive: boolean;
  intersectionsCleared: number;
  totalIntersections: number;
  dispatchTimestamp: number;
  arrivalTimestamp?: number;
}

export interface TrafficEvent {
  id: string;
  type: 'SURGE' | 'ACCIDENT' | 'ROAD_CLOSURE' | 'EMERGENCY' | 'PEDESTRIAN_SWARM';
  name: string;
  description: string;
  targetId: string; // road or intersection id
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  active: boolean;
  timestamp: number;
  impactMetrics: {
    capacityReductionPct?: number;
    densityIncreasePct?: number;
  };
}

export interface QUBOVariable {
  index: number;
  name: string;
  intersectionId: string;
  phase: SignalPhaseType;
  timingCandidateSec: number;
  meaning: string;
  linearCost: number;
  isEmergencyCorridor: boolean;
}

export interface QUBOMatrix {
  variables: QUBOVariable[];
  size: number;
  matrix: number[][]; // size x size
  linearTerms: number[];
  quadraticTerms: { i: number; j: number; weight: number }[];
  constraintsDescription: string[];
  objectiveFormula: string;
  penaltyWeights: {
    conflictPenalty: number;
    cycleDurationPenalty: number;
    emergencyDelayWeight: number;
    queueWeight: number;
    waitingTimeWeight: number;
    fuelWeight: number;
    co2Weight: number;
  };
}

export interface QuantumGate {
  id: string;
  type: 'H' | 'RZ' | 'RX' | 'CX' | 'MEASURE';
  qubits: number[];
  paramName?: string;
  paramValue?: number;
  layer: number;
  description: string;
}

export type MeasurementSample = { bitstring: string; count: number; probability: number; energy: number };

export interface QAOAConvergencePoint {
  iteration: number;
  energy: number;
  bestEnergy: number;
  gamma: number;
  beta: number;
  stepSize: number;
  deltaToGround: number;
}

export interface QAOACircuit {
  qubitCount: number;
  depth: number;
  pLayers: number;
  gates: QuantumGate[];
  parameters: {
    gammas: number[];
    betas: number[];
  };
  measurementShots: number;
  measurementDistribution: MeasurementSample[];
  bestBitstring: string;
  groundStateEnergy: number;
  iterations: number;
  executionTimeMs: number;
  backendType: 'QISKIT_AER_SIMULATOR' | 'HYBRID_QAOA_EMULATOR' | 'QUANTUM_INSPIRED_ANNEALER';
  convergenceHistory?: QAOAConvergencePoint[];
}

export interface OptimizationResult {
  id: string;
  timestamp: number;
  algorithm: 'CLASSICAL_FIXED' | 'CLASSICAL_RULE_BASED' | 'QUANTUM_QAOA' | 'HYBRID_QUANTUM';
  backend: string;
  qubits: number;
  qaoaLayers: number;
  circuitDepth: number;
  shots: number;
  iterations: number;
  initialCost: number;
  optimizedCost: number;
  improvementPercentage: number;
  executionTimeMs: number;
  bestBitstring: string;
  signalTimings: Record<string, { greenDuration: number; phase: SignalPhaseType; offsetSeconds: number }>;
}

export interface StrategyMetrics {
  avgWaitingTimeSec: number;
  maxQueueLength: number;
  avgQueueLength: number;
  throughputVehPerHour: number;
  avgSpeedKmh: number;
  emergencyTravelTimeSec: number;
  fuelConsumptionLitersPerHour: number;
  co2EmissionsKgPerHour: number;
  optimizationTimeMs: number;
  quantumAdvantagePct?: number;
}

export interface ComparisonMetrics {
  classicalFixed: StrategyMetrics;
  classicalAdaptive: StrategyMetrics;
  hybridQuantum: StrategyMetrics & { quantumAdvantagePct: number };
}

export interface EnvironmentalMetrics {
  totalFuelSavedLiters: number;
  totalCo2AvoidedKg: number;
  idleTimeReducedHours: number;
  equivalentTreesPlanted: number;
  passengerHoursSaved: number;
  calculationFormulas: {
    fuelFormula: string;
    co2Formula: string;
    assumptions: string[];
  };
}

export interface SimulationConfig {
  speed: 0.5 | 1 | 2 | 5 | 10;
  baseArrivalRate: number; // vehicles/sec
  roadCapacityMultiplier: number;
  pedestrianDensity: number;
  scenario: 'NORMAL' | 'RUSH_HOUR' | 'ACCIDENT' | 'ROAD_CLOSURE' | 'EMERGENCY' | 'COMBINED_CRISIS';
  optimizerMode: 'CLASSICAL_FIXED' | 'CLASSICAL_ADAPTIVE' | 'QUANTUM_QAOA' | 'HYBRID';
  autoOptimizeIntervalSeconds: number;
}

export interface SimulationState {
  intersections: Intersection[];
  roads: RoadSegment[];
  vehicles: Vehicle[];
  emergencyVehicle: EmergencyVehicle | null;
  events: TrafficEvent[];
  comparisonMetrics: ComparisonMetrics;
  environmentalMetrics: EnvironmentalMetrics;
  quboMatrix: QUBOMatrix;
  qaoaCircuit: QAOACircuit;
  simulationTimeSeconds: number;
  config: SimulationConfig;
  totalVehiclesPassed: number;
  totalIdleSecondsAccumulated: number;
}
