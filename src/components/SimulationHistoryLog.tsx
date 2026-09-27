import React, { useState, useMemo } from 'react';
import { SimulationHistoryItem } from '../types';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Download,
  Search,
  X,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from 'lucide-react';

interface SimulationHistoryLogProps {
  history: SimulationHistoryItem[];
  onSelectRun?: (item: SimulationHistoryItem) => void;
  onClearHistory?: () => void;
}

interface LoadTrendIndicatorProps {
  item: SimulationHistoryItem;
}

export const LoadTrendIndicator: React.FC<LoadTrendIndicatorProps> = ({ item }) => {
  // Trajectory points (fallback to standard evening peak progression if not set)
  const trajectory = item.loadTrajectory && item.loadTrajectory.length > 1
    ? item.loadTrajectory
    : [195.0, 239.0, 286.0, 331.0, 368.0, 398.0, 442.5];

  const delta =
    item.runToRunDeltaMw ??
    (item.totalForecastLoadMw && item.totalCurrentLoadMw
      ? item.totalForecastLoadMw - item.totalCurrentLoadMw
      : 44.5);

  const direction: 'INCREASING' | 'DECREASING' | 'STABLE' =
    item.trendDirection || (delta > 1.5 ? 'INCREASING' : delta < -1.5 ? 'DECREASING' : 'STABLE');

  // Compute SVG sparkline path
  const minVal = Math.min(...trajectory);
  const maxVal = Math.max(...trajectory);
  const range = maxVal - minVal || 1;
  const width = 68;
  const height = 24;
  const paddingY = 3;

  const points = trajectory.map((val, idx) => {
    const x = (idx / (trajectory.length - 1)) * width;
    const y = height - paddingY - ((val - minVal) / range) * (height - paddingY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pointsStr = points.join(' ');
  const lastPoint = points[points.length - 1].split(',');

  const strokeColor =
    direction === 'INCREASING'
      ? '#E11D48' // rose-600
      : direction === 'DECREASING'
      ? '#059669' // emerald-600
      : '#64748B'; // slate-500

  const fillColor =
    direction === 'INCREASING'
      ? 'rgba(225, 29, 72, 0.12)'
      : direction === 'DECREASING'
      ? 'rgba(5, 150, 105, 0.12)'
      : 'rgba(100, 116, 139, 0.1)';

  // Closed area polygon for soft gradient background
  const areaPoints = `0,${height} ${pointsStr} ${width},${height}`;

  return (
    <div
      className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg border text-xs font-mono transition-colors shadow-2xs ${
        direction === 'INCREASING'
          ? 'bg-rose-50/70 border-rose-200/80 text-rose-700'
          : direction === 'DECREASING'
          ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-700'
          : 'bg-slate-50 border-slate-200/80 text-slate-700'
      }`}
      title={`Grid Load Trend: ${direction} (${delta >= 0 ? '+' : ''}${delta.toFixed(1)} MW)`}
    >
      {/* Mini SVG Sparkline */}
      <div className="relative shrink-0 flex items-center">
        <svg width={width} height={height} className="overflow-visible">
          <polygon points={areaPoints} fill={fillColor} />
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsStr}
          />
          {/* Glowing pulse dot on terminal forecast point */}
          <circle
            cx={parseFloat(lastPoint[0])}
            cy={parseFloat(lastPoint[1])}
            r="2.5"
            fill={strokeColor}
          />
        </svg>
      </div>

      {/* Direction & Delta Text */}
      <div className="flex items-center gap-1 font-semibold text-[11px] whitespace-nowrap">
        {direction === 'INCREASING' ? (
          <TrendingUp className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        ) : direction === 'DECREASING' ? (
          <TrendingDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        ) : (
          <Minus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        )}
        <span>
          {direction === 'INCREASING'
            ? `+${Math.abs(delta).toFixed(1)} MW`
            : direction === 'DECREASING'
            ? `-${Math.abs(delta).toFixed(1)} MW`
            : `±${Math.abs(delta).toFixed(1)} MW`}
        </span>
        <span className="text-[10px] font-normal uppercase tracking-wider opacity-75 hidden xl:inline">
          {direction === 'INCREASING' ? 'Increasing' : direction === 'DECREASING' ? 'Decreasing' : 'Stable'}
        </span>
      </div>
    </div>
  );
};

export const SimulationHistoryLog: React.FC<SimulationHistoryLogProps> = ({
  history,
  onSelectRun,
  onClearHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RESOLVED' | 'NOMINAL' | 'PARTIAL'>('ALL');
  const [scenarioFilter, setScenarioFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Extract unique scenarios present in history
  const uniqueScenarios = useMemo(() => {
    return Array.from(new Set(history.map((item) => item.scenarioName)));
  }, [history]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL' || scenarioFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setScenarioFilter('ALL');
  };

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // 2. Scenario Filter
      if (scenarioFilter !== 'ALL' && item.scenarioName !== scenarioFilter) {
        return false;
      }

      // 3. Search Query Filter (matches scenario, run number, summary, route, status)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesScenario = item.scenarioName.toLowerCase().includes(q);
        const matchesRun =
          `run #${item.runNumber}`.toLowerCase().includes(q) ||
          `#${item.runNumber}`.includes(q) ||
          String(item.runNumber) === q;
        const matchesSummary = item.summary.toLowerCase().includes(q);
        const matchesRoute = item.primaryRoute ? item.primaryRoute.toLowerCase().includes(q) : false;
        const matchesStatus = item.status.toLowerCase().includes(q);

        if (!matchesScenario && !matchesRun && !matchesSummary && !matchesRoute && !matchesStatus) {
          return false;
        }
      }

      return true;
    });
  }, [history, statusFilter, scenarioFilter, searchQuery]);

  const exportRunCsv = (item: SimulationHistoryItem) => {
    const runNum = item.runNumber;
    const scenarioClean = item.scenarioName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `simulation_run_${runNum}_${scenarioClean}.csv`;

    let csv = '=== SIMULATION RUN METADATA ===\n';
    csv += `Run_Number,${item.runNumber}\n`;
    csv += `Timestamp,${item.timestamp}\n`;
    csv += `Scenario,${item.scenarioName}\n`;
    csv += `Status,${item.status}\n`;
    csv += `Overloaded_Zones_Count,${item.overloadCount}\n`;
    csv += `Total_Power_Shifted_MW,${item.totalShiftedMw.toFixed(2)}\n`;
    csv += `Directives_Count,${item.recommendationCount}\n`;
    if (item.primaryRoute) csv += `Primary_Route,${item.primaryRoute}\n`;
    if (item.executionTimeMs) csv += `Execution_Latency_ms,${item.executionTimeMs}\n`;
    csv += `Summary,"${item.summary.replace(/"/g, '""')}"\n\n`;

    // Zones Section
    csv += '=== ZONE TELEMETRY & CAPACITIES ===\n';
    csv += 'Zone,Capacity_MW,Current_Load_MW,Forecast_Load_MW,Post_Load_MW,Trend_Slope,Utilization_Pct,Status,Partition\n';
    const zones = item.zonesSnapshot || [];
    zones.forEach((z) => {
      const util = ((z.forecastLoadMw / z.capacityMw) * 100).toFixed(1);
      const post = (z.postLoadMw ?? z.forecastLoadMw).toFixed(1);
      csv += `${z.name},${z.capacityMw},${z.currentLoadMw.toFixed(1)},${z.forecastLoadMw.toFixed(1)},${post},${z.trendSlope.toFixed(2)},${util}%,${z.status},${z.partitionId || 'N/A'}\n`;
    });
    csv += '\n';

    // Transfer Recommendations Section
    csv += '=== RECOMMENDED LOAD TRANSFERS ===\n';
    csv += 'Directive_Index,Source_Zone,Destination_Zone,Transfer_MW,Source_Pre_MW,Source_Post_MW,Target_Pre_MW,Target_Post_MW,Corridor_Type,Reason\n';
    const recs = item.recommendationsSnapshot || [];
    if (recs.length === 0) {
      csv += 'N/A,None,None,0.0,0.0,0.0,0.0,0.0,NOMINAL,"Zero transfers required for this run."\n';
    } else {
      recs.forEach((r, idx) => {
        csv += `${idx + 1},${r.sourceZoneName},${r.targetZoneName},${r.transferMw.toFixed(2)},${r.sourcePreLoadMw.toFixed(1)},${r.sourcePostLoadMw.toFixed(1)},${r.targetPreLoadMw.toFixed(1)},${r.targetPostLoadMw.toFixed(1)},${r.transferType},"${r.reason.replace(/"/g, '""')}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: SimulationHistoryItem['status']) => {
    switch (status) {
      case 'RESOLVED':
        return {
          dot: 'bg-emerald-500',
          label: 'Overloads Relieved',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200/70',
        };
      case 'PARTIAL':
        return {
          dot: 'bg-amber-500',
          label: 'Partial Relief',
          textColor: 'text-amber-700',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200/70',
        };
      case 'NOMINAL':
      default:
        return {
          dot: 'bg-blue-500',
          label: 'Nominal Grid',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200/70',
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
      {/* Top Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Simulation History</span>
              <span className="text-slate-400 font-normal font-mono text-xs">
                ({history.length} {history.length === 1 ? 'run' : 'runs'})
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Chronological log of forecasting executions and load balancing outcomes.
            </p>
          </div>
        </div>

        {onClearHistory && history.length > 2 && (
          <button
            onClick={onClearHistory}
            className="text-xs text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-md border border-transparent hover:border-slate-200 hover:bg-white transition-colors cursor-pointer self-start sm:self-center"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="p-4 border-b border-slate-100 bg-white flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by scenario, route, or run (e.g. Heatwave, North, #1)..."
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 text-slate-900 text-xs rounded-xl pl-9 pr-8 py-2.5 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 rounded cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Group */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status Dropdown */}
          <div className="relative inline-block w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl pl-3 pr-8 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="RESOLVED">Relieved (RESOLVED)</option>
              <option value="NOMINAL">Nominal (NOMINAL)</option>
              <option value="PARTIAL">Partial (PARTIAL)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Scenario Filter Dropdown */}
          <div className="relative inline-block w-full sm:w-auto">
            <select
              value={scenarioFilter}
              onChange={(e) => setScenarioFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl pl-3 pr-8 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer max-w-[200px] truncate"
            >
              <option value="ALL">All Scenarios</option>
              {uniqueScenarios.map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
              title="Reset all search and filter conditions"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Status Sub-bar (when filtered) */}
      {hasActiveFilters && (
        <div className="px-5 py-2 bg-blue-50/40 border-b border-blue-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Showing <strong>{filteredHistory.length}</strong> of <strong>{history.length}</strong> runs
              {statusFilter !== 'ALL' && (
                <span className="ml-1 text-slate-500">
                  · Status: <strong className="text-slate-800">{statusFilter}</strong>
                </span>
              )}
              {scenarioFilter !== 'ALL' && (
                <span className="ml-1 text-slate-500">
                  · Scenario: <strong className="text-slate-800">{scenarioFilter}</strong>
                </span>
              )}
            </span>
          </div>

          <button
            onClick={resetFilters}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">No matching simulation runs</h4>
            <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
              No historical runs match the criteria {searchQuery ? `"${searchQuery}"` : ''} with the selected filters.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Clear Search &amp; Filters
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredHistory.map((item) => {
            const badge = getStatusBadge(item.status);
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="p-4 sm:px-5 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  {/* Left: Run ID, Scenario, Timestamp */}
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md shrink-0">
                      Run #{item.runNumber}
                    </span>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900">
                          {item.scenarioName}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.timestamp}</span>
                        </span>
                      </div>

                      {/* Brief headline result */}
                      <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                        <span>
                          {item.overloadCount > 0 ? (
                            <span className="text-rose-600 font-medium">
                              {item.overloadCount} zone{item.overloadCount > 1 ? 's' : ''} at risk
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">Zero overloads</span>
                          )}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono font-medium text-slate-700">
                          Shifted: {item.totalShiftedMw.toFixed(2)} MW
                        </span>
                        {item.primaryRoute && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-600 font-mono text-[11px] bg-slate-50 border border-slate-200/80 px-1.5 py-0.2 rounded">
                              {item.primaryRoute}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Trend Indicator & Action Cluster */}
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between xl:justify-end shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100">
                    {/* Visual Grid Load Trend Line Indicator */}
                    <LoadTrendIndicator item={item} />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportRunCsv(item);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0"
                        title={`Export CSV data for Run #${item.runNumber}`}
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Export CSV</span>
                      </button>

                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bgColor} ${badge.borderColor} ${badge.textColor}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                        <span>{badge.label}</span>
                      </div>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse details' : 'Expand details'}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Details Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-3 bg-slate-50/70 p-3.5 rounded-xl border">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                        Execution Summary &amp; Rationale
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Run #{item.runNumber} Record</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      {item.summary}
                    </p>

                    {/* Aggregate Grid Load Trajectory Progression Breakdown */}
                    {item.loadTrajectory && item.loadTrajectory.length > 1 && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-blue-600" />
                            <span>System Load Trajectory Across Look-Ahead Intervals</span>
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            Trajectory: {item.loadTrajectory[0]} MW → {item.loadTrajectory[item.loadTrajectory.length - 1]} MW
                          </span>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1 text-center font-mono">
                          {item.loadTrajectory.map((val, idx) => {
                            const isForecast = idx === item.loadTrajectory!.length - 1;
                            const label = isForecast ? 'Fcst T+1' : `T-${item.loadTrajectory!.length - 2 - idx}`;
                            return (
                              <div
                                key={idx}
                                className={`p-1.5 rounded-lg border text-[11px] ${
                                  isForecast
                                    ? 'bg-blue-50/80 border-blue-200 text-blue-800 font-bold'
                                    : 'bg-slate-50 border-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="text-[10px] text-slate-400 font-sans">{label}</div>
                                <div className="font-semibold">{val} <span className="text-[9px] font-normal text-slate-400">MW</span></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60 mt-1">
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono flex-wrap">
                        <span>Directives: <strong>{item.recommendationCount}</strong></span>
                        <span>·</span>
                        <span>Transferred: <strong>{item.totalShiftedMw.toFixed(2)} MW</strong></span>
                        <span>·</span>
                        <span>Status: <strong className={badge.textColor}>{item.status}</strong></span>
                        {item.executionTimeMs && (
                          <>
                            <span>·</span>
                            <span>Latency: <strong>{item.executionTimeMs}ms</strong></span>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => exportRunCsv(item)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-center"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Run #{item.runNumber} CSV</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
