import { LayoutGrid, FileText, Sparkles, ArrowLeft } from 'lucide-react';

interface SidebarProps {
  activeTab: 'jobs' | 'resumes';
  isViewingAnalysis: boolean;
  onTabChange: (tab: 'jobs' | 'resumes') => void;
  onBack: () => void;
}

export default function Sidebar({ activeTab, isViewingAnalysis, onTabChange, onBack }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-[var(--border)] flex flex-col shrink-0">
      {/* Brand */}
      <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-cyan)] flex items-center justify-center shadow-md">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-base text-[var(--text-heading)] leading-none">ApplyAI</h1>
          <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider uppercase">Workspace</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 p-4 space-y-1.5">
        <button
          onClick={() => onTabChange('jobs')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'jobs' && !isViewingAnalysis
              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-[var(--accent)] border border-blue-100 shadow-sm'
              : 'text-[var(--text-body)] hover:bg-[var(--bg-page)] border border-transparent'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Applications Board
        </button>

        <button
          onClick={() => onTabChange('resumes')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'resumes' && !isViewingAnalysis
              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-[var(--accent)] border border-blue-100 shadow-sm'
              : 'text-[var(--text-body)] hover:bg-[var(--bg-page)] border border-transparent'
          }`}
        >
          <FileText className="w-4 h-4" />
          Resume Templates
        </button>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[var(--border)]">
        <button
          onClick={onBack}
          className="w-full flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-heading)] hover:bg-[var(--bg-page)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Exit Workspace
        </button>
      </div>
    </aside>
  );
}
