import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  FolderOpen,
  GitMerge,
  GraduationCap,
  Layers3,
  Lightbulb,
  Link2,
  Loader2,
  MessageSquareText,
  Network,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Wand2,
  Bookmark,
  Clock3,
} from 'lucide-react';
import clsx from 'clsx';

import {
  SMART_LINK_DEFAULT_CATEGORIES,
  type SmartLinkAssistantAnswer,
  type SmartLinkContentType,
  type SmartLinkDefaultCategory,
  type SmartLinkHubState,
  type SmartLinkItem,
  type SmartLinkPriority,
  type SmartLinkQueryFilters,
  type SmartLinkRevisitStatus,
  type SmartLinkSourcePlatform,
} from '../smart-link-hub/types';
import {
  answerSmartLinkQuestion,
  analyzeSavedLinkSignals,
  applyCachedAnalysis,
  buildLearningPath,
  buildSmartLinkAnalytics,
  buildSmartLinkReminders,
  buildTopicClusters,
  createSmartLinkDraft,
  enrichSmartLinkItem,
  isValidHttpUrl,
  mergeSmartLinkRecords,
  normalizeUrl,
  parseUrlsFromText,
  persistSmartLinkCacheEntry,
  searchSmartLinks,
} from '../smart-link-hub/engine';
import { loadSmartLinkHubState, saveSmartLinkHubState, smartLinkHubStorageKey } from '../smart-link-hub/storage';

type TabId = 'overview' | 'library' | 'graph' | 'learning' | 'assistant' | 'analytics';

type ComposerOrigin = 'manual' | 'clipboard' | 'extension' | 'share';

type ComposerState = {
  text: string;
  note: string;
  reason: string;
  priority: SmartLinkPriority;
  customTag: string;
  customCategory: string;
};

type FilterState = SmartLinkQueryFilters;

const DAY_MS = 24 * 60 * 60 * 1000;

const TABS: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'library', label: 'Library', icon: BookOpenText },
  { id: 'graph', label: 'Graph', icon: Network },
  { id: 'learning', label: 'Learning', icon: GraduationCap },
  { id: 'assistant', label: 'Assistant', icon: MessageSquareText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const SOURCE_OPTIONS: Array<{ value: SmartLinkSourcePlatform | 'all'; label: string }> = [
  { value: 'all', label: 'All sources' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'threads', label: 'Threads' },
  { value: 'x', label: 'X / Twitter' },
  { value: 'blog', label: 'Blog' },
  { value: 'article', label: 'Article' },
  { value: 'research', label: 'Research' },
  { value: 'course', label: 'Course' },
  { value: 'tool', label: 'Tool' },
  { value: 'pdf', label: 'PDF' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'webpage', label: 'Webpage' },
  { value: 'unknown', label: 'Unknown' },
];

const STATUS_OPTIONS: Array<{ value: SmartLinkRevisitStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'unread', label: 'Unread' },
  { value: 'revisited', label: 'Revisited' },
  { value: 'important', label: 'Important' },
  { value: 'learned', label: 'Learned' },
  { value: 'ignored', label: 'Ignored' },
  { value: 'completed', label: 'Completed' },
];

const DIFFICULTY_OPTIONS: Array<{ value: SmartLinkQueryFilters['difficulty']; label: string }> = [
  { value: 'all', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'unknown', label: 'Unknown' },
];

const DATE_OPTIONS: Array<{ value: SmartLinkQueryFilters['dateWindowDays']; label: string }> = [
  { value: 'all', label: 'Any time' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const ASSISTANT_PROMPTS = [
  'What do I know about color grading?',
  'What should I learn next?',
  'Show beginner resources',
  'Which saved content is most useful?',
  'Find AI tools for students',
  'Show me links related to transitions',
];

const DEFAULT_FILTERS: FilterState = {
  source: 'all',
  status: 'all',
  difficulty: 'all',
  dateWindowDays: 'all',
  minUsefulness: 0,
  onlyUnread: false,
  onlyImportant: false,
};

const DEFAULT_COMPOSER: ComposerState = {
  text: '',
  note: '',
  reason: '',
  priority: 'medium',
  customTag: '',
  customCategory: '',
};

const DEFAULT_ASSISTANT_PROMPT = 'What should I learn next?';

const cn = (...parts: Array<string | false | null | undefined>): string => clsx(parts);

const titleCase = (value: string): string =>
  value
    .replace(/[-_]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatDateShort = (iso?: string): string => {
  if (!iso) return 'Unknown';
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const formatAgo = (iso?: string): string => {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < DAY_MS) return 'Today';
  const days = Math.round(diff / DAY_MS);
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
};

const formatScore = (score: number): string => `${Math.max(0, Math.min(100, Math.round(score)))}%`;

const formatRelativeNumber = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return `${value}`;
};

const priorityOrder: Record<SmartLinkPriority, number> = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 0,
};

const toneClasses: Record<string, string> = {
  default: 'border-white/10 bg-white/5 text-slate-200',
  cyan: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100',
  emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
  amber: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
  rose: 'border-rose-400/20 bg-rose-400/10 text-rose-100',
  violet: 'border-violet-400/20 bg-violet-400/10 text-violet-100',
  sky: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
  slate: 'border-white/10 bg-white/5 text-slate-200',
  red: 'border-red-400/20 bg-red-400/10 text-red-100',
};

function Pill({
  children,
  tone = 'default',
  className,
}: React.PropsWithChildren<{ tone?: keyof typeof toneClasses; className?: string }>): React.ReactElement {
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold', toneClasses[tone], className)}>{children}</span>;
}

function MetricTile({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: keyof typeof toneClasses;
}): React.ReactElement {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-slate-950/20 backdrop-blur">
      <Pill tone={tone} className="mb-3">
        {label}
      </Pill>
      <div className="text-2xl font-black tracking-tight text-white">{value}</div>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-slate-300">{hint}</p> : null}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-200/80">
            <Sparkles size={12} />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">{title}</h2>
        {description ? <p className="max-w-3xl text-sm leading-relaxed text-slate-300">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

function ProgressBar({ value, className }: { value: number; className?: string }): React.ReactElement {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-white/10', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-sky-300 transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function StatRow({ label, value, hint }: { label: string; value: string; hint?: string }): React.ReactElement {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-black text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

function TagList({
  items,
  tone = 'default',
  onClick,
  emptyText = 'Unknown',
}: {
  items: string[];
  tone?: keyof typeof toneClasses;
  onClick?: (value: string) => void;
  emptyText?: string;
}): React.ReactElement {
  if (items.length === 0) {
    return <Pill tone="slate">{emptyText}</Pill>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button key={item} type="button" onClick={() => onClick?.(item)} className="text-left">
          <Pill tone={tone}>{item}</Pill>
        </button>
      ))}
    </div>
  );
}

interface KnowledgeCardProps {
  item: SmartLinkItem;
  expanded: boolean;
  relatedItems: SmartLinkItem[];
  onToggle: (item: SmartLinkItem) => void;
  onOpenOriginal: (item: SmartLinkItem) => void;
  onSetStatus: (item: SmartLinkItem, status: SmartLinkRevisitStatus) => void;
  onFocusRelated: (itemId: string) => void;
  onMergeDuplicate: (item: SmartLinkItem) => void;
  onKeepDuplicate: (item: SmartLinkItem) => void;
  onIgnoreDuplicate: (item: SmartLinkItem) => void;
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({
  item,
  expanded,
  relatedItems,
  onToggle,
  onOpenOriginal,
  onSetStatus,
  onFocusRelated,
  onMergeDuplicate,
  onKeepDuplicate,
  onIgnoreDuplicate,
}) => {
  const processingTone =
    item.analysisStatus === 'ready' ? 'emerald' : item.analysisStatus === 'error' ? 'rose' : 'amber';
  const statusTone =
    item.revisitStatus === 'learned' || item.revisitStatus === 'completed'
      ? 'emerald'
      : item.revisitStatus === 'important'
        ? 'amber'
        : item.revisitStatus === 'ignored'
          ? 'red'
          : 'cyan';

  return (
    <motion.article
      layout
      id={`smart-link-card-${item.id}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
      className={cn(
        'overflow-hidden rounded-3xl border bg-white/5 shadow-[0_24px_60px_rgba(2,6,23,0.22)] backdrop-blur-xl transition',
        item.duplicateDecision === 'pending' && item.duplicateSimilarityScore >= 0.72
          ? 'border-amber-400/40 ring-1 ring-amber-400/25'
          : 'border-white/10'
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(item)}
        className="flex w-full items-start justify-between gap-4 p-5 text-left"
      >
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={processingTone}>{item.analysisStatus === 'ready' ? 'Ready' : item.analysisStatus === 'analyzing' ? 'Analyzing' : 'Review'}</Pill>
            <Pill tone={statusTone}>{titleCase(item.revisitStatus)}</Pill>
            <Pill tone="slate">{item.sourceLabel}</Pill>
            <Pill tone="slate">{titleCase(item.contentType)}</Pill>
            <Pill tone="slate">{item.primaryCategory}</Pill>
            {item.duplicateDecision === 'pending' && item.duplicateSimilarityScore >= 0.72 ? (
              <Pill tone="amber">Potential duplicate {formatScore(item.duplicateSimilarityScore * 100)}</Pill>
            ) : null}
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black leading-tight text-white md:text-xl">{item.title || 'Untitled link'}</h3>
            <p className="max-w-4xl text-sm leading-relaxed text-slate-300">{item.summary}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <div className="mb-1 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Usefulness</div>
              <ProgressBar value={item.usefulnessScore} />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Actionability</div>
              <ProgressBar value={item.actionabilityScore} />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Classification</div>
              <ProgressBar value={item.classificationConfidence} />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 text-slate-300">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-right">
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Saved</div>
            <div className="text-sm font-semibold text-white">{formatDateShort(item.createdAt)}</div>
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="space-y-5 p-5">
              {item.analysisError ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
                  <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                  <p>{item.analysisError}</p>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[1.35fr,0.85fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Key Insights</div>
                      <Pill tone="cyan">{item.difficultyLevel}</Pill>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-200">
                      {item.importantPoints.slice(0, 5).map((point) => (
                        <li key={point} className="flex gap-3">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-slate-400">Action Steps</div>
                    <ol className="space-y-2 text-sm text-slate-200">
                      {item.actionableSteps.slice(0, 4).map((step, index) => (
                        <li key={step} className="flex gap-3">
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-[11px] font-black text-cyan-200">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-slate-400">Source Signals</div>
                    <div className="space-y-3 text-sm text-slate-200">
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Author</div>
                        <p className="mt-1">{item.author || 'Unknown'}</p>
                      </div>
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Source type</div>
                        <p className="mt-1">{titleCase(item.sourcePlatform)}</p>
                      </div>
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Last opened</div>
                        <p className="mt-1">{item.lastOpenedAt ? formatAgo(item.lastOpenedAt) : 'Never opened'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-slate-400">Tools and frameworks</div>
                    <div className="space-y-3">
                      <TagList items={item.toolsMentioned.slice(0, 4)} tone="sky" emptyText="No tools detected" />
                      <TagList items={item.frameworksMentioned.slice(0, 4)} tone="violet" emptyText="No frameworks detected" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-slate-400">Related Topics</div>
                  <TagList items={item.relatedTopics.slice(0, 6)} tone="emerald" />
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-slate-400">Related Links</div>
                  <div className="space-y-2">
                    {relatedItems.length > 0 ? (
                      relatedItems.slice(0, 3).map((related) => (
                        <button
                          key={related.id}
                          type="button"
                          onClick={() => onFocusRelated(related.id)}
                          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">{related.title}</div>
                            <div className="text-xs text-slate-400">{related.primaryTopic}</div>
                          </div>
                          <ChevronRight size={14} className="shrink-0 text-slate-400" />
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No closely related items yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenOriginal(item)}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  <ExternalLink size={16} />
                  Open original
                </button>
                <button
                  type="button"
                  onClick={() => onSetStatus(item, 'learned')}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"
                >
                  <CheckCircle2 size={16} />
                  Learned
                </button>
                <button
                  type="button"
                  onClick={() => onSetStatus(item, 'completed')}
                  className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20"
                >
                  <Target size={16} />
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => onSetStatus(item, 'important')}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-100 transition hover:bg-amber-400/20"
                >
                  <Bookmark size={16} />
                  Important
                </button>
                <button
                  type="button"
                  onClick={() => onSetStatus(item, 'ignored')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
                >
                  <EyeOff size={16} />
                  Ignore
                </button>
                {item.duplicateDecision === 'pending' && item.duplicateSimilarityScore >= 0.72 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onMergeDuplicate(item)}
                      className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/20"
                    >
                      <GitMerge size={16} />
                      Merge duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => onKeepDuplicate(item)}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"
                    >
                      <CheckCircle2 size={16} />
                      Keep both
                    </button>
                    <button
                      type="button"
                      onClick={() => onIgnoreDuplicate(item)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
                    >
                      <Trash2 size={16} />
                      Ignore duplicate
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
};

interface ClusterCardProps {
  cluster: ReturnType<typeof buildTopicClusters>[number];
  onSelect: (category: string) => void;
}

const ClusterCard: React.FC<ClusterCardProps> = ({
  cluster,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(cluster.category)}
      className="group rounded-3xl border border-white/10 bg-white/5 p-5 text-left shadow-lg shadow-slate-950/20 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-300/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-black tracking-tight text-white">{cluster.category}</div>
          <div className="mt-1 text-sm text-slate-300">{cluster.itemCount} saved item{cluster.itemCount === 1 ? '' : 's'}</div>
        </div>
        <Pill tone="cyan">{formatScore(cluster.coverageStrength)}</Pill>
      </div>
      <div className="mt-4 space-y-3">
        <ProgressBar value={cluster.learningProgress} />
        <div className="flex flex-wrap gap-2">
          {cluster.topTopics.slice(0, 4).map((topic) => (
            <Pill key={topic} tone="slate">
              {topic}
            </Pill>
          ))}
        </div>
      </div>
      <div className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400 group-hover:text-slate-300">Coverage strength and topic map</div>
    </button>
  );
};

function StageCard({
  stage,
  tone,
}: {
  stage: { title: string; description: string; items: SmartLinkItem[]; practiceTasks: string[]; miniProjects: string[] };
  tone: keyof typeof toneClasses;
}): React.ReactElement {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-950/20 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-black tracking-tight text-white">{stage.title}</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{stage.description}</p>
        </div>
        <Pill tone={tone}>{stage.items.length} link{stage.items.length === 1 ? '' : 's'}</Pill>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-2 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Practice tasks</div>
          <TagList items={stage.practiceTasks} tone={tone} />
        </div>
        <div>
          <div className="mb-2 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Mini projects</div>
          <TagList items={stage.miniProjects} tone="slate" />
        </div>
      </div>
    </div>
  );
}

const SmartLinkHubPage: React.FC = () => {
  const [hubState, setHubState] = useState<SmartLinkHubState>(() => loadSmartLinkHubState());
  const [composer, setComposer] = useState<ComposerState>(DEFAULT_COMPOSER);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(SMART_LINK_DEFAULT_CATEGORIES[0]);
  const [assistantPrompt, setAssistantPrompt] = useState(DEFAULT_ASSISTANT_PROMPT);
  const [assistantAnswer, setAssistantAnswer] = useState<SmartLinkAssistantAnswer | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef(hubState);
  const processingIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    stateRef.current = hubState;
    saveSmartLinkHubState(hubState);
  }, [hubState]);

  useEffect(() => {
    const existingPending = stateRef.current.items.filter((item) => item.analysisStatus === 'analyzing' || item.analysisStatus === 'queued');
    existingPending.forEach((item) => {
      void processItemAnalysis(item);
    });
  }, []);

  useEffect(() => {
    const stored = stateRef.current.items;
    if (!stored.length) {
      setSelectedCategory(SMART_LINK_DEFAULT_CATEGORIES[0]);
      return;
    }
    const clusters = buildTopicClusters(stored);
    const nextCategory = clusters.find((cluster) => cluster.category === selectedCategory)?.category ?? clusters[0]?.category ?? SMART_LINK_DEFAULT_CATEGORIES[0];
    if (nextCategory !== selectedCategory) {
      setSelectedCategory(nextCategory);
    }
  }, [hubState.items, selectedCategory]);

  useEffect(() => {
    setVisibleCount(12);
  }, [activeTab, searchQuery, filters.category, filters.source, filters.status, filters.difficulty, filters.minUsefulness, filters.onlyImportant, filters.onlyUnread, filters.dateWindowDays]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === smartLinkHubStorageKey) {
        setHubState(loadSmartLinkHubState());
      }
    };

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; text?: string; urls?: string[]; source?: ComposerOrigin } | undefined;
      if (!data || data.type !== 'smart-link-hub/import') {
        return;
      }

      const text = data.text || (Array.isArray(data.urls) ? data.urls.join('\n') : '');
      if (!text.trim()) {
        return;
      }

      void saveLinksFromText(text, data.source ?? 'extension');
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const analytics = useMemo(() => buildSmartLinkAnalytics(hubState.items), [hubState.items]);
  const clusters = useMemo(() => buildTopicClusters(hubState.items), [hubState.items]);
  const reminders = useMemo(() => buildSmartLinkReminders(hubState.items), [hubState.items]);
  const learningPath = useMemo(() => buildLearningPath(hubState.items, selectedCategory), [hubState.items, selectedCategory]);
  const filteredItems = useMemo(() => searchSmartLinks(hubState.items, searchQuery, filters), [hubState.items, searchQuery, filters]);

  const categoryOptions = useMemo(
    () => Array.from(new Set([...SMART_LINK_DEFAULT_CATEGORIES, ...hubState.customCategories])),
    [hubState.customCategories]
  );
  const processingCount = hubState.items.filter((item) => item.analysisStatus === 'analyzing' || item.analysisStatus === 'queued').length;
  const duplicateCount = hubState.items.filter((item) => item.duplicateDecision === 'pending' && item.duplicateSimilarityScore >= 0.72).length;
  const highValueCount = hubState.items.filter((item) => item.usefulnessScore >= 80).length;
  const unreadCount = hubState.items.filter((item) => item.revisitStatus === 'unread').length;
  const ignoredCount = hubState.items.filter((item) => item.revisitStatus === 'ignored').length;
  const recentItems = [...hubState.items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);
  const strongestCluster = clusters[0];
  const readyCount = hubState.items.filter((item) => item.analysisStatus === 'ready').length;
  const visibleItems = filteredItems.slice(0, visibleCount);
  const duplicateCandidates = hubState.items.filter((item) => item.duplicateDecision === 'pending' && item.duplicateSimilarityScore >= 0.72);

  const updateItem = useCallback((itemId: string, updater: (item: SmartLinkItem) => SmartLinkItem) => {
    setHubState((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? updater(item) : item)),
    }));
  }, []);

  const processItemAnalysis = useCallback(
    async (draftItem: SmartLinkItem): Promise<void> => {
      if (processingIdsRef.current.has(draftItem.id)) {
        return;
      }

      processingIdsRef.current.add(draftItem.id);
      try {
        const cache = stateRef.current.analysisCache[draftItem.normalizedUrl];
        if (cache) {
          const cachedItem = applyCachedAnalysis(draftItem, cache);
          setHubState((prev) =>
            persistSmartLinkCacheEntry(
              {
                ...prev,
                items: prev.items.map((item) => (item.id === draftItem.id ? cachedItem : item)),
              },
              cachedItem,
              cache.signals
            )
          );
          return;
        }

        const signals = await analyzeSavedLinkSignals(draftItem.url, draftItem.sourcePlatform);
        const existingItems = stateRef.current.items;
        const enriched = enrichSmartLinkItem(draftItem, signals, existingItems);
        setHubState((prev) =>
          persistSmartLinkCacheEntry(
            {
              ...prev,
              items: prev.items.map((item) => (item.id === draftItem.id ? enriched : item)),
            },
            enriched,
            signals
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'We could not fully analyze this link, so the draft summary was kept.';
        updateItem(draftItem.id, (item) => ({
          ...item,
          analysisStatus: 'ready',
          analysisError: message,
          updatedAt: new Date().toISOString(),
        }));
      } finally {
        processingIdsRef.current.delete(draftItem.id);
      }
    },
    [updateItem]
  );

  const saveLinksFromText = useCallback(
    async (text: string, source: ComposerOrigin = 'manual'): Promise<void> => {
      const rawText = text.trim();
      if (!rawText) {
        setError('Paste one or more links to save them.');
        return;
      }

      const urls = parseUrlsFromText(rawText).filter(Boolean);
      if (!urls.length) {
        setError('I could not find a valid link in that text.');
        return;
      }

      setIsSaving(true);
      setError(null);
      setNotice(null);

      const uniqueUrls = Array.from(new Set(urls.map((url) => normalizeUrl(url))));
      const invalidInputs = uniqueUrls.filter((url) => !isValidHttpUrl(url));
      const validUrls = uniqueUrls.filter((url) => isValidHttpUrl(url));

      if (!validUrls.length) {
        setIsSaving(false);
        setError('The pasted text did not contain a valid http or https link.');
        return;
      }

      let workingItems = [...stateRef.current.items];
      const drafts: SmartLinkItem[] = [];

      validUrls.forEach((url) => {
        const draft = createSmartLinkDraft(
          {
            urlsText: url,
            note: composer.note.trim() || undefined,
            reason: composer.reason.trim() || undefined,
            priority: composer.priority,
            customTag: composer.customTag.trim() || undefined,
            customCategory: composer.customCategory.trim() || undefined,
            source,
          },
          workingItems
        );
        workingItems = [...workingItems, draft];
        drafts.push(draft);
      });

      const nextCustomCategories = composer.customCategory.trim()
        ? Array.from(new Set([...stateRef.current.customCategories, composer.customCategory.trim()]))
        : stateRef.current.customCategories;

      setHubState((prev) => ({
        ...prev,
        items: [...drafts, ...prev.items],
        customCategories: nextCustomCategories,
      }));

      setComposer(DEFAULT_COMPOSER);
      setActiveTab('library');
      setExpandedItemId(drafts[0]?.id ?? null);
      setIsSaving(false);

      const duplicateDrafts = drafts.filter((item) => item.duplicateDecision === 'pending' && item.duplicateSimilarityScore >= 0.72);
      setNotice(
        duplicateDrafts.length > 0
          ? `Saved ${drafts.length} link${drafts.length === 1 ? '' : 's'} and flagged ${duplicateDrafts.length} possible duplicate${duplicateDrafts.length === 1 ? '' : 's'}.`
          : `Saved ${drafts.length} link${drafts.length === 1 ? '' : 's'} and started background analysis.`
      );

      drafts.forEach((draft) => {
        void processItemAnalysis(draft);
      });

      if (invalidInputs.length > 0) {
        setError(`Skipped ${invalidInputs.length} invalid ${invalidInputs.length === 1 ? 'entry' : 'entries'}. Only real links were saved.`);
      }
    },
    [composer.customCategory, composer.customTag, composer.note, composer.priority, composer.reason, processItemAnalysis]
  );

  const saveFromClipboard = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) {
        setError('Your clipboard is empty.');
        return;
      }
      void saveLinksFromText(clip, 'clipboard');
    } catch {
      setError('Clipboard access was blocked by the browser. Paste the links into the box instead.');
    }
  }, [saveLinksFromText]);

  const toggleItem = useCallback(
    (item: SmartLinkItem) => {
      const opening = expandedItemId !== item.id;
      setExpandedItemId(opening ? item.id : null);
      if (opening) {
        updateItem(item.id, (current) => ({
          ...current,
          revisitCount: current.revisitCount + 1,
          lastOpenedAt: new Date().toISOString(),
          revisitStatus:
            current.revisitStatus === 'learned' || current.revisitStatus === 'completed' || current.revisitStatus === 'ignored'
              ? current.revisitStatus
              : 'revisited',
          updatedAt: new Date().toISOString(),
        }));
      }
    },
    [expandedItemId, updateItem]
  );

  const setItemStatus = useCallback(
    (item: SmartLinkItem, status: SmartLinkRevisitStatus) => {
      updateItem(item.id, (current) => ({
        ...current,
        revisitStatus: status,
        revisitCount: status === 'ignored' ? current.revisitCount : current.revisitCount + 1,
        lastOpenedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    },
    [updateItem]
  );

  const openOriginal = useCallback(
    (item: SmartLinkItem) => {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      updateItem(item.id, (current) => ({
        ...current,
        revisitCount: current.revisitCount + 1,
        lastOpenedAt: new Date().toISOString(),
        revisitStatus:
          current.revisitStatus === 'learned' || current.revisitStatus === 'completed' || current.revisitStatus === 'ignored'
            ? current.revisitStatus
            : 'revisited',
        updatedAt: new Date().toISOString(),
      }));
    },
    [updateItem]
  );

  const mergeDuplicate = useCallback(
    (item: SmartLinkItem) => {
      const targetId = item.duplicateOf;
      if (!targetId) {
        setNotice('The duplicate did not include a merge target, so it was left as-is.');
        return;
      }
      const target = stateRef.current.items.find((candidate) => candidate.id === targetId);
      if (!target) {
        setNotice('The duplicate target is no longer available.');
        return;
      }

      const mergedTarget = mergeSmartLinkRecords(target, item);
      setHubState((prev) => ({
        ...prev,
        items: prev.items
          .filter((candidate) => candidate.id !== item.id)
          .map((candidate) => (candidate.id === target.id ? { ...mergedTarget, duplicateDecision: 'kept', duplicateSimilarityScore: 0 } : candidate)),
      }));
      setNotice(`Merged "${item.title}" into "${target.title}".`);
    },
    []
  );

  const keepDuplicate = useCallback((item: SmartLinkItem) => {
    updateItem(item.id, (current) => ({
      ...current,
      duplicateDecision: 'kept',
      duplicateSimilarityScore: 0,
      duplicateOf: undefined,
      updatedAt: new Date().toISOString(),
    }));
    setNotice(`Kept "${item.title}" as a separate save.`);
  }, [updateItem]);

  const ignoreDuplicate = useCallback((item: SmartLinkItem) => {
    updateItem(item.id, (current) => ({
      ...current,
      duplicateDecision: 'ignored',
      duplicateSimilarityScore: 0,
      duplicateOf: undefined,
      updatedAt: new Date().toISOString(),
    }));
    setNotice(`Ignored the duplicate warning for "${item.title}".`);
  }, [updateItem]);

  const focusItem = useCallback((itemId: string) => {
    setActiveTab('library');
    setExpandedItemId(itemId);
    window.setTimeout(() => {
      document.getElementById(`smart-link-card-${itemId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }, []);

  const runAssistant = useCallback(() => {
    const answer = answerSmartLinkQuestion(assistantPrompt, hubState.items);
    setAssistantAnswer(answer);
  }, [assistantPrompt, hubState.items]);

  const handleQuickPrompt = useCallback((prompt: string) => {
    setAssistantPrompt(prompt);
    setAssistantAnswer(answerSmartLinkQuestion(prompt, hubState.items));
    setActiveTab('assistant');
  }, [hubState.items]);

  const selectedCluster = clusters.find((cluster) => cluster.category === selectedCategory) ?? clusters[0];

  const handleLibraryFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleKeywordFilter = (value: string) => {
    setSearchQuery(value);
    setActiveTab('library');
  };

  const renderOverview = () => {
    const digestItems = reminders.slice(0, 4);
    const spotlight = strongestCluster;

    if (!hubState.items.length) {
      return (
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <SectionHeader
              eyebrow="Zero-effort capture"
              title="Save links once. Let the hub do the organizing."
              description="Paste a single link, a thread of links, or a whole clipboard dump. The hub will create a knowledge card, classify it, summarize it, and connect it to related content in the background."
              action={<Pill tone="cyan">Ready for extension + share hooks</Pill>}
            />
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <StatRow label="Step 1" value="Paste links" hint="One or many URLs at once." />
              <StatRow label="Step 2" value="Auto analyze" hint="Summary, tags, category, and actions." />
              <StatRow label="Step 3" value="Reuse knowledge" hint="Search, graph, reminders, learning paths." />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {ASSISTANT_PROMPTS.slice(0, 3).map((prompt) => (
                <button key={prompt} type="button" onClick={() => handleQuickPrompt(prompt)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10">
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
              <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">What the system does</div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>It understands links from YouTube, Instagram, articles, blogs, research, PDFs, courses, and tools.</p>
                <p>It extracts summaries, topics, action steps, related links, reminders, and learning paths.</p>
                <p>It surfaces old high-value saves before they get forgotten.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
              <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Try this</div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Paste links like <span className="font-semibold text-white">video editing tips</span>, <span className="font-semibold text-white">AI tools</span>, or <span className="font-semibold text-white">research pages</span> and the hub will turn them into usable knowledge.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <SectionHeader
              eyebrow="Knowledge at a glance"
              title={spotlight ? `${spotlight.category} is your strongest cluster` : 'Your library is taking shape'}
              description={
                spotlight
                  ? `Coverage strength is ${spotlight.coverageStrength}%, with ${spotlight.itemCount} saved item${spotlight.itemCount === 1 ? '' : 's'} and ${spotlight.learningProgress}% learning progress.`
                  : 'Save more links to reveal a stronger topic map and learning path.'
              }
              action={
                <button type="button" onClick={() => setActiveTab('learning')} className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
                  <GraduationCap size={16} />
                  Open learning path
                </button>
              }
            />
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <StatRow label="Saved" value={formatRelativeNumber(hubState.items.length)} hint="Records in your knowledge vault." />
              <StatRow label="Ready" value={formatRelativeNumber(readyCount)} hint="Items with analyzed knowledge cards." />
              <StatRow label="Processing" value={formatRelativeNumber(processingCount)} hint="Background analysis is still running." />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Unused content</div>
                <Pill tone="amber">{formatRelativeNumber(analytics.unusedContentCount)}</Pill>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                High-value content that has never been revisited should be pushed back into the queue before it disappears into the archive.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Duplicate watch</div>
                <Pill tone="rose">{formatRelativeNumber(duplicateCount)}</Pill>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                Duplicate detection is active. You can merge, keep both, or ignore the warning without losing the save.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Daily digest</div>
                <div className="mt-1 text-xl font-black text-white">Revisit queue</div>
              </div>
              <Clock3 size={18} className="text-cyan-200" />
            </div>
            <div className="mt-4 space-y-3">
              {digestItems.length > 0 ? (
                digestItems.map((reminder) => (
                  <div key={reminder.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white">{reminder.title}</div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{reminder.description}</p>
                      </div>
                      <Pill tone={reminder.priority === 'urgent' ? 'rose' : reminder.priority === 'high' ? 'amber' : 'cyan'}>{reminder.dueLabel}</Pill>
                    </div>
                    <button
                      type="button"
                      onClick={() => focusItem(reminder.itemId)}
                      className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-cyan-200 transition hover:text-cyan-100"
                    >
                      {reminder.actionLabel}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No reminders yet. Save a few links and the digest will fill itself.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Recent saves</div>
            <div className="mt-4 space-y-3">
              {recentItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => focusItem(item.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-slate-400">{item.primaryTopic}</div>
                  </div>
                  <div className="text-xs text-slate-400">{formatAgo(item.createdAt)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLibrary = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
        <div className="grid gap-4 lg:grid-cols-[1.5fr,0.95fr]">
          <label className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 focus-within:border-cyan-300/30">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by keyword, meaning, category, or memory..."
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={filters.source}
              onChange={(event) => handleLibraryFilterChange('source', event.target.value as FilterState['source'])}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none"
            >
              {SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(event) => handleLibraryFilterChange('status', event.target.value as FilterState['status'])}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filters.difficulty}
              onChange={(event) => handleLibraryFilterChange('difficulty', event.target.value as FilterState['difficulty'])}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none"
            >
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={String(option.value)} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filters.dateWindowDays}
              onChange={(event) => {
                const raw = event.target.value;
                handleLibraryFilterChange('dateWindowDays', raw === 'all' ? 'all' : Number(raw));
              }}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none"
            >
              {DATE_OPTIONS.map((option) => (
                <option key={String(option.value)} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, minUsefulness: 75 }))}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-amber-300/30 hover:bg-amber-300/10"
          >
            High value only
          </button>
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, onlyUnread: !prev.onlyUnread }))}
            className={cn(
              'rounded-full border px-4 py-2 text-xs font-semibold transition',
              filters.onlyUnread ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-200'
            )}
          >
            Unread only
          </button>
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, onlyImportant: !prev.onlyImportant }))}
            className={cn(
              'rounded-full border px-4 py-2 text-xs font-semibold transition',
              filters.onlyImportant ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : 'border-white/10 bg-white/5 text-slate-200'
            )}
          >
            Important only
          </button>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSearchQuery('show me all video editing content')}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
        >
          Video editing
        </button>
        <button
          type="button"
          onClick={() => setSearchQuery('find saved links about AI tools for students')}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
        >
          AI tools
        </button>
        <button
          type="button"
          onClick={() => setSearchQuery('show content I saved for inspiration')}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
        >
          Inspiration
        </button>
        <button
          type="button"
          onClick={() => setSearchQuery('find beginner-level learning resources')}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
        >
          Beginner level
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">
          Showing <span className="font-bold text-white">{visibleItems.length}</span> of <span className="font-bold text-white">{filteredItems.length}</span> saved items
        </div>
        <div className="text-sm text-slate-400">
          Processing {formatRelativeNumber(processingCount)} | Duplicates {formatRelativeNumber(duplicateCount)}
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {visibleItems.length > 0 ? (
            visibleItems.map((item) => (
              <KnowledgeCard
                key={item.id}
                item={item}
                expanded={expandedItemId === item.id}
                relatedItems={searchSmartLinks(hubState.items, item.primaryTopic, { category: item.primaryCategory }).filter((related) => related.id !== item.id).slice(0, 3)}
                onToggle={toggleItem}
                onOpenOriginal={openOriginal}
                onSetStatus={setItemStatus}
                onFocusRelated={focusItem}
                onMergeDuplicate={mergeDuplicate}
                onKeepDuplicate={keepDuplicate}
                onIgnoreDuplicate={ignoreDuplicate}
              />
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-slate-300">
              <FolderOpen size={42} className="mx-auto text-slate-500" />
              <h3 className="mt-4 text-xl font-black text-white">No matches yet</h3>
              <p className="mt-2 text-sm text-slate-400">Try a broader semantic search or save a few links first.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {visibleCount < filteredItems.length ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 12)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
          >
            <Plus size={16} />
            Load more
          </button>
        </div>
      ) : null}
    </div>
  );

  const renderGraph = () => (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Knowledge graph"
        title="Topic clusters are built from your own saves"
        description="Each cluster shows coverage strength, repeated themes, and the missing subtopics that would make the topic more complete."
        action={<Pill tone="sky">{clusters.length} clusters</Pill>}
      />

      <div className="flex flex-wrap gap-2">
        {categoryOptions.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-semibold transition',
              selectedCategory === category ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-200 hover:border-cyan-300/20 hover:bg-cyan-300/10'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clusters.length > 0 ? (
          clusters.map((cluster) => <ClusterCard key={cluster.category} cluster={cluster} onSelect={(category) => setSelectedCategory(category)} />)
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-slate-300 md:col-span-2 xl:col-span-3">
            <Network size={42} className="mx-auto text-slate-500" />
            <h3 className="mt-4 text-xl font-black text-white">No clusters yet</h3>
            <p className="mt-2 text-sm text-slate-400">Save a few links and the graph will automatically cluster them by topic.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLearning = () => (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Learning path"
        title="Turn saved links into a real progression"
        description="The path is generated from your own saved resources, not generic external recommendations."
        action={<Pill tone="emerald">Coverage {learningPath ? formatScore(learningPath.coverageStrength) : '0%'}</Pill>}
      />

      <div className="flex flex-wrap gap-2">
        {categoryOptions.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-semibold transition',
              selectedCategory === category ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-200 hover:border-emerald-300/20 hover:bg-emerald-300/10'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {learningPath ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Focus topic</div>
                <div className="mt-2 text-2xl font-black text-white">{learningPath.focusTopic}</div>
                <p className="mt-2 text-sm text-slate-300">Missing subtopics: {learningPath.missingSubtopics.length ? learningPath.missingSubtopics.join(', ') : 'None detected'}</p>
              </div>
              <div className="w-full max-w-sm">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Coverage strength</span>
                  <span>{formatScore(learningPath.coverageStrength)}</span>
                </div>
                <ProgressBar value={learningPath.coverageStrength} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <StageCard stage={learningPath.beginner} tone="cyan" />
            <StageCard stage={learningPath.intermediate} tone="emerald" />
            <StageCard stage={learningPath.advanced} tone="violet" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
              <div className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-slate-400">Next steps</div>
              <div className="space-y-3">
                {learningPath.nextSteps.map((step) => (
                  <div key={step} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200">
                    <Lightbulb size={18} className="mt-0.5 shrink-0 text-amber-300" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
              <div className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-slate-400">Relevant reminders</div>
              <div className="space-y-3">
                {reminders.slice(0, 5).map((reminder) => (
                  <button
                    key={reminder.id}
                    type="button"
                    onClick={() => focusItem(reminder.itemId)}
                    className="flex w-full items-start justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">{reminder.title}</div>
                      <p className="mt-1 text-xs text-slate-400">{reminder.description}</p>
                    </div>
                    <Pill tone={reminder.priority === 'urgent' ? 'rose' : reminder.priority === 'high' ? 'amber' : 'cyan'}>{reminder.actionLabel}</Pill>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-slate-300">
          <GraduationCap size={42} className="mx-auto text-slate-500" />
          <h3 className="mt-4 text-xl font-black text-white">No path yet</h3>
          <p className="mt-2 text-sm text-slate-400">Save more links in one category and the learning journey will appear automatically.</p>
        </div>
      )}
    </div>
  );

  const renderAssistant = () => (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Personal knowledge assistant"
        title="Ask questions against your own saved links"
        description="The assistant answers from your library first, then falls back to the strongest semantic matches."
        action={<Pill tone="violet">{assistantAnswer ? `${assistantAnswer.confidence}% confidence` : 'Ready'}</Pill>}
      />

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
        <div className="grid gap-3 md:grid-cols-[1.3fr,0.7fr]">
          <textarea
            value={assistantPrompt}
            onChange={(event) => setAssistantPrompt(event.target.value)}
            rows={4}
            placeholder="Ask something like: What should I learn next?"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <div className="space-y-3">
            <button
              type="button"
              onClick={runAssistant}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
            >
              <Wand2 size={16} />
              Ask assistant
            </button>
            <button
              type="button"
              onClick={() => setAssistantPrompt(DEFAULT_ASSISTANT_PROMPT)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
            >
              <RefreshCcw size={16} />
              Reset prompt
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ASSISTANT_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setAssistantPrompt(prompt)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {assistantAnswer ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Answer</div>
            <p className="mt-3 text-base leading-relaxed text-white">{assistantAnswer.answer}</p>
            <div className="mt-5 space-y-3">
              {assistantAnswer.highlights.map((highlight) => (
                <div key={highlight} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200">
                  <Target size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              <span className="font-semibold text-white">Next step:</span> {assistantAnswer.nextStep}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Supporting links</div>
            <div className="mt-4 space-y-3">
              {assistantAnswer.relatedItems.length > 0 ? (
                assistantAnswer.relatedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => focusItem(item.id)}
                    className="flex w-full items-start justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{item.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{item.primaryCategory} · {item.primaryTopic}</div>
                    </div>
                    <ChevronRight size={14} className="mt-1 shrink-0 text-slate-400" />
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-400">No supporting links yet. Save more content to answer richer questions.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-slate-300">
          <BrainCircuit size={42} className="mx-auto text-slate-500" />
          <h3 className="mt-4 text-xl font-black text-white">No assistant answer yet</h3>
          <p className="mt-2 text-sm text-slate-400">Ask a question like “What should I learn next?” and the assistant will synthesize your library.</p>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => {
    const categoryEntries = Object.entries(analytics.byCategory)
      .map(([category, count]) => [category, Number(count)] as const)
      .sort((a, b) => b[1] - a[1]);
    const topCategoryCount = categoryEntries[0]?.[1] ?? 1;

    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Analytics dashboard"
          title="Useful, simple, and readable"
          description="See what you save, what you revisit, where your knowledge gaps are, and which topics keep resurfacing."
          action={<Pill tone="sky">{analytics.totalSaved} total saves</Pill>}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Total saved" value={formatRelativeNumber(analytics.totalSaved)} hint="All saved links in the hub." tone="cyan" />
          <MetricTile label="High value" value={formatRelativeNumber(analytics.highValueContentCount)} hint="Items with usefulness >= 80." tone="emerald" />
          <MetricTile label="Unused" value={formatRelativeNumber(analytics.unusedContentCount)} hint="Saved but never revisited." tone="amber" />
          <MetricTile label="Learning progress" value={formatScore(analytics.learningProgress)} hint="Learned/completed items vs total." tone="violet" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Topic performance</div>
            <div className="mt-4 space-y-3">
              <StatRow label="Most saved topic" value={analytics.mostSavedTopic} hint="The thing you keep saving the most." />
              <StatRow label="Most revisited topic" value={analytics.mostRevisitedTopic} hint="What your library keeps surfacing." />
              <StatRow label="Most ignored topic" value={analytics.mostIgnoredTopic} hint="A signal for clutter or low interest." />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Knowledge gaps</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {analytics.knowledgeGaps.length > 0 ? (
                analytics.knowledgeGaps.map((gap) => (
                  <Pill key={gap} tone="amber">
                    {gap}
                  </Pill>
                ))
              ) : (
                <p className="text-sm text-slate-400">No obvious gaps yet. Save more content to reveal them.</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Weekly activity</div>
              <Pill tone="slate">{analytics.weeklyActivity.length} days</Pill>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-3">
              {analytics.weeklyActivity.map((day) => {
                const height = Math.max(12, (day.count / Math.max(...analytics.weeklyActivity.map((entry) => entry.count), 1)) * 100);
                return (
                  <div key={day.date} className="flex flex-col items-center gap-2">
                    <div className="flex h-40 w-full items-end rounded-2xl border border-white/10 bg-slate-950/40 p-2">
                      <div
                        className="w-full rounded-xl bg-gradient-to-t from-cyan-400 via-emerald-300 to-sky-300"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <div className="text-[11px] font-semibold text-slate-400">{day.date}</div>
                    <div className="text-xs font-bold text-white">{day.count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Category breakdown</div>
            <div className="mt-4 space-y-4">
              {categoryEntries.length > 0 ? (
                categoryEntries.map(([category, count]) => (
                  <div key={category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-semibold text-white">{category}</span>
                      <span className="text-slate-400">{count}</span>
                    </div>
                    <ProgressBar value={(Number(count) / topCategoryCount) * 100} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">Save links to unlock the category breakdown.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'overview') return renderOverview();
    if (activeTab === 'library') return renderLibrary();
    if (activeTab === 'graph') return renderGraph();
    if (activeTab === 'learning') return renderLearning();
    if (activeTab === 'assistant') return renderAssistant();
    return renderAnalytics();
  };

  return (
    <div className="relative mx-auto max-w-7xl pb-24">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] rounded-[40px] bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.16),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(8,15,30,0.92))]" />
      <div className="space-y-8 rounded-[36px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_40px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-28 -bottom-28 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl space-y-5">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
                <ArrowLeft size={16} />
                Back to hub
              </Link>
              <div className="space-y-4">
                <Pill tone="cyan">
                  <BrainCircuit size={12} />
                  Smart Link Hub
                </Pill>
                <div className="space-y-3">
                  <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
                    Turn saved internet links into usable knowledge.
                  </h1>
                  <p className="max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
                    Smart Link Hub saves links fast, analyzes them in the background, and turns them into summaries, categories, action steps, topic clusters, reminders, and learning paths.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <MetricTile label="Saved" value={formatRelativeNumber(hubState.items.length)} hint="All links in your vault." tone="cyan" />
                <MetricTile label="Ready" value={formatRelativeNumber(readyCount)} hint="Processed knowledge cards." tone="emerald" />
                <MetricTile label="Unused" value={formatRelativeNumber(unreadCount)} hint="Never revisited yet." tone="amber" />
                <MetricTile label="Ignored" value={formatRelativeNumber(ignoredCount)} hint="Filtered out of the flow." tone="rose" />
              </div>
            </div>

            <div className="w-full max-w-md space-y-4">
              <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Live status</div>
                    <div className="mt-1 text-xl font-black text-white">Background engine</div>
                  </div>
                  <Loader2 size={18} className={cn('text-cyan-200', processingCount > 0 ? 'animate-spin' : '')} />
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Processing queue</span>
                    <span className="font-semibold text-white">{processingCount}</span>
                  </div>
                  <ProgressBar value={hubState.items.length ? (readyCount / hubState.items.length) * 100 : 0} />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Duplicates flagged {duplicateCount}</span>
                    <span>High value {highValueCount}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Quick import</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      void saveFromClipboard();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                  >
                    <ClipboardPaste size={16} />
                    Paste clipboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setComposer(DEFAULT_COMPOSER);
                      setNotice('Composer cleared.');
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <RefreshCcw size={16} />
                    Clear composer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl sm:p-6">
          <SectionHeader
            eyebrow="Save links"
            title="Quick add composer"
            description="Paste one link, many links, or clipboard text. Optional fields are only there when you want to add context."
            action={<Pill tone="emerald">{processingCount > 0 ? 'Analysis running' : 'Ready to save'}</Pill>}
          />

          <div className="mt-6 space-y-4">
            <textarea
              value={composer.text}
              onChange={(event) => setComposer((prev) => ({ ...prev, text: event.target.value }))}
              rows={5}
              placeholder="Paste one or more links here..."
              className="w-full rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/30"
            />

            <details className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
              <summary className="cursor-pointer text-sm font-bold text-white">Optional details</summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Note</span>
                  <textarea
                    value={composer.note}
                    onChange={(event) => setComposer((prev) => ({ ...prev, note: event.target.value }))}
                    rows={3}
                    placeholder="Why did you save this?"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Reason</span>
                  <textarea
                    value={composer.reason}
                    onChange={(event) => setComposer((prev) => ({ ...prev, reason: event.target.value }))}
                    rows={3}
                    placeholder="What do you expect to use it for?"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Priority</span>
                  <select
                    value={composer.priority}
                    onChange={(event) => setComposer((prev) => ({ ...prev, priority: event.target.value as SmartLinkPriority }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Custom tag</span>
                  <input
                    value={composer.customTag}
                    onChange={(event) => setComposer((prev) => ({ ...prev, customTag: event.target.value }))}
                    placeholder="One helpful tag"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Custom category</span>
                  <input
                    value={composer.customCategory}
                    onChange={(event) => setComposer((prev) => ({ ...prev, customCategory: event.target.value }))}
                    placeholder="Optional custom category"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </label>
              </div>
            </details>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void saveLinksFromText(composer.text, 'manual');
                  }}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save links
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void saveFromClipboard();
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                >
                  <ClipboardPaste size={16} />
                  Import clipboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setComposer(DEFAULT_COMPOSER);
                    setError(null);
                    setNotice(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                >
                  <Trash2 size={16} />
                  Clear
                </button>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <Pill tone="slate">
                  <Link2 size={12} />
                  One-click save
                </Pill>
                <Pill tone="slate">
                  <Layers3 size={12} />
                  Bulk import
                </Pill>
                <Pill tone="slate">
                  <Network size={12} />
                  Extension-ready
                </Pill>
                <Pill tone="slate">
                  <ClipboardPaste size={12} />
                  Mobile share-ready
                </Pill>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-xl shadow-slate-950/20 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                      activeTab === tab.id ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-200 hover:border-cyan-300/20 hover:bg-cyan-300/10'
                    )}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {notice ? <Pill tone="emerald">{notice}</Pill> : null}
              {error ? <Pill tone="rose">{error}</Pill> : null}
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/10 px-2 pt-4 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} />
            Smart Link Hub stores your knowledge locally in this browser. Sync hooks can be added later without changing the data model.
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span>Storage key: {smartLinkHubStorageKey}</span>
            <span>Versioned state</span>
            <span>Background analysis</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SmartLinkHubPage;
