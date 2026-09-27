import React, { useState } from 'react';
import {
  GridZoneData,
  GridConnection,
  TransferPlanItem,
  GridPartition,
} from '../types';
import { GridTopologyGraph } from '../components/GridTopologyGraph';
import { Network, Shield, ArrowRight, Layers, Sliders, CheckCircle2 } from 'lucide-react';

interface GridMapPageProps {
  zones: GridZoneData[];
  connections: GridConnection[];
  recommendations: TransferPlanItem[];
  partitions: GridPartition[];
  onSelectZone: (zone: GridZoneData) => void;
  selectedZone: GridZoneData | null;
  onUpdateLoad?: (zoneId: string, newCurrentLoad: number) => void;
}

export const GridMapPage: React.FC<GridMapPageProps> = ({
  zones,
  connections,
  recommendations,
  partitions,
  onSelectZone,
  selectedZone,
  onUpdateLoad,
}) => {
  const activeZone = selectedZone || zones[0];

  // Connected neighbors for activeZone
  const neighborConnections = connections.filter(
    (c) => c.from === activeZone.id || c.to === activeZone.id
  );

  const neighbors = neighborConnections.map((c) => {
    const nId = c.from === activeZone.id ? c.to : c.from;
    const nZone = zones.find((z) => z.id === nId);
    return {
      id: nId,
      name: nZone?.name || nId,
      capacityMw: nZone?.capacityMw || 100,
      currentLoadMw: nZone?.currentLoadMw || 50,
      forecastLoadMw: nZone?.forecastLoadMw || 50,
      status: nZone?.status || 'NORMAL',
      lineLimitMw: c.lineCapacityMw,
      isTieLine: c.isTieLine,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <Network className="w-4 h-4" />
            <span>Graph Theory &amp; Network Topology</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Microgrid Graph G = (V, E) &amp; Regional Sectors
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl">
            In this academic model, vertices $V$ represent regional power distribution zones, and edges $E$ represent high-voltage transmission interties. Load balancing transfers are strictly constrained to direct graph edges.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs font-mono bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div>
            <div className="text-slate-400">Vertices (|V|)</div>
            <div className="text-sm font-bold text-slate-900">{zones.length} Zones</div>
          </div>
          <span className="text-slate-300">·</span>
          <div>
            <div className="text-slate-400">Edges (|E|)</div>
            <div className="text-sm font-bold text-slate-900">{connections.length} Lines</div>
          </div>
          <span className="text-slate-300">·</span>
          <div>
            <div className="text-slate-400">Partitions</div>
            <div className="text-sm font-bold text-blue-600">{partitions.length} Sectors</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Full Size Graph (8 cols) + Zone Telemetry Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <GridTopologyGraph
            zones={zones}
            connections={connections}
            recommendations={recommendations}
            partitions={partitions}
            onSelectZone={onSelectZone}
            selectedZoneId={activeZone.id}
          />
        </div>

        {/* Selected Zone Inspector Panel */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Selected Vertex
                </span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{activeZone.name} Zone</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      activeZone.status === 'OVERLOADED'
                        ? 'bg-rose-100 text-rose-700'
                        : activeZone.status === 'WATCH'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {activeZone.status}
                  </span>
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                {activeZone.partitionId || 'Sector A'}
              </span>
            </div>

            {/* Zone Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-medium">Rated Capacity</span>
                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {activeZone.capacityMw} MW
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-medium">Current Demand</span>
                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {activeZone.currentLoadMw.toFixed(1)} MW
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${activeZone.status === 'OVERLOADED' ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-slate-400 font-medium">Forecast Peak</span>
                <div className={`text-base font-bold font-mono mt-0.5 ${activeZone.status === 'OVERLOADED' ? 'text-rose-700' : 'text-blue-700'}`}>
                  {activeZone.forecastLoadMw.toFixed(1)} MW
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-medium">Headroom Margin</span>
                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {activeZone.forecastLoadMw > activeZone.capacityMw ? (
                    <span className="text-rose-600">+{(activeZone.forecastLoadMw - activeZone.capacityMw).toFixed(1)} MW OL</span>
                  ) : (
                    <span className="text-emerald-600">{(activeZone.capacityMw - activeZone.forecastLoadMw).toFixed(1)} MW Spare</span>
                  )}
                </div>
              </div>
            </div>

            {/* Adjacency List for this Zone */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Adjacent Edges (E)</span>
                </span>
                <span className="text-slate-400 font-mono">{neighbors.length} links</span>
              </div>

              <div className="space-y-1.5">
                {neighbors.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      const t = zones.find((z) => z.id === n.id);
                      if (t) onSelectZone(t);
                    }}
                    className="p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 cursor-pointer transition-colors text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{n.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Forecast: {n.forecastLoadMw.toFixed(1)} / {n.capacityMw} MW
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[11px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        Limit: {n.lineLimitMw} MW
                      </span>
                      {n.isTieLine && (
                        <div className="text-[10px] text-amber-600 font-medium mt-0.5">Tie Line</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Divide and Conquer Partition Context Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Divide &amp; Conquer Partitions</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              The microgrid is hierarchically divided into autonomous subgrids to decouple transmission coordination.
            </p>

            <div className="space-y-2">
              {partitions.map((p) => {
                const isZoneInPartition = p.zoneIds.includes(activeZone.id);
                return (
                  <div
                    key={p.partitionId}
                    className={`p-3 rounded-lg border text-xs ${
                      isZoneInPartition
                        ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between font-semibold">
                      <span>{p.name}</span>
                      <span className="font-mono text-[11px]">{p.totalCapacity} MW Cap</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Zones: {p.zoneIds.join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
