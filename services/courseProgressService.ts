export type CreatorLevel = 'Beginner Creator' | 'Smart Creator' | 'Pro Creator' | 'Elite Creator';

export type SecretLabToolId =
  | 'creator-motivation'
  | 'content-idea-generator'
  | 'skill-practice-generator'
  | 'boring-content-fixer'
  | 'reel-idea-builder'
  | 'reel-script-maker'
  | 'thumbnail-title-tester';

type CourseEntry = {
  totalLessons: number;
  lessonPages: number[];
  quizPages: number[];
  pollPages: number[];
  qnaPages: number[];
  miniChallengePages: number[];
  completedAt?: string;
};

type ProgressStore = {
  version: 1;
  courses: Record<string, CourseEntry>;
};

export type CourseProgressSummary = {
  totalLessons: number;
  lessonCount: number;
  quizCount: number;
  pollCount: number;
  qnaCount: number;
  miniChallengeCount: number;
  completed: boolean;
  completedAt?: string;
  pageStatus: {
    lessonDone: boolean;
    quizDone: boolean;
    pollDone: boolean;
    qnaDone: boolean;
    miniChallengeDone: boolean;
  };
};

const STORAGE_KEY = 'course_progress_v1';
const LEVELS: CreatorLevel[] = ['Beginner Creator', 'Smart Creator', 'Pro Creator', 'Elite Creator'];

const LEVEL_TOOL_UNLOCK: Record<SecretLabToolId, number> = {
  'creator-motivation': 0,
  'content-idea-generator': 0,
  'skill-practice-generator': 1,
  'boring-content-fixer': 1,
  'reel-idea-builder': 2,
  'reel-script-maker': 2,
  'thumbnail-title-tester': 3,
};

const EMPTY_STORE: ProgressStore = {
  version: 1,
  courses: {},
};

const uniqueSorted = (arr: number[]) => Array.from(new Set(arr.filter((n) => Number.isInteger(n) && n >= 0))).sort((a, b) => a - b);

const readStore = (): ProgressStore => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_STORE;
    }
    const parsed = JSON.parse(raw) as ProgressStore;
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1 || typeof parsed.courses !== 'object') {
      return EMPTY_STORE;
    }
    return parsed;
  } catch {
    return EMPTY_STORE;
  }
};

const writeStore = (store: ProgressStore) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore local storage issues
  }
};

const ensureCourseEntry = (store: ProgressStore, skillId: string, totalLessons: number): CourseEntry => {
  const current = store.courses[skillId];
  if (!current) {
    const next: CourseEntry = {
      totalLessons: Math.max(1, totalLessons),
      lessonPages: [],
      quizPages: [],
      pollPages: [],
      qnaPages: [],
      miniChallengePages: [],
    };
    store.courses[skillId] = next;
    return next;
  }

  current.totalLessons = Math.max(1, totalLessons);
  current.lessonPages = uniqueSorted(current.lessonPages || []);
  current.quizPages = uniqueSorted(current.quizPages || []);
  current.pollPages = uniqueSorted(current.pollPages || []);
  current.qnaPages = uniqueSorted(current.qnaPages || []);
  current.miniChallengePages = uniqueSorted(current.miniChallengePages || []);
  return current;
};

const isCourseCompleted = (entry: CourseEntry): boolean => {
  const total = Math.max(1, entry.totalLessons || 1);
  return (
    entry.lessonPages.length >= total &&
    entry.quizPages.length >= total &&
    entry.pollPages.length >= total &&
    entry.qnaPages.length >= total &&
    entry.miniChallengePages.length >= total
  );
};

const updateCoursePage = (
  skillId: string,
  totalLessons: number,
  pageIndex: number,
  field: keyof Pick<CourseEntry, 'lessonPages' | 'quizPages' | 'pollPages' | 'qnaPages' | 'miniChallengePages'>,
  value: boolean
) => {
  const store = readStore();
  const entry = ensureCourseEntry(store, skillId, totalLessons);
  const pages = new Set(entry[field] || []);

  if (value) {
    pages.add(pageIndex);
  } else {
    pages.delete(pageIndex);
  }

  entry[field] = uniqueSorted(Array.from(pages));

  if (isCourseCompleted(entry) && !entry.completedAt) {
    entry.completedAt = new Date().toISOString();
  }

  writeStore(store);
};

export const markLessonCompleted = (skillId: string, totalLessons: number, pageIndex: number) => {
  updateCoursePage(skillId, totalLessons, pageIndex, 'lessonPages', true);
};

export const markQuizAttempted = (skillId: string, totalLessons: number, pageIndex: number) => {
  updateCoursePage(skillId, totalLessons, pageIndex, 'quizPages', true);
};

export const markPollVoted = (skillId: string, totalLessons: number, pageIndex: number) => {
  updateCoursePage(skillId, totalLessons, pageIndex, 'pollPages', true);
};

export const markQnaAnswered = (skillId: string, totalLessons: number, pageIndex: number) => {
  updateCoursePage(skillId, totalLessons, pageIndex, 'qnaPages', true);
};

export const markMiniChallengeCompleted = (
  skillId: string,
  totalLessons: number,
  pageIndex: number,
  isCompleted: boolean
) => {
  updateCoursePage(skillId, totalLessons, pageIndex, 'miniChallengePages', isCompleted);
};

export const getCourseSummary = (
  skillId: string,
  totalLessons: number,
  pageIndex: number
): CourseProgressSummary => {
  const store = readStore();
  const entry = ensureCourseEntry(store, skillId, totalLessons);
  writeStore(store);

  return {
    totalLessons: entry.totalLessons,
    lessonCount: entry.lessonPages.length,
    quizCount: entry.quizPages.length,
    pollCount: entry.pollPages.length,
    qnaCount: entry.qnaPages.length,
    miniChallengeCount: entry.miniChallengePages.length,
    completed: isCourseCompleted(entry),
    completedAt: entry.completedAt,
    pageStatus: {
      lessonDone: entry.lessonPages.includes(pageIndex),
      quizDone: entry.quizPages.includes(pageIndex),
      pollDone: entry.pollPages.includes(pageIndex),
      qnaDone: entry.qnaPages.includes(pageIndex),
      miniChallengeDone: entry.miniChallengePages.includes(pageIndex),
    },
  };
};

export const getCompletedCourseCount = (): number => {
  const store = readStore();
  return Object.values(store.courses).filter((entry) => isCourseCompleted(entry)).length;
};

export const isSecretCreatorLabUnlocked = (): boolean => getCompletedCourseCount() > 0;

const getLevelIndexByCompletedCourses = (completedCourses: number): number => {
  if (completedCourses >= 5) {
    return 3;
  }
  if (completedCourses >= 3) {
    return 2;
  }
  if (completedCourses >= 2) {
    return 1;
  }
  if (completedCourses >= 1) {
    return 0;
  }
  return -1;
};

export const getCreatorLevel = (): CreatorLevel | null => {
  const count = getCompletedCourseCount();
  const levelIndex = getLevelIndexByCompletedCourses(count);
  if (levelIndex < 0) {
    return null;
  }
  return LEVELS[levelIndex];
};

export const getLevelProgress = () => {
  const completedCourses = getCompletedCourseCount();
  const levelIndex = getLevelIndexByCompletedCourses(completedCourses);
  const nextLevelIndex = Math.min(levelIndex + 1, LEVELS.length - 1);
  const currentLevel = levelIndex >= 0 ? LEVELS[levelIndex] : null;
  const nextLevel = levelIndex < LEVELS.length - 1 ? LEVELS[nextLevelIndex] : null;

  let requiredForNext = 0;
  if (levelIndex < 0) {
    requiredForNext = 1;
  } else if (levelIndex === 0) {
    requiredForNext = 2;
  } else if (levelIndex === 1) {
    requiredForNext = 3;
  } else if (levelIndex === 2) {
    requiredForNext = 5;
  } else {
    requiredForNext = 5;
  }

  return {
    completedCourses,
    levelIndex,
    currentLevel,
    nextLevel,
    requiredForNext,
    remainingForNext: Math.max(0, requiredForNext - completedCourses),
  };
};

export const isToolUnlockedForCurrentLevel = (toolId: SecretLabToolId): boolean => {
  const completedCourses = getCompletedCourseCount();
  const levelIndex = getLevelIndexByCompletedCourses(completedCourses);
  if (levelIndex < 0) {
    return false;
  }
  return levelIndex >= LEVEL_TOOL_UNLOCK[toolId];
};

export const getToolRequiredLevel = (toolId: SecretLabToolId): CreatorLevel => {
  return LEVELS[LEVEL_TOOL_UNLOCK[toolId]];
};
