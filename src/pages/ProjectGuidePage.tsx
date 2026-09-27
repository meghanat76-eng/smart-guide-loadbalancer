import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  GitBranch,
  Layers,
  Cpu,
  Calculator,
  ShieldAlert,
  GraduationCap,
  ChevronRight,
  FileText,
  Terminal,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface ProjectGuidePageProps {
  onOpenCodeViewer: () => void;
}

export const ProjectGuidePage: React.FC<ProjectGuidePageProps> = ({ onOpenCodeViewer }) => {
  const [activeSection, setActiveSection] = useState<string>('problem');

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Curriculum Guide</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Smart Grid Load Balancer: Architecture &amp; Theory
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            A comprehensive college project guide integrating Object-Oriented Programming in Java (OOPJ), Advanced Data Structures &amp; Algorithms (ADSA), and Python time-series regression.
          </p>
        </div>

        <button
          onClick={onOpenCodeViewer}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Code2 className="w-4 h-4" />
          <span>View Source Files</span>
        </button>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'problem', label: '1. Problem Statement' },
          { id: 'graph', label: '2. Graph Modeling' },
          { id: 'adsa', label: '3. ADSA Divide & Conquer' },
          { id: 'oopj', label: '4. Java OOP Architecture' },
          { id: 'python', label: '5. Python Forecaster' },
          { id: 'pipeline', label: '6. Data Exchange Flow' },
          { id: 'presentation', label: '7. Presentation Script' },
          { id: 'glossary', label: '8. Glossary' },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === sec.id
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Section 1: Problem Statement */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">1</span>
          <h3 className="text-base font-bold text-slate-900">Problem Statement &amp; Microgrid Load Dynamics</h3>
        </div>

        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            Modern electrical grids are increasingly decentralized into local <strong>microgrids</strong> containing interconnected regional zones (residential suburbs, commercial centers, industrial parks, and harbor facilities).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
              <h4 className="font-bold text-slate-900">Why Overloads Occur</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-500">
                <li><strong>Uncoordinated Peak Hours:</strong> Simultaneous heating or cooling during weather extremes.</li>
                <li><strong>Industrial Ramp-Ups:</strong> Heavy machinery startup shifts drawing sudden mega-watt surges.</li>
                <li><strong>EV Fleet Charging:</strong> Clustered charging stations overloading local substations.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
              <h4 className="font-bold text-slate-900">Why Load Balancing Helps</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-500">
                <li><strong>Prevents Blackouts:</strong> Alleviates transformer overload before circuit breakers trip.</li>
                <li><strong>Protects Assets:</strong> Avoids thermal overheating on aging transmission cables.</li>
                <li><strong>Maximizes Efficiency:</strong> Utilizes idle spare capacity in adjacent connected zones.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Graph Theory */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">2</span>
          <h3 className="text-base font-bold text-slate-900">Graph Theory: Vertices, Edges &amp; Constraints</h3>
        </div>

        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            The microgrid is formalized mathematically as an undirected graph $G = (V, E)$:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
              <span className="font-bold text-slate-900 font-mono">Vertices V (Zones)</span>
              <p className="text-slate-500 text-[11px]">
                Each zone $v \in V$ possesses a rated capacity $C(v)$ and load $L(v)$. In this project: $|V| = 6$ (North, East, Central, West, South, Harbor).
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
              <span className="font-bold text-slate-900 font-mono">Edges E (Transmission Lines)</span>
              <p className="text-slate-500 text-[11px]">
                An edge $(u, v) \in E$ represents a physical high-voltage circuit. Power can ONLY be routed between zones that share a direct graph edge!
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
              <span className="font-bold text-slate-900 font-mono">Line Ratings (Thermal Limits)</span>
              <p className="text-slate-500 text-[11px]">
                Each edge (u, v) has a maximum transmission capacity T_max(u, v) (e.g. 25–35 MW) that cannot be exceeded regardless of target headroom.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: ADSA Divide & Conquer */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">3</span>
          <h3 className="text-base font-bold text-slate-900">
            ADSA Component: Divide &amp; Conquer Graph Partitioning
          </h3>
        </div>

        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            In electrical grid operations, computing global optimizations across a massive monolithic graph introduces $O(|V| \cdot |E|)$ communication latency. The <strong>Divide and Conquer</strong> technique decomposes the grid hierarchically:
          </p>

          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] space-y-2">
            <div className="text-emerald-400 font-bold">Algorithm: DivideAndConquerGridPartition(Graph G, Threshold k=3)</div>
            <div>1. Base Case: If |V(G)| &le; k: return AutonomousSubgrid(V(G))</div>
            <div>2. Divide: Split G into balanced bi-partitions V_A and V_B minimizing cross-boundary cut edges.</div>
            <div>3. Conquer:</div>
            <div className="pl-4">Part_A = DivideAndConquerGridPartition(Subgrid(V_A), k)</div>
            <div className="pl-4">Part_B = DivideAndConquerGridPartition(Subgrid(V_B), k)</div>
            <div>4. Combine: Classify intra-partition circuits vs. boundary inter-partition tie-lines.</div>
          </div>

          <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
            <h4 className="font-bold text-blue-900">Big-O Time Complexity Analysis (Master Theorem)</h4>
            <p className="text-blue-950">
              The recursion tree divides vertices into two subproblems of size $|V|/2$. The split step evaluates edge connectivity in $O(|V| + |E|)$ time:
            </p>
            <div className="font-mono text-blue-800 text-[11px] font-bold">
              T(|V|) = 2 · T(|V| / 2) + O(|V| + |E|) &rArr; By Master Theorem (Case 2): T(|V|) = O((|V| + |E|) · log |V|)
            </div>
            <p className="text-[11px] text-blue-900">
              In our 6-zone topology, the base case threshold ($k=3$) produces two primary sectors: Northern Sector (North, East, Central) and Southern Sector (West, South, Harbor), bridged by Central&mdash;West and Central&mdash;South tie-lines.
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: OOPJ Java Architecture */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">4</span>
          <h3 className="text-base font-bold text-slate-900">
            OOPJ Component: Object-Oriented Java Architecture
          </h3>
        </div>

        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            The backend engine is engineered following strict Object-Oriented Programming (OOP) principles: encapsulation, single responsibility, and loose coupling:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: 'GridZone.java', role: 'Entity Class', desc: 'Encapsulates electrical state: capacity, current load, forecast load, and status calculations.' },
              { name: 'GridGraph.java', role: 'Data Structure Class', desc: 'Maintains adjacency lists and line capacity limits for the microgrid topology.' },
              { name: 'PartitionManager.java', role: 'ADSA Algorithm', desc: 'Implements recursive divide-and-conquer graph partitioning.' },
              { name: 'LoadBalancer.java', role: 'Business Logic Engine', desc: 'Constrained greedy dispatcher that routes excess load to intra-partition neighbors first.' },
              { name: 'TransferRecommendation.java', role: 'Value Object', desc: 'Immutable recommendation record detailing source, destination, MW shift, and explanation.' },
              { name: 'CsvManager.java', role: 'I/O Integration', desc: 'Reads/writes standardized CSV data connecting Java and Python subsystems.' },
            ].map((cls) => (
              <div key={cls.name} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-900">{cls.name}</span>
                  <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                    {cls.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{cls.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 5: Python Machine Learning / Linear Regression */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">5</span>
          <h3 className="text-base font-bold text-slate-900">
            Python Component: Ordinary Least Squares (OLS) Forecaster
          </h3>
        </div>

        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            Load forecasting is implemented in <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">python/forecast.py</code> using the Python standard library. It processes the historical time-series exported by Java:
          </p>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[11px] space-y-1">
            <div className="text-blue-700 font-bold"># Python Linear Regression Formulation</div>
            <div>x_values = [1, 2, 3, 4, 5, 6]  # Time intervals T-5 to T0</div>
            <div>y_values = [readings from CSV]</div>
            <div>m = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x**2)</div>
            <div>b = (sum_y - m * sum_x) / n</div>
            <div>forecast_T1 = m * 7 + b  # Projected load at next interval</div>
          </div>
        </div>
      </div>

      {/* Section 6: Data Exchange Pipeline */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">6</span>
          <h3 className="text-base font-bold text-slate-900">Data Exchange Pipeline (Java &harr; Python)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="text-[10px] font-bold text-blue-600 uppercase">Step 1 (Java)</div>
            <div className="font-semibold text-slate-900">Export Historical CSV</div>
            <div className="text-[11px] text-slate-400 font-mono">data/historical_loads.csv</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="text-[10px] font-bold text-blue-600 uppercase">Step 2 (Python)</div>
            <div className="font-semibold text-slate-900">Execute OLS Forecast</div>
            <div className="text-[11px] text-slate-400 font-mono">python3 forecast.py</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="text-[10px] font-bold text-blue-600 uppercase">Step 3 (Java)</div>
            <div className="font-semibold text-slate-900">Import Forecast CSV</div>
            <div className="text-[11px] text-slate-400 font-mono">data/forecast_loads.csv</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="text-[10px] font-bold text-blue-600 uppercase">Step 4 (Java)</div>
            <div className="font-semibold text-slate-900">Dispatch &amp; Balance</div>
            <div className="text-[11px] text-slate-400 font-mono">transfer_recommendations.csv</div>
          </div>
        </div>
      </div>

      {/* Section 7: Presentation Walkthrough */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">7</span>
          <h3 className="text-base font-bold text-slate-900">
            College Presentation Walkthrough (6-Step Demo Script)
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          {[
            {
              step: 'Step 1: Introduction',
              desc: 'Open the Overview dashboard. Explain that the microgrid represents 6 interconnected electrical zones. Point out that North zone is experiencing an evening peak ramp at 84 MW.',
            },
            {
              step: 'Step 2: Show the Topology Map',
              desc: 'Switch to "Grid Map". Explain that zones are graph vertices and transmission lines are graph edges. Show the Divide-and-Conquer partition overlay separating the Northern Sector from the Southern Sector.',
            },
            {
              step: 'Step 3: Run the Live Simulation',
              desc: 'Click "Run Simulation". Explain that Java exported the historical loads, Python computed the OLS linear trend, and Java detected that North will exceed its 100 MW capacity at 101.13 MW.',
            },
            {
              step: 'Step 4: Demonstrate the Transfer Plan',
              desc: 'Navigate to "Transfer Plan". Show that Java recommended shifting 1.13 MW from North to adjacent East. Emphasize that East has 25.6 MW spare capacity and is within the same sector (intra-partition priority).',
            },
            {
              step: 'Step 5: Test a Multi-Zone Heatwave Scenario',
              desc: 'Select "Heatwave Alert" from the top dropdown and click "Run Simulation". Show how both North and South exceed capacity, triggering cross-partition transfers across tie-lines.',
            },
            {
              step: 'Step 6: Code Inspection & Terminal Verification',
              desc: 'Click "Inspect Source Files" in the sidebar to show the Java OOP classes and Python forecast script to the examiner. Reference the Big-O Master Theorem proof.',
            },
          ].map((item, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div>
                <div className="font-bold text-slate-900">{item.step}</div>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 8: Glossary */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">8</span>
          <h3 className="text-base font-bold text-slate-900">Glossary of Technical Terms</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {[
            { term: 'Megawatt (MW)', def: 'Standard unit of electrical power (1,000,000 Watts) measuring instantaneous energy consumption and generation rate.' },
            { term: 'Rated Capacity', def: 'The maximum continuous power throughput a substation or distribution transformer can handle without overheating or tripping.' },
            { term: 'Forecast Utilization (%)', def: 'Ratio of predicted load to rated capacity: (ForecastLoad / Capacity) * 100.' },
            { term: 'Graph Vertex (Node)', def: 'A discrete entity in graph theory; in this project, each electrical zone is modeled as a vertex.' },
            { term: 'Graph Edge (Link)', def: 'A connection between two vertices representing a physical electrical transmission corridor.' },
            { term: 'Tie-Line', def: 'A cross-boundary transmission line connecting two distinct regional sectors or subgrids.' },
            { term: 'Load Balancing', def: 'The process of redistributing electricity demand from congested lines/zones to under-utilized neighbors.' },
            { term: 'Ordinary Least Squares (OLS)', def: 'A statistical method that estimates linear trends by minimizing the sum of squared vertical offsets between observed and fitted values.' },
          ].map((item) => (
            <div key={item.term} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="font-bold text-slate-900 font-mono">{item.term}:</span>{' '}
              <span className="text-slate-600 text-[11px] leading-relaxed">{item.def}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
