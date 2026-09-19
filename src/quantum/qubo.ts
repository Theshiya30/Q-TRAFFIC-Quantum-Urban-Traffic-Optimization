/**
 * Q-TRAFFIC: QUBO Formulation Engine
 * Translates multi-intersection traffic states into a Quadratic Unconstrained Binary Optimization (QUBO) matrix.
 * Min x^T Q x, where x in {0, 1}^N
 */

import { Intersection, RoadSegment, EmergencyVehicle, QUBOMatrix, QUBOVariable, SignalPhaseType } from '../types';

export interface QUBOBuildParams {
  intersections: Intersection[];
  roads: RoadSegment[];
  emergency?: EmergencyVehicle | null;
  weights?: {
    waitingTimeWeight?: number;
    queueWeight?: number;
    congestionWeight?: number;
    emergencyDelayWeight?: number;
    coordinationWeight?: number;
    conflictPenalty?: number;
  };
}

export class QUBOEngine {
  /**
   * Builds the QUBO formulation for the 8-intersection network.
   * For each intersection i in {1..8}, we define candidate signal allocations:
   * x_{i,0}: North-South Priority (Phase A, 45s green)
   * x_{i,1}: East-West Priority (Phase C, 45s green)
   * x_{i,2}: Balanced Split (30s NS, 30s EW)
   * x_{i,3}: Emergency Green Corridor (Direct green wave for emergency vehicle)
   */
  public static buildQUBO(params: QUBOBuildParams): QUBOMatrix {
    const { intersections, roads, emergency, weights } = params;

    const wWait = weights?.waitingTimeWeight ?? 1.4;
    const wQueue = weights?.queueWeight ?? 1.8;
    const wCongest = weights?.congestionWeight ?? 1.2;
    const wEmerg = weights?.emergencyDelayWeight ?? 8.5;
    const wCoord = weights?.coordinationWeight ?? 2.2;
    const penaltyConflict = weights?.conflictPenalty ?? 12.0;

    const variables: QUBOVariable[] = [];

    // Construct 4 candidate variables per intersection (4 * 8 = 32 decision variables,
    // or condensed to 16 variables: 2 primary phase states per intersection with fine timing)
    // To allow real-time QAOA emulation and exact statevector evaluation, 16 qubits (2 per intersection)
    // represents:
    // x_{i,0}: 1 if NS is allocated dominant green (>35s), 0 otherwise
    // x_{i,1}: 1 if EW is allocated dominant green (>35s), 0 otherwise
    // (With x_{i,0} + x_{i,1} = 1 penalty constraint)
    intersections.forEach((intersection) => {
      const isEmergencyInvolved = emergency && emergency.status === 'EN_ROUTE' &&
        emergency.routeIntersectionIds.includes(intersection.id);

      variables.push({
        index: variables.length,
        name: `x_${intersection.id}_NS`,
        intersectionId: intersection.id,
        phase: 'PHASE_A',
        timingCandidateSec: 45,
        meaning: `${intersection.name} North-South Priority (45s Green)`,
        linearCost: 0,
        isEmergencyCorridor: Boolean(isEmergencyInvolved),
      });

      variables.push({
        index: variables.length,
        name: `x_${intersection.id}_EW`,
        intersectionId: intersection.id,
        phase: 'PHASE_C',
        timingCandidateSec: 45,
        meaning: `${intersection.name} East-West Priority (45s Green)`,
        linearCost: 0,
        isEmergencyCorridor: Boolean(isEmergencyInvolved),
      });
    });

    const N = variables.length;
    const matrix: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
    const linearTerms: number[] = Array(N).fill(0);
    const quadraticTerms: { i: number; j: number; weight: number }[] = [];

    // Calculate Linear and Quadratic Weights
    for (let idx = 0; idx < N; idx++) {
      const v = variables[idx];
      const inter = intersections.find(it => it.id === v.intersectionId)!;
      const isNS = v.phase === 'PHASE_A';

      // Traffic pressures
      const nsPressure = (inter.northSouthLane.queueLength * wQueue) +
                         (inter.northSouthLane.waitingTime * wWait * 0.1) +
                         (inter.northSouthLane.density * wCongest * 0.2);

      const ewPressure = (inter.eastWestLane.queueLength * wQueue) +
                         (inter.eastWestLane.waitingTime * wWait * 0.1) +
                         (inter.eastWestLane.density * wCongest * 0.2);

      // We want to MINIMIZE C(x).
      // Selecting NS (x_NS = 1) reduces NS queue -> lower cost (-nsPressure).
      // Selecting EW (x_EW = 1) reduces EW queue -> lower cost (-ewPressure).
      // If EW queue is starving, selecting NS increases overall penalty (+ewPressure).
      let linearCost = 0;
      if (isNS) {
        linearCost = -nsPressure + (ewPressure * 0.4);
      } else {
        linearCost = -ewPressure + (nsPressure * 0.4);
      }

      // Emergency Vehicle Priority:
      // If ambulance is approaching this intersection along the route,
      // determine which direction the ambulance needs (NS vs EW along the grid).
      if (emergency && emergency.status === 'EN_ROUTE' && emergency.routeIntersectionIds.includes(inter.id)) {
        const currIndex = emergency.routeIntersectionIds.indexOf(inter.id);
        const nextId = emergency.routeIntersectionIds[currIndex + 1];
        const prevId = emergency.routeIntersectionIds[currIndex - 1];

        // Determine road orientation connecting to this intersection deterministically
        const nextNode = intersections.find(it => it.id === nextId);
        const prevNode = intersections.find(it => it.id === prevId);

        let emergencyDirectionIsNS = false;
        if (nextNode) {
          emergencyDirectionIsNS = Math.abs(nextNode.y - inter.y) >= Math.abs(nextNode.x - inter.x);
        } else if (prevNode) {
          emergencyDirectionIsNS = Math.abs(inter.y - prevNode.y) >= Math.abs(inter.x - prevNode.x);
        }

        // Heavy reward (large negative coefficient) for giving green to emergency direction
        if ((emergencyDirectionIsNS && isNS) || (!emergencyDirectionIsNS && !isNS)) {
          linearCost -= (wEmerg * 15.0);
        } else {
          linearCost += (wEmerg * 10.0);
        }
      }

      // Store normalized linear term
      linearTerms[idx] = parseFloat(linearCost.toFixed(3));
      matrix[idx][idx] = linearTerms[idx];
    }

    // Constraint 1: One-Hot Constraint per intersection
    // For intersection i: (x_{i,NS} + x_{i,EW} - 1)^2 = x_{i,NS}^2 + x_{i,EW}^2 + 2 x_{i,NS} x_{i,EW} - 2 x_{i,NS} - 2 x_{i,EW} + 1
    // In QUBO, x^2 = x for binary variables.
    // Penalty = P * (x_{i,NS} + x_{i,EW} - 1)^2
    // -> Add -P to linear terms x_{i,NS} and x_{i,EW}
    // -> Add +2P to quadratic term x_{i,NS} * x_{i,EW}
    for (let i = 0; i < N; i += 2) {
      const p = penaltyConflict;
      matrix[i][i] -= p;
      matrix[i + 1][i + 1] -= p;
      linearTerms[i] -= p;
      linearTerms[i + 1] -= p;

      // Quadratic conflict penalty: simultaneous green is impossible and dangerous
      matrix[i][i + 1] += (2 * p);
      matrix[i + 1][i] += (2 * p);
      quadraticTerms.push({ i, j: i + 1, weight: 2 * p });
    }

    // Constraint 2: Arterial Green Wave Coordination (Coupling between adjacent intersections)
    // If intersection i and neighbor j share an arterial road, coordinating green phases creates a green wave.
    // Reward -wCoord * x_i * x_j
    roads.forEach((road) => {
      if (road.status === 'CLOSED') return; // no coordination across closed roads

      const fromInter = intersections.find(it => it.id === road.fromIntersectionId);
      const toInter = intersections.find(it => it.id === road.toIntersectionId);
      if (!fromInter || !toInter) return;

      const fromIdx = intersections.findIndex(it => it.id === fromInter.id) * 2;
      const toIdx = intersections.findIndex(it => it.id === toInter.id) * 2;

      // Check if road is predominantly North-South or East-West
      const isRoadNS = Math.abs(toInter.y - fromInter.y) > Math.abs(toInter.x - fromInter.x);
      const targetOffset = isRoadNS ? 0 : 1; // 0 = NS, 1 = EW

      const varI = fromIdx + targetOffset;
      const varJ = toIdx + targetOffset;

      if (varI < N && varJ < N && varI !== varJ) {
        // Reward green wave synchronization (-wCoord)
        const coordReward = -wCoord * (road.congestionLevel > 50 ? 1.5 : 1.0);
        matrix[varI][varJ] += coordReward;
        matrix[varJ][varI] += coordReward;
        quadraticTerms.push({ i: varI, j: varJ, weight: coordReward });
      }
    });

    return {
      variables,
      size: N,
      matrix,
      linearTerms,
      quadraticTerms,
      constraintsDescription: [
        'Phase Exclusivity: Exactly one dominant green phase per intersection (penalty weight = 12.0)',
        'Emergency Preemption: High priority green wave for emergency corridor on active route (weight = 8.5)',
        'Arterial Green Wave: Negative quadratic coupling between neighboring intersections along congested roads (weight = 2.2)',
        'Queue Starvation Minimization: Linear cost proportional to approaching queue and wait times',
      ],
      objectiveFormula: 'Min C(x) = ∑ Q_ii x_i + ∑ 2 Q_ij x_i x_j + P_conflict ∑ (x_{i,NS} + x_{i,EW} - 1)²',
      penaltyWeights: {
        conflictPenalty: penaltyConflict,
        cycleDurationPenalty: 5.0,
        emergencyDelayWeight: wEmerg,
        queueWeight: wQueue,
        waitingTimeWeight: wWait,
        fuelWeight: 1.1,
        co2Weight: 1.3,
      },
    };
  }

  /**
   * Calculates the exact energy/cost of a candidate bitstring: E = x^T Q x
   */
  public static evaluateBitstringEnergy(bitstring: string, qubo: QUBOMatrix): number {
    const x = bitstring.split('').map(b => parseInt(b, 10));
    let energy = 0;
    const N = qubo.size;

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (x[i] === 1 && x[j] === 1) {
          energy += qubo.matrix[i][j];
        }
      }
    }
    return parseFloat(energy.toFixed(3));
  }

  /**
   * Decodes a bitstring into optimized traffic signal configurations for all 8 intersections.
   */
  public static decodeBitstringToSignals(
    bitstring: string,
    qubo: QUBOMatrix,
    intersections: Intersection[]
  ): Record<string, { greenDuration: number; phase: SignalPhaseType; offsetSeconds: number }> {
    const results: Record<string, { greenDuration: number; phase: SignalPhaseType; offsetSeconds: number }> = {};
    const x = bitstring.split('').map(b => parseInt(b, 10));

    intersections.forEach((intersection, idx) => {
      const nsVarIdx = idx * 2;
      const ewVarIdx = idx * 2 + 1;

      const nsActive = x[nsVarIdx] === 1;
      const ewActive = x[ewVarIdx] === 1;

      let chosenPhase: SignalPhaseType = 'PHASE_A';
      let greenDuration = 35;
      let offsetSeconds = (idx % 3) * 4;

      if (intersection.isEmergencyCorridor) {
        chosenPhase = 'EMERGENCY_GREEN';
        greenDuration = 55;
      } else if (nsActive && !ewActive) {
        chosenPhase = 'PHASE_A'; // NS Green
        // Scale green duration based on NS vs EW queue ratio
        const nsQueue = intersection.northSouthLane.queueLength;
        const ewQueue = intersection.eastWestLane.queueLength;
        greenDuration = Math.min(60, Math.max(15, Math.round(30 + (nsQueue - ewQueue) * 0.8)));
      } else if (ewActive && !nsActive) {
        chosenPhase = 'PHASE_C'; // EW Green
        const nsQueue = intersection.northSouthLane.queueLength;
        const ewQueue = intersection.eastWestLane.queueLength;
        greenDuration = Math.min(60, Math.max(15, Math.round(30 + (ewQueue - nsQueue) * 0.8)));
      } else {
        // Tie-breaker or fallback to balanced phase
        chosenPhase = intersection.northSouthLane.queueLength >= intersection.eastWestLane.queueLength
          ? 'PHASE_A'
          : 'PHASE_C';
        greenDuration = 30;
      }

      results[intersection.id] = {
        phase: chosenPhase,
        greenDuration,
        offsetSeconds,
      };
    });

    return results;
  }
}
