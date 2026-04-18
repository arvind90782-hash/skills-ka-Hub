export const SMART_LINK_DEFAULT_CATEGORIES = [
  'Video Editing',
  'AI Tools',
  'Business',
  'Marketing',
  'Coding',
  'Design',
  'Productivity',
  'Education',
  'Research',
  'Finance',
  'Motivation',
  'Entertainment',
  'Miscellaneous',
] as const;

export type SmartLinkDefaultCategory = (typeof SMART_LINK_DEFAULT_CATEGORIES)[number];

export type SmartLinkPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SmartLinkRevisitStatus = 'unread' | 'revisited' | 'important' | 'learned' | 'ignored' | 'completed';
export type SmartLinkProcessingStatus = 'queued' | 'analyzing' | 'ready' | 'error';
export type SmartLinkSourcePlatform =
  | 'youtube'
  | 'instagram'
  | 'threads'
  | 'x'
  | 'blog'
  | 'article'
  | 'research'
  | 'course'
  | 'tool'
  | 'pdf'
  | 'tutorial'
  | 'webpage'
  | 'unknown';
export type SmartLinkContentType =
  | 'video'
  | 'reel'
  | 'article'
  | 'blog'
  | 'thread'
  | 'research'
  | 'course'
  | 'tool'
  | 'pdf'
  | 'tutorial'
  | 'webpage'
  | 'unknown';
export type SmartLinkIntentCategory =
  | 'learn'
  | 'build'
  | 'reference'
  | 'inspiration'
  | 'research'
  | 'compare'
  | 'track'
  | 'watch'
  | 'buy'
  | 'unknown';
export type SmartLinkDifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'unknown';

export interface SmartLinkSavedInput {
  urlsText: string;
  note?: string;
  reason?: string;
  priority?: SmartLinkPriority;
  customTag?: string;
  customCategory?: string;
  source?: 'manual' | 'clipboard' | 'extension' | 'share';
}

export interface SmartLinkContentSignals {
  pageTitle?: string;
  description?: string;
  visibleText?: string;
  siteName?: string;
  author?: string;
  canonicalUrl?: string;
  ogType?: string;
  publishedAt?: string;
}

export interface SmartLinkAnalysisSnapshot {
  title: string;
  sourcePlatform: SmartLinkSourcePlatform;
  sourceLabel: string;
  contentType: SmartLinkContentType;
  author: string;
  summary: string;
  detailedSummary: string[];
  primaryTopic: string;
  subtopics: string[];
  intentCategory: SmartLinkIntentCategory;
  difficultyLevel: SmartLinkDifficultyLevel;
  usefulnessScore: number;
  actionabilityScore: number;
  learningValueScore: number;
  tags: string[];
  importantPoints: string[];
  toolsMentioned: string[];
  frameworksMentioned: string[];
  actionableSteps: string[];
  relatedTopics: string[];
  primaryCategory: string;
  secondaryCategories: string[];
  classificationConfidence: number;
  searchIndex: string;
  unknownFields: string[];
  analysisConfidence: number;
}

export interface SmartLinkItem extends SmartLinkAnalysisSnapshot {
  id: string;
  url: string;
  normalizedUrl: string;
  note?: string;
  reason?: string;
  priority: SmartLinkPriority;
  revisitStatus: SmartLinkRevisitStatus;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  revisitCount: number;
  analysisStatus: SmartLinkProcessingStatus;
  analysisError?: string;
  analysisSource: 'local' | 'cache' | 'ai';
  contentSignals: SmartLinkContentSignals;
  duplicateSimilarityScore: number;
  duplicateOf?: string;
  duplicateDecision: 'pending' | 'kept' | 'merged' | 'ignored';
  customTag?: string;
  customCategory?: string;
  sourceOrigin: 'manual' | 'clipboard' | 'extension' | 'share';
}

export interface SmartLinkDuplicateMatch {
  itemId: string;
  title: string;
  url: string;
  score: number;
  exact: boolean;
  reason: string;
}

export interface SmartLinkBatchResult {
  saved: SmartLinkItem[];
  duplicates: SmartLinkDuplicateMatch[];
  invalidInputs: string[];
}

export interface SmartLinkTopicBreakdown {
  topic: string;
  count: number;
  itemIds: string[];
}

export interface SmartLinkClusterCard {
  category: string;
  itemCount: number;
  learningProgress: number;
  coverageStrength: number;
  missingSubtopics: string[];
  repeatedThemes: string[];
  topicBreakdown: SmartLinkTopicBreakdown[];
  representativeItems: SmartLinkItem[];
  topTopics: string[];
}

export interface SmartLinkPathStage {
  title: string;
  description: string;
  items: SmartLinkItem[];
  practiceTasks: string[];
  miniProjects: string[];
}

export interface SmartLinkLearningPath {
  category: string;
  focusTopic: string;
  beginner: SmartLinkPathStage;
  intermediate: SmartLinkPathStage;
  advanced: SmartLinkPathStage;
  nextSteps: string[];
  missingSubtopics: string[];
  coverageStrength: number;
}

export interface SmartLinkReminder {
  id: string;
  itemId: string;
  kind: 'saved-7-days-ago' | 'never-revisited' | 'high-value-unused' | 'weekly-digest' | 'daily-gem' | 'revisit-queue';
  title: string;
  description: string;
  dueLabel: string;
  actionLabel: string;
  priority: SmartLinkPriority;
}

export interface SmartLinkAnalytics {
  totalSaved: number;
  byCategory: Record<string, number>;
  mostSavedTopic: string;
  mostRevisitedTopic: string;
  mostIgnoredTopic: string;
  learningProgress: number;
  knowledgeGaps: string[];
  weeklyActivity: Array<{ date: string; count: number }>;
  unusedContentCount: number;
  highValueContentCount: number;
  averageUsefulness: number;
  averageActionability: number;
}

export interface SmartLinkAssistantAnswer {
  answer: string;
  highlights: string[];
  relatedItems: SmartLinkItem[];
  nextStep: string;
  confidence: number;
}

export interface SmartLinkAnalysisCacheEntry {
  updatedAt: string;
  snapshot: SmartLinkAnalysisSnapshot;
  signals: SmartLinkContentSignals;
}

export interface SmartLinkHubState {
  items: SmartLinkItem[];
  analysisCache: Record<string, SmartLinkAnalysisCacheEntry>;
  customCategories: string[];
}

export interface SmartLinkQueryFilters {
  category?: string;
  source?: SmartLinkSourcePlatform | 'all';
  status?: SmartLinkRevisitStatus | 'all';
  difficulty?: SmartLinkDifficultyLevel | 'all';
  minUsefulness?: number;
  tag?: string;
  dateWindowDays?: number | 'all';
  onlyUnread?: boolean;
  onlyImportant?: boolean;
}

