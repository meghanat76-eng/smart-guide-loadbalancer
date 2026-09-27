import React, { useState } from 'react';
import { GridZoneData, GridConnection, TransferPlanItem, GridPartition } from '../types';
import { Layers, ArrowRight, Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GridTopologyGraphProps {
  zones: GridZoneData[];
  connections: GridConnection[];
  recommendations: TransferPlanItem[];
  partitions?: GridPartition[];
  onSelectZone: (zone: GridZoneData) => void;
  selectedZoneId?: string | null;
  interactive?: boolean;
}

export const GridTopologyGraph: React.FC<GridTopologyGraphProps> = ({
  zones,
  connections,
  recommendations,
  partitions,
  onSelectZone,
  selectedZoneId,
  interactive = true,
}) => {
  const [showPartitions, setShowPartitions] = useState(true);
  const [showTransfers, setShowTransfers] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // SVG viewBox coordinates
  // Layout coordinates for the 6 zones (width 720, height 480)
  const zoneCoords: Record<string, { x: number; y: number }> = {
    North: { x: 360, y: 70 },
    East: { x: 570, y: 130 },
    Central: { x: 360, y: 240 },
    West: { x: 150, y: 240 },
    South: { x: 490, y: 400 },
    Harbor: { x: 210, y: 400 },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OVERLOADED':
        return {
          fill: '#FEF2F2',
          stroke: '#DC2626',
          badge: '#DC2626',
          text: '#991B1B',
          ring: 'rgba(220, 38, 38, 0.25)',
        };
      case 'WATCH':
        return {
          fill: '#FFFBEB',
          stroke: '#D97706',
          badge: '#D97706',
          text: '#92400E',
          ring: 'rgba(217, 119, 6, 0.2)',
        };
      case 'NORMAL':
      default:
        return {
          fill: '#F0FDF4',
          stroke: '#16A34A',
          badge: '#16A34A',
          text: '#166534',
          ring: 'rgba(22, 163, 74, 0.2)',
        };
    }
  };

  return (
    <div className="relative bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
      {/* Top control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50/70 border-b border-slate-200/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Microgrid Topology</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500 font-mono text-[11px]">|V| = {zones.length} zones, |E| = {connections.length} lines</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPartitions(!showPartitions)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showPartitions
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Partition Overlay</span>
          </button>

          <button
            onClick={() => setShowTransfers(!showTransfers)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showTransfers
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Transfer Flows</span>
          </button>

          <div className="flex items-center border border-slate-200 rounded-md bg-white overflow-hidden">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
              className="p-1 hover:bg-slate-100 text-slate-500 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:bg-slate-100 text-slate-500 text-[10px] font-mono px-1.5 cursor-pointer"
              title="Reset zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1 hover:bg-slate-100 text-slate-500 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto bg-[#FAFCFF] flex justify-center py-2">
        <svg
          viewBox="0 0 720 480"
          className="w-full max-w-[800px] h-auto select-none"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.2s' }}
        >
          <defs>
            {/* Arrow marker for transfer flows */}
            <marker
              id="transfer-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563EB" />
            </marker>

            {/* Subtle glow filter */}
            <filter id="glow-danger" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#DC2626" floodOpacity="0.4" />
            </filter>
            <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* 1. Divide-and-Conquer Partition Shading */}
          {showPartitions && (
            <g className="partition-overlays opacity-90 transition-opacity">
              {/* Partition A: Northern Sector [North, East, Central] */}
              <path
                d="M 270 40 L 640 90 L 640 290 L 330 300 L 250 160 Z"
                fill="#EFF6FF"
                fillOpacity="0.75"
                stroke="#93C5FD"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                rx="20"
              />
              <text x="590" y="70" fill="#3B82F6" fontSize="11" fontWeight="600" textAnchor="end">
                PARTITION A · Northern Sector
              </text>

              {/* Partition B: Southern Sector [West, South, Harbor] */}
              <path
                d="M 70 210 L 250 210 L 570 360 L 550 460 L 120 460 Z"
                fill="#F0FDF4"
                fillOpacity="0.7"
                stroke="#86EFAC"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                rx="20"
              />
              <text x="100" y="450" fill="#16A34A" fontSize="11" fontWeight="600">
                PARTITION B · Southern Sector
              </text>
            </g>
          )}

          {/* 2. Physical Grid Connection Lines (Edges) */}
          <g className="grid-edges">
            {connections.map((conn, idx) => {
              const start = zoneCoords[conn.from];
              const end = zoneCoords[conn.to];
              if (!start || !end) return null;

              const isTie = conn.isTieLine;
              const midX = (start.x + end.x) / 2;
              const midY = (start.y + end.y) / 2;

              return (
                <g key={`edge-${idx}`}>
                  {/* Background shadow line */}
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={isTie ? '#94A3B8' : '#CBD5E1'}
                    strokeWidth={isTie ? 2.5 : 2}
                    strokeDasharray={isTie ? '6 4' : undefined}
                  />

                  {/* Line capacity label badge */}
                  <rect
                    x={midX - 22}
                    y={midY - 9}
                    width={44}
                    height={18}
                    rx={9}
                    fill="#FFFFFF"
                    stroke={isTie ? '#94A3B8' : '#E2E8F0'}
                    strokeWidth={1}
                  />
                  <text
                    x={midX}
                    y={midY + 3.5}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="500"
                  >
                    {conn.lineCapacityMw}M
                  </text>
                </g>
              );
            })}
          </g>

          {/* 3. Recommended Transfer Direction Overlays */}
          {showTransfers && (
            <g className="transfer-flows">
              {recommendations.map((rec, idx) => {
                const start = zoneCoords[rec.sourceZoneId];
                const end = zoneCoords[rec.targetZoneId];
                if (!start || !end) return null;

                // Calculate offset for curved arc
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const ux = dx / len;
                const uy = dy / len;

                // Shorten endpoints so arrow touches node boundary
                const startX = start.x + ux * 36;
                const startY = start.y + uy * 36;
                const endX = end.x - ux * 36;
                const endY = end.y - uy * 36;

                // Midpoint for animated text label
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2 - 12;

                return (
                  <g key={`rec-${idx}`} className="animate-pulse">
                    {/* Glowing active transfer path */}
                    <line
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="#2563EB"
                      strokeWidth={3.5}
                      strokeDasharray="6 3"
                      markerEnd="url(#transfer-arrow)"
                    />

                    {/* Transfer badge */}
                    <rect
                      x={midX - 32}
                      y={midY - 11}
                      width={64}
                      height={20}
                      rx={10}
                      fill="#2563EB"
                      filter="url(#node-shadow)"
                    />
                    <text
                      x={midX}
                      y={midY + 3}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      +{rec.transferMw.toFixed(1)} MW
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* 4. Grid Vertices (Zone Nodes) */}
          <g className="grid-nodes">
            {zones.map((zone) => {
              const coords = zoneCoords[zone.id] || { x: 360, y: 240 };
              const colors = getStatusColor(zone.status);
              const isSelected = selectedZoneId === zone.id;
              const isOverloaded = zone.status === 'OVERLOADED';
              const utilPct = Math.round((zone.forecastLoadMw / zone.capacityMw) * 100);

              return (
                <g
                  key={zone.id}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  onClick={() => interactive && onSelectZone(zone)}
                  className={`cursor-pointer transition-transform duration-150 ${
                    interactive ? 'hover:scale-105' : ''
                  }`}
                  filter={isOverloaded ? 'url(#glow-danger)' : 'url(#node-shadow)'}
                >
                  {/* Outer selection ring */}
                  {isSelected && (
                    <circle r="44" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="4 2" />
                  )}

                  {/* Pulsing ring for overloaded node */}
                  {isOverloaded && (
                    <circle r="42" fill="none" stroke="#DC2626" strokeWidth="2" opacity="0.6" className="animate-ping" />
                  )}

                  {/* Node Body Card */}
                  <rect
                    x="-68"
                    y="-30"
                    width="136"
                    height="60"
                    rx="12"
                    fill="#FFFFFF"
                    stroke={isSelected ? '#2563EB' : colors.stroke}
                    strokeWidth={isSelected ? 2.5 : 1.8}
                  />

                  {/* Status header indicator bar */}
                  <rect x="-68" y="-30" width="6" height="60" rx="3" fill={colors.badge} />

                  {/* Zone Name */}
                  <text x="-52" y="-10" fill="#0F172A" fontSize="13" fontWeight="bold" fontFamily="system-ui">
                    {zone.name}
                  </text>

                  {/* Status label */}
                  <text x="-52" y="5" fill={colors.text} fontSize="9.5" fontWeight="600" className="uppercase">
                    {zone.status}
                  </text>

                  {/* Load / Capacity Numerals */}
                  <text x="-52" y="20" fill="#475569" fontSize="10.5" fontFamily="monospace" fontWeight="500">
                    {zone.forecastLoadMw.toFixed(1)} / {zone.capacityMw.toFixed(0)} MW
                  </text>

                  {/* Utilization badge right aligned */}
                  <rect
                    x="20"
                    y="-18"
                    width="40"
                    height="18"
                    rx="9"
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth="0.8"
                  />
                  <text
                    x="40"
                    y="-5.5"
                    textAnchor="middle"
                    fill={colors.text}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {utilPct}%
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Bottom Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-slate-50/70 border-t border-slate-200/70 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-slate-400 font-medium">Node Status:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-700 font-medium">Normal (&lt;85%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-700 font-medium">Watch (85–100%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span className="text-slate-700 font-medium">Overloaded (&gt;100%)</span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-slate-400" />
            <span>Intra-grid Line</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t border-dashed border-slate-500" />
            <span>Inter-partition Tie Line</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-blue-600" />
            <span>Recommended Transfer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
