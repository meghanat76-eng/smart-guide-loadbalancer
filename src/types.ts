export type ZoneStatus = 'NORMAL' | 'WATCH' | 'OVERLOADED';

export interface GridZoneData {
  id: string;
  name: string;
  capacityMw: number;
  currentLoadMw: number;
  forecastLoadMw: number;
  trendSlope: number;
  historicalLoads: number[];
  status: ZoneStatus;
  partitionId?: string;
  postLoadMw?: number;
  // Node coordinates for graph rendering (0..100 percentage or px)
  x: number;
  y: number;
}

export interface GridConnection {
  from: string;
  to: string;
  lineCapacityMw: number;
  isTieLine?: boolean;
}

export interface TransferPlanItem {
  sourceZoneId: string;
  sourceZoneName: string;
  targetZoneId: string;
  targetZoneName: string;
  transferMw: number;
  sourcePreLoadMw: number;
  sourcePostLoadMw: number;
  targetPreLoadMw: number;
  targetPostLoadMw: number;
  sourceCapacityMw: number;
  targetCapacityMw: number;
  sourcePreOverloadMw: number;
  targetPreSpareMw: number;
  lineCapacityMw: number;
  reason: string;
  transferType: 'INTRA_PARTITION' | 'INTER_PARTITION';
}

export interface GridPartition {
  partitionId: string;
  name: string;
  zoneIds: string[];
  totalCapacity: number;
  totalLoad: number;
  surplusCapacity: number;
  overloadAmount: number;
  intraEdges: string[];
}

export interface SimulationResult {
  timestamp: string;
  runCount: number;
  scenarioName: string;
  allOverloadsResolved: boolean;
  totalMegawattsShifted: number;
  overloadedZoneCount: number;
  totalCurrentLoadMw: number;
  totalForecastLoadMw: number;
  totalGridCapacityMw: number;
  zones: GridZoneData[];
  partitions: GridPartition[];
  tieLines: [string, string][];
  recommendations: TransferPlanItem[];
  pythonExecutionLog: string[];
  javaExecutionLog: string[];
  algorithmSummary: string;
}

export interface SimulationHistoryItem {
  id: string;
  runNumber: number;
  timestamp: string;
  scenarioName: string;
  status: 'RESOLVED' | 'NOMINAL' | 'PARTIAL';
  overloadCount: number;
  totalShiftedMw: number;
  recommendationCount: number;
  summary: string;
  primaryRoute?: string;
  executionTimeMs?: number;
  zonesSnapshot?: GridZoneData[];
  recommendationsSnapshot?: TransferPlanItem[];
  totalCurrentLoadMw?: number;
  totalForecastLoadMw?: number;
  loadTrajectory?: number[];
  runToRunDeltaMw?: number;
  trendDirection?: 'INCREASING' | 'DECREASING' | 'STABLE';
}
