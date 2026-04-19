import type { ContentBlock, GeneratedContent, SubPage } from '../types';
import { logUsageEvent } from './analyticsService';
import { getCurrentCreditBalance, recordUsageAndConsumeCredits } from './creditService';
import { getToolDefinition, type ToolCategory, type ToolGenerationType, type ToolProvider } from './toolCatalog';

const VALID_TOOL_IDS = ['image-analyzer', 'video-analyzer', 'image-animator', 'image-generator'] as const;
type ValidToolId = (typeof VALID_TOOL_IDS)[number];

type QnAHistoryItem = {
  role: 'user' | 'assistant';
  text: string;
};

type QnASource = {
  uri: string;
  title: string;
};

type QuotaInfo = {
  quotaMetric?: string;
  quotaId?: string;
  quotaValue?: string;
  quotaDimensions?: Record<string, unknown>;
  retryDelay?: string;
  retryDelayMs?: number;
};

type GeminiApiError = Error & {
  status?: number;
  quotaInfo?: QuotaInfo;
  details?: unknown;
};

// import type { QuotaInfo, ToolResponseMeta } from '../types';

type ToolResponseWithQuota = {
  data: any;
  meta?: ToolResponseMeta;
};

export type ToolResponseMeta = {
  toolId: string;
  toolName: string;
  generationType: ToolGenerationType;
  category: ToolCategory;
  requiredApi: string;
  requiredAiEngine: string;
  provider: ToolProvider;
  model: string;
  providerChain: ToolProvider[];
  fallbackUsed: boolean;
  creditsRequired: number;
  estimatedCostUsd: number;
  notice?: string;
  cached?: boolean;
};

type VideoGenerationStartResponse = {
  operationName?: string;
  model?: string;
  status?: 'in_progress' | 'done';
  aspectRatio?: '16:9' | '9:16';
  resolution?: string;
  numberOfVideos?: number;
};

type VideoGenerationPollResponse = {
  status?: 'in_progress' | 'done';
  operationName?: string;
  progressMessage?: string;
  videoBase64?: string;
  mimeType?: string;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const toText = (value: unknown, fallback: string): string =>
  isNonEmptyString(value) ? value.trim() : fallback;

const toStringArray = (value: unknown, minLen = 1): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  const arr = value.filter(isNonEmptyString).map((entry) => entry.trim());
  return arr.length >= minLen ? arr : [];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getPreferredLanguageHint = (): string => {
  if (typeof window === 'undefined') {
    return 'English';
  }

  const code = localStorage.getItem('app_language') || 'en';
  const labels: Record<string, string> = {
    hinglish: 'Hinglish',
    en: 'English',
    hi: 'Hindi',
    bn: 'Bangla',
    ta: 'Tamil',
    te: 'Telugu',
    mr: 'Marathi',
    gu: 'Gujarati',
    pa: 'Punjabi',
    ur: 'Urdu',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    pt: 'Portuguese',
    ru: 'Russian',
    ar: 'Arabic',
    tr: 'Turkish',
    id: 'Indonesian',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
  };

  return labels[code] ?? 'English';
};

const errorToString = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message || String(error);
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const maybeMessage = (error as any).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const isModelNotFoundError = (error: unknown): boolean => {
  const raw = errorToString(error).toLowerCase();
  return (
    (raw.includes('model') && raw.includes('not found')) ||
    (raw.includes('models/') && raw.includes('not found')) ||
    raw.includes('unsupported model') ||
    raw.includes('does not support')
  );
};

const callGeminiApi = async <T>(
  action: string,
  payload: Record<string, unknown>
): Promise<{ data: T; meta?: ToolResponseMeta }> => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  const raw = await response.text();
  let parsed: any = {};
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    const error = new Error(raw || 'Server response invalid') as GeminiApiError;
    error.status = response.status;
    throw error;
  }

  if (!response.ok || !parsed?.ok) {
    const error = new Error(parsed?.error || `Request failed with status ${response.status}`) as GeminiApiError;
    error.status = typeof parsed?.status === 'number' ? parsed.status : response.status;
    if (parsed?.quotaInfo) {
      error.quotaInfo = parsed.quotaInfo as QuotaInfo;
    }
    if (parsed?.details) {
      error.details = parsed.details;
    }
    throw error;
  }

  return {
    data: parsed.data as T,
    meta: parsed.meta as ToolResponseMeta | undefined,
  };
};

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

export const getFriendlyAiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  const raw = errorToString(error);
  const normalized = raw.toLowerCase();
  const quotaInfo = (error as GeminiApiError | undefined)?.quotaInfo;

  const quotaSuffix = (() => {
    if (!quotaInfo) {
      return '';
    }

    const parts: string[] = [];
    if (quotaInfo.quotaId) {
      parts.push(quotaInfo.quotaId);
    } else if (quotaInfo.quotaMetric) {
      parts.push(quotaInfo.quotaMetric);
    }

    if (quotaInfo.retryDelay) {
      parts.push(`retry after ${quotaInfo.retryDelay}`);
    }

    return parts.length > 0 ? ` (${parts.join(', ')})` : '';
  })();

  if (normalized.includes('server api key missing') || normalized.includes('api key set nahi')) {
    return 'The server API key is missing. Set GOOGLE_API_KEY or GEMINI_API_KEY in Vercel and redeploy.';
  }

  if (
    normalized.includes('resource_exhausted') ||
    normalized.includes('quota exceeded') ||
    normalized.includes('"code":429') ||
    normalized.includes('rate limit') ||
    normalized.includes('too many requests')
  ) {
    return `The Gemini quota or rate limit has been exceeded${quotaSuffix}. Please try again later or check your billing plan.`;
  }

  if (isModelNotFoundError(error)) {
    return 'The selected AI model is no longer available. A stable fallback is being used. Please refresh and try again.';
  }

  if (
    normalized.includes('permission_denied') ||
    normalized.includes('unauthenticated') ||
    normalized.includes('invalid api key')
  ) {
    return 'The server-side API key is invalid or unauthorized. Please verify it in the dashboard.';
  }

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('network error') ||
    normalized.includes('fetch failed')
  ) {
    return 'A network issue occurred. Check your internet connection and try again.';
  }

  if (
    normalized.includes('function_invocation_failed') ||
    normalized.includes('function invocation failed') ||
    normalized.includes('deadline exceeded') ||
    normalized.includes('server timed out') ||
    normalized.includes('timeout')
  ) {
    return 'The video server timed out while processing the request. Please try again; the tool now uses safer background polling.';
  }

  if (raw.includes('{"error"') || raw.length > 300) {
    return fallbackMessage;
  }

  return raw || fallbackMessage;
};

const assertCreditsAvailable = async (toolId: string) => {
  const definition = getToolDefinition(toolId);
  if (!definition || definition.creditsRequired <= 0) {
    return;
  }

  const balance = await getCurrentCreditBalance();
  if (balance < definition.creditsRequired) {
    throw new Error(
      `Not enough credits. ${definition.name} needs ${definition.creditsRequired} credits and your balance is ${balance}.`
    );
  }
};

const persistUsageFromMeta = async (toolId: string, meta?: ToolResponseMeta) => {
  const definition = getToolDefinition(toolId);
  if (!definition || !meta || meta.cached || meta.creditsRequired <= 0) {
    return;
  }

  await recordUsageAndConsumeCredits({
    toolId,
    toolName: meta.toolName || definition.name,
    apiUsed: meta.provider,
    creditsUsed: meta.creditsRequired,
    generationType: meta.generationType,
    estimatedCostUsd: meta.estimatedCostUsd,
    model: meta.model,
    fallbackUsed: meta.fallbackUsed,
    status: 'success',
  });
};

const FALLBACK_BLOCK: ContentBlock = {
  type: 'paragraph',
  text: 'This page content was unstable. Tap Next or Previous to continue.',
};

const buildLocalCourseFallback = (skillName: string): GeneratedContent => ({
  skillName,
  subPages: [
    {
      title: `${skillName} Starter Roadmap`,
      imageSuggestion: `${skillName} learning roadmap with a laptop and notes`,
      motionStoryboard: 'Roadmap cards one-by-one slide in with glow.',
      content: [
        { type: 'heading', text: `How to start ${skillName}` },
        {
          type: 'paragraph',
          text: `Today you are starting a practical ${skillName} journey. Keep a daily 45-60 minute focused practice block.`,
        },
        { type: 'tip', text: 'Follow one fixed 30-day plan instead of jumping between random tutorials.' },
        {
          type: 'doAndDont',
          dos: ['Practice every day', 'Take notes', 'Publish a mini project'],
          donts: ['Do not only watch', 'Do not wait to be perfect'],
        },
        { type: 'benefits', text: 'Consistency creates visible progress in 4-6 weeks and builds confidence.' },
      ],
    },
    {
      title: 'Beginner Problems & Fixes',
      imageSuggestion: `Student solving common ${skillName} beginner issues`,
      motionStoryboard: 'Problem icons shake, then solution ticks appear.',
      content: [
        { type: 'heading', text: 'Common mistakes beginners make' },
        {
          type: 'qAndA',
          question: 'I understand it while watching, but I cannot build it myself. What should I do?',
          answer: 'After finishing a tutorial, rebuild the same thing once without watching the video.',
        },
        {
          type: 'mythBuster',
          myth: `Only naturally talented people can learn ${skillName}.`,
          reality: 'System and repetition matter more than raw talent.',
        },
        {
          type: 'poll',
          question: 'What is your biggest blocker?',
          options: ['Time management', 'Practice consistency', 'Client confidence', 'Tool confusion'],
        },
        {
          type: 'funFact',
          text: 'The first portfolio piece from top freelancers is often average, but they still publish it.',
        },
      ],
    },
    {
      title: 'Tools, Templates & Speed',
      imageSuggestion: `${skillName} tool stack and reusable templates`,
      motionStoryboard: 'Tool badges pop in and template card flips.',
      content: [
        { type: 'heading', text: 'Set up tools for a faster workflow' },
        {
          type: 'template',
          text: 'Client Brief Template:\n1) Goal\n2) Target audience\n3) Deadline\n4) Deliverables\n5) Budget range',
        },
        { type: 'infographic', text: 'Rule: 20% learning and 80% creating. Produce one micro output after every new concept.' },
        { type: 'ideaCorner', prompt: `Define one simple ${skillName} service today that can be delivered within 24 hours.` },
        { type: 'tip', text: 'Create a checklist for every project. Quality and speed will both improve.' },
      ],
    },
    {
      title: 'Client Communication Blueprint',
      imageSuggestion: `${skillName} freelancer talking to a client on a call with notes`,
      motionStoryboard: 'Chat bubbles appear with checklist highlights.',
      content: [
        { type: 'heading', text: 'A simple communication flow that impresses clients' },
        {
          type: 'paragraph',
          text: 'Keep three things clear in every client message: goal, timeline, and next action. This builds trust quickly.',
        },
        {
          type: 'qAndA',
          question: 'What should I do if a client ghosts me?',
          answer: 'Send a short, polite follow-up after 48 hours with one clear next step.',
        },
        {
          type: 'quiz',
          question: 'What is the best client update format?',
          options: ['Long random paragraph', 'Short status + next step + ETA', 'No update until final delivery'],
          correctAnswerIndex: 1,
          explanation: 'A concise status and clear next step improve clarity and confidence.',
        },
        {
          type: 'poll',
          question: 'How often do you send client updates?',
          options: ['Daily', 'Alternate day', 'Only when the client asks'],
        },
      ],
    },
    {
      title: 'Portfolio to Projects',
      imageSuggestion: `${skillName} project cards and portfolio showcase`,
      motionStoryboard: 'Cards slide in and expand one by one.',
      content: [
        { type: 'heading', text: 'How to turn your portfolio into a project machine' },
        {
          type: 'paragraph',
          text: 'Use a problem, process, and result format for every project. It helps clients decide faster.',
        },
        {
          type: 'template',
          text: 'Case Study Template:\n1) Problem\n2) Approach\n3) Tools\n4) Final Output\n5) Measurable Result',
        },
        {
          type: 'doAndDont',
          dos: ['Show before/after', 'Mention numbers', 'Keep screenshots clean'],
          donts: ['Only pretty visuals', 'No context', 'No result mention'],
        },
        {
          type: 'flashcard',
          front: 'What is the most important portfolio section?',
          back: 'Result-oriented case studies with measurable impact.',
        },
      ],
    },
    {
      title: 'Income Growth Plan',
      imageSuggestion: `${skillName} freelancer growth graph with milestones`,
      motionStoryboard: 'Graph line rises with milestone popups.',
      content: [
        { type: 'heading', text: 'A stable income roadmap for the skill' },
        {
          type: 'paragraph',
          text: 'Start with a starter offer, then increase pricing based on testimonials. Review your rate after every three projects.',
        },
        {
          type: 'benefits',
          text: 'A structured growth plan reduces stress and helps you build predictable monthly income.',
        },
        {
          type: 'poll',
          question: 'What will be your focus for the next 30 days?',
          options: ['Portfolio improvement', 'Client outreach', 'Skill depth + speed'],
        },
        {
          type: 'ideaCorner',
          prompt: `Design one ${skillName} micro-offer today that can be delivered in 3 days and can bring repeat clients.`,
        },
      ],
    },
  ],
});

const sanitizeContentBlock = (rawBlock: unknown): ContentBlock | null => {
  if (!rawBlock || typeof rawBlock !== 'object') {
    return null;
  }

  const block = rawBlock as Record<string, unknown>;
  const type = block.type;

  if (!isNonEmptyString(type)) {
    return null;
  }

  switch (type) {
    case 'heading':
    case 'paragraph':
    case 'tip':
    case 'template':
    case 'benefits':
    case 'infographic':
    case 'funFact':
      return {
        type,
        text: toText(block.text, 'This section text is unavailable.'),
      } as ContentBlock;
    case 'quiz': {
      const options = toStringArray(block.options, 2);
      if (!isNonEmptyString(block.question) || !isNonEmptyString(block.explanation) || options.length < 2) {
        return null;
      }
      const idx =
        typeof block.correctAnswerIndex === 'number' &&
        Number.isInteger(block.correctAnswerIndex) &&
        block.correctAnswerIndex >= 0 &&
        block.correctAnswerIndex < options.length
          ? block.correctAnswerIndex
          : 0;
      return {
        type: 'quiz',
        question: block.question.trim(),
        options,
        correctAnswerIndex: idx,
        explanation: block.explanation.trim(),
      };
    }
    case 'aiChallenge': {
      const toolId = block.toolId;
      if (!isNonEmptyString(block.challenge) || !isNonEmptyString(toolId) || !VALID_TOOL_IDS.includes(toolId as ValidToolId)) {
        return null;
      }
      return {
        type: 'aiChallenge',
        challenge: block.challenge.trim(),
        toolId: toolId as ValidToolId,
      };
    }
    case 'poll': {
      const options = toStringArray(block.options, 2);
      if (!isNonEmptyString(block.question) || options.length < 2) {
        return null;
      }
      return {
        type: 'poll',
        question: block.question.trim(),
        options,
      };
    }
    case 'qAndA':
      if (!isNonEmptyString(block.question) || !isNonEmptyString(block.answer)) {
        return null;
      }
      return { type: 'qAndA', question: block.question.trim(), answer: block.answer.trim() };
    case 'expertSays':
      if (!isNonEmptyString(block.quote) || !isNonEmptyString(block.expertName)) {
        return null;
      }
      return { type: 'expertSays', quote: block.quote.trim(), expertName: block.expertName.trim() };
    case 'mythBuster':
      if (!isNonEmptyString(block.myth) || !isNonEmptyString(block.reality)) {
        return null;
      }
      return { type: 'mythBuster', myth: block.myth.trim(), reality: block.reality.trim() };
    case 'doAndDont': {
      const dos = toStringArray(block.dos, 1);
      const donts = toStringArray(block.donts, 1);
      if (dos.length === 0 || donts.length === 0) {
        return null;
      }
      return { type: 'doAndDont', dos, donts };
    }
    case 'shockingFact':
      if (!isNonEmptyString(block.fact)) {
        return null;
      }
      return { type: 'shockingFact', fact: block.fact.trim() };
    case 'ideaCorner':
      if (!isNonEmptyString(block.prompt)) {
        return null;
      }
      return { type: 'ideaCorner', prompt: block.prompt.trim() };
    case 'flashcard':
      if (!isNonEmptyString(block.front) || !isNonEmptyString(block.back)) {
        return null;
      }
      return { type: 'flashcard', front: block.front.trim(), back: block.back.trim() };
    default:
      return null;
  }
};

const normalizeSubPages = (rawSubPages: unknown): SubPage[] => {
  if (!Array.isArray(rawSubPages)) {
    return [];
  }

  const cleaned = rawSubPages.map((subPage, index) => {
    const entry = subPage as any;
    const title = typeof entry?.title === 'string' && entry.title.trim() ? entry.title.trim() : `Section ${index + 1}`;
    const imageSuggestion =
      typeof entry?.imageSuggestion === 'string' && entry.imageSuggestion.trim()
        ? entry.imageSuggestion.trim()
        : 'Freelance student learning setup';
    const motionStoryboard =
      typeof entry?.motionStoryboard === 'string' && entry.motionStoryboard.trim()
        ? entry.motionStoryboard.trim()
        : 'Smooth reveal animation with highlighted key points.';

    const rawBlocks = Array.isArray(entry?.content) ? entry.content : [];
    const content = rawBlocks.map(sanitizeContentBlock).filter((block): block is ContentBlock => block !== null);

    return {
      title,
      imageSuggestion,
      motionStoryboard,
      content: content.length > 0 ? content : [FALLBACK_BLOCK],
    } as SubPage;
  });

  return cleaned.filter((page) => Array.isArray(page.content) && page.content.length > 0);
};

const normalizeGeneratedContent = (skillName: string, payload: unknown): GeneratedContent => {
  const data = payload as any;
  const subPages = normalizeSubPages(data?.subPages);

  return {
    skillName: typeof data?.skillName === 'string' && data.skillName.trim() ? data.skillName.trim() : skillName,
    subPages:
      subPages.length > 0
        ? subPages
        : [
            {
              title: `${skillName} Starter`,
              imageSuggestion: 'A student working on a laptop',
              motionStoryboard: 'Subtle fade-in animation for key lessons.',
              content: [FALLBACK_BLOCK],
            },
          ],
  };
};

export const generateSkillContent = async (skillName: string): Promise<GeneratedContent> => {
  const preferredLanguage = getPreferredLanguageHint();
  const cacheKey = `skill-content-${preferredLanguage}-${skillName}`;

  try {
    const cachedContent = sessionStorage.getItem(cacheKey);
    if (cachedContent) {
      const parsedCache = JSON.parse(cachedContent);
      return normalizeGeneratedContent(skillName, parsedCache);
    }
  } catch {
    try {
      sessionStorage.removeItem(cacheKey);
    } catch {
      // ignore
    }
  }

  try {
    void logUsageEvent('tool_action', { toolId: 'course-generator', action: 'generate_course', skillName });
    const response = await withTimeout(
      callGeminiApi<{ jsonText: string }>('generateSkillContent', {
        skillName,
        preferredLanguage,
      }),
      12000,
      'Course generation timeout'
    );
    const parsedJson = JSON.parse(response.data.jsonText || '{}');
    const normalizedContent = normalizeGeneratedContent(skillName, parsedJson);
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(normalizedContent));
    } catch {
      // ignore
    }
    return normalizedContent;
  } catch (error) {
    console.error('Error generating skill content, using local fallback:', error);
    const fallback = buildLocalCourseFallback(skillName);
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(fallback));
    } catch {
      // ignore
    }
    return fallback;
  }
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  try {
    await assertCreditsAvailable('image-analyzer');
    void logUsageEvent('tool_action', { toolId: 'image-analyzer', action: 'analyze' });
    const response = await callGeminiApi<{ text: string }>('analyzeImage', {
      toolId: 'image-analyzer',
      prompt,
      imageBase64,
      mimeType,
    });
    await persistUsageFromMeta('image-analyzer', response.meta);
    return response.data.text || 'The result was unclear. Please try again.';
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'There was a problem with image analysis. Please try again later.'));
  }
};

export const analyzeVideo = async (prompt: string, videoBase64: string, mimeType: string): Promise<string> => {
  try {
    await assertCreditsAvailable('video-analyzer');
    void logUsageEvent('tool_action', { toolId: 'video-analyzer', action: 'analyze' });
    const response = await callGeminiApi<{ text: string }>('analyzeVideo', {
      toolId: 'video-analyzer',
      prompt,
      videoBase64,
      mimeType,
    });
    await persistUsageFromMeta('video-analyzer', response.meta);
    return response.data.text || 'The video result was unclear. Please try again.';
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'There was a problem with video analysis. Please try again later.'));
  }
};

export const animateImage = async (
  prompt: string,
  imageBase64: string,
  mimeType: string,
  aspectRatio: '16:9' | '9:16',
  onProgress: (message: string) => void,
  options?: {
    videoDuration?: number;
    fps?: number;
    resolution?: string;
    style?: string;
    cameraMotion?: string;
  }
): Promise<string> => {
  try {
    await assertCreditsAvailable('image-animator');
    void logUsageEvent('tool_action', { toolId: 'image-animator', action: 'animate' });
    onProgress('Starting video generation...');
    const start = await callGeminiApi<VideoGenerationStartResponse>('startVideoGeneration', {
      toolId: 'image-animator',
      prompt,
      imageBase64,
      mimeType,
      aspectRatio,
      videoDuration: options?.videoDuration,
      fps: options?.fps,
      resolution: options?.resolution,
      style: options?.style,
      cameraMotion: options?.cameraMotion,
    });

    const operationName = start.data.operationName?.trim();
    if (!operationName) {
      throw new Error('The server did not return a video operation id.');
    }

    const hardTimeoutMs = 12 * 60_000;
    const pollIntervalMs = 8_000;
    const startedAt = Date.now();
    let lastMessage = 'The video is being processed on Google servers...';
    onProgress(lastMessage);

    while (Date.now() - startedAt < hardTimeoutMs) {
      const status = await withTimeout(
        callGeminiApi<VideoGenerationPollResponse>('pollVideoGeneration', { operationName }),
        20_000,
        'Video status check timed out'
      );

      if (status.data.status === 'done' && status.data.videoBase64) {
        onProgress('The video is ready!');
        await persistUsageFromMeta('image-animator', start.meta);
        const bytes = Uint8Array.from(atob(status.data.videoBase64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: status.data.mimeType || 'video/mp4' });
        return URL.createObjectURL(blob);
      }

      if (status.data.status === 'done' && !status.data.videoBase64) {
        throw new Error('The video finished, but the download payload was empty.');
      }

      lastMessage =
        status.data.progressMessage || 'The video is still rendering. This tab can stay open while Google finishes processing it.';
      onProgress(lastMessage);
      await sleep(pollIntervalMs);
    }

    throw new Error('The video generation took too long. Please try again.');
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'There was a problem with video animation. Please try again later.'));
  }
};

export const generateImage = async (
  prompt: string,
  imageSize: '1K' | '2K' | '4K',
  options?: {
    toolId?: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    style?: string;
    sourceImageBase64?: string;
    sourceImageMimeType?: string;
  }
): Promise<{ imageUrl: string; altText: string }> => {
  try {
    const toolId = options?.toolId || 'image-generator';
    await assertCreditsAvailable(toolId);
    void logUsageEvent('tool_action', { toolId, action: 'generate_image', imageSize });
    const response = await callGeminiApi<{ imageUrl: string; altText: string }>('generateImage', {
      toolId,
      prompt,
      imageSize,
      aspectRatio: options?.aspectRatio || '1:1',
      style: options?.style,
      sourceImageBase64: options?.sourceImageBase64,
      sourceImageMimeType: options?.sourceImageMimeType,
    });
    await persistUsageFromMeta(toolId, response.meta);
    let imageUrl = response.data.imageUrl || '';
    let altText = response.data.altText || 'Generated image';

    if (!imageUrl) {
      const safeText = (altText || prompt || 'Generated visual').slice(0, 180);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0b1220"/><stop offset="100%" stop-color="#1f3b75"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="34">${safeText.replace(
        /[<>&'"]/g,
        ''
      )}</text></svg>`;
      imageUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
      altText = safeText;
    }

    return { imageUrl, altText };
  } catch (error: any) {
    const quotaInfo = (error as any).quotaInfo;
    throw new Error(getFriendlyAiErrorMessage(error, 'There was a problem with image generation. Please try again later.'));
  }
};

export const generateFastText = async (
  prompt: string,
  options?: {
    toolId?: string;
    tone?: string;
    length?: string;
    outputFormat?: string;
    temperature?: number;
    maxOutputTokens?: number;
  }
) => {
  try {
    const toolId = options?.toolId || 'rocket-writer';
    await assertCreditsAvailable(toolId);
    void logUsageEvent('tool_action', { toolId, action: 'generate_text' });
    const response = await callGeminiApi<{ text: string }>('generateFastText', {
      toolId,
      prompt,
      tone: options?.tone,
      length: options?.length,
      outputFormat: options?.outputFormat,
      temperature: options?.temperature,
      maxOutputTokens: options?.maxOutputTokens,
    });
    await persistUsageFromMeta(toolId, response.meta);
    const text = response.data.text || '';
    const meta = response.meta;
    return (async function* () {
      yield { text, meta };
    })();
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'Text generation failed for now. Please try again later.'));
  }
};

export const askQna = async (
  message: string,
  history: QnAHistoryItem[],
  languageName: string
): Promise<{ text: string; sources: QnASource[] }> => {
  try {
    await assertCreditsAvailable('qna-bot');
    const response = await callGeminiApi<{ text: string; sources: QnASource[] }>('askQna', {
      toolId: 'qna-bot',
      message,
      languageName,
      history,
    });
    await persistUsageFromMeta('qna-bot', response.meta);
    return {
      text: response.data.text || '',
      sources: Array.isArray(response.data.sources) ? response.data.sources : [],
    };
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'Sorry, the AI response is unavailable right now. Please try again later.'));
  }
};

import type { SmartLinkOutput } from '../types';

export const analyzeSmartLink = async (url: string, note = '', intent = ''): Promise<SmartLinkOutput> => {
  try {
    await assertCreditsAvailable('smart-link-hub');
    void logUsageEvent('tool_action', { toolId: 'smart-link-hub', action: 'analyze' });
    const response = await callGeminiApi<SmartLinkOutput>('analyzeSmartLink', {
      toolId: 'smart-link-hub',
      url,
      note,
      intent,
    });
    await persistUsageFromMeta('smart-link-hub', response.meta);
    return response.data;
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'Link analysis failed. Check URL and try again.'));
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await callGeminiApi<{ base64Audio: string }>('generateSpeech', { text });
    if (!response.data.base64Audio) {
      throw new Error('Audio could not be generated.');
    }
    return response.data.base64Audio;
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'There was a problem with audio generation. Please try again later.'));
  }
};

export const fetchPlatformAudit = async () => {
  const response = await callGeminiApi<{
    tools: Array<Record<string, unknown>>;
    audit: Array<Record<string, unknown>>;
    creditConfig: Record<string, unknown>;
  }>('getPlatformAudit', {});
  return response.data;
};
