import React from 'react';
import {
  GridZoneData,
  GridConnection,
  TransferPlanItem,
  GridPartition,
  SimulationResult,
  SimulationHistoryItem,
} from '../types';
import { MetricCard } from '../components/MetricCard';
import { GridTopologyGraph } from '../components/GridTopologyGraph';
import { HistoricalForecastChart } from '../components/HistoricalForecastChart';
import { SimulationHistoryLog } from '../components/SimulationHistoryLog';
import {
  Layers,
  AlertTriangle,
  Zap,
  TrendingUp,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface OverviewPageProps {
  zones: GridZoneData[];
  connections: GridConnection[];
  partitions: GridPartition[];
  recommendations: TransferPlanItem[];
  simulationResult: SimulationResult;
  simulationHistory: SimulationHistoryItem[];
  onSelectZone: (zone: GridZoneData) => void;
  onRunSimulation: () => void;
  onNavigateTab: (tab: NavTab) => void;
  isRunningSimulation: boolean;
  onClearHistory?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  zones,
  connections,
  partitions,
  recommendations,
  simulationResult,
  simulationHistory,
  onSelectZone,
  onRunSimulation,
  onNavigateTab,
  isRunningSimulation,
  onClearHistory,
}) => {
  const overloadedZones = zones.filter((z) => z.forecastLoadMw > z.capacityMw);
  const watchZones = zones.filter(
    (z) => z.forecastLoadMw <= z.capacityMw && z.forecastLoadMw >= z.capacityMw * 0.85
  );

  const totalCurrentLoad = zones.reduce((sum, z) => sum + z.currentLoadMw, 0);
  const totalForecastLoad = zones.reduce((sum, z) => sum + z.forecastLoadMw, 0);
  const totalCapacity = zones.reduce((sum, z) => sum + z.capacityMw, 0);

  return (
    <div className="space-y-6">
      {/* Overview Hero Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Simulation Console
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">Run #{simulationResult.runCount}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Autonomous Grid Balancing &amp; Overload Relief
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            {simulationResult.algorithmSummary}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('transfer-plan')}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Transfer Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRunSimulation}
            disabled={isRunningSimulation}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Run Simulation</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Grid Zones"
          value={zones.length}
          unit="Vertices"
          helperText={`Across ${partitions.length} ADSA Partitions`}
          icon={Layers}
          status="normal"
        />

        <MetricCard
          label="Zones at Risk"
          value={overloadedZones.length}
          unit={overloadedZones.length === 1 ? 'Zone Overload' : 'Zones Overloaded'}
          helperText={
            overloadedZones.length > 0
              ? `${overloadedZones.map((z) => z.name).join(', ')} exceed rated capacity`
              : 'All zones operating within limits'
          }
          icon={AlertTriangle}
          status={overloadedZones.length > 0 ? 'danger' : 'normal'}
        />

        <MetricCard
          label="Current Total Load"
          value={totalCurrentLoad.toFixed(1)}
          unit="MW"
          helperText={`${((totalCurrentLoad / totalCapacity) * 100).toFixed(1)}% of ${totalCapacity} MW capacity`}
          icon={Zap}
          status="normal"
        />

        <MetricCard
          label="Forecast Total Load"
          value={totalForecastLoad.toFixed(1)}
          unit="MW"
          helperText={`Net delta: ${(totalForecastLoad - totalCurrentLoad >= 0 ? '+' : '')}${(totalForecastLoad - totalCurrentLoad).toFixed(1)} MW`}
          icon={TrendingUp}
          status={overloadedZones.length > 0 ? 'watch' : 'normal'}
        />
      </div>

      {/* Main Grid: Interactive Graph + Forecast Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Microgrid Topology Graph (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Interactive Microgrid Graph</span>
              <span className="text-slate-400 font-normal">· Click node for details</span>
            </h3>
            <button
              onClick={() => onNavigateTab('grid-map')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Full Graph Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <GridTopologyGraph
            zones={zones}
            connections={connections}
            recommendations={recommendations}
            partitions={partitions}
            onSelectZone={onSelectZone}
          />
        </div>

        {/* Load Trend Forecast Chart (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Linear Regression Forecast</span>
              <span className="text-slate-400 font-normal">· Python OLS</span>
            </h3>
            <button
              onClick={() => onNavigateTab('forecasts')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>All Forecasts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <HistoricalForecastChart
            zones={zones}
            selectedZoneId={overloadedZones.length > 0 ? overloadedZones[0].id : 'North'}
            onSelectZoneId={(id) => {
              const target = zones.find((z) => z.id === id);
              if (target) onSelectZone(target);
            }}
            showTable={false}
          />
        </div>
      </div>

      {/* Lower Row: Zone Health + Recommended Actions + Simulation Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone Health Panel */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Zone Health Status</h3>
            <span className="text-xs text-slate-500 font-mono">{zones.length} Zones</span>
          </div>

          <div className="divide-y divide-slate-100">
            {zones.map((zone) => {
              const utilPct = ((zone.forecastLoadMw / zone.capacityMw) * 100).toFixed(1);
              return (
                <div
                  key={zone.id}
                  onClick={() => onSelectZone(zone)}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        zone.status === 'OVERLOADED'
                          ? 'bg-rose-500 ring-2 ring-rose-200 animate-pulse'
                          : zone.status === 'WATCH'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{zone.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {zone.forecastLoadMw.toFixed(1)} / {zone.capacityMw} MW
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-mono font-bold ${
                        zone.status === 'OVERLOADED'
                          ? 'text-rose-600'
                          : zone.status === 'WATCH'
                          ? 'text-amber-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {utilPct}%
                    </span>
                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                      {zone.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended Actions Panel */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              <span>Recommended Actions</span>
            </h3>
            <button
              onClick={() => onNavigateTab('transfer-plan')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Details
            </button>
          </div>

          {recommendations.length === 0 ? (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">Grid operating in balance</div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                No zone exceeds rated capacity threshold. No emergency load shedding or transfers are required.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="text-rose-600 font-bold">{rec.sourceZoneName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-emerald-700 font-bold">{rec.targetZoneName}</span>
                    </span>
                    <span className="font-mono font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                      +{rec.transferMw.toFixed(2)} MW
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {rec.reason}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-blue-100/60 font-mono">
                    <span>Pre: {rec.sourcePreLoadMw} MW</span>
                    <span className="text-emerald-700 font-semibold">Post: {rec.sourcePostLoadMw} MW (Relieved)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Simulation Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Simulation Execution</span>
            </h3>
            <span className="text-[11px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded">
              Run #{simulationResult.runCount}
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Scenario Preset</span>
              <span className="font-semibold text-slate-900">{simulationResult.scenarioName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Last Execution</span>
              <span className="font-mono text-slate-700">{simulationResult.timestamp}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Overload Resolution</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{simulationResult.allOverloadsResolved ? '100% Relieved' : 'Partial Relief'}</span>
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Total Energy Shifted</span>
              <span className="font-mono font-bold text-blue-700">
                {simulationResult.totalMegawattsShifted.toFixed(2)} MW
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('guide')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore ADSA &amp; OOPJ Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chronological Simulation History Log Component */}
      <SimulationHistoryLog
        history={simulationHistory}
        onClearHistory={onClearHistory}
      />
    </div>
  );
};
