import React, { useState, useMemo } from 'react';
import { GridZoneData, GridConnection } from '../types';
import { Search, Filter, ArrowUpDown, ChevronRight, Layers, SlidersHorizontal } from 'lucide-react';

interface ZonesPageProps {
  zones: GridZoneData[];
  connections: GridConnection[];
  onSelectZone: (zone: GridZoneData) => void;
}

export const ZonesPage: React.FC<ZonesPageProps> = ({
  zones,
  connections,
  onSelectZone,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NORMAL' | 'WATCH' | 'OVERLOADED'>('ALL');
  const [sortBy, setSortBy] = useState<'utilization' | 'name' | 'capacity' | 'forecast'>('utilization');
  const [sortAsc, setSortAsc] = useState(false);

  // Helper to find connected neighbor names
  const getConnectedNeighborNames = (zoneId: string) => {
    return connections
      .filter((c) => c.from === zoneId || c.to === zoneId)
      .map((c) => (c.from === zoneId ? c.to : c.from))
      .join(', ');
  };

  // Filter & Sort
  const filteredZones = useMemo(() => {
    return zones
      .filter((z) => {
        const matchesSearch =
          z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          z.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || z.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'utilization') {
          const utilA = a.forecastLoadMw / a.capacityMw;
          const utilB = b.forecastLoadMw / b.capacityMw;
          cmp = utilA - utilB;
        } else if (sortBy === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (sortBy === 'capacity') {
          cmp = a.capacityMw - b.capacityMw;
        } else if (sortBy === 'forecast') {
          cmp = a.forecastLoadMw - b.forecastLoadMw;
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [zones, searchQuery, statusFilter, sortBy, sortAsc]);

  const toggleSort = (field: 'utilization' | 'name' | 'capacity' | 'forecast') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false); // default descending for metrics
    }
  };

  return (
    <div className="space-y-6">
      {/* Search, Filter, and Sorting Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search zones by name (e.g. North, Central)..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg pl-9 pr-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Status Filter buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          {(['ALL', 'NORMAL', 'WATCH', 'OVERLOADED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Zones Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 font-semibold tracking-wider uppercase text-[11px]">
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Zone Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Current Load</th>
                <th
                  onClick={() => toggleSort('capacity')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Capacity</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('forecast')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Forecast (T+1)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('utilization')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none min-w-[160px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Forecast Utilization</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Spare / Overload</th>
                <th className="py-3 px-4">Connected Edges</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredZones.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No matching microgrid zones found for "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredZones.map((zone) => {
                  const utilPct = (zone.forecastLoadMw / zone.capacityMw) * 100;
                  const isOverloaded = utilPct > 100;
                  const isWatch = utilPct >= 85 && utilPct <= 100;
                  const overloadMw = Math.max(0, zone.forecastLoadMw - zone.capacityMw);
                  const spareMw = Math.max(0, zone.capacityMw - zone.forecastLoadMw);
                  const neighbors = getConnectedNeighborNames(zone.id);

                  return (
                    <tr
                      key={zone.id}
                      onClick={() => onSelectZone(zone)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-slate-100 group-hover:bg-blue-100 text-slate-700 group-hover:text-blue-700 flex items-center justify-center font-mono text-xs">
                          {zone.name.charAt(0)}
                        </span>
                        <div>
                          <div>{zone.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{zone.partitionId || 'Sector A'}</div>
                        </div>
                      </td>

                      {/* Current Load */}
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                        {zone.currentLoadMw.toFixed(1)} MW
                      </td>

                      {/* Capacity */}
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                        {zone.capacityMw.toFixed(0)} MW
                      </td>

                      {/* Forecast Load */}
                      <td className="py-3.5 px-4 font-mono tabular-nums font-bold">
                        <span className={isOverloaded ? 'text-rose-600' : 'text-slate-900'}>
                          {zone.forecastLoadMw.toFixed(1)} MW
                        </span>
                      </td>

                      {/* Progress Utilization */}
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono tabular-nums">
                            <span className={isOverloaded ? 'text-rose-600 font-bold' : isWatch ? 'text-amber-600 font-semibold' : 'text-slate-600'}>
                              {utilPct.toFixed(1)}%
                            </span>
                            <span className="text-slate-400 font-normal">of {zone.capacityMw} MW</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOverloaded
                                  ? 'bg-rose-600'
                                  : isWatch
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, utilPct)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Spare or Overload */}
                      <td className="py-3.5 px-4 font-mono tabular-nums">
                        {isOverloaded ? (
                          <span className="text-rose-600 font-bold">+{overloadMw.toFixed(1)} MW Overload</span>
                        ) : (
                          <span className="text-emerald-700 font-medium">{spareMw.toFixed(1)} MW Spare</span>
                        )}
                      </td>

                      {/* Connected zones */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-[180px] truncate" title={neighbors}>
                        {neighbors}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full inline-block ${
                            isOverloaded
                              ? 'bg-rose-100 text-rose-700'
                              : isWatch
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {zone.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-blue-600 group-hover:text-blue-800 text-xs font-medium flex items-center justify-end gap-1">
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
