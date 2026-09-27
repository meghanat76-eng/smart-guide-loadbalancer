import React, { useState } from 'react';
import { GridZoneData } from '../types';
import { HistoricalForecastChart } from '../components/HistoricalForecastChart';
import { TrendingUp, HelpCircle, ChevronDown, ChevronUp, Calculator, Terminal } from 'lucide-react';

interface ForecastsPageProps {
  zones: GridZoneData[];
  onSelectZone: (zone: GridZoneData) => void;
}

export const ForecastsPage: React.FC<ForecastsPageProps> = ({ zones, onSelectZone }) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('North');
  const [showFormulaDetails, setShowFormulaDetails] = useState(true);

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Python Regression Service</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Near-Future Load Forecasting (T+1 Horizon)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Python estimates the next load from recent historical readings using a least-squares linear trend ($y = mx + b$). When a zone's forecast approaches or exceeds rated capacity, the load balancer is triggered.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            Engine: forecast.py (OLS)
          </span>
        </div>
      </div>

      {/* Primary Chart Component */}
      <HistoricalForecastChart
        zones={zones}
        selectedZoneId={selectedZoneId}
        onSelectZoneId={(id) => {
          setSelectedZoneId(id);
          const z = zones.find((item) => item.id === id);
          if (z) onSelectZone(z);
        }}
        showTable={true}
      />

      {/* Expandable "How Forecasting Works" Math Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        <button
          onClick={() => setShowFormulaDetails(!showFormulaDetails)}
          className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between text-left text-xs font-bold text-slate-800 border-b border-slate-200/80 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span>How Forecasting Works: Ordinary Least Squares (OLS) Linear Trend</span>
          </span>
          {showFormulaDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showFormulaDetails && (
          <div className="p-5 space-y-4 text-xs text-slate-600 leading-relaxed bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">1. Mathematical Model</h4>
                <p>
                  Given $n = 6$ sequential load readings $y_1, y_2, \dots, y_6$ sampled at time steps $x_1 = 1, x_2 = 2, \dots, x_6 = 6$, Python fits a linear regression line:
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] space-y-1 text-slate-800">
                  <div>y = m · x + b</div>
                  <div>m (slope) = [n·∑(xy) - (∑x)(∑y)] / [n·∑(x²) - (∑x)²]</div>
                  <div>b (intercept) = [∑y - m·∑x] / n</div>
                  <div className="text-blue-600 font-bold">Forecast (T+1) = m · 7 + b</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">2. Why Linear Trend for Short Horizons?</h4>
                <p>
                  For short look-ahead intervals (e.g., 15–30 minutes ahead in microgrids), linear regression provides a transparent, explainable extrapolation without overfitting.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Detects ramp-up rate (+MW per interval) for industrial and residential peaks.</li>
                  <li>Signals early warning when projected load crosses 85% (Watch) or 100% (Overload).</li>
                  <li>Outputs structured CSV ingested directly by Java OOP objects.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid-Wide All Zones Forecast Summary Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Grid-Wide Forecast Comparison (All 6 Zones)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Input: data/historical_loads.csv</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-4">Zone</th>
                <th className="py-2.5 px-4">Capacity</th>
                <th className="py-2.5 px-4">Current (T0)</th>
                <th className="py-2.5 px-4">Trend Slope (m)</th>
                <th className="py-2.5 px-4">Forecast (T+1)</th>
                <th className="py-2.5 px-4">Utilization</th>
                <th className="py-2.5 px-4">Predicted Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {zones.map((z) => {
                const util = (z.forecastLoadMw / z.capacityMw) * 100;
                const isOverloaded = util > 100;
                return (
                  <tr key={z.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">{z.name}</td>
                    <td className="py-3 px-4 text-slate-600">{z.capacityMw} MW</td>
                    <td className="py-3 px-4 text-slate-600">{z.currentLoadMw.toFixed(1)} MW</td>
                    <td className="py-3 px-4 text-slate-600">
                      {z.trendSlope > 0 ? `+${z.trendSlope.toFixed(2)}` : z.trendSlope.toFixed(2)} MW/step
                    </td>
                    <td className={`py-3 px-4 font-bold ${isOverloaded ? 'text-rose-600' : 'text-slate-900'}`}>
                      {z.forecastLoadMw.toFixed(1)} MW
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span className={isOverloaded ? 'text-rose-600' : util >= 85 ? 'text-amber-600' : 'text-slate-700'}>
                        {util.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isOverloaded
                            ? 'bg-rose-100 text-rose-700'
                            : util >= 85
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {z.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
