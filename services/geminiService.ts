import { GoogleGenAI, Modality, Type } from '@google/genai';
import type { GeneratedContent, SubPage, ContentBlock } from '../types';

const getApiKey = (): string => {
  const apiKey =
    process.env.API_KEY ||
    process.env.GEMINI_API_KEY ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_KEY);

  if (!apiKey) {
    throw new Error('API key missing');
  }

  return apiKey;
};

const getAiClient = () => new GoogleGenAI({ apiKey: getApiKey() });

const quizSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['quiz'] },
    question: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctAnswerIndex: { type: Type.INTEGER },
    explanation: { type: Type.STRING },
  },
  required: ['type', 'question', 'options', 'correctAnswerIndex', 'explanation'],
};

const aiChallengeSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['aiChallenge'] },
    challenge: { type: Type.STRING },
    toolId: {
      type: Type.STRING,
      enum: ['image-analyzer', 'video-analyzer', 'image-animator', 'image-generator'],
    },
  },
  required: ['type', 'challenge', 'toolId'],
};

const pollSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['poll'] },
    question: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['type', 'question', 'options'],
};

const qAndASchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['qAndA'] },
    question: { type: Type.STRING },
    answer: { type: Type.STRING },
  },
  required: ['type', 'question', 'answer'],
};

const expertSaysSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['expertSays'] },
    quote: { type: Type.STRING },
    expertName: { type: Type.STRING },
  },
  required: ['type', 'quote', 'expertName'],
};

const mythBusterSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['mythBuster'] },
    myth: { type: Type.STRING },
    reality: { type: Type.STRING },
  },
  required: ['type', 'myth', 'reality'],
};

const doAndDontSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['doAndDont'] },
    dos: { type: Type.ARRAY, items: { type: Type.STRING } },
    donts: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['type', 'dos', 'donts'],
};

const shockingFactSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['shockingFact'] },
    fact: { type: Type.STRING },
  },
  required: ['type', 'fact'],
};

const ideaCornerSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['ideaCorner'] },
    prompt: { type: Type.STRING },
  },
  required: ['type', 'prompt'],
};

const flashcardSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['flashcard'] },
    front: { type: Type.STRING },
    back: { type: Type.STRING },
  },
  required: ['type', 'front', 'back'],
};

const basicTextBlockSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['heading', 'paragraph', 'tip', 'template', 'benefits', 'infographic', 'funFact'] },
    text: { type: Type.STRING },
  },
  required: ['type', 'text'],
};

const contentSchema = {
  oneOf: [
    basicTextBlockSchema,
    quizSchema,
    aiChallengeSchema,
    pollSchema,
    qAndASchema,
    expertSaysSchema,
    mythBusterSchema,
    doAndDontSchema,
    shockingFactSchema,
    ideaCornerSchema,
    flashcardSchema,
  ],
};

const subPageSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'A catchy title for the sub-page.' },
    imageSuggestion: {
      type: Type.STRING,
      description: "A descriptive suggestion for a relevant image or illustration (e.g., 'A student looking confused at code').",
    },
    content: { type: Type.ARRAY, items: contentSchema, description: 'An array of various content blocks that make up the page.' },
    motionStoryboard: {
      type: Type.STRING,
      description: "A short, creative idea for a motion graphic or animation to be used on this page (e.g., 'A lightbulb icon appears and glows when a tip is shown').",
    },
  },
  required: ['title', 'imageSuggestion', 'content', 'motionStoryboard'],
};

const moduleSchema = {
  type: Type.OBJECT,
  properties: {
    skillName: { type: Type.STRING, description: 'The name of the skill being taught.' },
    subPages: { type: Type.ARRAY, items: subPageSchema, description: 'An array of 10 sub-pages for the learning module.' },
  },
  required: ['skillName', 'subPages'],
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
        { type: 'paragraph', text: `Aaj se aap ${skillName} ka practical safar start kar rahe ho. Daily 45-60 min focused practice rakho.` },
        { type: 'tip', text: 'Random tutorials dekhne ke bajaye ek fixed 30-day plan follow karo.' },
        { type: 'doAndDont', dos: ['Roz practice karo', 'Notes banao', 'Mini project publish karo'], donts: ['Sirf dekhte mat raho', 'Perfect hone ka wait mat karo'] },
        { type: 'benefits', text: 'Consistency se 4-6 hafton me visible progress milti hai aur confidence grow hota hai.' },
      ],
    },
    {
      title: `Beginner Problems & Fixes`,
      imageSuggestion: `Student solving common ${skillName} beginner issues`,
      motionStoryboard: 'Problem icons shake, then solution ticks appear.',
      content: [
        { type: 'heading', text: 'Common mistakes jo beginners karte hain' },
        { type: 'qAndA', question: 'Mujhe samajh aa jata hai, par khud se nahi ban pata. Kya karu?', answer: 'Tutorial complete karne ke baad bina video dekhe same cheez dobara banao.' },
        { type: 'mythBuster', myth: `${skillName} sirf talented log kar sakte hain.`, reality: 'Talent se zyada system aur repetition kaam karta hai.' },
        { type: 'poll', question: 'Aapka sabse bada blocker kya hai?', options: ['Time management', 'Practice consistency', 'Client confidence', 'Tool confusion'] },
        { type: 'funFact', text: 'Top freelancers ka first portfolio piece aksar average hota hai, lekin woh publish zaroor karte hain.' },
      ],
    },
    {
      title: `Tools, Templates & Speed`,
      imageSuggestion: `${skillName} tool stack and reusable templates`,
      motionStoryboard: 'Tool badges pop in and template card flips.',
      content: [
        { type: 'heading', text: 'Fast workflow ke liye tool setup' },
        { type: 'template', text: 'Client Brief Template:\\n1) Goal\\n2) Target audience\\n3) Deadline\\n4) Deliverables\\n5) Budget range' },
        { type: 'infographic', text: 'Rule: 20% learning + 80% creating. Har naye concept ke baad ek micro output nikalo.' },
        { type: 'ideaCorner', prompt: `Aaj ${skillName} me 1 simple service define karo jo 24 ghante me deliver ho sake.` },
        { type: 'tip', text: 'Har project ka checklist banao. Quality aur speed dono improve honge.' },
      ],
    },
    {
      title: `Client Ready Execution`,
      imageSuggestion: `Freelancer presenting ${skillName} work to client`,
      motionStoryboard: 'Before/after cards reveal with smooth swipe.',
      content: [
        { type: 'heading', text: 'Client-facing output ka standard' },
        { type: 'quiz', question: 'Client ko first message me kya bhejna best hai?', options: ['Sirf price', 'Generic hello', 'Short pitch + relevant sample + timeline', 'Long essay'], correctAnswerIndex: 2, explanation: 'Trust tab banta hai jab clarity + proof + timeline ek saath dete ho.' },
        { type: 'expertSays', quote: 'Client clarity always beats raw creativity.', expertName: 'AI Mentor' },
        { type: 'shockingFact', fact: 'Clear communication se close rate 2x tak improve ho sakta hai.' },
        { type: 'flashcard', front: 'Golden Rule?', back: 'Deadline se pehle draft bhejo, final me changes fast ho jaate hain.' },
      ],
    },
    {
      title: `Growth Plan & Income Start`,
      imageSuggestion: `${skillName} portfolio and freelancing growth chart`,
      motionStoryboard: 'Growth chart line animates upward with spark points.',
      content: [
        { type: 'heading', text: `${skillName} se earning start roadmap` },
        { type: 'paragraph', text: 'Portfolio me 5 strong samples rakho: 2 beginner-safe, 2 niche-focused, 1 premium quality.' },
        { type: 'aiChallenge', challenge: 'Apne ek sample ka visual/story explain karne ke liye AI tool use karke better pitch banao.', toolId: 'image-analyzer' },
        { type: 'benefits', text: 'Skill + portfolio + communication combo se first paying client milna realistic ho jata hai.' },
        { type: 'tip', text: 'Roz 5 targeted outreach messages bhejo. Numbers game ko discipline se jeeta jata hai.' },
      ],
    },
  ],
});

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
    const content = rawBlocks.filter((block: any) => block && typeof block === 'object' && typeof block.type === 'string');

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
    subPages: subPages.length > 0
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

export const getFriendlyAiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  const raw = errorToString(error);
  const normalized = raw.toLowerCase();

  if (normalized.includes('api key missing') || normalized.includes('api_key environment variable not set')) {
    return 'API key set nahi hai. .env me valid Gemini API key add karke dobara deploy karo.';
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

  if (
    normalized.includes('requested entity was not found') ||
    normalized.includes('permission_denied') ||
    normalized.includes('unauthenticated') ||
    normalized.includes('api key not valid') ||
    normalized.includes('invalid api key')
  ) {
    return 'API key invalid ya unauthorized hai. Sahi key select karke phir try karo.';
  }

  if (
    normalized.includes('model') && normalized.includes('not found') ||
    normalized.includes('unsupported model') ||
    normalized.includes('does not support')
  ) {
    return 'Selected AI model ab available nahi hai. App ko stable model par update kiya gaya hai, page refresh karke phir try karo.';
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

export const generateSkillContent = async (skillName: string): Promise<GeneratedContent> => {
  const cacheKey = `skill-content-${skillName}`;

  try {
    const cachedContent = sessionStorage.getItem(cacheKey);
    if (cachedContent) {
      const parsedCache = JSON.parse(cachedContent);
      return normalizeGeneratedContent(skillName, parsedCache);
    }
  } catch (error) {
    console.warn('Could not read cached skill content.', error);
    try {
      sessionStorage.removeItem(cacheKey);
    } catch {
      // no-op
    }
  }

  try {
    const ai = getAiClient();
    const prompt = `
      Ek freelance skill "${skillName}" ke liye ek bahut engaging learning module Hinglish (Hindi + English) me banao.
      Ye module Indian students ke liye fun, visual aur relatable hona chahiye.
      Total 10 detailed sub-pages banao.

      Har page me 5-6 alag block-types ki variety do:
      - 'heading', 'paragraph', 'tip', 'template', 'benefits', 'infographic', 'funFact'
      - 'quiz', 'aiChallenge', 'poll', 'qAndA', 'expertSays', 'mythBuster', 'doAndDont', 'shockingFact', 'ideaCorner', 'flashcard'

      Tone friendly, actionable aur encouraging rakho.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: moduleSchema,
      },
    });

    const jsonString = response.text;
    if (!jsonString) {
      throw new Error('API returned no content text.');
    }

    const parsedJson = JSON.parse(jsonString);
    const normalizedContent = normalizeGeneratedContent(skillName, parsedJson);

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(normalizedContent));
    } catch (error) {
      console.warn('Could not cache generated skill content.', error);
    }

    return normalizedContent;
  } catch (error) {
    console.error('Error generating skill content, using local fallback:', error);
    const fallback = buildLocalCourseFallback(skillName);
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(fallback));
    } catch {
      // no-op
    }
    return fallback;
  }
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
    });
    return response.text ?? 'Kuch samajh nahi aaya, phir se try karein.';
  } catch (error) {
    throw new Error(
      getFriendlyAiErrorMessage(error, 'Image analysis me problem aa gayi. Thodi der baad phir try karo.')
    );
  }
};

export const analyzeVideo = async (prompt: string, videoBase64: string, mimeType: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const videoPart = { inlineData: { data: videoBase64, mimeType } };
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, videoPart] },
    });
    return response.text ?? 'Video ajeeb thi, kuch samajh nahi aaya.';
  } catch (error) {
    throw new Error(
      getFriendlyAiErrorMessage(error, 'Video analysis me problem aa gayi. Thodi der baad phir try karo.')
    );
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
    const apiKey = getApiKey();
    const ai = getAiClient();

    onProgress('Video banana shuru ho raha hai...');

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      image: { imageBytes: imageBase64, mimeType },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio },
    });

    onProgress('Processing jaari hai... ismein kuch minute lag sakte hain.');

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
      const progress = (operation.metadata as any)?.progressPercentage ?? 0;
      onProgress(`Video ${Math.round(Number(progress))}% ban chuki hai...`);
    }

    onProgress('Video taiyaar hai!');

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error('Video generate ho gayi, par download link nahi mila.');
    }

    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Video download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    throw new Error(
      getFriendlyAiErrorMessage(error, 'Video animation me issue aa gaya. Thodi der baad phir try karo.')
    );
  }
};

export const generateImage = async (
  prompt: string,
  imageSize: '1K' | '2K' | '4K'
): Promise<{ imageUrl: string; altText: string }> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { imageSize, aspectRatio: '1:1' },
        tools: [{ googleSearch: {} } as any],
      },
    });

    let imageUrl = '';
    let altText = 'Generated image';

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
        } else if (part.text) {
          altText = part.text;
        }
      }
    }

    if (!imageUrl) {
      throw new Error('Image generate nahi ho paayi. Kuch aur prompt try karein.');
    }

    return { imageUrl, altText };
  } catch (error) {
    throw new Error(
      getFriendlyAiErrorMessage(error, 'Image generation me issue aa gaya. Thodi der baad phir try karo.')
    );
  }
};

export const generateFastText = async (prompt: string) => {
  try {
    const ai = getAiClient();
    return ai.models.generateContentStream({
      model: 'gemini-2.5-flash-lite-latest',
      contents: prompt,
    });
  } catch (error) {
    throw new Error(
      getFriendlyAiErrorMessage(error, 'Text generation abhi fail ho gaya. Thodi der baad phir try karo.')
    );
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: `Please read this clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('Audio generate nahi ho paaya.');
    }

    return base64Audio;
  } catch (error) {
    throw new Error(
      getFriendlyAiErrorMessage(error, 'Audio generation me issue aa gaya. Thodi der baad phir try karo.')
    );
  }
};
