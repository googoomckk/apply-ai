import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { useStore, JobApplication, Resume } from '../../hooks/useStore';
import {
  Sparkles,
  ArrowLeft,
  FileText,
  Briefcase,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ExternalLink,
  Edit,
  Sliders,
  Check,
  LayoutGrid,
  FileCheck,
  Sparkle
} from 'lucide-react';

const LOADING_PHASES = [
  'Initializing ApplyAI secure analyzer...',
  'Parsing resume structure and key sections...',
  'Extracting technical skills and core competencies...',
  'Analyzing job description requirements...',
  'Calculating semantic match and keywords coverage...',
  'Generating optimized resume bullets and suggestions...',
  'Formulating targeted interview prep strategy...',
];

export default function DashboardSection({ onBack }: { onBack: () => void }) {
  const {
    jobs,
    resumes,
    activeTab,
    selectedJobForAnalysis,
    setActiveTab,
    setSelectedJobForAnalysis,
    addJob,
    updateJob,
    deleteJob,
    addResume,
    updateResume,
    deleteResume,
  } = useStore();

  // Navigation / Local view state
  const [viewingAnalysisJobId, setViewingAnalysisJobId] = useState<string | null>(null);

  // Modals state
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [isAddResumeOpen, setIsAddResumeOpen] = useState(false);
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);

  // Form states
  const [newJob, setNewJob] = useState({
    company: '',
    role: '',
    status: 'wishlist' as JobApplication['status'],
    url: '',
    jobDescription: '',
    selectedResumeId: '',
    analyzeImmediately: false,
  });

  const [newResume, setNewResume] = useState({
    name: '',
    content: '',
    isDefault: false,
  });

  // API Call state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedPrepIndex, setExpandedPrepIndex] = useState<number | null>(null);

  // Sync selectedResumeId with default resume when resumes change
  useEffect(() => {
    const defaultResume = resumes.find(r => r.isDefault) || resumes[0];
    if (defaultResume) {
      setNewJob(prev => ({ ...prev, selectedResumeId: defaultResume.id }));
    }
  }, [resumes]);

  // Loading animation phase cycle
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingPhase(0);
      interval = setInterval(() => {
        setLoadingPhase((prev) => {
          if (prev < LOADING_PHASES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Run the Comparison
  const handleCompare = async (jobId: string, resumeContent: string, jobDesc: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const apiHost = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      const viteApiKey = import.meta.env.VITE_API_KEY;
      if (viteApiKey) {
        headers['x-api-key'] = viteApiKey;
      }

      const response = await fetch(`${apiHost}/api/compare`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resumeText: resumeContent,
          jobDescription: jobDesc,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to compare resume and job description.');
      }

      // Update the job in store
      updateJob(jobId, {
        matchScore: data.score,
        analysisResult: data,
        jobDescription: jobDesc
      });

      setViewingAnalysisJobId(jobId);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitNewJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.company || !newJob.role) return;

    // Create the job structure
    const jobData = {
      company: newJob.company,
      role: newJob.role,
      status: newJob.status,
      url: newJob.url,
      jobDescription: newJob.jobDescription,
      resumeUsed: newJob.selectedResumeId,
    };

    // Generate random id local mock behavior before calling store
    const generatedId = `job-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add job to store
    addJob({
      ...jobData,
    });
    
    // Find the actual newly created job in the store state is tricky, so we find it or we simulate
    // In our store, addJob adds it synchronously. Let's get the list after state update or just perform it.
    // Let's trigger a match immediately if check box is true and we have a resume and JD
    if (newJob.analyzeImmediately && newJob.jobDescription) {
      const selectedResume = resumes.find(r => r.id === newJob.selectedResumeId) || resumes.find(r => r.isDefault) || resumes[0];
      if (selectedResume) {
        // Because addJob uses a random ID inside, let's fetch the last added job from store
        setTimeout(() => {
          const stateJobs = useStore.getState().jobs;
          const createdJob = stateJobs[stateJobs.length - 1];
          if (createdJob) {
            handleCompare(createdJob.id, selectedResume.content, newJob.jobDescription);
          }
        }, 50);
      }
    }

    // Reset Form
    setNewJob({
      company: '',
      role: '',
      status: 'wishlist',
      url: '',
      jobDescription: '',
      selectedResumeId: resumes.find(r => r.isDefault)?.id || resumes[0]?.id || '',
      analyzeImmediately: false,
    });
    setIsAddJobOpen(false);
  };

  const submitNewResume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResume.name || !newResume.content) return;

    addResume({
      name: newResume.name,
      content: newResume.content,
      isDefault: newResume.isDefault,
    });

    setNewResume({ name: '', content: '', isDefault: false });
    setIsAddResumeOpen(false);
  };

  const submitEditResume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResume) return;

    updateResume(editingResume.id, {
      name: editingResume.name,
      content: editingResume.content,
      isDefault: editingResume.isDefault,
    });

    setEditingResume(null);
  };

  const getScoreStroke = (score: number) => {
    if (score >= 85) return '#22C55E';
    if (score >= 70) return '#2563EB';
    if (score >= 50) return '#FACC15';
    return '#EF4444';
  };

  const getStatusColor = (status: JobApplication['status']) => {
    switch (status) {
      case 'wishlist': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'applied': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'interviewing': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'offer': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  // Groups jobs by status columns
  const columns: { id: JobApplication['status']; label: string; color: string }[] = [
    { id: 'wishlist', label: 'Wishlist', color: 'border-t-slate-400' },
    { id: 'applied', label: 'Applied', color: 'border-t-blue-400' },
    { id: 'interviewing', label: 'Interviewing', color: 'border-t-amber-400' },
    { id: 'offer', label: 'Offer Received', color: 'border-t-emerald-400' },
    { id: 'rejected', label: 'Rejected', color: 'border-t-rose-400' },
  ];

  const currentAnalysisJob = jobs.find(j => j.id === viewingAnalysisJobId);

  return (
    <div className="flex min-h-screen bg-[var(--bg-page)] text-[var(--text-body)]">
      {/* Sidebar */}
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
            onClick={() => {
              setActiveTab('jobs');
              setViewingAnalysisJobId(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'jobs' && !viewingAnalysisJobId
                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-[var(--accent)] border border-blue-100 shadow-sm'
                : 'text-[var(--text-body)] hover:bg-[var(--bg-page)] border border-transparent'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Applications Board
          </button>

          <button
            onClick={() => {
              setActiveTab('resumes');
              setViewingAnalysisJobId(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'resumes' && !viewingAnalysisJobId
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

      {/* Main Panel */}
      <main className="flex-1 flex flex-col overflow-y-auto h-screen relative">
        {/* API Loading screen */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-float)] p-12 text-center max-w-md w-full">
                <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-50 animate-ping"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-[var(--accent)] border-r-[var(--accent-cyan)] border-b-transparent border-l-transparent animate-spin"></div>
                  <Sparkle className="w-8 h-8 text-[var(--accent-cyan)] animate-pulse" />
                </div>
                <h3 className="font-display font-extrabold text-lg text-[var(--text-heading)] mb-1">
                  Analyzing Alignment
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-6">
                  Applying advanced semantic matching rules to optimize your resume bullets.
                </p>

                {/* Progress bar */}
                <div className="bg-[var(--bg-page)] rounded-2xl p-4 text-left border border-black/5">
                  <span className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-wider block mb-1">
                    System Pipeline Status
                  </span>
                  <div className="text-xs font-semibold text-[var(--text-heading)] flex items-center gap-2 min-h-[32px]">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse shrink-0"></div>
                    {LOADING_PHASES[loadingPhase]}
                  </div>
                  <div className="w-full bg-gray-200 h-1 rounded-full mt-3 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-cyan)] h-full"
                      animate={{ width: `${((loadingPhase + 1) / LOADING_PHASES.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Error toast */}
        {error && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3.5 flex justify-between items-center text-rose-800 text-xs font-medium">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              {error}
            </span>
            <button onClick={() => setError(null)} className="underline cursor-pointer hover:text-rose-900">Dismiss</button>
          </div>
        )}

        {/* Content routing */}
        <div className="p-8 flex-1">
          {viewingAnalysisJobId && currentAnalysisJob ? (
            /* Match Analysis Detail view */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              {/* Back header */}
              <div className="flex items-center justify-between bg-white border border-[var(--border)] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewingAnalysisJobId(null)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-[var(--text-body)]" />
                  </button>
                  <div>
                    <h2 className="font-display font-extrabold text-sm text-[var(--text-heading)] leading-none">
                      {currentAnalysisJob.company}
                    </h2>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                      {currentAnalysisJob.role} &bull; Match Analysis
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const resume = resumes.find(r => r.id === currentAnalysisJob.resumeUsed) || resumes.find(r => r.isDefault) || resumes[0];
                      if (resume && currentAnalysisJob.jobDescription) {
                        handleCompare(currentAnalysisJob.id, resume.content, currentAnalysisJob.jobDescription);
                      }
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Re-run Analysis
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setViewingAnalysisJobId(null)}>
                    Done View
                  </Button>
                </div>
              </div>

              {currentAnalysisJob.analysisResult ? (
                <>
                  {/* Executive Match Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Score */}
                    <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-[var(--shadow-card)] flex flex-col items-center justify-center text-center">
                      <div className="relative w-32 h-32 mb-4">
                        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="#F1F5F9" strokeWidth="2.5" />
                          <motion.circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="none"
                            stroke={getScoreStroke(currentAnalysisJob.analysisResult.score)}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: '0, 100' }}
                            animate={{ strokeDasharray: `${currentAnalysisJob.analysisResult.score * 0.942}, 100` }}
                            transition={{ duration: 1.2 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-display font-extrabold text-[var(--text-heading)]">
                            {currentAnalysisJob.analysisResult.score}%
                          </span>
                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            Match Score
                          </span>
                        </div>
                      </div>
                      <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[10px] font-bold text-[var(--accent)]">
                        {currentAnalysisJob.analysisResult.fitLevel}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="md:col-span-2 bg-white rounded-3xl border border-[var(--border)] p-6 shadow-[var(--shadow-card)] flex flex-col justify-center">
                      <h3 className="font-display font-extrabold text-base text-[var(--text-heading)] mb-2">
                        Match Assessment
                      </h3>
                      <p className="text-xs md:text-sm text-[var(--text-body)] leading-relaxed">
                        {currentAnalysisJob.analysisResult.summary}
                      </p>
                    </div>
                  </div>

                  {/* Keyword Coverage */}
                  <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-[var(--shadow-card)]">
                    <h3 className="font-display font-extrabold text-sm text-[var(--text-heading)] mb-4 flex items-center gap-2">
                      <FileSpreadsheet className="w-4.5 h-4.5 text-[var(--accent-cyan)]" />
                      Keyword Coverage
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                          Matched Keywords ({currentAnalysisJob.analysisResult.matchedKeywords.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentAnalysisJob.analysisResult.matchedKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                              {kw}
                            </span>
                          ))}
                          {currentAnalysisJob.analysisResult.matchedKeywords.length === 0 && (
                            <span className="text-xs text-[var(--text-muted)] italic">No matches detected.</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                          Missing Keywords ({currentAnalysisJob.analysisResult.missingKeywords.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentAnalysisJob.analysisResult.missingKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="text-[10px] px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-100 flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600 stroke-[2.5]" />
                              {kw}
                            </span>
                          ))}
                          {currentAnalysisJob.analysisResult.missingKeywords.length === 0 && (
                            <span className="text-xs text-[var(--text-muted)] italic">No missing keywords! Excellent coverage.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Gaps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-[var(--shadow-card)]">
                      <h3 className="font-display font-extrabold text-sm text-[#16A34A] mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4.5 h-4.5" />
                        Key Strengths
                      </h3>
                      <ul className="space-y-2">
                        {currentAnalysisJob.analysisResult.strengths.map((str, idx) => (
                          <li key={idx} className="text-xs text-[var(--text-body)] flex items-start gap-2 leading-relaxed">
                            <div className="w-1 h-1 rounded-full bg-[#16A34A] mt-2 shrink-0"></div>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-[var(--shadow-card)]">
                      <h3 className="font-display font-extrabold text-sm text-[#EF4444] mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4.5 h-4.5" />
                        Major Gaps
                      </h3>
                      <ul className="space-y-2">
                        {currentAnalysisJob.analysisResult.gaps.map((gap, idx) => (
                          <li key={idx} className="text-xs text-[var(--text-body)] flex items-start gap-2 leading-relaxed">
                            <div className="w-1 h-1 rounded-full bg-[#EF4444] mt-2 shrink-0"></div>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Resume Enhancements */}
                  <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-[var(--shadow-card)]">
                    <h3 className="font-display font-extrabold text-sm text-[var(--text-heading)] mb-1">
                      Tailored Resume Enhancements
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] mb-4">
                      Integrate these suggested rewrites into your resume when applying for this role.
                    </p>
                    <div className="space-y-4">
                      {currentAnalysisJob.analysisResult.suggestions.map((sug, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                          <span className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-wider block">
                            {sug.section}
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg">
                              <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block mb-1">Original</span>
                              <p className="text-[11px] text-rose-800 italic">"{sug.original}"</p>
                            </div>
                            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Suggested Rewrite</span>
                              <p className="text-[11px] text-emerald-900 font-medium">"{sug.suggested}"</p>
                            </div>
                          </div>
                          <div className="text-[11px] text-[var(--text-body)]">
                            <span className="font-bold text-[var(--text-heading)]">Why:</span> {sug.rationale}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interview Preparation */}
                  <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-[var(--shadow-card)]">
                    <h3 className="font-display font-extrabold text-sm text-[var(--text-heading)] mb-1 flex items-center gap-2">
                      <HelpCircle className="w-4.5 h-4.5 text-[var(--accent)]" />
                      Targeted Interview Prep
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] mb-4">
                      Anticipate and prepare for questions recruiters might ask based on your resume gaps.
                    </p>
                    <div className="space-y-2">
                      {currentAnalysisJob.analysisResult.interviewPrep.map((prep, idx) => {
                        const isExpanded = expandedPrepIndex === idx;
                        return (
                          <div key={idx} className="border border-[var(--border)] rounded-xl overflow-hidden bg-white">
                            <button
                              onClick={() => setExpandedPrepIndex(isExpanded ? null : idx)}
                              className="w-full px-4 py-3 flex items-center justify-between text-left font-semibold text-xs text-[var(--text-heading)] hover:bg-[var(--bg-page)] transition-colors cursor-pointer"
                            >
                              <span>{prep.question}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              )}
                            </button>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden border-t border-[var(--border)] bg-slate-50"
                                >
                                  <div className="p-4 text-[11px] text-[var(--text-body)] leading-relaxed">
                                    <span className="font-bold text-[var(--text-heading)] block mb-1 text-[9px] uppercase tracking-wider">
                                      Suggested Response Strategy
                                    </span>
                                    {prep.strategy}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 bg-white border border-[var(--border)] rounded-3xl">
                  <p className="text-sm">No analysis result available for this job.</p>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'jobs' ? (
            /* Jobs / Applications tab */
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
                    onClick={() => {
                      if (resumes.length === 0) {
                        setError('You need to add at least one Resume template before starting an analysis.');
                        return;
                      }
                      // Open Add Job, pre-configure it for immediate comparison
                      setNewJob({
                        company: '',
                        role: '',
                        status: 'wishlist',
                        url: '',
                        jobDescription: '',
                        selectedResumeId: resumes.find(r => r.isDefault)?.id || resumes[0]?.id || '',
                        analyzeImmediately: true,
                      });
                      setIsAddJobOpen(true);
                    }}
                    className="flex items-center gap-1.5 shadow-sm text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-cyan)] fill-[var(--accent-cyan)]/15" />
                    AI Compare Match
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setNewJob({
                        company: '',
                        role: '',
                        status: 'wishlist',
                        url: '',
                        jobDescription: '',
                        selectedResumeId: resumes.find(r => r.isDefault)?.id || resumes[0]?.id || '',
                        analyzeImmediately: false,
                      });
                      setIsAddJobOpen(true);
                    }}
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
                  const columnJobs = jobs.filter(j => j.status === col.id);
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
                                <h4 className="font-display font-bold text-xs text-[var(--text-heading)] leading-tight group-hover:text-[var(--accent)] transition-colors">
                                  {job.role}
                                </h4>
                                <button
                                  onClick={() => deleteJob(job.id)}
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
                              {/* Status select dropdown */}
                              <select
                                value={job.status}
                                onChange={(e) => updateJob(job.id, { status: e.target.value as JobApplication['status'] })}
                                className="text-[10px] border border-black/10 rounded px-1.5 py-0.5 bg-white text-[var(--text-body)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                              >
                                <option value="wishlist">Wishlist</option>
                                <option value="applied">Applied</option>
                                <option value="interviewing">Interviewing</option>
                                <option value="offer">Offer</option>
                                <option value="rejected">Rejected</option>
                              </select>

                              {/* Match Score Indicator */}
                              {job.matchScore !== undefined ? (
                                <button
                                  onClick={() => setViewingAnalysisJobId(job.id)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-0.5"
                                  title="View analysis report"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600/10" />
                                  {job.matchScore}%
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (resumes.length === 0) {
                                      setError('Please add a Resume template first in the "Resume Templates" tab.');
                                      return;
                                    }
                                    setEditingJob(job);
                                    setNewJob({
                                      company: job.company,
                                      role: job.role,
                                      status: job.status,
                                      url: job.url || '',
                                      jobDescription: job.jobDescription || '',
                                      selectedResumeId: job.resumeUsed || resumes.find(r => r.isDefault)?.id || resumes[0]?.id || '',
                                      analyzeImmediately: true,
                                    });
                                  }}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-0.5"
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
          ) : (
            /* Resumes tab */
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-display font-extrabold text-2xl text-[var(--text-heading)]">Resume Templates</h2>
                  <p className="text-xs text-[var(--text-muted)]">Store and edit resumes to use during job matches</p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsAddResumeOpen(true)}
                  className="flex items-center gap-1.5 shadow-md text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Resume
                </Button>
              </div>

              {/* Resumes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resumes.map((resume) => (
                  <Card
                    key={resume.id}
                    className="p-5 border border-black/5 hover:border-[var(--accent)] hover:shadow-md transition-all flex flex-col justify-between min-h-[220px]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4.5 h-4.5 text-[var(--accent)]" />
                          <h4 className="font-display font-extrabold text-sm text-[var(--text-heading)] leading-tight line-clamp-1">
                            {resume.name}
                          </h4>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => setEditingResume(resume)}
                            className="p-1 text-slate-400 hover:text-[var(--accent)] transition-colors cursor-pointer"
                            title="Edit Resume"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteResume(resume.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete Template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center mb-4">
                        <span className="text-[9px] text-[var(--text-muted)]">
                          Updated: {resume.updatedAt}
                        </span>
                        {resume.isDefault ? (
                          <Badge className="px-2 py-0.2 text-[8px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                            Active Template
                          </Badge>
                        ) : (
                          <button
                            onClick={() => updateResume(resume.id, { isDefault: true })}
                            className="text-[8px] font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            Set Active
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-[var(--text-body)] line-clamp-4 font-mono bg-slate-50 p-2 rounded-lg leading-relaxed border border-slate-100">
                        {resume.content}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/5 text-[10px] text-[var(--text-muted)] flex justify-between items-center">
                      <span>{resume.content.split(/\s+/).filter(Boolean).length} words</span>
                      <span>{resume.content.length} chars</span>
                    </div>
                  </Card>
                ))}

                {resumes.length === 0 && (
                  <div className="col-span-full py-16 text-center border border-dashed border-slate-200 rounded-3xl bg-white shadow-sm">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h4 className="font-display font-extrabold text-base text-[var(--text-heading)] mb-1">No Resumes Found</h4>
                    <p className="text-xs text-[var(--text-muted)] mb-6 max-w-xs mx-auto">
                      Please add at least one Resume template to use for job matches and enhancements.
                    </p>
                    <Button variant="primary" size="sm" onClick={() => setIsAddResumeOpen(true)}>
                      Add Your First Resume
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Job Modal / Screen overlay */}
      <AnimatePresence>
        {isAddJobOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-float)] w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-slate-50">
                <h3 className="font-display font-extrabold text-base text-[var(--text-heading)]">
                  {newJob.analyzeImmediately ? 'Start AI Comparison' : 'Add New Job Application'}
                </h3>
                <button
                  onClick={() => setIsAddJobOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitNewJob} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[var(--text-heading)] mb-1">Company *</label>
                    <input
                      type="text"
                      required
                      value={newJob.company}
                      onChange={(e) => setNewJob(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="e.g. Stripe"
                      className="w-full p-2.5 rounded-xl border border-black/10 focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-heading)] mb-1">Role / Title *</label>
                    <input
                      type="text"
                      required
                      value={newJob.role}
                      onChange={(e) => setNewJob(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="e.g. Senior Frontend Dev"
                      className="w-full p-2.5 rounded-xl border border-black/10 focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[var(--text-heading)] mb-1">Status</label>
                    <select
                      value={newJob.status}
                      onChange={(e) => setNewJob(prev => ({ ...prev, status: e.target.value as JobApplication['status'] }))}
                      className="w-full p-2.5 rounded-xl border border-black/10 bg-white focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                    >
                      <option value="wishlist">Wishlist</option>
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offer">Offer Received</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-heading)] mb-1">Job Post URL (optional)</label>
                    <input
                      type="url"
                      value={newJob.url}
                      onChange={(e) => setNewJob(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://example.com/job"
                      className="w-full p-2.5 rounded-xl border border-black/10 focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                {/* Resume Selector */}
                {resumes.length > 0 && (
                  <div>
                    <label className="block font-semibold text-[var(--text-heading)] mb-1">Compare Against Resume Template</label>
                    <select
                      value={newJob.selectedResumeId}
                      onChange={(e) => setNewJob(prev => ({ ...prev, selectedResumeId: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-black/10 bg-white focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                    >
                      {resumes.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.isDefault ? '(Active Template)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-[var(--text-heading)] mb-1">Job Description *</label>
                  <textarea
                    rows={4}
                    required={newJob.analyzeImmediately}
                    value={newJob.jobDescription}
                    onChange={(e) => setNewJob(prev => ({ ...prev, jobDescription: e.target.value }))}
                    placeholder="Paste the target job description requirements here..."
                    className="w-full p-3 rounded-xl border border-black/10 focus:outline-none focus:border-[var(--accent)] font-mono text-[11px] leading-relaxed resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="analyzeImmediately"
                    checked={newJob.analyzeImmediately}
                    onChange={(e) => setNewJob(prev => ({ ...prev, analyzeImmediately: e.target.checked }))}
                    className="w-4 h-4 rounded text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                  />
                  <label htmlFor="analyzeImmediately" className="font-medium text-[var(--text-heading)] cursor-pointer selection:bg-transparent">
                    Analyze matching alignment immediately via Llama AI
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsAddJobOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={resumes.length === 0 && newJob.analyzeImmediately}>
                    {newJob.analyzeImmediately ? 'Save & Start AI Match' : 'Save Application'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Job Description / Match triggers from card */}
      <AnimatePresence>
        {editingJob && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-float)] w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-slate-50">
                <h3 className="font-display font-extrabold text-base text-[var(--text-heading)]">
                  Run AI Comparison for {editingJob.role}
                </h3>
                <button
                  onClick={() => setEditingJob(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-heading)] mb-1">Company & Role</label>
                  <p className="text-sm font-bold text-[var(--text-heading)]">{editingJob.company} &mdash; {editingJob.role}</p>
                </div>

                {/* Resume Selector */}
                {resumes.length > 0 && (
                  <div>
                    <label className="block font-semibold text-[var(--text-heading)] mb-1">Compare Against Resume Template</label>
                    <select
                      value={newJob.selectedResumeId}
                      onChange={(e) => setNewJob(prev => ({ ...prev, selectedResumeId: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-black/10 bg-white focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                    >
                      {resumes.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.isDefault ? '(Active Template)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-[var(--text-heading)] mb-1">Paste Job Description *</label>
                  <textarea
                    rows={6}
                    required
                    value={newJob.jobDescription}
                    onChange={(e) => setNewJob(prev => ({ ...prev, jobDescription: e.target.value }))}
                    placeholder="Paste the target job description requirements here..."
                    className="w-full p-3 rounded-xl border border-black/10 focus:outline-none focus:border-[var(--accent)] font-mono text-[11px] leading-relaxed resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
                  <Button variant="outline" size="sm" type="button" onClick={() => setEditingJob(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!newJob.jobDescription.trim()}
                    onClick={() => {
                      const selectedResume = resumes.find(r => r.id === newJob.selectedResumeId) || resumes.find(r => r.isDefault) || resumes[0];
                      if (selectedResume && editingJob) {
                        handleCompare(editingJob.id, selectedResume.content, newJob.jobDescription);
                        setEditingJob(null);
                      }
                    }}
                  >
                    Start AI Match
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Resume Modal */}
      <AnimatePresence>
        {isAddResumeOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-float)] w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-slate-50">
                <h3 className="font-display font-extrabold text-base text-[var(--text-heading)]">
                  Add New Resume Template
                </h3>
                <button
                  onClick={() => setIsAddResumeOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitNewResume} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-heading)] mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    value={newResume.name}
                    onChange={(e) => setNewResume(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Senior Frontend Dev Resume"
                    className="w-full p-2.5 rounded-xl border border-black/10 focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-heading)] mb-1">Resume Text Content *</label>
                  <textarea
                    rows={8}
                    required
                    value={newResume.content}
                    onChange={(e) => setNewResume(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Paste the full text of your CV/Resume here..."
                    className="w-full p-3 rounded-xl border border-black/10 focus:outline-none focus:border-[var(--accent)] font-mono text-[11px] leading-relaxed resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={newResume.isDefault}
                    onChange={(e) => setNewResume(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="w-4 h-4 rounded text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                  />
                  <label htmlFor="isDefault" className="font-medium text-[var(--text-heading)] cursor-pointer selection:bg-transparent">
                    Set as Active default template for matching
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsAddResumeOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    Save Template
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Resume Modal */}
      <AnimatePresence>
        {editingResume && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-float)] w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-slate-50">
                <h3 className="font-display font-extrabold text-base text-[var(--text-heading)]">
                  Edit Resume Template
                </h3>
                <button
                  onClick={() => setEditingResume(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitEditResume} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-heading)] mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    value={editingResume.name}
                    onChange={(e) => setEditingResume(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="e.g. Senior Frontend Dev Resume"
                    className="w-full p-2.5 rounded-xl border border-black/10 focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-heading)] mb-1">Resume Text Content *</label>
                  <textarea
                    rows={8}
                    required
                    value={editingResume.content}
                    onChange={(e) => setEditingResume(prev => prev ? { ...prev, content: e.target.value } : null)}
                    placeholder="Paste the full text of your CV/Resume here..."
                    className="w-full p-3 rounded-xl border border-black/10 focus:outline-none focus:border-[var(--accent)] font-mono text-[11px] leading-relaxed resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsDefault"
                    checked={editingResume.isDefault}
                    onChange={(e) => setEditingResume(prev => prev ? { ...prev, isDefault: e.target.checked } : null)}
                    className="w-4 h-4 rounded text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                  />
                  <label htmlFor="editIsDefault" className="font-medium text-[var(--text-heading)] cursor-pointer selection:bg-transparent">
                    Set as Active default template for matching
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
                  <Button variant="outline" size="sm" type="button" onClick={() => setEditingResume(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
