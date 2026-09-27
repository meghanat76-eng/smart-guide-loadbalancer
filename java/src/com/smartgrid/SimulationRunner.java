package com.smartgrid;

import java.io.File;
import java.util.Arrays;
import java.util.List;

/**
 * Main Executable Class for College Project Demo & Academic Presentation.
 *
 * Demonstrates:
 * 1. Object-Oriented Modeling of Microgrid Entities (OOPJ)
 * 2. Integration with Python Linear Regression Forecast Engine
 * 3. Divide-and-Conquer Graph Partitioning (ADSA)
 * 4. Constrained Load Balancing Across Graph Edges
 */
public class SimulationRunner {

    public static GridGraph createSampleMicrogrid() {
        GridGraph graph = new GridGraph();

        // 1. Add Vertices (Zones with capacities and current loads as specified in brief)
        GridZone north = new GridZone("North", "North", 100.0, 84.0);
        north.setHistoricalLoads(Arrays.asList(0.0, 16.0, 33.0, 50.0, 68.0, 84.0));

        GridZone east = new GridZone("East", "East", 90.0, 61.0);
        east.setHistoricalLoads(Arrays.asList(45.0, 48.0, 51.0, 55.0, 58.0, 61.0));

        GridZone central = new GridZone("Central", "Central", 100.0, 79.0);
        central.setHistoricalLoads(Arrays.asList(50.0, 56.0, 62.0, 68.0, 74.0, 79.0));

        GridZone west = new GridZone("West", "West", 80.0, 40.0);
        west.setHistoricalLoads(Arrays.asList(32.0, 34.0, 35.0, 37.0, 39.0, 40.0));

        GridZone south = new GridZone("South", "South", 100.0, 82.0);
        south.setHistoricalLoads(Arrays.asList(30.0, 42.0, 54.0, 66.0, 76.0, 82.0));

        GridZone harbor = new GridZone("Harbor", "Harbor", 75.0, 52.0);
        harbor.setHistoricalLoads(Arrays.asList(42.0, 44.0, 46.0, 48.0, 50.0, 52.0));

        graph.addZone(north);
        graph.addZone(east);
        graph.addZone(central);
        graph.addZone(west);
        graph.addZone(south);
        graph.addZone(harbor);

        // 2. Add Physical Transmission Lines (Edges) as specified in brief:
        // North—East, North—Central, East—Central, Central—West, Central—South, West—Harbor, South—Harbor
        graph.addEdge("North", "East", 35.0);
        graph.addEdge("North", "Central", 35.0);
        graph.addEdge("East", "Central", 30.0);
        graph.addEdge("Central", "West", 25.0);
        graph.addEdge("Central", "South", 35.0);
        graph.addEdge("West", "Harbor", 25.0);
        graph.addEdge("South", "Harbor", 30.0);

        return graph;
    }

    public static void main(String[] args) {
        System.out.println("================================================================================");
        System.out.println("               SMART GRID LOAD BALANCER - SIMULATION ENGINE                     ");
        System.out.println("              Forecasting & Balancing Electricity Loads Across Zones           ");
        System.out.println("================================================================================");

        String historicalCsv = args.length > 0 ? args[0] : "data/historical_loads.csv";
        String forecastCsv = args.length > 1 ? args[1] : "data/forecast_loads.csv";
        String transferCsv = args.length > 2 ? args[2] : "data/transfer_recommendations.csv";

        try {
            // STEP 1: Initialize Grid
            System.out.println("\n[1/5] Building Microgrid Topology Graph G = (V, E)...");
            GridGraph graph = createSampleMicrogrid();
            System.out.printf("      Graph initialized with |V| = %d zones, |E| = %d transmission lines.%n",
                    graph.getVertexCount(), graph.getEdgeCount());

            // STEP 2: Export Historical Readings for Python Forecaster
            System.out.println("\n[2/5] Exporting Historical Load Time-Series to: " + historicalCsv);
            CsvManager.exportHistoricalLoads(graph, historicalCsv);
            System.out.println("      CSV export completed successfully.");

            // STEP 3: Import Forecast from Python (or fallback if file missing)
            System.out.println("\n[3/5] Ingesting Forecast CSV from Python Engine: " + forecastCsv);
            File fFile = new File(forecastCsv);
            if (fFile.exists()) {
                CsvManager.importForecastLoads(graph, forecastCsv);
                System.out.println("      Successfully imported Python regression forecasts.");
            } else {
                System.out.println("      [INFO] Forecast CSV not found yet. Using local linear projection.");
                for (GridZone z : graph.getAllZones()) {
                    List<Double> h = z.getHistoricalLoads();
                    if (h.size() >= 2) {
                        double delta = h.get(h.size() - 1) - h.get(h.size() - 2);
                        z.setForecastLoadMw(z.getCurrentLoadMw() + delta);
                    }
                }
            }

            // Print Forecast Summary Table
            System.out.println("\n--------------------------------------------------------------------------------");
            System.out.printf("%-10s | %-12s | %-12s | %-12s | %-10s | %-10s%n",
                    "Zone", "Capacity(MW)", "Current(MW)", "Forecast(MW)", "Util(%)", "Status");
            System.out.println("--------------------------------------------------------------------------------");
            for (GridZone z : graph.getAllZones()) {
                System.out.printf("%-10s | %10.1f MW | %10.1f MW | %10.1f MW | %9.1f%% | %-10s%n",
                        z.getName(), z.getCapacityMw(), z.getCurrentLoadMw(),
                        z.getForecastLoadMw(), z.getUtilizationPercentage(), z.getStatus());
            }
            System.out.println("--------------------------------------------------------------------------------");

            // STEP 4: Advanced Data Structures & Algorithms - Divide & Conquer Partitioning
            System.out.println("\n[4/5] Executing ADSA Divide-and-Conquer Graph Partitioning...");
            PartitionManager partitionManager = new PartitionManager(3);
            PartitionManager.PartitionTreeResult tree = partitionManager.partition(graph);
            System.out.println("      " + tree.getAlgorithmExplanation());

            for (PartitionManager.Partition p : tree.getPartitions()) {
                System.out.printf("      * %-25s: Zones=%s, Cap=%.1f MW, Load=%.1f MW, Headroom=%.1f MW%n",
                        p.getName(), p.getZoneIds(), p.getTotalCapacity(), p.getTotalLoad(), p.getSurplusCapacity());
            }
            System.out.println("      Boundary Tie-Lines (Cut Edges):");
            for (String[] tie : tree.getTieLineEdges()) {
                System.out.printf("        - [%s <==> %s] (Inter-Partition Bridge)%n", tie[0], tie[1]);
            }

            // STEP 5: Constrained Load Balancing
            System.out.println("\n[5/5] Executing Load Balancing Engine...");
            LoadBalancer balancer = new LoadBalancer();
            LoadBalancer.BalancingResult result = balancer.balanceGrid(graph, tree);

            System.out.println("\n================================================================================");
            System.out.println("                      RECOMMENDED LOAD BALANCING PLAN                           ");
            System.out.println("================================================================================");
            List<TransferRecommendation> recs = result.getRecommendations();
            if (recs.isEmpty()) {
                System.out.println("  [NO ACTION NEEDED] All zones operating safely within capacity limits.");
            } else {
                for (int i = 0; i < recs.size(); i++) {
                    TransferRecommendation r = recs.get(i);
                    System.out.printf("  Recommendation #%d:%n", i + 1);
                    System.out.printf("    Route       : [%s] ===[ %.2f MW ]===> [%s] (%s)%n",
                            r.getSourceZoneName(), r.getTransferMw(), r.getTargetZoneName(), r.getTransferType());
                    System.out.printf("    Source Pre  : %.1f MW / %.1f MW (Overload: +%.2f MW)%n",
                            r.getSourcePreLoadMw(), r.getSourceCapacityMw(), r.getSourcePreOverloadMw());
                    System.out.printf("    Source Post : %.1f MW / %.1f MW (Util: %.1f%%)%n",
                            r.getSourcePostLoadMw(), r.getSourceCapacityMw(), r.getSourcePostUtilization());
                    System.out.printf("    Target Pre  : %.1f MW / %.1f MW (Spare: %.2f MW)%n",
                            r.getTargetPreLoadMw(), r.getTargetCapacityMw(), r.getTargetPreSpareMw());
                    System.out.printf("    Target Post : %.1f MW / %.1f MW (Util: %.1f%%)%n",
                            r.getTargetPostLoadMw(), r.getTargetCapacityMw(), r.getTargetPostUtilization());
                    System.out.printf("    Reason      : %s%n", r.getReason());
                    System.out.println();
                }
            }

            // Export to CSV
            CsvManager.exportTransferPlan(recs, transferCsv);
            System.out.println("  Exported Transfer Plan to: " + transferCsv);
            System.out.printf("  Summary: Relieved %s overloads with %.2f MW total load redistribution.%n",
                    result.isAllOverloadsResolved() ? "ALL" : "PARTIAL", result.getTotalMegawattsShifted());
            System.out.println("================================================================================");

        } catch (Exception e) {
            System.err.println("[ERROR] Simulation failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
