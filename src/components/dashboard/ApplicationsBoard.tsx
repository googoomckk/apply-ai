import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { JobApplication, Resume } from '../../hooks/useStore';
import { Sparkles, Plus, Trash2, Play } from 'lucide-react';

interface ApplicationsBoardProps {
  jobs: JobApplication[];
  resumes: Resume[];
  onAddJobClick: () => void;
  onAICheckClick: () => void;
  onMatchClick: (job: JobApplication) => void;
  onViewAnalysisClick: (jobId: string) => void;
  onUpdateJobStatus: (id: string, status: JobApplication['status']) => void;
  onDeleteJob: (id: string) => void;
}

export default function ApplicationsBoard({
  jobs,
  resumes,
  onAddJobClick,
  onAICheckClick,
  onMatchClick,
  onViewAnalysisClick,
  onUpdateJobStatus,
  onDeleteJob,
}: ApplicationsBoardProps) {
  const columns: { id: JobApplication['status']; label: string; color: string }[] = [
    { id: 'wishlist', label: 'Wishlist', color: 'border-t-slate-400' },
    { id: 'applied', label: 'Applied', color: 'border-t-blue-400' },
    { id: 'interviewing', label: 'Interviewing', color: 'border-t-amber-400' },
    { id: 'offer', label: 'Offer Received', color: 'border-t-emerald-400' },
    { id: 'rejected', label: 'Rejected', color: 'border-t-rose-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-[var(--text-heading)]">Applications Board</h2>
          <p className="text-xs text-[var(--text-muted)]">Track your target roles and evaluate compatibility</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={onAICheckClick}
            className="flex items-center gap-1.5 shadow-sm text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-cyan)] fill-[var(--accent-cyan)]/15" />
            AI Compare Match
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onAddJobClick}
            className="flex items-center gap-1.5 shadow-md text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {columns.map((col) => {
          const columnJobs = jobs.filter((j) => j.status === col.id);
          return (
            <div key={col.id} className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden flex flex-col min-h-[350px]">
              {/* Column Header */}
              <div className={`px-4 py-3 border-b border-[var(--border)] border-t-2 ${col.color} flex justify-between items-center bg-slate-50`}>
                <span className="font-display font-extrabold text-xs text-[var(--text-heading)]">
                  {col.label}
                </span>
                <Badge className="px-2 py-0.5 text-[10px] font-bold bg-slate-200/60 text-[var(--text-body)]">
                  {columnJobs.length}
                </Badge>
              </div>

              {/* Cards list */}
              <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[450px]">
                {columnJobs.map((job) => (
                  <Card
                    key={job.id}
                    className="p-3 border border-black/5 hover:border-[var(--accent)] hover:shadow-md transition-all group flex flex-col gap-2 relative bg-[var(--bg-page)]/20"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-display font-bold text-xs text-[var(--text-heading)] leading-tight group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                          {job.role}
                        </h4>
                        <button
                          onClick={() => onDeleteJob(job.id)}
                          className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                        {job.company}
                      </span>
                    </div>

                    {/* Applied date */}
                    <div className="flex items-center gap-1 text-[9px] text-[var(--text-muted)]">
                      <span>Added: {job.dateApplied}</span>
                    </div>

                    {/* Status controls */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 gap-1.5">
                      <select
                        value={job.status}
                        onChange={(e) => onUpdateJobStatus(job.id, e.target.value as JobApplication['status'])}
                        className="text-[10px] border border-black/10 rounded px-1.5 py-0.5 bg-white text-[var(--text-body)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                      >
                        <option value="wishlist">Wishlist</option>
                        <option value="applied">Applied</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      {job.matchScore !== undefined ? (
                        <button
                          onClick={() => onViewAnalysisClick(job.id)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-0.5"
                          title="View analysis report"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600/10" />
                          {job.matchScore}%
                        </button>
                      ) : (
                        <button
                          onClick={() => onMatchClick(job)}
                          disabled={resumes.length === 0}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-0.5"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          Match
                        </button>
                      )}
                    </div>
                  </Card>
                ))}

                {columnJobs.length === 0 && (
                  <div className="py-8 text-center text-[10px] text-[var(--text-muted)] italic border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
