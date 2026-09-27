package com.smartgrid;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Handles CSV Input/Output integration between Java and Python components.
 * - Exports historical grid time-series for Python linear trend forecaster
 * - Reads generated forecast CSV from Python
 * - Exports finalized transfer plan recommendations
 */
public class CsvManager {

    /**
     * Exports current historical load readings to CSV for Python consumption.
     */
    public static void exportHistoricalLoads(GridGraph graph, String filePath) throws IOException {
        File file = new File(filePath);
        if (file.getParentFile() != null) {
            file.getParentFile().mkdirs();
        }

        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(new FileOutputStream(file), StandardCharsets.UTF_8))) {
            // Find max historical steps across all zones
            int maxSteps = 6;
            for (GridZone z : graph.getAllZones()) {
                maxSteps = Math.max(maxSteps, z.getHistoricalLoads().size());
            }

            // Write Header
            StringBuilder sb = new StringBuilder("Zone,Capacity_MW");
            for (int i = maxSteps - 1; i >= 1; i--) {
                sb.append(",T_minus_").append(i);
            }
            sb.append(",Current_T0");
            writer.println(sb);

            // Write rows
            for (GridZone zone : graph.getAllZones()) {
                StringBuilder row = new StringBuilder();
                row.append(zone.getId()).append(",").append(zone.getCapacityMw());
                List<Double> hist = zone.getHistoricalLoads();
                int padCount = maxSteps - hist.size();
                for (int p = 0; p < padCount; p++) {
                    row.append(",").append(hist.isEmpty() ? zone.getCurrentLoadMw() : hist.get(0));
                }
                for (Double val : hist) {
                    row.append(",").append(String.format(Locale.US, "%.1f", val));
                }
                writer.println(row);
            }
        }
    }

    /**
     * Reads the forecast CSV emitted by the Python regression engine.
     */
    public static void importForecastLoads(GridGraph graph, String filePath) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            throw new FileNotFoundException("Forecast CSV file not found: " + filePath);
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new IOException("Empty forecast CSV file");
            }

            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;
                String[] parts = line.split(",");
                if (parts.length >= 4) {
                    String zoneId = parts[0].trim();
                    // double cap = Double.parseDouble(parts[1].trim());
                    // double curr = Double.parseDouble(parts[2].trim());
                    double forecast = Double.parseDouble(parts[3].trim());
                    double slope = parts.length >= 5 ? Double.parseDouble(parts[4].trim()) : 0.0;

                    GridZone zone = graph.getZone(zoneId);
                    if (zone != null) {
                        zone.setForecastLoadMw(forecast);
                        zone.setTrendSlope(slope);
                    }
                }
            }
        }
    }

    /**
     * Exports load transfer recommendations to CSV for downstream reporting.
     */
    public static void exportTransferPlan(List<TransferRecommendation> recommendations, String filePath) throws IOException {
        File file = new File(filePath);
        if (file.getParentFile() != null) {
            file.getParentFile().mkdirs();
        }

        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(new FileOutputStream(file), StandardCharsets.UTF_8))) {
            writer.println("Source_Zone,Destination_Zone,Transfer_MW,Source_Pre_MW,Source_Post_MW,Target_Pre_MW,Target_Post_MW,Line_Capacity_MW,Type,Reason");
            for (TransferRecommendation rec : recommendations) {
                writer.printf(Locale.US, "%s,%s,%.2f,%.2f,%.2f,%.2f,%.2f,%.1f,%s,\"%s\"%n",
                        rec.getSourceZoneName(),
                        rec.getTargetZoneName(),
                        rec.getTransferMw(),
                        rec.getSourcePreLoadMw(),
                        rec.getSourcePostLoadMw(),
                        rec.getTargetPreLoadMw(),
                        rec.getTargetPostLoadMw(),
                        rec.getLineCapacityMw(),
                        rec.getTransferType(),
                        rec.getReason().replace("\"", "'")
                );
            }
        }
    }
}
