# SMART GRID LOAD BALANCER
### Forecasting and Balancing Electricity Loads Across Grid Zones

An educational microgrid load forecasting and autonomous balancing application designed for computer science and electrical engineering college presentations.

Integrates **Advanced Data Structures & Algorithms (ADSA)**, **Object-Oriented Programming in Java (OOPJ)**, and **Python Ordinary Least Squares (OLS) Machine Learning / Time-Series Regression**.

---

## 1. Project Concept & Architecture

A microgrid contains interconnected electrical zones (residential, commercial, industrial, harbor). Each zone has:
- Current load in Megawatts (MW)
- Maximum rated capacity (MW)
- Interconnection transmission lines (edges with thermal capacity limits)
- Historical sequential load readings ($T_{-5}$ to $T_0$)

### End-to-End System Workflow

```
[Java Subsystem]
  Exports historical time-series to `data/historical_loads.csv`
        │
        ▼
[Python Engine (`python/forecast.py`)]
  Computes Ordinary Least Squares (OLS) linear trend: y = m·x + b
  Projects near-future load (T+1) for each zone
  Writes results to `data/forecast_loads.csv`
        │
        ▼
[Java Subsystem (`com.smartgrid.SimulationRunner`)]
  Ingests `data/forecast_loads.csv`
  Executes Divide-and-Conquer Graph Partitioning (ADSA)
  Detects zones exceeding rated capacity
  Dispatches constrained greedy load transfers to adjacent zones
  Outputs `data/transfer_recommendations.csv`
        │
        ▼
[Full-Stack Web Console (React + TypeScript + Tailwind)]
  Interactive topology visualization, load trend charts,
  before/after matrix, and live scenario simulator
```

> **Educational Disclaimer**: This application is an educational simulation and calculation model. It does not interface with or command live high-voltage physical grid switchgear.

---

## 2. Directory Structure

```text
├── data/                                 # Shared CSV exchange files
│   ├── historical_loads.csv              # Java -> Python historical readings
│   ├── forecast_loads.csv                # Python -> Java regression predictions
│   └── transfer_recommendations.csv      # Java finalized transfer plan
│
├── java/                                 # Java OOPJ & ADSA Subsystem
│   ├── src/com/smartgrid/
│   │   ├── GridZone.java                 # Entity class modeling microgrid vertices
│   │   ├── GridGraph.java                # Undirected graph & adjacency list
│   │   ├── PartitionManager.java         # Divide & Conquer graph partitioning (ADSA)
│   │   ├── TransferRecommendation.java   # Transfer directive value object
│   │   ├── LoadBalancer.java             # Constrained greedy dispatch engine
│   │   ├── CsvManager.java               # File I/O & CSV serialization
│   │   └── SimulationRunner.java         # Executable CLI main demonstration
│   ├── build.sh                          # Compilation shell script (javac)
│   ├── run.sh                            # Execution shell script (java)
│   ├── Makefile                          # Standard make commands
│   └── README.md                         # Java documentation
│
├── python/                               # Python ML / Forecasting Engine
│   ├── forecast.py                       # OLS linear trend regression script
│   ├── test_forecast.py                  # Automated unittest suite
│   └── README.md                         # Mathematical derivations
│
├── src/                                  # Frontend Web Dashboard (React + TS)
│   ├── components/
│   │   ├── Sidebar.tsx                   # Fixed desktop / collapsible mobile navigation
│   │   ├── Header.tsx                    # Status indicators & simulation trigger
│   │   ├── Footer.tsx                    # Disclaimer & download utilities
│   │   ├── MetricCard.tsx                # High-contrast tabular telemetry cards
│   │   ├── GridTopologyGraph.tsx         # Interactive SVG microgrid graph & partitions
│   │   ├── HistoricalForecastChart.tsx   # SVG time-series chart with capacity limit
│   │   ├── ZoneModal.tsx                 # Zone detail inspector & load slider
│   │   └── CodeViewerModal.tsx           # In-app Java/Python source inspector
│   ├── pages/
│   │   ├── OverviewPage.tsx              # Executive operations landing dashboard
│   │   ├── GridMapPage.tsx               # Full-screen network topology & inspector
│   │   ├── ZonesPage.tsx                 # Searchable & sortable zone data table
│   │   ├── ForecastsPage.tsx             # Python regression analytics & formula guide
│   │   ├── TransferPlanPage.tsx          # Transfer schedule & before/after comparison
│   │   └── ProjectGuidePage.tsx          # Presentation script, theory, & glossary
│   ├── data/
│   │   └── initialGrid.ts                # Benchmark 6-zone topology dataset
│   ├── types.ts                          # Strict TypeScript data models
│   ├── App.tsx                           # Root application component
│   └── main.tsx                          # DOM mount point
│
├── server.ts                             # Express full-stack backend & Vite middleware
├── package.json                          # Dependencies & npm scripts
└── README.md                             # Project documentation
```

---

## 3. Academic Algorithms

### A. Divide and Conquer Graph Partitioning (ADSA)
* **Goal**: Partition microgrid graph $G = (V, E)$ into smaller autonomous regional subgrids of size $\le k$ (base threshold $k=3$) to localize transmission and limit inter-tie communications.
* **Base Case**: If $|V| \le 3$, return the subgrid as an autonomous sector.
* **Divide**: Split vertices into balanced subsets $V_A$ and $V_B$ minimizing cut edges.
* **Conquer**: Recursively solve $T(|V|/2)$ on each subgrid.
* **Combine**: Classify intra-partition circuits vs. boundary tie-lines (interties).
* **Time Complexity**:
  $$T(|V|) = 2 \cdot T(|V|/2) + O(|V| + |E|) = O((|V| + |E|) \log |V|)$$
  *(Proven by Case 2 of the Master Theorem)*.

### B. Ordinary Least Squares (OLS) Linear Regression (Python)
Given time-step readings $(x_1, y_1), \dots, (x_6, y_6)$ at $x \in \{1, 2, 3, 4, 5, 6\}$:
$$\text{Slope } m = \frac{n \sum (x_i y_i) - (\sum x_i)(\sum y_i)}{n \sum x_i^2 - (\sum x_i)^2}$$
$$\text{Intercept } b = \frac{\sum y_i - m \sum x_i}{n}$$
$$\text{Forecast (T+1)} = m \cdot 7 + b$$

### C. Constrained Greedy Load Balancing (Java)
1. **Adjacency Invariant**: Load can only be transferred between zones that share a direct graph edge in $E$.
2. **Transfer Limit Invariant**:
   $$\text{Transfer}(u \to v) = \min(\text{Overload}(u), \text{SafeSpare}(v), \text{LineRating}(u, v))$$
3. **Multi-Phase Priority**:
   - **Phase 1 (Intra-Partition)**: Absorb overload using neighbors within the same sector (avoids line losses and tie-line wear).
   - **Phase 2 (Inter-Partition)**: Route across boundary tie-lines if local sector headroom is exhausted.

---

## 4. Benchmark Sample Data

| Zone | Capacity (MW) | Current Load (MW) | Historical Readings ($T_{-5} \dots T_0$) | Forecast (T+1) | Status |
| :--- | :---: | :---: | :--- | :---: | :---: |
| **North** | 100 MW | 84 MW | `[0, 16, 33, 50, 68, 84]` | **101.13 MW** | **OVERLOADED** |
| **East** | 90 MW | 61 MW | `[45, 48, 51, 55, 58, 61]` | 64.40 MW | NORMAL |
| **Central** | 100 MW | 79 MW | `[50, 56, 62, 68, 74, 79]` | 85.33 MW | WATCH |
| **West** | 80 MW | 40 MW | `[32, 34, 35, 37, 39, 40]` | 41.87 MW | NORMAL |
| **South** | 100 MW | 82 MW | `[30, 42, 54, 66, 76, 82]` | 95.73 MW | WATCH |
| **Harbor** | 75 MW | 52 MW | `[42, 44, 46, 48, 50, 52]` | 54.00 MW | NORMAL |

**Physical Interconnections (Edges)**:
- North—East (35 MW limit)
- North—Central (35 MW limit)
- East—Central (30 MW limit)
- Central—West (25 MW limit, Inter-Partition Tie-Line)
- Central—South (35 MW limit, Inter-Partition Tie-Line)
- West—Harbor (25 MW limit)
- South—Harbor (30 MW limit)

**Resulting Transfer Recommendation**:
- **Source**: North (101.13 MW $\to$ 100.00 MW)
- **Target**: East (64.40 MW $\to$ 65.53 MW)
- **Transfer**: **1.13 MW** via direct North—East intra-subgrid transmission line
- **Outcome**: North overload fully relieved; all 6 zones operating safely within capacity!

---

## 5. Local Setup & Execution Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.8+)
- Java JDK (v11+ for local terminal execution; the web app runs in preview mode with simulated fallback if JDK is not in path)

### Running the Full-Stack Web Application
```bash
# 1. Install Node dependencies
npm install

# 2. Start full-stack development server (Express on port 3000)
npm run dev

# 3. Open in browser:
# http://localhost:3000
```

### Running the Python Forecaster Standalone
```bash
# Run forecaster on CSV files
python3 python/forecast.py data/historical_loads.csv data/forecast_loads.csv

# Run automated Python unit tests
python3 python/test_forecast.py
```

### Compiling & Running Java Engine Standalone
```bash
cd java

# Compile with bash script or make
bash build.sh
# or: make

# Execute simulation
bash run.sh
# or: make run
```

---

## 6. College Presentation / Demo Walkthrough

Follow this 6-step walkthrough during viva or project presentations:

1. **Overview Dashboard**: Present the 6-zone microgrid. Note that the North zone is undergoing an evening peak demand ramp (84 MW current).
2. **Grid Topology Map**: Show the graph vertices and transmission line edges. Toggle the "Partition Overlay" to illustrate Divide-and-Conquer bi-partitioning into Northern and Southern sectors.
3. **Run Simulation**: Click **Run Simulation**. Explain the automated data pipeline: Java exports historical CSV $\to$ Python executes OLS regression $\to$ Java ingests forecasts and detects North's 101.13 MW overload.
4. **Transfer Plan Inspection**: Navigate to **Transfer Plan**. Show that Java shifted 1.13 MW from North to adjacent East within the local sector, preserving inter-sector tie-lines.
5. **Scenario Testing**: Switch to **Heatwave Alert** in the top header and re-run. Observe multi-zone overloads (North and South) and how both local and cross-tie transfers activate.
6. **Code & Theory Verification**: Click **Inspect Source Files** in the sidebar to review `SimulationRunner.java`, `PartitionManager.java`, and `forecast.py` alongside the Master Theorem Big-O proof.
