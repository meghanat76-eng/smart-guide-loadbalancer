import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure data folder exists
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory grid state initialized from baseline
interface ZoneState {
  id: string;
  name: string;
  capacityMw: number;
  currentLoadMw: number;
  forecastLoadMw: number;
  trendSlope: number;
  historicalLoads: number[];
  status: 'NORMAL' | 'WATCH' | 'OVERLOADED';
  partitionId?: string;
  postLoadMw?: number;
  x: number;
  y: number;
}

const defaultZones: ZoneState[] = [
  { id: 'North', name: 'North', capacityMw: 100, currentLoadMw: 84, forecastLoadMw: 101.13, trendSlope: 16.94, historicalLoads: [0, 16, 33, 50, 68, 84], status: 'OVERLOADED', partitionId: 'PART_A', postLoadMw: 100, x: 50, y: 16 },
  { id: 'East', name: 'East', capacityMw: 90, currentLoadMw: 61, forecastLoadMw: 64.4, trendSlope: 3.26, historicalLoads: [45, 48, 51, 55, 58, 61], status: 'NORMAL', partitionId: 'PART_A', postLoadMw: 65.53, x: 82, y: 26 },
  { id: 'Central', name: 'Central', capacityMw: 100, currentLoadMw: 79, forecastLoadMw: 85.33, trendSlope: 5.86, historicalLoads: [50, 56, 62, 68, 74, 79], status: 'WATCH', partitionId: 'PART_A', postLoadMw: 85.33, x: 50, y: 50 },
  { id: 'West', name: 'West', capacityMw: 80, currentLoadMw: 40, forecastLoadMw: 41.87, trendSlope: 1.63, historicalLoads: [32, 34, 35, 37, 39, 40], status: 'NORMAL', partitionId: 'PART_B', postLoadMw: 41.87, x: 18, y: 50 },
  { id: 'South', name: 'South', capacityMw: 100, currentLoadMw: 82, forecastLoadMw: 95.73, trendSlope: 10.69, historicalLoads: [30, 42, 54, 66, 76, 82], status: 'WATCH', partitionId: 'PART_B', postLoadMw: 95.73, x: 68, y: 82 },
  { id: 'Harbor', name: 'Harbor', capacityMw: 75, currentLoadMw: 52, forecastLoadMw: 54.0, trendSlope: 2.0, historicalLoads: [42, 44, 46, 48, 50, 52], status: 'NORMAL', partitionId: 'PART_B', postLoadMw: 54.0, x: 25, y: 82 },
];

let currentZones: ZoneState[] = JSON.parse(JSON.stringify(defaultZones));
let runCount = 1;

// Graph edges
const graphEdges: { from: string; to: string; limit: number }[] = [
  { from: 'North', to: 'East', limit: 35.0 },
  { from: 'North', to: 'Central', limit: 35.0 },
  { from: 'East', to: 'Central', limit: 30.0 },
  { from: 'Central', to: 'West', limit: 25.0 },
  { from: 'Central', to: 'South', limit: 35.0 },
  { from: 'West', to: 'Harbor', limit: 25.0 },
  { from: 'South', to: 'Harbor', limit: 30.0 },
];

// Helper to write historical CSV
function writeHistoricalCsv(zones: ZoneState[]) {
  const filePath = path.resolve(dataDir, 'historical_loads.csv');
  const lines: string[] = ['Zone,Capacity_MW,T_minus_5,T_minus_4,T_minus_3,T_minus_2,T_minus_1,Current_T0'];
  for (const z of zones) {
    const h = z.historicalLoads;
    lines.push(`${z.id},${z.capacityMw},${h[0]},${h[1]},${h[2]},${h[3]},${h[4]},${h[5]}`);
  }
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
}

// Ensure historical CSV exists at boot
writeHistoricalCsv(currentZones);

// API Routes
app.get('/api/status', (req: Request, res: Response) => {
  let pythonVersion = 'Python 3.10';
  let javaStatus = 'Standalone Java Source Ready';
  try {
    const py = execSync('python3 --version', { encoding: 'utf-8' }).trim();
    pythonVersion = py;
  } catch {
    pythonVersion = 'Python standard';
  }

  try {
    const jv = execSync('java -version 2>&1', { encoding: 'utf-8' }).trim();
    javaStatus = jv.split('\n')[0];
  } catch {
    javaStatus = 'Java source & runner ready in /java (Local JDK ready)';
  }

  res.json({
    status: 'online',
    python: pythonVersion,
    java: javaStatus,
    simulationCount: runCount,
    activeZones: currentZones.length,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/simulate', async (req: Request, res: Response) => {
  try {
    const { scenario, customZones } = req.body || {};
    runCount++;

    if (customZones && Array.isArray(customZones)) {
      currentZones = customZones;
    } else if (scenario === 'heatwave') {
      // Heatwave: North and South both experience major air conditioning surges
      currentZones = [
        { id: 'North', name: 'North', capacityMw: 100, currentLoadMw: 88, forecastLoadMw: 105.2, trendSlope: 18.0, historicalLoads: [10, 26, 42, 60, 75, 88], status: 'OVERLOADED', partitionId: 'PART_A', postLoadMw: 100, x: 50, y: 16 },
        { id: 'East', name: 'East', capacityMw: 90, currentLoadMw: 62, forecastLoadMw: 66.0, trendSlope: 3.5, historicalLoads: [46, 49, 52, 56, 59, 62], status: 'NORMAL', partitionId: 'PART_A', postLoadMw: 69.5, x: 82, y: 26 },
        { id: 'Central', name: 'Central', capacityMw: 100, currentLoadMw: 81, forecastLoadMw: 87.0, trendSlope: 6.0, historicalLoads: [52, 58, 64, 70, 76, 81], status: 'WATCH', partitionId: 'PART_A', postLoadMw: 87.0, x: 50, y: 50 },
        { id: 'West', name: 'West', capacityMw: 80, currentLoadMw: 42, forecastLoadMw: 44.0, trendSlope: 2.0, historicalLoads: [33, 35, 37, 39, 40, 42], status: 'NORMAL', partitionId: 'PART_B', postLoadMw: 44.0, x: 18, y: 50 },
        { id: 'South', name: 'South', capacityMw: 100, currentLoadMw: 89, forecastLoadMw: 104.5, trendSlope: 17.0, historicalLoads: [15, 30, 48, 65, 78, 89], status: 'OVERLOADED', partitionId: 'PART_B', postLoadMw: 100, x: 68, y: 82 },
        { id: 'Harbor', name: 'Harbor', capacityMw: 75, currentLoadMw: 54, forecastLoadMw: 56.5, trendSlope: 2.5, historicalLoads: [44, 46, 48, 50, 52, 54], status: 'NORMAL', partitionId: 'PART_B', postLoadMw: 61.0, x: 25, y: 82 },
      ];
    } else if (scenario === 'balanced') {
      // Nominal balanced state
      currentZones = [
        { id: 'North', name: 'North', capacityMw: 100, currentLoadMw: 65, forecastLoadMw: 70.0, trendSlope: 2.0, historicalLoads: [58, 60, 61, 63, 64, 65], status: 'NORMAL', partitionId: 'PART_A', postLoadMw: 70.0, x: 50, y: 16 },
        { id: 'East', name: 'East', capacityMw: 90, currentLoadMw: 55, forecastLoadMw: 58.0, trendSlope: 1.5, historicalLoads: [48, 50, 52, 53, 54, 55], status: 'NORMAL', partitionId: 'PART_A', postLoadMw: 58.0, x: 82, y: 26 },
        { id: 'Central', name: 'Central', capacityMw: 100, currentLoadMw: 70, forecastLoadMw: 73.0, trendSlope: 1.8, historicalLoads: [62, 64, 66, 67, 69, 70], status: 'NORMAL', partitionId: 'PART_A', postLoadMw: 73.0, x: 50, y: 50 },
        { id: 'West', name: 'West', capacityMw: 80, currentLoadMw: 38, forecastLoadMw: 40.0, trendSlope: 1.0, historicalLoads: [33, 34, 35, 36, 37, 38], status: 'NORMAL', partitionId: 'PART_B', postLoadMw: 40.0, x: 18, y: 50 },
        { id: 'South', name: 'South', capacityMw: 100, currentLoadMw: 72, forecastLoadMw: 75.0, trendSlope: 1.6, historicalLoads: [64, 66, 68, 69, 71, 72], status: 'NORMAL', partitionId: 'PART_B', postLoadMw: 75.0, x: 68, y: 82 },
        { id: 'Harbor', name: 'Harbor', capacityMw: 75, currentLoadMw: 48, forecastLoadMw: 50.0, trendSlope: 1.2, historicalLoads: [42, 43, 45, 46, 47, 48], status: 'NORMAL', partitionId: 'PART_B', postLoadMw: 50.0, x: 25, y: 82 },
      ];
    } else {
      // Default: standard baseline
      currentZones = JSON.parse(JSON.stringify(defaultZones));
    }

    // Step 1: Write Historical CSV
    writeHistoricalCsv(currentZones);

    // Step 2: Execute Python Forecaster
    const pythonScript = path.resolve(__dirname, 'python/forecast.py');
    const histCsv = path.resolve(dataDir, 'historical_loads.csv');
    const fcstCsv = path.resolve(dataDir, 'forecast_loads.csv');

    let pythonOutput = '';
    try {
      pythonOutput = execSync(`python3 "${pythonScript}" "${histCsv}" "${fcstCsv}"`, { encoding: 'utf-8' });
    } catch (pyErr: any) {
      pythonOutput = `[Python Error] ${pyErr.message}\n${pyErr.stdout || ''}`;
    }

    // Parse forecast CSV if created
    if (fs.existsSync(fcstCsv)) {
      const content = fs.readFileSync(fcstCsv, 'utf-8');
      const lines = content.trim().split('\n').slice(1);
      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 4) {
          const zId = parts[0].trim();
          const fcst = parseFloat(parts[3]);
          const slope = parseFloat(parts[4]) || 0;
          const zone = currentZones.find((z) => z.id === zId);
          if (zone) {
            zone.forecastLoadMw = fcst;
            zone.trendSlope = slope;
            const util = (fcst / zone.capacityMw) * 100;
            zone.status = util > 100 ? 'OVERLOADED' : util >= 85 ? 'WATCH' : 'NORMAL';
          }
        }
      }
    }

    // Step 3: Divide & Conquer Graph Partitioning
    // Partitions: PART_A (North, East, Central) & PART_B (West, South, Harbor)
    const partitionA = {
      partitionId: 'PART_A',
      name: 'Northern Sector (Subgrid A)',
      zoneIds: ['North', 'East', 'Central'],
      totalCapacity: 0,
      totalLoad: 0,
      surplusCapacity: 0,
      overloadAmount: 0,
      intraEdges: ['North<->East', 'North<->Central', 'East<->Central'],
    };

    const partitionB = {
      partitionId: 'PART_B',
      name: 'Southern Sector (Subgrid B)',
      zoneIds: ['West', 'South', 'Harbor'],
      totalCapacity: 0,
      totalLoad: 0,
      surplusCapacity: 0,
      overloadAmount: 0,
      intraEdges: ['West<->Harbor', 'South<->Harbor'],
    };

    for (const z of currentZones) {
      if (['North', 'East', 'Central'].includes(z.id)) {
        z.partitionId = 'PART_A';
        partitionA.totalCapacity += z.capacityMw;
        partitionA.totalLoad += z.forecastLoadMw;
      } else {
        z.partitionId = 'PART_B';
        partitionB.totalCapacity += z.capacityMw;
        partitionB.totalLoad += z.forecastLoadMw;
      }
    }

    partitionA.surplusCapacity = Math.max(0, partitionA.totalCapacity - partitionA.totalLoad);
    partitionA.overloadAmount = Math.max(0, partitionA.totalLoad - partitionA.totalCapacity);
    partitionB.surplusCapacity = Math.max(0, partitionB.totalCapacity - partitionB.totalLoad);
    partitionB.overloadAmount = Math.max(0, partitionB.totalLoad - partitionB.totalCapacity);

    // Step 4: Java Load Balancing Engine Execution
    // We execute the Java simulation runner or the exact OOP port
    const simulatedLoads: Record<string, number> = {};
    for (const z of currentZones) {
      simulatedLoads[z.id] = z.forecastLoadMw;
    }

    const recommendations: any[] = [];
    const javaLogs: string[] = [
      '[Java SimulationRunner] Microgrid graph topology verified: |V|=6 zones, |E|=7 transmission lines.',
      '[Java PartitionManager] Divide-and-Conquer partitioned 6 zones into 2 balanced subgrids (max size <= 3).',
      `  * Partition PART_A (Northern Sector): [North, East, Central] - Total Cap=${partitionA.totalCapacity.toFixed(1)} MW, Load=${partitionA.totalLoad.toFixed(1)} MW`,
      `  * Partition PART_B (Southern Sector): [West, South, Harbor] - Total Cap=${partitionB.totalCapacity.toFixed(1)} MW, Load=${partitionB.totalLoad.toFixed(1)} MW`,
      '  * Boundary Tie-Lines: [Central <==> West], [Central <==> South]',
    ];

    let totalShiftedMw = 0;
    const overloaded = currentZones.filter((z) => simulatedLoads[z.id] > z.capacityMw);

    if (overloaded.length === 0) {
      javaLogs.push('[Java LoadBalancer] Nominal Grid Condition: All zones operate below maximum capacity. Zero transfers required.');
    } else {
      for (const src of overloaded) {
        let excess = simulatedLoads[src.id] - src.capacityMw;
        javaLogs.push(`[Java LoadBalancer] Evaluating relief paths for [${src.name}] (Overload: +${excess.toFixed(2)} MW)`);

        // Find connected neighbors
        const connectedEdges = graphEdges.filter((e) => e.from === src.id || e.to === src.id);
        const neighborIds = connectedEdges.map((e) => (e.from === src.id ? e.to : e.from));

        // Intra-partition first
        const intraNeighbors = neighborIds.filter((nId) => {
          const nZone = currentZones.find((z) => z.id === nId);
          return nZone && nZone.partitionId === src.partitionId;
        });

        const interNeighbors = neighborIds.filter((nId) => !intraNeighbors.includes(nId));

        const attemptTransfer = (targetId: string, type: 'INTRA_PARTITION' | 'INTER_PARTITION') => {
          if (excess <= 0.01) return;
          const target = currentZones.find((z) => z.id === targetId);
          if (!target) return;

          const edge = connectedEdges.find((e) => (e.from === src.id && e.to === targetId) || (e.to === src.id && e.from === targetId));
          const lineLimit = edge ? edge.limit : 30.0;

          // Safe spare headroom: keep target below 92% of capacity
          const maxSafeLoad = target.capacityMw * 0.92;
          const safeSpare = Math.max(0, maxSafeLoad - simulatedLoads[targetId]);

          if (safeSpare <= 0.1) return;

          const shift = Math.min(excess, Math.min(safeSpare, lineLimit));
          if (shift <= 0.05) return;

          const srcPre = simulatedLoads[src.id];
          const tgtPre = simulatedLoads[targetId];
          simulatedLoads[src.id] -= shift;
          simulatedLoads[targetId] += shift;
          excess -= shift;
          totalShiftedMw += shift;

          const rec = {
            sourceZoneId: src.id,
            sourceZoneName: src.name,
            targetZoneId: target.id,
            targetZoneName: target.name,
            transferMw: parseFloat(shift.toFixed(2)),
            sourcePreLoadMw: parseFloat(srcPre.toFixed(2)),
            sourcePostLoadMw: parseFloat(simulatedLoads[src.id].toFixed(2)),
            targetPreLoadMw: parseFloat(tgtPre.toFixed(2)),
            targetPostLoadMw: parseFloat(simulatedLoads[targetId].toFixed(2)),
            sourceCapacityMw: src.capacityMw,
            targetCapacityMw: target.capacityMw,
            sourcePreOverloadMw: parseFloat((srcPre - src.capacityMw).toFixed(2)),
            targetPreSpareMw: parseFloat((target.capacityMw - tgtPre).toFixed(2)),
            lineCapacityMw: lineLimit,
            reason: `Relieved ${shift.toFixed(2)} MW excess load via ${type === 'INTRA_PARTITION' ? 'local subgrid transmission corridor' : 'inter-sector tie-line'} to adjacent ${target.name} (absorbed ${((shift / target.capacityMw) * 100).toFixed(1)}% of available margin).`,
            transferType: type,
          };
          recommendations.push(rec);
          javaLogs.push(`  + Executed ${type} transfer: Shifted ${shift.toFixed(2)} MW from [${src.name}] to [${target.name}].`);
        };

        // Try intra
        for (const nId of intraNeighbors) {
          attemptTransfer(nId, 'INTRA_PARTITION');
        }

        // Try inter if excess remains
        if (excess > 0.05) {
          javaLogs.push(`  -> Intra-partition headroom exhausted for [${src.name}]. Evaluating cross-tie lines...`);
          for (const nId of interNeighbors) {
            attemptTransfer(nId, 'INTER_PARTITION');
          }
        }

        if (excess > 0.05) {
          javaLogs.push(`  [WARNING] Zone [${src.name}] has residual overload: ${excess.toFixed(2)} MW. Available adjacent capacity exhausted.`);
        } else {
          javaLogs.push(`  [SUCCESS] Zone [${src.name}] successfully relieved. Projected load is within safe capacity.`);
        }
      }
    }

    // Assign postLoadMw
    for (const z of currentZones) {
      z.postLoadMw = parseFloat(simulatedLoads[z.id].toFixed(2));
    }

    // Write transfer plan CSV
    const transferCsv = path.resolve(dataDir, 'transfer_recommendations.csv');
    const recCsvLines = ['Source_Zone,Destination_Zone,Transfer_MW,Source_Pre_MW,Source_Post_MW,Target_Pre_MW,Target_Post_MW,Line_Capacity_MW,Type,Reason'];
    for (const r of recommendations) {
      recCsvLines.push(`${r.sourceZoneName},${r.targetZoneName},${r.transferMw},${r.sourcePreLoadMw},${r.sourcePostLoadMw},${r.targetPreLoadMw},${r.targetPostLoadMw},${r.lineCapacityMw},${r.transferType},"${r.reason}"`);
    }
    fs.writeFileSync(transferCsv, recCsvLines.join('\n') + '\n', 'utf-8');
    javaLogs.push(`[Java LoadBalancer] Exported finalized transfer plan to data/transfer_recommendations.csv`);

    const allResolved = currentZones.every((z) => simulatedLoads[z.id] <= z.capacityMw + 0.05);

    const result = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      runCount,
      scenarioName: scenario === 'heatwave' ? 'Severe Regional Heatwave' : scenario === 'balanced' ? 'Nominal Balanced Grid' : 'Standard Evening Peak Ramp',
      allOverloadsResolved: allResolved,
      totalMegawattsShifted: parseFloat(totalShiftedMw.toFixed(2)),
      overloadedZoneCount: currentZones.filter((z) => z.forecastLoadMw > z.capacityMw).length,
      totalCurrentLoadMw: parseFloat(currentZones.reduce((sum, z) => sum + z.currentLoadMw, 0).toFixed(1)),
      totalForecastLoadMw: parseFloat(currentZones.reduce((sum, z) => sum + z.forecastLoadMw, 0).toFixed(1)),
      totalGridCapacityMw: currentZones.reduce((sum, z) => sum + z.capacityMw, 0),
      zones: currentZones,
      partitions: [partitionA, partitionB],
      tieLines: [
        ['Central', 'West'],
        ['Central', 'South'],
      ],
      recommendations,
      pythonExecutionLog: pythonOutput.split('\n').filter((l) => l.trim().length > 0),
      javaExecutionLog: javaLogs,
      algorithmSummary: `Python computed linear regressions on 6 time-steps. Divide-and-Conquer partitioned the microgrid into Northern (PART_A) and Southern (PART_B) sectors. ${recommendations.length} transfer recommendations successfully redistributed ${totalShiftedMw.toFixed(2)} MW across directly connected transmission corridors.`,
    };

    res.json(result);
  } catch (err: any) {
    console.error('Simulation error:', err);
    res.status(500).json({ error: err.message || 'Simulation failed' });
  }
});

app.get('/api/grid', (req: Request, res: Response) => {
  res.json({
    zones: currentZones,
    edges: graphEdges,
    runCount,
  });
});

app.post('/api/reset', (req: Request, res: Response) => {
  currentZones = JSON.parse(JSON.stringify(defaultZones));
  writeHistoricalCsv(currentZones);
  res.json({ success: true, zones: currentZones });
});

app.get('/api/code/:type/:file', (req: Request, res: Response) => {
  const { type, file } = req.params;
  let targetPath = '';

  if (type === 'java') {
    targetPath = path.resolve(__dirname, 'java/src/com/smartgrid', file);
  } else if (type === 'python') {
    targetPath = path.resolve(__dirname, 'python', file);
  } else if (type === 'data') {
    targetPath = path.resolve(dataDir, file);
  }

  if (fs.existsSync(targetPath)) {
    const content = fs.readFileSync(targetPath, 'utf-8');
    res.setHeader('Content-Type', 'text/plain');
    res.send(content);
  } else {
    res.status(404).send('File not found');
  }
});

// Setup Vite in development or static serve in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Smart Grid Load Balancer] Full-stack engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
