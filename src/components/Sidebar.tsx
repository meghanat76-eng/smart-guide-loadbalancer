import React from 'react';
import {
  Zap,
  LayoutDashboard,
  Network,
  Layers,
  TrendingUp,
  ArrowRightLeft,
  BookOpen,
  Code2,
  X,
} from 'lucide-react';

export type NavTab = 'overview' | 'grid-map' | 'zones' | 'forecasts' | 'transfer-plan' | 'guide';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  onOpenCodeViewer: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  onOpenCodeViewer,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'grid-map', label: 'Grid Map', icon: Network },
    { id: 'zones', label: 'Zones', icon: Layers },
    { id: 'forecasts', label: 'Forecasts', icon: TrendingUp },
    { id: 'transfer-plan', label: 'Transfer Plan', icon: ArrowRightLeft },
    { id: 'guide', label: 'Project Guide', icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-none tracking-tight text-base">
                GridFlow
              </div>
              <div className="text-[11px] text-slate-500 font-medium tracking-tight mt-0.5">
                Smart Grid Load Balancer
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom utility: inspect academic source code */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <button
            onClick={() => {
              onOpenCodeViewer();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/80 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Inspect Source Files</span>
            </span>
            <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">
              Java + Py
            </span>
          </button>

          <div className="px-2 pt-1 text-[11px] text-slate-400 leading-relaxed">
            ADSA &amp; OOPJ Simulation Model
          </div>
        </div>
      </aside>
    </>
  );
};
