# GridFlow Java Microgrid Balancing Subsystem

This folder contains the Object-Oriented Programming (Java) and Advanced Data Structures & Algorithms (ADSA) core logic for the **Smart Grid Load Balancer**.

## Architecture & Responsibilities

1. **`GridZone.java`**:
   - Represents a node (vertex) in the electrical network.
   - Encapsulates capacity (MW), current load, historical time series, and forecast utilization.
   - Enforces business rules (cannot have negative load; capacity > 0).

2. **`GridGraph.java`**:
   - Adjacency-list based undirected graph modeling the microgrid.
   - Tracks transmission line thermal ratings / capacity constraints on edges.
   - Provides methods for finding neighbors, checking connectivity, and graph traversal.

3. **`PartitionManager.java` (ADSA Divide & Conquer)**:
   - Divides the grid into autonomous regional subgrids of size $\le$ base threshold.
   - Computes cut edges (inter-cluster tie-lines) vs intra-cluster circuits.
   - Recurrence relation: $T(V) = 2 T(V/2) + O(V + E) = O((V + E) \log V)$ by Master Theorem.

4. **`TransferRecommendation.java`**:
   - Immutable value object detailing a proposed simulated shift from an overloaded source to a recipient.
   - Tracks pre-transfer loads, post-transfer loads, transmission route, and human-readable explanation.

5. **`LoadBalancer.java`**:
   - Multi-phase constrained greedy load balancing engine.
   - Enforces graph adjacency: only directly connected neighbors can receive load.
   - Phase 1: Local intra-partition relief (minimizes boundary tie-line wear and line losses).
   - Phase 2: Inter-partition relief across tie-lines if local headroom is insufficient.
   - Respects line thermal limits and target safety thresholds.

6. **`CsvManager.java`**:
   - Ingests and serializes CSV files connecting Java and Python subsystems.

7. **`SimulationRunner.java`**:
   - Standalone CLI runner with ASCII tables, pipeline logs, and full terminal demonstration.

## How to Compile and Run Locally

```bash
# 1. Compile Java classes
bash build.sh
# or using make:
make

# 2. Run simulation
bash run.sh
# or using make:
make run
```
