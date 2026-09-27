package com.smartgrid;

import java.util.*;

/**
 * Models the microgrid as an undirected graph G = (V, E)
 * where V is the set of GridZones (vertices) and E is the set of
 * physical transmission interconnections (edges).
 */
public class GridGraph {
    private final Map<String, GridZone> zones;
    private final Map<String, Set<String>> adjacencyList;
    private final Map<String, Double> lineCapacitiesMw; // Edge limit for physical safety

    public static final double DEFAULT_LINE_CAPACITY_MW = 30.0;

    public GridGraph() {
        this.zones = new LinkedHashMap<>();
        this.adjacencyList = new LinkedHashMap<>();
        this.lineCapacitiesMw = new HashMap<>();
    }

    public void addZone(GridZone zone) {
        if (zone == null) throw new IllegalArgumentException("Zone cannot be null");
        zones.put(zone.getId(), zone);
        adjacencyList.putIfAbsent(zone.getId(), new LinkedHashSet<>());
    }

    public void addEdge(String zoneA, String zoneB) {
        addEdge(zoneA, zoneB, DEFAULT_LINE_CAPACITY_MW);
    }

    public void addEdge(String zoneA, String zoneB, double lineCapacityMw) {
        if (!zones.containsKey(zoneA) || !zones.containsKey(zoneB)) {
            throw new IllegalArgumentException(String.format("Both zones must exist. Found: %s, %s", zoneA, zoneB));
        }
        adjacencyList.get(zoneA).add(zoneB);
        adjacencyList.get(zoneB).add(zoneA);

        String edgeKey1 = getEdgeKey(zoneA, zoneB);
        String edgeKey2 = getEdgeKey(zoneB, zoneA);
        lineCapacitiesMw.put(edgeKey1, lineCapacityMw);
        lineCapacitiesMw.put(edgeKey2, lineCapacityMw);
    }

    public boolean areConnected(String zoneA, String zoneB) {
        return adjacencyList.containsKey(zoneA) && adjacencyList.get(zoneA).contains(zoneB);
    }

    public Set<String> getNeighbors(String zoneId) {
        return Collections.unmodifiableSet(adjacencyList.getOrDefault(zoneId, Collections.emptySet()));
    }

    public GridZone getZone(String zoneId) {
        return zones.get(zoneId);
    }

    public Collection<GridZone> getAllZones() {
        return Collections.unmodifiableCollection(zones.values());
    }

    public double getLineCapacity(String zoneA, String zoneB) {
        return lineCapacitiesMw.getOrDefault(getEdgeKey(zoneA, zoneB), DEFAULT_LINE_CAPACITY_MW);
    }

    public int getVertexCount() {
        return zones.size();
    }

    public int getEdgeCount() {
        int total = 0;
        for (Set<String> neighbors : adjacencyList.values()) {
            total += neighbors.size();
        }
        return total / 2;
    }

    public List<String[]> getAllEdges() {
        List<String[]> edges = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        for (Map.Entry<String, Set<String>> entry : adjacencyList.entrySet()) {
            String u = entry.getKey();
            for (String v : entry.getValue()) {
                String key = getEdgeKey(u, v);
                if (!visited.contains(key)) {
                    visited.add(key);
                    edges.add(new String[]{u, v});
                }
            }
        }
        return edges;
    }

    private String getEdgeKey(String a, String b) {
        return a.compareTo(b) < 0 ? a + "<->" + b : b + "<->" + a;
    }
}
