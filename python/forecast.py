#!/usr/bin/env python3
"""
GridFlow Electricity Load Forecasting Engine
Uses Ordinary Least Squares (OLS) Linear Regression to project the next period's load.
"""
import sys
import csv

def calculate_linear_forecast(readings):
    """
    Given a list of numeric readings [y_1, y_2, ..., y_n] at time steps x = [1, 2, ..., n],
    compute the linear regression slope m and intercept b:
        y = m * x + b
    and return the forecast for x = n + 1.
    """
    n = len(readings)
    if n == 0:
        return 0.0, 0.0, 0.0
    if n == 1:
        return float(readings[0]), 0.0, float(readings[0])
    
    # x values: 1, 2, ..., n
    x_vals = list(range(1, n + 1))
    y_vals = [float(v) for v in readings]
    
    sum_x = sum(x_vals)
    sum_y = sum(y_vals)
    sum_xy = sum(x * y for x, y in zip(x_vals, y_vals))
    sum_x2 = sum(x * x for x in x_vals)
    
    denominator = (n * sum_x2 - sum_x * sum_x)
    if denominator == 0:
        m = 0.0
    else:
        m = (n * sum_xy - sum_x * sum_y) / denominator
    
    b = (sum_y - m * sum_x) / n
    
    # Next step x_next = n + 1
    next_x = n + 1
    projected = m * next_x + b
    return round(projected, 2), round(m, 2), round(b, 2)

def main():
    input_file = sys.argv[1] if len(sys.argv) > 1 else "data/historical_loads.csv"
    output_file = sys.argv[2] if len(sys.argv) > 2 else "data/forecast_loads.csv"
    
    print(f"[Python Forecaster] Reading historical data from: {input_file}")
    
    zone_readings = {}
    time_headers = []
    
    with open(input_file, mode="r", newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        headers = next(reader)
        # headers: Zone,Capacity,T1,T2,T3,T4,T5,T6
        time_headers = headers[2:]
        for row in reader:
            if not row:
                continue
            zone_name = row[0].strip()
            capacity = float(row[1].strip())
            readings = [float(val.strip()) for val in row[2:]]
            zone_readings[zone_name] = {
                "capacity": capacity,
                "readings": readings
            }
            
    print(f"[Python Forecaster] Successfully parsed {len(zone_readings)} zones with {len(time_headers)} time steps each.")
    
    results = []
    for zone_name, data in zone_readings.items():
        readings = data["readings"]
        capacity = data["capacity"]
        forecast_mw, slope, intercept = calculate_linear_forecast(readings)
        utilization = round((forecast_mw / capacity) * 100, 1)
        overload = max(0.0, round(forecast_mw - capacity, 2))
        spare = max(0.0, round(capacity - forecast_mw, 2))
        
        results.append({
            "zone": zone_name,
            "capacity": capacity,
            "current_load": readings[-1],
            "forecast_load": forecast_mw,
            "slope": slope,
            "intercept": intercept,
            "utilization": utilization,
            "overload": overload,
            "spare": spare,
            "status": "OVERLOADED" if forecast_mw > capacity else ("WATCH" if forecast_mw >= capacity * 0.85 else "NORMAL")
        })
        print(f"  -> Zone {zone_name:8s}: Current={readings[-1]:5.1f} MW, Trend Slope={slope:+5.2f}, Forecast={forecast_mw:5.1f} MW (Cap={capacity:.0f} MW, {utilization:5.1f}%) => {results[-1]['status']}")
        
    with open(output_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Zone", "Capacity_MW", "Current_Load_MW", "Forecast_Load_MW", "Slope", "Utilization_Pct", "Overload_MW", "Spare_MW", "Status"])
        for r in results:
            writer.writerow([
                r["zone"],
                r["capacity"],
                r["current_load"],
                r["forecast_load"],
                r["slope"],
                r["utilization"],
                r["overload"],
                r["spare"],
                r["status"]
            ])
            
    print(f"[Python Forecaster] Forecast results exported to: {output_file}")
    print("[Python Forecaster] Forecasting run complete.")

if __name__ == "__main__":
    main()
