import React from 'react';
import { ShieldCheck, Download, Code } from 'lucide-react';

interface FooterProps {
  onOpenCodeViewer: () => void;
  onDownloadReport: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenCodeViewer, onDownloadReport }) => {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Educational simulation — not connected to live grid equipment.</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            onClick={onDownloadReport}
            className="hover:text-blue-600 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Datasets</span>
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={onOpenCodeViewer}
            className="hover:text-blue-600 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Java &amp; Python Sources</span>
          </button>
          <span className="text-slate-300">·</span>
          <span className="text-slate-400">ADSA &amp; OOPJ College Project</span>
        </div>
      </div>
    </footer>
  );
};
