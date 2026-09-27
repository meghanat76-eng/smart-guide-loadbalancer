import React, { useState } from 'react';
import { GridZoneData, GridConnection } from '../types';
import { X, Sliders, Zap, Shield, ArrowRight, TrendingUp } from 'lucide-react';

interface ZoneModalProps {
  zone: GridZoneData | null;
  connections: GridConnection[];
  allZones: GridZoneData[];
  onClose: () => void;
  onUpdateLoad?: (zoneId: string, newCurrentLoad: number) => void;
}

export const ZoneModal: React.FC<ZoneModalProps> = ({
  zone,
  connections,
  allZones,
  onClose,
  onUpdateLoad,
}) => {
  if (!zone) return null;

  const [simulatedLoad, setSimulatedLoad] = useState<number>(zone.currentLoadMw);

  // Neighbors directly connected
  const neighborConnections = connections.filter(
    (c) => c.from === zone.id || c.to === zone.id
  );

  const neighbors = neighborConnections.map((c) => {
    const neighborId = c.from === zone.id ? c.to : c.from;
    const neighborZone = allZones.find((z) => z.id === neighborId);
    return {
      id: neighborId,
      name: neighborZone?.name || neighborId,
      capacityMw: neighborZone?.capacityMw || 100,
      currentLoadMw: neighborZone?.currentLoadMw || 50,
      forecastLoadMw: neighborZone?.forecastLoadMw || 50,
      status: neighborZone?.status || 'NORMAL',
      lineLimitMw: c.lineCapacityMw,
      isTieLine: c.isTieLine,
    };
  });

  const utilPct = ((zone.forecastLoadMw / zone.capacityMw) * 100).toFixed(1);
  const spareCapacity = Math.max(0, zone.capacityMw - zone.forecastLoadMw).toFixed(1);
  const overload = Math.max(0, zone.forecastLoadMw - zone.capacityMw).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              {zone.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Zone Details: {zone.name}</h3>
              <p className="text-xs text-slate-500">
                Partition: {zone.partitionId || 'Standard Sector'} · Rated Capacity: {zone.capacityMw} MW
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Load</span>
              <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                {zone.currentLoadMw.toFixed(1)} <span className="text-xs font-normal text-slate-500">MW</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Forecast Load</span>
              <div className={`text-lg font-bold font-mono mt-1 ${zone.status === 'OVERLOADED' ? 'text-rose-600' : 'text-blue-700'}`}>
                {zone.forecastLoadMw.toFixed(1)} <span className="text-xs font-normal text-slate-500">MW</span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${zone.status === 'OVERLOADED' ? 'bg-rose-50/40 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Utilization</span>
              <div className={`text-lg font-bold font-mono mt-1 ${zone.status === 'OVERLOADED' ? 'text-rose-600' : 'text-slate-900'}`}>
                {utilPct}%
              </div>
            </div>
          </div>

          {/* Utilization Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
              <span>Capacity Consumption</span>
              <span>{zone.forecastLoadMw.toFixed(1)} / {zone.capacityMw} MW</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  zone.status === 'OVERLOADED'
                    ? 'bg-rose-600'
                    : zone.status === 'WATCH'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (zone.forecastLoadMw / zone.capacityMw) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>0 MW</span>
              <span>
                {parseFloat(overload) > 0 ? (
                  <span className="text-rose-600 font-semibold font-mono">Overload: +{overload} MW</span>
                ) : (
                  <span className="text-emerald-600 font-semibold font-mono">Spare Margin: {spareCapacity} MW</span>
                )}
              </span>
              <span>{zone.capacityMw} MW Max</span>
            </div>
          </div>

          {/* Connected Neighboring Zones */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Direct Graph Connections ({neighbors.length} Interties)</span>
            </h4>
            <div className="space-y-2">
              {neighbors.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{n.name}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 font-mono">Cap: {n.capacityMw} MW</span>
                    {n.isTieLine && (
                      <span className="text-[10px] bg-slate-200 px-1 rounded text-slate-600">Cross-Tie</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-500">Line Limit: {n.lineLimitMw} MW</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Load Adjuster for presentations */}
          {onUpdateLoad && (
            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Interactive Load Surge Slider (Demo)</span>
                </span>
                <span className="text-xs font-bold font-mono text-blue-700">{simulatedLoad.toFixed(1)} MW</span>
              </div>
              <input
                type="range"
                min="20"
                max={zone.capacityMw * 1.3}
                step="1"
                value={simulatedLoad}
                onChange={(e) => setSimulatedLoad(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setSimulatedLoad(zone.currentLoadMw);
                  }}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md cursor-pointer"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    onUpdateLoad(zone.id, simulatedLoad);
                    onClose();
                  }}
                  className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs cursor-pointer"
                >
                  Apply &amp; Re-run Simulation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200/70 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
