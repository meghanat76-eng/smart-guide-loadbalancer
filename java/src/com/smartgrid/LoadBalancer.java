package com.smartgrid;

import java.util.*;

/**
 * Core Load Balancing Engine (Java OOP implementation).
 *
 * Implements constrained greedy load balancing over graph adjacency edges:
 * 1. Prioritizes local intra-partition transfers to minimize tie-line losses.
 * 2. Uses boundary tie-lines for cross-partition balancing if local capacity is exhausted.
 * 3. Enforces hard safety invariants:
 *    - Strict physical edge connection
 *    - Transfer <= Source Overload
 *    - Transfer <= Target Available Spare Margin
 *    - Transfer <= Line Thermal Rating
 */
public class LoadBalancer {

    public static class BalancingResult {
        private final List<TransferRecommendation> recommendations;
        private final Map<String, Double> finalProjectedLoads;
        private final List<String> executionLogs;
        private final boolean allOverloadsResolved;
        private final double totalMegawattsShifted;

        public BalancingResult(List<TransferRecommendation> recommendations,
                               Map<String, Double> finalProjectedLoads,
                               List<String> executionLogs,
                               boolean allOverloadsResolved,
                               double totalMegawattsShifted) {
            this.recommendations = recommendations;
            this.finalProjectedLoads = finalProjectedLoads;
            this.executionLogs = executionLogs;
            this.allOverloadsResolved = allOverloadsResolved;
            this.totalMegawattsShifted = totalMegawattsShifted;
        }

        public List<TransferRecommendation> getRecommendations() { return recommendations; }
        public Map<String, Double> getFinalProjectedLoads() { return finalProjectedLoads; }
        public List<String> getExecutionLogs() { return executionLogs; }
        public boolean isAllOverloadsResolved() { return allOverloadsResolved; }
        public double getTotalMegawattsShifted() { return totalMegawattsShifted; }
    }

    // Maximum safe threshold target zone may reach post-transfer (e.g., 92% of capacity)
    private final double safeTargetUtilizationThreshold;

    public LoadBalancer() {
        this(0.92); // Keep target zones below 92% of capacity during relief
    }

    public LoadBalancer(double safeTargetUtilizationThreshold) {
        this.safeTargetUtilizationThreshold = safeTargetUtilizationThreshold;
    }

    /**
     * Balances load across the grid graph using forecast loads and divide-and-conquer partitions.
     */
    public BalancingResult balanceGrid(GridGraph graph, PartitionManager.PartitionTreeResult partitionTree) {
        List<TransferRecommendation> recommendations = new ArrayList<>();
        List<String> logs = new ArrayList<>();
        Map<String, Double> simulatedLoads = new HashMap<>();

        // Initialize simulation state with forecast loads
        for (GridZone zone : graph.getAllZones()) {
            simulatedLoads.put(zone.getId(), zone.getForecastLoadMw());
        }

        logs.add("[LoadBalancer] Initialized balancing pass across " + graph.getVertexCount() + " zones.");

        // Detect overloaded zones
        List<GridZone> overloadedZones = new ArrayList<>();
        for (GridZone zone : graph.getAllZones()) {
            double load = simulatedLoads.get(zone.getId());
            if (load > zone.getCapacityMw()) {
                overloadedZones.add(zone);
                logs.add(String.format("  * Overload Detected in [%s]: Forecast=%.2f MW, Capacity=%.2f MW (Overload=+%.2f MW)",
                        zone.getName(), load, zone.getCapacityMw(), load - zone.getCapacityMw()));
            }
        }

        if (overloadedZones.isEmpty()) {
            logs.add("[LoadBalancer] Nominal Grid Condition: All zones operate below maximum capacity. Zero transfers required.");
            return new BalancingResult(recommendations, simulatedLoads, logs, true, 0.0);
        }

        double totalShifted = 0.0;

        // Sort overloaded zones descending by excess load (relieve worst first)
        overloadedZones.sort((a, b) -> Double.compare(
                simulatedLoads.get(b.getId()) - b.getCapacityMw(),
                simulatedLoads.get(a.getId()) - a.getCapacityMw()
        ));

        // Process each overloaded zone
        for (GridZone source : overloadedZones) {
            String srcId = source.getId();
            double currentOverload = simulatedLoads.get(srcId) - source.getCapacityMw();

            if (currentOverload <= 0.001) continue;

            logs.add(String.format("[LoadBalancer] Evaluating relief paths for [%s] (Need to shed: %.2f MW)",
                    source.getName(), currentOverload));

            // Candidate neighbors directly connected in graph
            Set<String> neighborIds = graph.getNeighbors(srcId);
            List<GridZone> neighbors = new ArrayList<>();
            for (String nId : neighborIds) {
                neighbors.add(graph.getZone(nId));
            }

            // PHASE 1: Try Intra-Partition neighbors first (same cluster)
            List<GridZone> intraNeighbors = new ArrayList<>();
            List<GridZone> interNeighbors = new ArrayList<>();

            for (GridZone n : neighbors) {
                if (source.getPartitionId() != null && source.getPartitionId().equals(n.getPartitionId())) {
                    intraNeighbors.add(n);
                } else {
                    interNeighbors.add(n);
                }
            }

            // Sort intra neighbors by available spare headroom descending
            intraNeighbors.sort((a, b) -> Double.compare(
                    calculateSafeSpare(b, simulatedLoads.get(b.getId())),
                    calculateSafeSpare(a, simulatedLoads.get(a.getId()))
            ));

            // Execute intra-partition transfers
            for (GridZone target : intraNeighbors) {
                if (currentOverload <= 0.001) break;
                double shifted = executeTransfer(graph, source, target, currentOverload,
                        simulatedLoads, recommendations, logs, "INTRA_PARTITION");
                currentOverload -= shifted;
                totalShifted += shifted;
            }

            // PHASE 2: If overload remains, evaluate Inter-Partition neighbors across boundary tie-lines
            if (currentOverload > 0.001) {
                logs.add(String.format("  -> Intra-partition headroom exhausted for [%s]. Evaluating cross-tie lines...", source.getName()));
                interNeighbors.sort((a, b) -> Double.compare(
                        calculateSafeSpare(b, simulatedLoads.get(b.getId())),
                        calculateSafeSpare(a, simulatedLoads.get(a.getId()))
                ));

                for (GridZone target : interNeighbors) {
                    if (currentOverload <= 0.001) break;
                    double shifted = executeTransfer(graph, source, target, currentOverload,
                            simulatedLoads, recommendations, logs, "INTER_PARTITION");
                    currentOverload -= shifted;
                    totalShifted += shifted;
                }
            }

            if (currentOverload > 0.001) {
                logs.add(String.format("  [WARNING] Could not fully relieve zone [%s]. Residual overload: %.2f MW. Connected neighbors lack additional safe capacity.",
                        source.getName(), currentOverload));
            } else {
                logs.add(String.format("  [SUCCESS] Zone [%s] successfully relieved. Projected load is now within safe capacity.",
                        source.getName()));
            }
        }

        // Check if all overloads resolved
        boolean allResolved = true;
        for (GridZone z : graph.getAllZones()) {
            if (simulatedLoads.get(z.getId()) > z.getCapacityMw() + 0.01) {
                allResolved = false;
                break;
            }
        }

        logs.add(String.format("[LoadBalancer] Balancing plan generated: %d transfer(s), total %.2f MW transferred. All overloads relieved: %s",
                recommendations.size(), totalShifted, allResolved ? "YES" : "PARTIAL"));

        return new BalancingResult(recommendations, simulatedLoads, logs, allResolved, totalShifted);
    }

    private double executeTransfer(GridGraph graph, GridZone source, GridZone target,
                                  double neededReliefMw,
                                  Map<String, Double> simulatedLoads,
                                  List<TransferRecommendation> recommendations,
                                  List<String> logs,
                                  String transferType) {
        String srcId = source.getId();
        String tgtId = target.getId();

        double srcPreLoad = simulatedLoads.get(srcId);
        double tgtPreLoad = simulatedLoads.get(tgtId);
        double safeTargetSpare = calculateSafeSpare(target, tgtPreLoad);
        double lineLimit = graph.getLineCapacity(srcId, tgtId);

        if (safeTargetSpare <= 0.01) {
            logs.add(String.format("    - Neighbor [%s] has no safe spare capacity (Current load: %.1f MW / %.1f MW)",
                    target.getName(), tgtPreLoad, target.getCapacityMw()));
            return 0.0;
        }

        // Transfer amount is min(neededRelief, targetSpare, lineLimit)
        double transferMw = Math.min(neededReliefMw, Math.min(safeTargetSpare, lineLimit));

        if (transferMw <= 0.05) {
            return 0.0;
        }

        double srcPostLoad = srcPreLoad - transferMw;
        double tgtPostLoad = tgtPreLoad + transferMw;

        // Apply to simulated loads
        simulatedLoads.put(srcId, srcPostLoad);
        simulatedLoads.put(tgtId, tgtPostLoad);

        String reason = String.format("Transfer %.2f MW from %s to adjacent %s via %s (absorbed %.1f%% of available margin)",
                transferMw, source.getName(), target.getName(),
                transferType.equals("INTRA_PARTITION") ? "local subgrid line" : "inter-sector tie-line",
                (transferMw / target.getCapacityMw()) * 100.0);

        TransferRecommendation rec = new TransferRecommendation(
                srcId, source.getName(),
                tgtId, target.getName(),
                transferMw,
                srcPreLoad, srcPostLoad,
                tgtPreLoad, tgtPostLoad,
                source.getCapacityMw(), target.getCapacityMw(),
                srcPreLoad - source.getCapacityMw(),
                target.getCapacityMw() - tgtPreLoad,
                lineLimit,
                reason,
                transferType
        );

        recommendations.add(rec);
        logs.add(String.format("    + Recommended: Move %.2f MW [%s -> %s] (%s). New loads: %s=%.1f MW, %s=%.1f MW",
                transferMw, source.getName(), target.getName(), transferType,
                source.getName(), srcPostLoad, target.getName(), tgtPostLoad));

        return transferMw;
    }

    private double calculateSafeSpare(GridZone zone, double currentSimulatedLoad) {
        double maxSafeLoad = zone.getCapacityMw() * safeTargetUtilizationThreshold;
        return Math.max(0.0, maxSafeLoad - currentSimulatedLoad);
    }
}
