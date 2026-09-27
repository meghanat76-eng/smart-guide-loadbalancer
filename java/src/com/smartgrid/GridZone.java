package com.smartgrid;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Represents a single electrical zone (vertex) in the microgrid.
 * Encapsulates zone electrical parameters: capacity, current load,
 * historical readings, and forecast load.
 */
public class GridZone {
    private final String id;
    private final String name;
    private final double capacityMw;
    private double currentLoadMw;
    private double forecastLoadMw;
    private double trendSlope;
    private final List<Double> historicalLoads;
    private String status; // NORMAL, WATCH, OVERLOADED
    private String partitionId; // Assigned by Divide & Conquer algorithm

    public GridZone(String id, String name, double capacityMw, double currentLoadMw) {
        if (capacityMw <= 0) {
            throw new IllegalArgumentException("Capacity must be positive. Provided: " + capacityMw);
        }
        if (currentLoadMw < 0) {
            throw new IllegalArgumentException("Current load cannot be negative. Provided: " + currentLoadMw);
        }
        this.id = id;
        this.name = name;
        this.capacityMw = capacityMw;
        this.currentLoadMw = currentLoadMw;
        this.forecastLoadMw = currentLoadMw;
        this.trendSlope = 0.0;
        this.historicalLoads = new ArrayList<>();
        this.status = "NORMAL";
        this.partitionId = "ROOT";
        updateStatus();
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public double getCapacityMw() {
        return capacityMw;
    }

    public double getCurrentLoadMw() {
        return currentLoadMw;
    }

    public void setCurrentLoadMw(double currentLoadMw) {
        this.currentLoadMw = Math.max(0, currentLoadMw);
    }

    public double getForecastLoadMw() {
        return forecastLoadMw;
    }

    public void setForecastLoadMw(double forecastLoadMw) {
        this.forecastLoadMw = Math.max(0, forecastLoadMw);
        updateStatus();
    }

    public double getTrendSlope() {
        return trendSlope;
    }

    public void setTrendSlope(double trendSlope) {
        this.trendSlope = trendSlope;
    }

    public List<Double> getHistoricalLoads() {
        return Collections.unmodifiableList(historicalLoads);
    }

    public void setHistoricalLoads(List<Double> loads) {
        this.historicalLoads.clear();
        if (loads != null) {
            this.historicalLoads.addAll(loads);
            if (!this.historicalLoads.isEmpty()) {
                this.currentLoadMw = this.historicalLoads.get(this.historicalLoads.size() - 1);
            }
        }
    }

    public void addHistoricalReading(double load) {
        this.historicalLoads.add(load);
        this.currentLoadMw = load;
    }

    public String getStatus() {
        return status;
    }

    public String getPartitionId() {
        return partitionId;
    }

    public void setPartitionId(String partitionId) {
        this.partitionId = partitionId;
    }

    public double getUtilizationPercentage() {
        return (forecastLoadMw / capacityMw) * 100.0;
    }

    public double getCurrentUtilizationPercentage() {
        return (currentLoadMw / capacityMw) * 100.0;
    }

    public double getSpareCapacityMw() {
        return Math.max(0.0, capacityMw - forecastLoadMw);
    }

    public double getOverloadMw() {
        return Math.max(0.0, forecastLoadMw - capacityMw);
    }

    public boolean isOverloaded() {
        return forecastLoadMw > capacityMw;
    }

    private void updateStatus() {
        double util = getUtilizationPercentage();
        if (util > 100.0) {
            this.status = "OVERLOADED";
        } else if (util >= 85.0) {
            this.status = "WATCH";
        } else {
            this.status = "NORMAL";
        }
    }

    @Override
    public String toString() {
        return String.format("GridZone[%s (%s): Cap=%.1f MW, Curr=%.1f MW, Fcst=%.1f MW (%.1f%%), Status=%s, Part=%s]",
                name, id, capacityMw, currentLoadMw, forecastLoadMw, getUtilizationPercentage(), status, partitionId);
    }
}
