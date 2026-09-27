#!/bin/bash
# Execution script for Smart Grid Load Balancer Java Simulation
set -e

if [ ! -d "bin" ] || [ ! -f "bin/com/smartgrid/SimulationRunner.class" ]; then
    echo "[GridFlow Java Run] Class files not found. Running build.sh first..."
    bash build.sh
fi

echo "[GridFlow Java Run] Executing SimulationRunner..."
java -cp bin com.smartgrid.SimulationRunner ../data/historical_loads.csv ../data/forecast_loads.csv ../data/transfer_recommendations.csv
