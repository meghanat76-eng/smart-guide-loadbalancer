#!/usr/bin/env python3
"""
Unit tests for the Python Least-Squares Linear Trend Forecaster.
Runs using the standard library `unittest` framework.
"""
import unittest
from forecast import calculate_linear_forecast

class TestForecastEngine(unittest.TestCase):

    def test_constant_readings(self):
        """Constant load of 50 MW should forecast 50 MW with slope 0.0"""
        readings = [50.0, 50.0, 50.0, 50.0, 50.0, 50.0]
        forecast, slope, intercept = calculate_linear_forecast(readings)
        self.assertAlmostEqual(forecast, 50.0, places=2)
        self.assertAlmostEqual(slope, 0.0, places=2)
        self.assertAlmostEqual(intercept, 50.0, places=2)

    def test_linear_increasing_trend(self):
        """Steady +5 MW per step: [10, 15, 20, 25, 30, 35] -> Next should be 40 MW"""
        readings = [10.0, 15.0, 20.0, 25.0, 30.0, 35.0]
        forecast, slope, intercept = calculate_linear_forecast(readings)
        self.assertAlmostEqual(slope, 5.0, places=2)
        self.assertAlmostEqual(forecast, 40.0, places=2)

    def test_overload_detection(self):
        """Test North zone surge series reaching over 100 MW capacity"""
        readings = [0.0, 16.0, 33.0, 50.0, 68.0, 84.0]
        forecast, slope, intercept = calculate_linear_forecast(readings)
        self.assertGreater(forecast, 100.0, "North forecast must exceed 100 MW capacity to trigger load balancing")
        self.assertGreater(slope, 15.0, "Slope should detect sharp ramp")

    def test_single_value(self):
        """Single reading should project itself"""
        readings = [82.5]
        forecast, slope, intercept = calculate_linear_forecast(readings)
        self.assertEqual(forecast, 82.5)

    def test_empty_list(self):
        """Empty list should return (0.0, 0.0, 0.0) gracefully"""
        readings = []
        forecast, slope, intercept = calculate_linear_forecast(readings)
        self.assertEqual(forecast, 0.0)
        self.assertEqual(slope, 0.0)

if __name__ == "__main__":
    unittest.main(verbosity=2)
