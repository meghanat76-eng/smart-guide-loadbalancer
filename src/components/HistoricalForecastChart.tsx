import React, { useState } from 'react';
import { GridZoneData } from '../types';
import { TrendingUp, Info } from 'lucide-react';

interface HistoricalForecastChartProps {
  zones: GridZoneData[];
  selectedZoneId?: string;
  onSelectZoneId?: (id: string) => void;
  showTable?: boolean;
}

export const HistoricalForecastChart: React.FC<HistoricalForecastChartProps> = ({
  zones,
  selectedZoneId = 'North',
  onSelectZoneId,
  showTable = true,
}) => {
  const [activeZoneId, setActiveZoneId] = useState<string>(selectedZoneId);

  const zone = zones.find((z) => z.id === activeZoneId) || zones[0];
  const history = zone ? zone.historicalLoads : [0, 0, 0, 0, 0, 0];
  const forecast = zone ? zone.forecastLoadMw : 0;
  const capacity = zone ? zone.capacityMw : 100;
  const slope = zone ? zone.trendSlope : 0;

  // Chart dimensions
  const width = 640;
  const height = 260;
  const padding = { top: 30, right: 40, bottom: 40, left: 55 };

  // Data points: x=0..5 (history T-5..T0), x=6 (forecast T+1)
  const allValues = [...history, forecast, capacity];
  const maxVal = Math.max(120, Math.ceil(Math.max(...allValues) / 20) * 20);
  const minVal = 0;

  const getX = (index: number) => {
    const usableWidth = width - padding.left - padding.right;
    return padding.left + (index / 6) * usableWidth;
  };

  const getY = (value: number) => {
    const usableHeight = height - padding.top - padding.bottom;
    return height - padding.bottom - ((value - minVal) / (maxVal - minVal)) * usableHeight;
  };

  // Build SVG path for history
  const historyPoints = history.map((val, idx) => ({ x: getX(idx), y: getY(val), val }));
  const historyPath = historyPoints.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  // Forecast point
  const forecastPoint = { x: getX(6), y: getY(forecast), val: forecast };
  const lastHistoryPoint = historyPoints[historyPoints.length - 1];
  const forecastLinePath = `M ${lastHistoryPoint.x} ${lastHistoryPoint.y} L ${forecastPoint.x} ${forecastPoint.y}`;

  // Capacity threshold line Y
  const capacityY = getY(capacity);

  const timeLabels = ['T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'T0 (Now)', 'T+1 (Fcst)'];

  const isOverloaded = forecast > capacity;
  const utilPct = ((forecast / capacity) * 100).toFixed(1);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
      {/* Top Header & Zone Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Load Trend &amp; Forecast</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Python Ordinary Least Squares (OLS) linear projection vs. rated capacity.
          </p>
        </div>

        {/* Zone Selector Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {zones.map((z) => {
            const isSelected = z.id === activeZoneId;
            return (
              <button
                key={z.id}
                onClick={() => {
                  setActiveZoneId(z.id);
                  if (onSelectZoneId) onSelectZoneId(z.id);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {z.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric Callouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="text-[11px] font-medium text-slate-500">Current Load (T0)</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {zone?.currentLoadMw.toFixed(1)} <span className="text-xs font-normal text-slate-500">MW</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="text-[11px] font-medium text-slate-500">Rated Capacity</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {capacity.toFixed(0)} <span className="text-xs font-normal text-slate-500">MW</span>
          </div>
        </div>

        <div className={`p-3 rounded-lg border ${isOverloaded ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
          <div className="text-[11px] font-medium text-slate-500">Forecast Next (T+1)</div>
          <div className={`text-lg font-bold font-mono mt-0.5 ${isOverloaded ? 'text-rose-700' : 'text-blue-700'}`}>
            {forecast.toFixed(1)} <span className="text-xs font-normal text-slate-500">MW</span>
          </div>
        </div>

        <div className={`p-3 rounded-lg border ${isOverloaded ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
          <div className="text-[11px] font-medium text-slate-500">Utilization &amp; Slope</div>
          <div className={`text-lg font-bold font-mono mt-0.5 ${isOverloaded ? 'text-rose-700' : 'text-slate-900'}`}>
            {utilPct}% <span className="text-xs font-mono font-normal text-slate-500">({slope > 0 ? `+${slope.toFixed(2)}` : slope.toFixed(2)}/t)</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px] select-none font-sans">
          {/* Y Axis Grid lines */}
          {[0, 25, 50, 75, 100, 125].map((gridVal) => {
            if (gridVal > maxVal) return null;
            const y = getY(gridVal);
            return (
              <g key={`grid-${gridVal}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94A3B8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Rated Capacity ceiling line */}
          <line
            x1={padding.left}
            y1={capacityY}
            x2={width - padding.right}
            y2={capacityY}
            stroke="#EF4444"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={width - padding.right}
            y={capacityY - 6}
            textAnchor="end"
            fill="#EF4444"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="600"
          >
            Capacity Ceiling ({capacity} MW)
          </text>

          {/* Forecast split vertical divider line */}
          <line
            x1={lastHistoryPoint.x}
            y1={padding.top}
            x2={lastHistoryPoint.x}
            y2={height - padding.bottom}
            stroke="#E2E8F0"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text
            x={lastHistoryPoint.x - 6}
            y={padding.top - 10}
            textAnchor="end"
            fill="#64748B"
            fontSize="9"
            fontWeight="bold"
          >
            Recorded History
          </text>
          <text
            x={lastHistoryPoint.x + 6}
            y={padding.top - 10}
            textAnchor="start"
            fill="#2563EB"
            fontSize="9"
            fontWeight="bold"
          >
            Projected
          </text>

          {/* Historical line (Solid) */}
          <path d={historyPath} fill="none" stroke="#2563EB" strokeWidth="2.5" />

          {/* Forecast line (Dashed) */}
          <path
            d={forecastLinePath}
            fill="none"
            stroke={isOverloaded ? '#DC2626' : '#2563EB'}
            strokeWidth="2.5"
            strokeDasharray="5 3"
          />

          {/* Historical Points */}
          {historyPoints.map((pt, idx) => (
            <g key={`hist-pt-${idx}`}>
              <circle cx={pt.x} cy={pt.y} r="4" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                fill="#334155"
                fontSize="9.5"
                fontFamily="monospace"
                fontWeight="500"
              >
                {pt.val.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Forecast Point (Glowing) */}
          <circle
            cx={forecastPoint.x}
            cy={forecastPoint.y}
            r="8"
            fill={isOverloaded ? '#FEE2E2' : '#DBEAFE'}
            opacity="0.7"
          />
          <circle
            cx={forecastPoint.x}
            cy={forecastPoint.y}
            r="4.5"
            fill={isOverloaded ? '#DC2626' : '#2563EB'}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <text
            x={forecastPoint.x}
            y={forecastPoint.y - 12}
            textAnchor="middle"
            fill={isOverloaded ? '#DC2626' : '#2563EB'}
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {forecastPoint.val.toFixed(1)} MW
          </text>

          {/* X Axis Time Labels */}
          {timeLabels.map((lbl, idx) => {
            const x = getX(idx);
            const isFcst = idx === 6;
            return (
              <text
                key={`lbl-${idx}`}
                x={x}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fill={isFcst ? '#2563EB' : '#64748B'}
                fontSize="10"
                fontFamily="monospace"
                fontWeight={isFcst ? 'bold' : 'normal'}
              >
                {lbl}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Accessible Exact Data Table */}
      {showTable && (
        <div className="mt-4 pt-3 border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-100">
                <th className="pb-1.5 font-medium">Time Interval</th>
                <th className="pb-1.5 font-medium">T-5</th>
                <th className="pb-1.5 font-medium">T-4</th>
                <th className="pb-1.5 font-medium">T-3</th>
                <th className="pb-1.5 font-medium">T-2</th>
                <th className="pb-1.5 font-medium">T-1</th>
                <th className="pb-1.5 font-medium">T0 (Current)</th>
                <th className="pb-1.5 font-medium text-blue-600">T+1 (Forecast)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-mono tabular-nums text-slate-700">
              <tr>
                <td className="py-2 font-sans font-semibold text-slate-900">{zone?.name} (MW)</td>
                {history.map((val, i) => (
                  <td key={i} className="py-2 text-slate-600">
                    {val.toFixed(1)}
                  </td>
                ))}
                <td className={`py-2 font-bold ${isOverloaded ? 'text-rose-600' : 'text-blue-600'}`}>
                  {forecast.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
