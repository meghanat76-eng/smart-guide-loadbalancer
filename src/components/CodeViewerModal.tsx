import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Terminal } from 'lucide-react';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeFile, setActiveFile] = useState<string>('LoadBalancer.java');
  const [copied, setCopied] = useState<boolean>(false);

  const files: Record<string, { lang: string; title: string; category: string; code: string; desc: string }> = {
    'LoadBalancer.java': {
      lang: 'java',
      title: 'LoadBalancer.java',
      category: 'Java (OOPJ)',
      desc: 'Multi-phase constrained greedy load balancing over graph edges, prioritizing local intra-partition transfers.',
      code: `package com.smartgrid;

import java.util.*;

/**
 * Core Load Balancing Engine (Java OOP implementation).
 * Enforces graph adjacency, intra-partition priority, and line thermal ratings.
 */
public class LoadBalancer {
    private final double safeTargetUtilizationThreshold = 0.92;

    public BalancingResult balanceGrid(GridGraph graph, PartitionManager.PartitionTreeResult partitionTree) {
        List<TransferRecommendation> recommendations = new ArrayList<>();
        Map<String, Double> simulatedLoads = new HashMap<>();

        for (GridZone zone : graph.getAllZones()) {
            simulatedLoads.put(zone.getId(), zone.getForecastLoadMw());
        }

        List<GridZone> overloadedZones = new ArrayList<>();
        for (GridZone zone : graph.getAllZones()) {
            if (simulatedLoads.get(zone.getId()) > zone.getCapacityMw()) {
                overloadedZones.add(zone);
            }
        }

        // Relieve each overloaded zone via connected graph edges
        for (GridZone source : overloadedZones) {
            double currentOverload = simulatedLoads.get(source.getId()) - source.getCapacityMw();
            Set<String> neighborIds = graph.getNeighbors(source.getId());

            // Phase 1: Local Intra-Partition Neighbors first
            for (String nId : neighborIds) {
                if (currentOverload <= 0.01) break;
                GridZone target = graph.getZone(nId);
                if (source.getPartitionId().equals(target.getPartitionId())) {
                    double shifted = executeTransfer(graph, source, target, currentOverload, simulatedLoads, recommendations, "INTRA_PARTITION");
                    currentOverload -= shifted;
                }
            }

            // Phase 2: Inter-Partition Cross-Tie lines if overload remains
            if (currentOverload > 0.01) {
                for (String nId : neighborIds) {
                    if (currentOverload <= 0.01) break;
                    GridZone target = graph.getZone(nId);
                    if (!source.getPartitionId().equals(target.getPartitionId())) {
                        double shifted = executeTransfer(graph, source, target, currentOverload, simulatedLoads, recommendations, "INTER_PARTITION");
                        currentOverload -= shifted;
                    }
                }
            }
        }
        return new BalancingResult(recommendations, simulatedLoads);
    }
}`,
    },
    'PartitionManager.java': {
      lang: 'java',
      title: 'PartitionManager.java',
      category: 'Java (ADSA)',
      desc: 'Divide-and-Conquer recursive graph partitioning algorithm. Recurrence: T(V) = 2T(V/2) + O(V+E) = O((V+E) log V).',
      code: `package com.smartgrid;

import java.util.*;

/**
 * Advanced Data Structures & Algorithms (ADSA) Component:
 * Divide and Conquer Graph Partitioning.
 */
public class PartitionManager {
    private final int maxPartitionThreshold = 3;

    public PartitionTreeResult partition(GridGraph graph) {
        List<GridZone> allZones = new ArrayList<>(graph.getAllZones());
        List<Partition> partitions = new ArrayList<>();
        
        // Recursive divide-and-conquer call
        recursivePartition(graph, allZones, "PART", partitions, 0);

        List<String[]> tieLines = identifyBoundaryCutEdges(graph, partitions);
        return new PartitionTreeResult(partitions, tieLines);
    }

    private void recursivePartition(GridGraph graph, List<GridZone> currentZones,
                                    String idPrefix, List<Partition> result, int depth) {
        int n = currentZones.size();

        // BASE CASE: Size <= threshold (e.g. 3 zones)
        if (n <= maxPartitionThreshold) {
            Partition part = new Partition(idPrefix, "Subgrid " + idPrefix);
            for (GridZone z : currentZones) part.addZone(z);
            result.add(part);
            return;
        }

        // DIVIDE STEP: Bi-partition vertices into balanced sets
        int mid = n / 2;
        List<GridZone> subA = new ArrayList<>(currentZones.subList(0, mid));
        List<GridZone> subB = new ArrayList<>(currentZones.subList(mid, n));

        // CONQUER STEP: Recurse on subproblems
        recursivePartition(graph, subA, idPrefix + "_A", result, depth + 1);
        recursivePartition(graph, subB, idPrefix + "_B", result, depth + 1);
    }
}`,
    },
    'forecast.py': {
      lang: 'python',
      title: 'forecast.py',
      category: 'Python ML',
      desc: 'Ordinary Least Squares (OLS) Linear Regression for load forecasting across historical time-series.',
      code: `#!/usr/bin/env python3
"""
GridFlow Electricity Load Forecasting Engine
Uses Ordinary Least Squares (OLS) Linear Regression to project the next period's load.
"""
import sys
import csv

def calculate_linear_forecast(readings):
    n = len(readings)
    if n == 0: return 0.0, 0.0, 0.0
    if n == 1: return float(readings[0]), 0.0, float(readings[0])

    x_vals = list(range(1, n + 1))
    y_vals = [float(v) for v in readings]

    sum_x = sum(x_vals)
    sum_y = sum(y_vals)
    sum_xy = sum(x * y for x, y in zip(x_vals, y_vals))
    sum_x2 = sum(x * x for x in x_vals)

    denominator = (n * sum_x2 - sum_x * sum_x)
    m = (n * sum_xy - sum_x * sum_y) / denominator if denominator != 0 else 0.0
    b = (sum_y - m * sum_x) / n

    # Next step forecast: x = n + 1
    projected = m * (n + 1) + b
    return round(projected, 2), round(m, 2), round(b, 2)

def main():
    input_file = sys.argv[1] if len(sys.argv) > 1 else "data/historical_loads.csv"
    output_file = sys.argv[2] if len(sys.argv) > 2 else "data/forecast_loads.csv"
    
    # Reads historical CSV, computes forecast for all zones, writes forecast CSV
    # ...
`,
    },
    'GridGraph.java': {
      lang: 'java',
      title: 'GridGraph.java',
      category: 'Java (OOPJ)',
      desc: 'Adjacency list representation of microgrid vertices and transmission line capacity constraints.',
      code: `package com.smartgrid;

import java.util.*;

public class GridGraph {
    private final Map<String, GridZone> zones = new LinkedHashMap<>();
    private final Map<String, Set<String>> adjacencyList = new LinkedHashMap<>();
    private final Map<String, Double> lineCapacitiesMw = new HashMap<>();

    public void addZone(GridZone zone) {
        zones.put(zone.getId(), zone);
        adjacencyList.putIfAbsent(zone.getId(), new LinkedHashSet<>());
    }

    public void addEdge(String zoneA, String zoneB, double lineCapacityMw) {
        adjacencyList.get(zoneA).add(zoneB);
        adjacencyList.get(zoneB).add(zoneA);
        lineCapacitiesMw.put(zoneA + "<->" + zoneB, lineCapacityMw);
    }

    public boolean areConnected(String a, String b) {
        return adjacencyList.containsKey(a) && adjacencyList.get(a).contains(b);
    }
}`,
    },
    'SimulationRunner.java': {
      lang: 'java',
      title: 'SimulationRunner.java',
      category: 'Java Main',
      desc: 'End-to-end command-line executable that initializes the grid, exports CSV, invokes partitioning and balancing.',
      code: `package com.smartgrid;

public class SimulationRunner {
    public static void main(String[] args) {
        System.out.println("=== SMART GRID LOAD BALANCER ===");
        GridGraph graph = createSampleMicrogrid();
        CsvManager.exportHistoricalLoads(graph, "data/historical_loads.csv");
        CsvManager.importForecastLoads(graph, "data/forecast_loads.csv");

        PartitionManager pm = new PartitionManager(3);
        PartitionManager.PartitionTreeResult partitions = pm.partition(graph);

        LoadBalancer balancer = new LoadBalancer();
        LoadBalancer.BalancingResult result = balancer.balanceGrid(graph, partitions);

        CsvManager.exportTransferPlan(result.getRecommendations(), "data/transfer_recommendations.csv");
    }
}`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Project Source Code Inspector
              </h3>
              <p className="text-xs text-slate-400">
                Academic implementations in Java (OOPJ &amp; ADSA) and Python (OLS Forecaster)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab row */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/90 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {Object.keys(files).map((fName) => {
              const f = files[fName];
              const isActive = activeFile === fName;
              return (
                <button
                  key={fName}
                  onClick={() => setActiveFile(fName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {f.title}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors shrink-0 ml-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* File Description */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
          <span>{files[activeFile].desc}</span>
          <span className="text-[11px] font-mono text-blue-400 bg-blue-950/60 border border-blue-900/60 px-2 py-0.5 rounded">
            {files[activeFile].category}
          </span>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#0A0E17] font-mono text-xs text-slate-200 leading-relaxed">
          <pre>
            <code>{files[activeFile].code}</code>
          </pre>
        </div>

        {/* Bottom Run Command Helper */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-slate-300">
              Terminal: javac -d bin java/src/com/smartgrid/*.java &amp;&amp; java -cp bin com.smartgrid.SimulationRunner
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
