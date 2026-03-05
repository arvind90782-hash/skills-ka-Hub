import { GoogleGenAI, Modality } from '@google/genai';

type ReqBody = {
  action?: string;
  payload?: Record<string, any>;
};

const COURSE_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'] as const;
const ANALYSIS_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash'] as const;
const IMAGE_MODELS = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image-preview', 'gemini-2.5-flash'] as const;
const FAST_TEXT_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'] as const;
const CHAT_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash'] as const;

const errorToString = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
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

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('Server API key missing');
  }
  return new GoogleGenAI({ apiKey });
};

const runWithModelFallback = async <T>(
  models: readonly string[],
  runner: (model: string) => Promise<T>
): Promise<T> => {
  let lastError: unknown = null;
  for (const model of models) {
    try {
      return await runner(model);
    } catch (error) {
      lastError = error;
      if (!isModelNotFoundError(error)) {
        throw error;
      }
    }
  }
  throw lastError ?? new Error('No supported model available.');
};

const json = (res: any, status: number, payload: Record<string, any>) => {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const toHistoryLines = (history: any[] | undefined) => {
  if (!Array.isArray(history)) {
    return [];
  }
  return history
    .slice(-12)
    .map((item) => {
      const role = item?.role === 'user' ? 'User' : 'Assistant';
      const text = typeof item?.text === 'string' ? item.text.trim() : '';
      if (!text) {
        return '';
      }
      return `${role}: ${text}`;
    })
    .filter(Boolean);
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    json(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const body: ReqBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const action = body.action;
    const payload = body.payload || {};
    if (!action) {
      json(res, 400, { ok: false, error: 'Missing action' });
      return;
    }

    const ai = getAi();

    if (action === 'generateSkillContent') {
      const skillName = String(payload.skillName || 'Freelance Skill');
      const preferredLanguage = String(payload.preferredLanguage || 'English');

      const prompt = `
Create a highly engaging creator-style learning module for "${skillName}" for beginners.
Preferred language: ${preferredLanguage}.

Return STRICT JSON:
{
  "skillName": string,
  "subPages": [
    {
      "title": string,
      "imageSuggestion": string,
      "motionStoryboard": string,
      "content": ContentBlock[]
    }
  ]
}

Generate exactly 8 subPages.
Tone and experience rules:
- Write like a friendly creator mentor, not a textbook teacher.
- Use short, fast paragraphs (1-3 lines feel).
- Add curiosity and momentum so learner wants to continue scrolling.
- Include creator phrases naturally where relevant: "socho zara", "hidden trick", "beginners ye mistake karte hain", "game change ho jayega".
- Add dopamine blocks via content blocks: tips, fun facts, myth busters, quick actions.

Lesson quality rules:
- Each subPage must follow practical flow: hook, simple explanation, creator example, mini scenario, quick trick, mini challenge.
- Keep every text concise but impactful (mostly 2-4 lines).
- Every subPage must include at least one interactive block from: quiz, poll, qAndA, doAndDont, flashcard.
- Use mixed block types across module: heading, paragraph, tip, template, benefits, infographic, funFact, quiz, poll, qAndA, doAndDont, flashcard.
- Keep content beginner-friendly, project-oriented, and action-first.
- Do not include markdown formatting or text outside JSON.

Reward framing:
- Add progress/reward tone in content so users feel completion unlock value.
- Mention practical challenge or mini action in each subPage.
Avoid extra text outside JSON.
`;

      const response = await runWithModelFallback(COURSE_MODELS, (model) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        })
      );

      json(res, 200, { ok: true, data: { jsonText: response.text || '{}' } });
      return;
    }

    if (action === 'analyzeImage') {
      const response = await runWithModelFallback(ANALYSIS_MODELS, (model) =>
        ai.models.generateContent({
          model,
          contents: {
            parts: [
              { text: String(payload.prompt || '') },
              {
                inlineData: {
                  data: String(payload.imageBase64 || ''),
                  mimeType: String(payload.mimeType || 'image/jpeg'),
                },
              },
            ],
          },
        })
      );
      json(res, 200, { ok: true, data: { text: response.text || '' } });
      return;
    }

    if (action === 'analyzeVideo') {
      const response = await runWithModelFallback(ANALYSIS_MODELS, (model) =>
        ai.models.generateContent({
          model,
          contents: {
            parts: [
              { text: String(payload.prompt || '') },
              {
                inlineData: {
                  data: String(payload.videoBase64 || ''),
                  mimeType: String(payload.mimeType || 'video/mp4'),
                },
              },
            ],
          },
        })
      );
      json(res, 200, { ok: true, data: { text: response.text || '' } });
      return;
    }

    if (action === 'generateImage') {
      const prompt = String(payload.prompt || '');
      const imageSize = String(payload.imageSize || '1K') as '1K' | '2K' | '4K';

      const response = await runWithModelFallback(IMAGE_MODELS, (model) =>
        ai.models.generateContent({
          model,
          contents: { parts: [{ text: prompt }] },
          config: {
            imageConfig: { imageSize, aspectRatio: '1:1' },
          },
        })
      );

      let imageUrl = '';
      let altText = 'Generated image';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          } else if (part.text) {
            altText = part.text;
          }
        }
      }

      json(res, 200, { ok: true, data: { imageUrl, altText } });
      return;
    }

    if (action === 'generateFastText') {
      const prompt = String(payload.prompt || '');
      const response = await runWithModelFallback(FAST_TEXT_MODELS, (model) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.5,
            maxOutputTokens: 260,
          },
        })
      );
      json(res, 200, { ok: true, data: { text: response.text || '' } });
      return;
    }

    if (action === 'askQna') {
      const message = String(payload.message || '');
      const languageName = String(payload.languageName || 'English');
      const history = toHistoryLines(payload.history);

      const prompt = `
You are AI Dost, a friendly and practical assistant for freelance learners.
Preferred language: ${languageName}.
If recent info is needed, use Google Search.

Conversation so far:
${history.join('\n')}

User message:
${message}
`;

      const response = await runWithModelFallback(CHAT_MODELS, (model) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: { tools: [{ googleSearch: {} }] },
        })
      );

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = (groundingChunks || [])
        .map((gc: any) => gc?.web)
        .filter((web: any) => web?.uri && web?.title)
        .map((web: any) => ({ uri: web.uri, title: web.title }));

      const uniqueSources = sources.filter(
        (src: any, index: number, arr: any[]) => arr.findIndex((x) => x.uri === src.uri) === index
      );

      json(res, 200, { ok: true, data: { text: response.text || '', sources: uniqueSources } });
      return;
    }

    if (action === 'generateSpeech') {
      const text = String(payload.text || '');
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
      json(res, 200, { ok: true, data: { base64Audio: base64Audio || '' } });
      return;
    }

    if (action === 'animateImage') {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      const prompt = String(payload.prompt || '');
      const imageBase64 = String(payload.imageBase64 || '');
      const mimeType = String(payload.mimeType || 'image/jpeg');
      const aspectRatio = payload.aspectRatio === '9:16' ? '9:16' : '16:9';

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: { imageBytes: imageBase64, mimeType },
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio },
      });

      const start = Date.now();
      const timeoutMs = 90_000;
      while (!operation.done) {
        if (Date.now() - start > timeoutMs) {
          throw new Error('Video generation is taking longer than allowed timeout. Please try again.');
        }
        await new Promise((resolve) => setTimeout(resolve, 8000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink || !apiKey) {
        throw new Error('Video generated but download link unavailable.');
      }

      const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download generated video (${videoResponse.status})`);
      }
      const arrayBuffer = await videoResponse.arrayBuffer();
      const videoBase64 = Buffer.from(arrayBuffer).toString('base64');

      json(res, 200, { ok: true, data: { videoBase64, mimeType: 'video/mp4' } });
      return;
    }

    json(res, 400, { ok: false, error: 'Unknown action' });
  } catch (error) {
    json(res, 500, { ok: false, error: errorToString(error) || 'Server error' });
  }
}
