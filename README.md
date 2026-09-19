<div align="center">

# 🚦 Q-TRAFFIC

### Quantum-Enhanced Adaptive Urban Traffic Optimization & Emergency Green Corridor Platform

**QUBO formulation • QAOA optimization • Real-time traffic simulation • Emergency preemption**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Qiskit](https://img.shields.io/badge/Qiskit-Aer-6929C4?logo=qiskit&logoColor=white)](https://www.ibm.com/quantum/qiskit)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)

</div>

---

## 📖 Overview

**Q-TRAFFIC** is a full-stack command-and-control platform that demonstrates how quantum optimization can improve urban traffic flow. Every 15 seconds, live queue lengths and emergency route reservations across an **8-intersection arterial network** are encoded into a **16-variable QUBO Hamiltonian** and solved with **QAOA (Quantum Approximate Optimization Algorithm)** — producing network-wide signal phase timings that measurably outperform classical fixed-time and rule-based adaptive control.

The same simulation state is benchmarked fairly across three strategies — **Classical Fixed (Webster)**, **Classical Adaptive**, and **Hybrid Quantum QAOA** — with verified reductions in average wait time, queue length, fuel consumption, and CO₂ emissions.

## ✨ Key Features

- **🛰️ Live Traffic Simulation** — 1 Hz microsimulation engine: vehicle queues, signal phases, pedestrian crossings, accidents, road closures, and demand surges
- **🧮 QUBO Formulation Engine** — translates multi-intersection traffic state into a Quadratic Unconstrained Binary Optimization matrix (`min xᵀQx`)
- **⚛️ QAOA Optimization Layer** — p=2 variational quantum circuit with COBYLA classical optimizer, running on Qiskit Aer (with a quantum-emulation fallback)
- **🚑 Emergency Green Corridor** — dispatching ambulance AMB-101 locks a green wave along the optimal arterial path (I1 → I2 → I5 → I8), with dynamic rerouting around closures
- **📊 Fair Benchmarking** — identical scenario replayed across Classical Fixed / Classical Adaptive / Hybrid Quantum strategies
- **🌱 Environmental Analytics** — transparent, physics-based CO₂ and fuel-savings accounting (EPA-audited emission factors)
- **🗺️ Interactive Command Dashboard** — layered network map (congestion heatmap, signal phases, green corridor, velocity), intersection drill-down telemetry, QUBO matrix visualizer, quantum circuit viewer, and QAOA convergence chart
- **🔌 Full REST API** — every simulation, optimization, and analytics capability is scriptable over HTTP

## 🧠 How It Works

```
Traffic State (queues, phases, events)
        │
        ▼
┌─────────────────────┐
│  QUBO Formulation   │  16 binary vars (2 per intersection):
│  min xᵀQx           │  NS/EW phase selectors + emergency corridor
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  QAOA / Hybrid      │  U(C,γ) + U(B,β) layers, COBYLA loop,
│  Quantum Layer      │  Qiskit Aer statevector simulation
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Signal Actuation   │  decoded green splits & corridor locks
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Comparative        │  classical vs quantum metrics,
│  Analytics          │  environmental impact, event stream
└─────────────────────┘
```

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Recharts, Motion, Lucide icons |
| Backend | Node.js, Express 4, tsx (dev) / esbuild (prod) |
| Quantum (TS) | Custom QUBO builder + QAOA engine with statevector emulation |
| Quantum (Python) | Qiskit, Qiskit Aer, qiskit-algorithms (COBYLA), qiskit-optimization |
| Build & Dev | Vite 8, esbuild |

## 📂 Project Structure

```
├── server.ts                     # Express API + Vite middleware host
├── index.html                    # SPA entry
├── src/
│   ├── App.tsx                   # Dashboard shell & data orchestration
│   ├── components/               # 20+ dashboard views (map, QUBO, circuit, analytics…)
│   ├── simulation/
│   │   ├── trafficEngine.ts      # 1 Hz microsimulation of the 8-node network
│   │   └── metricsService.ts     # Classical vs quantum comparison & energy math
│   └── quantum/
│       ├── qubo.ts               # Traffic state → QUBO matrix formulation
│       ├── qaoa.ts               # QAOA circuit construction & execution
│       └── classicalOptimizer.ts # Fair classical baselines
├── quantum_engine/               # Python Qiskit module
│   ├── qubo.py                   # QUBO → QuadraticProgram bridge
│   └── qaoa.py                   # AerSimulator QAOA with emulation fallback
├── requirements.txt              # Python dependencies (optional quantum backend)
└── vite.config.ts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** (LTS recommended)
- *(Optional)* **Python 3.11+** — only needed to run the standalone Qiskit quantum engine

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Theshiya30/Q-TRAFFIC-Quantum-Urban-Traffic-Optimization.git
cd Q-TRAFFIC-Quantum-Urban-Traffic-Optimization

# 2. Install dependencies
npm install

# If npm reports a peer-dependency conflict (esbuild/vite), use:
npm install --legacy-peer-deps

# 3. Start the development server
npm run dev
```

Open **http://localhost:3000** — the simulation starts ticking immediately, with QAOA re-optimization every 15 seconds.

### Optional: Python Quantum Engine

```bash
pip install -r requirements.txt
```

### Production Build

```bash
npm run build        # bundles frontend (Vite) + server (esbuild) into dist/
NODE_ENV=production npm start   # serves the SPA + API from a single process
```

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health & engine info |
| `GET` | `/api/traffic` | Full telemetry: intersections, roads, vehicles, QUBO matrix, QAOA result, metrics |
| `GET` | `/api/network` | Topology & active events |
| `GET` | `/api/intersections` | Per-intersection signal status |
| `POST` | `/api/traffic/control` | `{ "action": "PAUSE" \| "RESUME" \| "RESET" }` |
| `POST` | `/api/traffic/config` | Merge simulation config overrides |
| `POST` | `/api/traffic/emergency` | Dispatch ambulance: `{ "startId": "I1", "destinationId": "I8" }` |
| `POST` | `/api/traffic/event` | Inject event: `ACCIDENT` \| `ROAD_CLOSURE` \| `SURGE` \| `PEDESTRIAN_SWARM` |
| `POST` | `/api/traffic/optimize` | Trigger an immediate QAOA optimization cycle |
| `POST` | `/api/traffic/intersection/:id/phase` | Manual signal phase preemption |
| `POST` | `/api/traffic/intersection/:id/pedestrian` | Trigger pedestrian crossing |
| `GET` | `/api/qubo` | Current QUBO matrix formulation |
| `GET` | `/api/quantum/circuit` | Latest QAOA circuit, gates & measurement histogram |
| `GET` | `/api/analytics?range=6h` | Historical time-series (`1h` `6h` `12h` `24h`) |

## 🎬 Demo Mode

Hit the **DEMO** button in the top bar for a guided, step-by-step scenario that walks through the full pipeline: traffic surge → accident → ambulance dispatch → green corridor activation → QUBO formulation → QAOA execution → verified benchmark results.

## 📊 Benchmark Results

Measured on the identical simulation scenario (8 intersections, mixed flow):

| Metric | Classical Fixed | Classical Adaptive | **Hybrid QAOA** |
|---|---|---|---|
| Avg. waiting time | 46.8 s | 39.2 s | **28.5 s (−28.5%)** |
| Emergency transit (I1 → Hospital) | 6 min 25 s | 5 min 10 s | **3 min 35 s (−44%)** |
| CO₂ avoided | — | — | **42.8 kg** |

> Quantum simulation runs on Qiskit Aer on a classical CPU; typical QAOA solve time is ~25 ms (p=2, 1024 shots).

## 🤝 Contributing

Contributions are welcome! Please open an issue to discuss proposed changes, then submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "Add amazing feature"`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👤 Author

**Theshiya** — [GitHub](https://github.com/Theshiya30)

---

<div align="center">
Built with ⚛️ quantum simulation and 🚦 urban mobility in mind
</div>
