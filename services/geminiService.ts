import type { ContentBlock, GeneratedContent, SubPage } from '../types';
import { logUsageEvent } from './analyticsService';

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

const callGeminiApi = async <T>(action: string, payload: Record<string, unknown>): Promise<T> => {
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
    throw new Error(raw || 'Server response invalid');
  }

  if (!response.ok || !parsed?.ok) {
    throw new Error(parsed?.error || `Request failed with status ${response.status}`);
  }

  return parsed.data as T;
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

  if (normalized.includes('server api key missing') || normalized.includes('api key set nahi')) {
    return 'Server API key missing hai. Vercel me GEMINI_API_KEY set karke redeploy karo.';
  }

  if (
    normalized.includes('resource_exhausted') ||
    normalized.includes('quota exceeded') ||
    normalized.includes('"code":429') ||
    normalized.includes('rate limit') ||
    normalized.includes('too many requests')
  ) {
    return 'Aaj ka Gemini quota/rate-limit exceed ho gaya hai. Thodi der baad try karo ya billing/plan check karo.';
  }

  if (isModelNotFoundError(error)) {
    return 'Selected AI model ab available nahi hai. Stable model fallback try ho raha hai. Page refresh karke phir try karo.';
  }

  if (
    normalized.includes('permission_denied') ||
    normalized.includes('unauthenticated') ||
    normalized.includes('invalid api key')
  ) {
    return 'Server-side API key invalid ya unauthorized hai. Dashboard me key check karo.';
  }

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('network error') ||
    normalized.includes('fetch failed')
  ) {
    return 'Network issue aa gaya. Internet check karo aur phir try karo.';
  }

  if (raw.includes('{"error"') || raw.length > 300) {
    return fallbackMessage;
  }

  return raw || fallbackMessage;
};

const FALLBACK_BLOCK: ContentBlock = {
  type: 'paragraph',
  text: 'Is page ka content thoda unstable tha. Next/previous par tap karke continue karein.',
};

const buildLocalCourseFallback = (skillName: string): GeneratedContent => ({
  skillName,
  subPages: [
    {
      title: `${skillName} Ka Starter Roadmap`,
      imageSuggestion: `${skillName} learning roadmap with laptop and notes`,
      motionStoryboard: 'Roadmap cards one-by-one slide in with glow.',
      content: [
        { type: 'heading', text: `${skillName} shuru kaise karein` },
        {
          type: 'paragraph',
          text: `Aaj se aap ${skillName} ka practical safar start kar rahe ho. Daily 45-60 min focused practice rakho.`,
        },
        { type: 'tip', text: 'Random tutorials dekhne ke bajaye ek fixed 30-day plan follow karo.' },
        {
          type: 'doAndDont',
          dos: ['Roz practice karo', 'Notes banao', 'Mini project publish karo'],
          donts: ['Sirf dekhte mat raho', 'Perfect hone ka wait mat karo'],
        },
        { type: 'benefits', text: 'Consistency se 4-6 hafton me visible progress milti hai aur confidence grow hota hai.' },
      ],
    },
    {
      title: `Beginner Problems & Fixes`,
      imageSuggestion: `Student solving common ${skillName} beginner issues`,
      motionStoryboard: 'Problem icons shake, then solution ticks appear.',
      content: [
        { type: 'heading', text: 'Common mistakes jo beginners karte hain' },
        {
          type: 'qAndA',
          question: 'Mujhe samajh aa jata hai, par khud se nahi ban pata. Kya karu?',
          answer: 'Tutorial complete karne ke baad bina video dekhe same cheez dobara banao.',
        },
        {
          type: 'mythBuster',
          myth: `${skillName} sirf talented log kar sakte hain.`,
          reality: 'Talent se zyada system aur repetition kaam karta hai.',
        },
        {
          type: 'poll',
          question: 'Aapka sabse bada blocker kya hai?',
          options: ['Time management', 'Practice consistency', 'Client confidence', 'Tool confusion'],
        },
        {
          type: 'funFact',
          text: 'Top freelancers ka first portfolio piece aksar average hota hai, lekin woh publish zaroor karte hain.',
        },
      ],
    },
    {
      title: `Tools, Templates & Speed`,
      imageSuggestion: `${skillName} tool stack and reusable templates`,
      motionStoryboard: 'Tool badges pop in and template card flips.',
      content: [
        { type: 'heading', text: 'Fast workflow ke liye tool setup' },
        {
          type: 'template',
          text: 'Client Brief Template:\n1) Goal\n2) Target audience\n3) Deadline\n4) Deliverables\n5) Budget range',
        },
        { type: 'infographic', text: 'Rule: 20% learning + 80% creating. Har naye concept ke baad ek micro output nikalo.' },
        { type: 'ideaCorner', prompt: `Aaj ${skillName} me 1 simple service define karo jo 24 ghante me deliver ho sake.` },
        { type: 'tip', text: 'Har project ka checklist banao. Quality aur speed dono improve honge.' },
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
        text: toText(block.text, 'Is section ka text unavailable hai.'),
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
    const data = await withTimeout(
      callGeminiApi<{ jsonText: string }>('generateSkillContent', {
        skillName,
        preferredLanguage,
      }),
      12000,
      'Course generation timeout'
    );
    const parsedJson = JSON.parse(data.jsonText || '{}');
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
    void logUsageEvent('tool_action', { toolId: 'image-analyzer', action: 'analyze' });
    const data = await callGeminiApi<{ text: string }>('analyzeImage', { prompt, imageBase64, mimeType });
    return data.text || 'Kuch samajh nahi aaya, phir se try karein.';
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'Image analysis me problem aa gayi. Thodi der baad phir try karo.'));
  }
};

export const analyzeVideo = async (prompt: string, videoBase64: string, mimeType: string): Promise<string> => {
  try {
    void logUsageEvent('tool_action', { toolId: 'video-analyzer', action: 'analyze' });
    const data = await callGeminiApi<{ text: string }>('analyzeVideo', { prompt, videoBase64, mimeType });
    return data.text || 'Video ajeeb thi, kuch samajh nahi aaya.';
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'Video analysis me problem aa gayi. Thodi der baad phir try karo.'));
  }
};

export const animateImage = async (
  prompt: string,
  imageBase64: string,
  mimeType: string,
  aspectRatio: '16:9' | '9:16',
  onProgress: (message: string) => void
): Promise<string> => {
  try {
    onProgress('Video banana shuru ho raha hai...');
    void logUsageEvent('tool_action', { toolId: 'image-animator', action: 'animate' });
    const data = await callGeminiApi<{ videoBase64: string; mimeType: string }>('animateImage', {
      prompt,
      imageBase64,
      mimeType,
      aspectRatio,
    });
    onProgress('Video taiyaar hai!');
    const bytes = Uint8Array.from(atob(data.videoBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: data.mimeType || 'video/mp4' });
    return URL.createObjectURL(blob);
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'Video animation me issue aa gaya. Thodi der baad phir try karo.'));
  }
};

export const generateImage = async (
  prompt: string,
  imageSize: '1K' | '2K' | '4K'
): Promise<{ imageUrl: string; altText: string }> => {
  try {
    void logUsageEvent('tool_action', { toolId: 'image-generator', action: 'generate_image', imageSize });
    const data = await callGeminiApi<{ imageUrl: string; altText: string }>('generateImage', { prompt, imageSize });
    let imageUrl = data.imageUrl || '';
    let altText = data.altText || 'Generated image';

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
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'Image generation me issue aa gaya. Thodi der baad phir try karo.'));
  }
};

export const generateFastText = async (prompt: string) => {
  try {
    void logUsageEvent('tool_action', { toolId: 'rocket-writer', action: 'generate_text' });
    const data = await callGeminiApi<{ text: string }>('generateFastText', { prompt });
    const text = data.text || '';
    return (async function* () {
      yield { text };
    })();
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'Text generation abhi fail ho gaya. Thodi der baad phir try karo.'));
  }
};

export const askQna = async (
  message: string,
  history: QnAHistoryItem[],
  languageName: string
): Promise<{ text: string; sources: QnASource[] }> => {
  try {
    const data = await callGeminiApi<{ text: string; sources: QnASource[] }>('askQna', {
      message,
      languageName,
      history,
    });
    return {
      text: data.text || '',
      sources: Array.isArray(data.sources) ? data.sources : [],
    };
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'Sorry, abhi AI response nahi de pa raha. Thodi der baad try karein.'));
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const data = await callGeminiApi<{ base64Audio: string }>('generateSpeech', { text });
    if (!data.base64Audio) {
      throw new Error('Audio generate nahi ho paaya.');
    }
    return data.base64Audio;
  } catch (error) {
    throw new Error(getFriendlyAiErrorMessage(error, 'Audio generation me issue aa gaya. Thodi der baad phir try karo.'));
  }
};
