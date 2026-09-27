# GridFlow Python Forecasting Engine

This directory contains the Python time-series load forecasting service for the **Smart Grid Load Balancer**.

## Methodology: Ordinary Least Squares (OLS) Linear Trend

In power systems engineering, near-future load forecasting for short look-ahead intervals is modeled by fitting an Ordinary Least Squares linear regression across sequential historical power readings $(x_1, y_1), (x_2, y_2), \dots, (x_n, y_n)$:

$$\text{Slope } m = \frac{n \sum (x_i y_i) - (\sum x_i)(\sum y_i)}{n \sum (x_i^2) - (\sum x_i)^2}$$

$$\text{Intercept } b = \frac{\sum y_i - m \sum x_i}{n}$$

The projected load for the next time interval $x_{next} = n + 1$ is:

$$y_{forecast} = m \cdot (n + 1) + b$$

## Files

- `forecast.py`: Production forecasting script. Reads `data/historical_loads.csv` exported by the Java subsystem, computes linear regression parameters, detects overload risks, and outputs `data/forecast_loads.csv`.
- `test_forecast.py`: Automated `unittest` test suite covering constant loads, ramps, overload detection, and edge cases.

## Usage

```bash
# Run forecaster with custom CSV paths
python3 forecast.py ../data/historical_loads.csv ../data/forecast_loads.csv

# Run automated unit tests
python3 test_forecast.py
```
