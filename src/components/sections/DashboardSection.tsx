import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
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
} from 'lucide-react';


interface ComparisonResult {
  score: number;
  fitLevel: string;
  summary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  suggestions: {
    section: string;
    original: string;
    suggested: string;
    rationale: string;
  }[];
  interviewPrep: {
    question: string;
    strategy: string;
  }[];
}

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
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [expandedPrepIndex, setExpandedPrepIndex] = useState<number | null>(null);

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
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Run the Comparison
  const handleCompare = async () => {
    setError(null);
    setResult(null);
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
          resumeText,
          jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to compare resume and job description.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreStroke = (score: number) => {
    if (score >= 85) return '#22C55E';
    if (score >= 70) return '#2563EB';
    if (score >= 50) return '#FACC15';
    return '#EF4444';
  };

  return (
    <div className="section-container section-gap py-8">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-[var(--text-body)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <Badge className="flex items-center gap-1.5 px-3 py-1">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-cyan)] fill-[var(--accent-cyan)]/10" />
          ApplyAI MVP Dashboard
        </Badge>
      </div>


      <AnimatePresence mode="wait">
        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-12 text-center max-w-2xl mx-auto my-12"
          >
            <div className="relative w-20 h-20 mx-auto mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-50 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-[var(--accent)] border-r-[var(--accent-cyan)] border-b-transparent border-l-transparent animate-spin"></div>
              <Sparkles className="w-8 h-8 text-[var(--accent-cyan)] animate-pulse" />
            </div>

            <h3 className="font-display font-extrabold text-xl text-[var(--text-heading)] mb-2">
              Analyzing Your Alignment
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-8 max-w-sm mx-auto">
              Our AI is parsing your qualifications and comparing them against the target role requirements.
            </p>

            {/* Micro-Progress Animation */}
            <div className="bg-[var(--bg-page)] rounded-2xl p-5 text-left max-w-md mx-auto border border-black/5">
              <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider block mb-2">
                Analyzer Status
              </span>
              <div className="text-sm font-medium text-[var(--text-heading)] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse"></div>
                {LOADING_PHASES[loadingPhase]}
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-4 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-cyan)] h-full"
                  animate={{ width: `${((loadingPhase + 1) / LOADING_PHASES.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Screen */}
        {!isLoading && error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl p-6 max-w-xl mx-auto my-8 text-center"
          >
            <AlertTriangle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
            <h3 className="font-display font-extrabold text-lg text-[#991B1B] mb-2">Analysis Failed</h3>
            <p className="text-sm text-[#B91C1C] mb-6">{error}</p>
            <Button variant="primary" size="md" onClick={() => setError(null)}>
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Inputs Screen */}
        {!isLoading && !error && !result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* CV Input Card */}
            <div className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6 md:p-8 flex flex-col min-h-[500px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-lg text-[var(--text-heading)]">Paste your CV / Resume</h3>
                  <p className="text-xs text-[var(--text-muted)]">Include experience, skills, and projects</p>
                </div>
              </div>

              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the full text of your CV/Resume here...&#10;&#10;e.g.&#10;John Doe - Senior Software Engineer&#10;Skills: React, TypeScript, Bun, Python...&#10;Experience:&#10;- Led development of global SaaS product..."
                className="flex-1 w-full p-4 rounded-2xl bg-[var(--bg-page)] border border-black/5 text-sm resize-none focus:outline-none focus:border-[var(--accent)] font-mono leading-relaxed"
              />
            </div>

            {/* Job Description Input Card */}
            <div className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6 md:p-8 flex flex-col min-h-[500px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-[var(--accent-cyan)]" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-lg text-[var(--text-heading)]">Paste Job Description</h3>
                  <p className="text-xs text-[var(--text-muted)]">Paste the target role description</p>
                </div>
              </div>

              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here...&#10;&#10;e.g.&#10;We are looking for a Senior React Developer who is passionate about fast workflows, native TypeScript compilation, and bundling systems like Bun. Experience with Python/AI endpoints is a plus..."
                className="flex-1 w-full p-4 rounded-2xl bg-[var(--bg-page)] border border-black/5 text-sm resize-none focus:outline-none focus:border-[var(--accent-cyan)] font-mono leading-relaxed"
              />
            </div>

            {/* Compare Trigger Row */}
            <div className="lg:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 bg-white border border-[var(--border)] shadow-sm rounded-2xl p-5">
              <div className="text-sm text-[var(--text-body)]">
                Ready to evaluate? Our AI engine uses **Llama-3.3** for instant parsing.
              </div>
              <Button
                variant="primary"
                size="lg"
                disabled={!resumeText.trim() || !jobDescription.trim()}
                onClick={handleCompare}
                className="w-full sm:w-auto px-10 gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed group shadow-md hover:shadow-lg transition-all"
              >
                Start AI Comparison
                <Play className="w-4 h-4 fill-current group-hover:scale-105" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Results Screen */}
        {!isLoading && !error && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Back & Re-run header */}
            <div className="flex justify-between items-center bg-white border border-[var(--border)] rounded-2xl p-4 shadow-sm">
              <span className="text-sm font-medium text-[var(--text-heading)] font-display">
                Report generated successfully!
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResult(null)}
                className="flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Analyze New Job
              </Button>
            </div>

            {/* Executive Match Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Radial Dial card */}
              <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-card)] flex flex-col items-center justify-center text-center">
                <div className="relative w-36 h-36 mb-4">
                  {/* SVG Circle Progress */}
                  <svg className="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#E2E8F0" strokeWidth="2.5" />
                    <motion.circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke={getScoreStroke(result.score)}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0, 100' }}
                      animate={{ strokeDasharray: `${result.score * 0.942}, 100` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-display font-extrabold text-[var(--text-heading)]">
                      {result.score}%
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                      Match Score
                    </span>
                  </div>
                </div>

                <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-xs font-bold text-[var(--accent)] mb-2">
                  {result.fitLevel}
                </div>
              </div>

              {/* Summary text card */}
              <div className="md:col-span-2 bg-white rounded-3xl border border-[var(--border)] p-6 md:p-8 shadow-[var(--shadow-card)] flex flex-col justify-center">
                <h3 className="font-display font-extrabold text-xl text-[var(--text-heading)] mb-3">
                  Match Assessment
                </h3>
                <p className="text-sm md:text-base text-[var(--text-body)] leading-relaxed">
                  {result.summary}
                </p>
              </div>
            </div>

            {/* Keyword grid card */}
            <div className="bg-white rounded-3xl border border-[var(--border)] p-6 md:p-8 shadow-[var(--shadow-card)]">
              <h3 className="font-display font-extrabold text-lg text-[var(--text-heading)] mb-6 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[var(--accent-cyan)]" />
                Keyword Coverage
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                    Matched Keywords ({result.matchedKeywords.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.matchedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-xs px-3 py-1.5 rounded-full bg-[#E8F8F0] text-[#16A34A] font-semibold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                        {kw}
                      </span>
                    ))}
                    {result.matchedKeywords.length === 0 && (
                      <span className="text-xs text-[var(--text-muted)] italic">No matches found.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                    Missing Keywords ({result.missingKeywords.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-xs px-3 py-1.5 rounded-full bg-[#FEF2F2] text-[#EF4444] font-semibold flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                        {kw}
                      </span>
                    ))}
                    {result.missingKeywords.length === 0 && (
                      <span className="text-xs text-[var(--text-muted)] italic">No missing keywords! Perfect match.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl border border-[var(--border)] p-6 md:p-8 shadow-[var(--shadow-card)]">
                <h3 className="font-display font-extrabold text-lg text-[var(--text-heading)] mb-4 text-[#16A34A] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Key Strengths
                </h3>
                <ul className="space-y-3">
                  {result.strengths.map((str, idx) => (
                    <li key={idx} className="text-sm text-[var(--text-body)] flex items-start gap-2.5 leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mt-2 shrink-0"></div>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-3xl border border-[var(--border)] p-6 md:p-8 shadow-[var(--shadow-card)]">
                <h3 className="font-display font-extrabold text-lg text-[var(--text-heading)] mb-4 text-[#EF4444] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Major Gaps
                </h3>
                <ul className="space-y-3">
                  {result.gaps.map((gap, idx) => (
                    <li key={idx} className="text-sm text-[var(--text-body)] flex items-start gap-2.5 leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-2 shrink-0"></div>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Custom Resume Suggestions */}
            <div className="bg-white rounded-3xl border border-[var(--border)] p-6 md:p-8 shadow-[var(--shadow-card)]">
              <h3 className="font-display font-extrabold text-lg text-[var(--text-heading)] mb-2">
                Tailored Resume Enhancements
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-6">
                Replace your existing resume bullet points with these optimized versions to directly align with the job description.
              </p>

              <div className="space-y-6">
                {result.suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-[var(--bg-page)] border border-black/5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                        {sug.section}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-[#FEF2F2] rounded-xl border border-[#FCA5A5]/30">
                        <span className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wider block mb-1">
                          Original Text
                        </span>
                        <p className="text-xs text-[#991B1B] italic">"{sug.original}"</p>
                      </div>

                      <div className="p-3 bg-[#E8F8F0] rounded-xl border border-[#86EFAC]/30">
                        <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider block mb-1">
                          Suggested Enhancement
                        </span>
                        <p className="text-xs text-[#14532D] font-medium font-mono">"{sug.suggested}"</p>
                      </div>
                    </div>

                    <div className="text-xs text-[var(--text-body)]">
                      <span className="font-bold text-[var(--text-heading)]">Rationale:</span> {sug.rationale}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interview Prep Questions */}
            <div className="bg-white rounded-3xl border border-[var(--border)] p-6 md:p-8 shadow-[var(--shadow-card)]">
              <h3 className="font-display font-extrabold text-lg text-[var(--text-heading)] mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[var(--accent)]" />
                Targeted Interview Prep
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-6">
                Anticipate high-yield questions hiring managers will likely ask based on gaps in your resume, and master your strategy.
              </p>

              <div className="space-y-3">
                {result.interviewPrep.map((prep, idx) => {
                  const isExpanded = expandedPrepIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white"
                    >
                      <button
                        onClick={() => setExpandedPrepIndex(isExpanded ? null : idx)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left font-semibold text-sm text-[var(--text-heading)] hover:bg-[var(--bg-page)] transition-colors cursor-pointer"
                      >
                        <span>{prep.question}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-[var(--border)] bg-[var(--bg-page)]/50"
                          >
                            <div className="p-5 text-xs text-[var(--text-body)] leading-relaxed">
                              <span className="font-bold text-[var(--text-heading)] block mb-1.5 uppercase tracking-wider text-[10px]">
                                Strategic Answering Framework
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
