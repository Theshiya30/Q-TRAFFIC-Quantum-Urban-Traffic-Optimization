"""
Q-TRAFFIC: Quantum-Enhanced Adaptive Urban Traffic Optimization
Module: quantum_engine/qubo.py
Formulates the multi-intersection signal control problem as a Quadratic Unconstrained Binary Optimization (QUBO).
"""

from typing import Dict, List, Tuple, Optional
import numpy as np

class QUBOFormulator:
    """
    Constructs the QUBO matrix Q such that minimizing x^T Q x yields optimal signal configurations.
    Variables x_{i, p}:
        i: intersection index (0 to 7 for I1-I8)
        p: phase allocation (0: North-South priority, 1: East-West priority)
    """

    def __init__(self, num_intersections: int = 8):
        self.num_intersections = num_intersections
        self.num_qubits = num_intersections * 2
        self.P_conflict = 12.0  # Penalty for invalid phase conflicts
        self.w_queue = 1.8      # Weight for queue length
        self.w_wait = 1.4       # Weight for waiting time delay
        self.w_emerg = 8.5      # Weight for emergency green corridor priority
        self.w_coord = 2.2      # Reward for adjacent green wave coordination

    def build_qubo_matrix(
        self,
        intersection_data: List[Dict],
        road_adjacency: List[Tuple[int, int]],
        emergency_route: Optional[List[int]] = None
    ) -> Tuple[np.ndarray, List[str]]:
        """
        Builds the symmetric/upper-triangular QUBO matrix.
        Returns:
            Q (np.ndarray): (N x N) QUBO matrix where N = num_qubits
            variable_names (List[str]): Names of binary decision variables
        """
        N = self.num_qubits
        Q = np.zeros((N, N))
        var_names = []

        for i in range(self.num_intersections):
            var_names.append(f"x_I{i+1}_NS")
            var_names.append(f"x_I{i+1}_EW")

        # 1. Linear terms: Queue, delay, and emergency preemption
        for i, data in enumerate(intersection_data):
            idx_ns = i * 2
            idx_ew = i * 2 + 1

            ns_pressure = data.get("ns_queue", 10) * self.w_queue + data.get("ns_wait", 20) * self.w_wait * 0.1
            ew_pressure = data.get("ew_queue", 10) * self.w_queue + data.get("ew_wait", 20) * self.w_wait * 0.1

            # Minimization: favoring high pressure gives negative cost
            Q[idx_ns, idx_ns] = -ns_pressure + (0.35 * ew_pressure)
            Q[idx_ew, idx_ew] = -ew_pressure + (0.35 * ns_pressure)

            # Emergency corridor priority
            if emergency_route and i in emergency_route:
                # Ambulance priority wave: heavily bias towards the emergency traversal axis
                is_emergency_ns = data.get("is_emergency_ns", True)
                if is_emergency_ns:
                    Q[idx_ns, idx_ns] -= self.w_emerg * 12.0
                    Q[idx_ew, idx_ew] += self.w_emerg * 8.0
                else:
                    Q[idx_ew, idx_ew] -= self.w_emerg * 12.0
                    Q[idx_ns, idx_ns] += self.w_emerg * 8.0

            # 2. One-hot exclusivity constraint per intersection: (x_{i,NS} + x_{i,EW} - 1)^2
            # = x_NS^2 + x_EW^2 + 2 x_NS x_EW - 2 x_NS - 2 x_EW + 1
            # QUBO linear add -P, quadratic add +2P
            Q[idx_ns, idx_ns] -= self.P_conflict
            Q[idx_ew, idx_ew] -= self.P_conflict
            Q[idx_ns, idx_ew] += 2 * self.P_conflict
            Q[idx_ew, idx_ns] += 2 * self.P_conflict

        # 3. Arterial coordination between adjacent intersections
        for (u, v) in road_adjacency:
            if u < self.num_intersections and v < self.num_intersections:
                u_ns, u_ew = u * 2, u * 2 + 1
                v_ns, v_ew = v * 2, v * 2 + 1

                # Green wave reward for synchronized phase along corridor
                reward = -self.w_coord
                Q[u_ns, v_ns] += reward
                Q[v_ns, u_ns] += reward
                Q[u_ew, v_ew] += reward
                Q[v_ew, u_ew] += reward

        return Q, var_names

    def to_qiskit_quadratic_program(self, Q: np.ndarray, var_names: List[str]):
        """Converts raw QUBO matrix into a Qiskit Optimization QuadraticProgram."""
        try:
            from qiskit_optimization import QuadraticProgram
            qp = QuadraticProgram(name="TrafficSignalOptimization")
            for name in var_names:
                qp.binary_var(name=name)

            linear_dict = {var_names[i]: float(Q[i, i]) for i in range(len(var_names))}
            quadratic_dict = {}
            for i in range(len(var_names)):
                for j in range(i + 1, len(var_names)):
                    if abs(Q[i, j]) > 1e-4:
                        quadratic_dict[(var_names[i], var_names[j])] = float(Q[i, j] + Q[j, i])

            qp.minimize(linear=linear_dict, quadratic=quadratic_dict)
            return qp
        except ImportError:
            return None
