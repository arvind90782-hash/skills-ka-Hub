import { GoogleGenAI, Modality } from '@google/genai';
import { getPageMetadata } from '../utils/fetchPageContent';
import {
  CREDIT_CONFIG,
  PLATFORM_AUDIT_ROWS,
  TOOL_DEFINITIONS,
  getToolDefinition,
  type ToolCategory,
  type ToolGenerationType,
  type ToolProvider,
} from '../services/toolCatalog';

type ReqBody = {
  action?: string;
  payload?: Record<string, any>;
};

type ProviderResult<T> = {
  data: T;
  provider: ToolProvider;
  model: string;
  fallbackUsed: boolean;
  providerChain: ToolProvider[];
  notice?: string;
};

type ResponseMeta = {
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

type CacheValue = {
  expiresAt: number;
  data: unknown;
  meta: ResponseMeta;
};

type VideoStartResponse = {
  operationName: string;
  model: string;
  status: 'in_progress' | 'done';
  aspectRatio: '16:9' | '9:16';
  resolution: string;
  numberOfVideos: number;
};

type VideoPollResponse = {
  status: 'in_progress' | 'done';
  operationName: string;
  progressMessage?: string;
  videoBase64?: string;
  mimeType?: string;
};

const TEXT_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'] as const;
const ANALYSIS_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash'] as const;
const IMAGE_MODELS = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image'] as const;
const VIDEO_MODELS = ['veo-3.1-generate-preview', 'veo-3.1-fast-generate-preview', 'veo-3.0-generate-preview'] as const;
const TTS_MODELS = ['gemini-2.5-pro-preview-tts', 'gemini-2.5-flash-preview-tts'] as const;
const responseCache = new Map<string, CacheValue>();

const getEnv = (...keys: string[]): string => keys.map((key) => process.env[key]).find(Boolean) || '';

const getGoogleApiKey = (): string => getEnv('GOOGLE_API_KEY', 'GEMINI_API_KEY', 'API_KEY');
const getOpenRouterKey = (): string => getEnv('OPENROUTER_API_KEY');
const getTogetherKey = (): string => getEnv('TOGETHER_API_KEY');
const getHuggingFaceKey = (): string => getEnv('HUGGINGFACE_API_KEY', 'HF_TOKEN');
const getStabilityKey = (): string => getEnv('STABILITY_API_KEY');
const getReplicateKey = (): string => getEnv('REPLICATE_API_TOKEN');
const getRunwayKey = (): string => getEnv('RUNWAY_API_KEY', 'RUNWAYML_API_SECRET');

const json = (res: any, status: number, payload: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const errorToString = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message || String(error);
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const getErrorStatus = (error: unknown): number => {
  const direct = (error as any)?.status;
  if (typeof direct === 'number') {
    return direct;
  }
  const nested = (error as any)?.error?.status;
  return typeof nested === 'number' ? nested : 500;
};

const isModelNotFoundError = (error: unknown): boolean => {
  const raw = errorToString(error).toLowerCase();
  return (
    (raw.includes('model') && raw.includes('not found')) ||
    raw.includes('unsupported model') ||
    raw.includes('does not support')
  );
};

const shouldFallbackProvider = (error: unknown): boolean => {
  const status = getErrorStatus(error);
  const raw = errorToString(error).toLowerCase();

  if (isModelNotFoundError(error)) {
    return true;
  }

  return (
    status === 408 ||
    status === 409 ||
    status === 425 ||
    status === 429 ||
    status >= 500 ||
    raw.includes('timeout') ||
    raw.includes('timed out') ||
    raw.includes('resource_exhausted') ||
    raw.includes('quota') ||
    raw.includes('rate limit') ||
    raw.includes('temporarily unavailable') ||
    raw.includes('overloaded')
  );
};

const extractQuotaInfo = (error: unknown): Record<string, unknown> | undefined => {
  const source = (error as any)?.error && typeof (error as any).error === 'object' ? (error as any).error : error;
  const details = source && typeof source === 'object' && Array.isArray((source as any).details) ? (source as any).details : [];
  if (!Array.isArray(details)) {
    return undefined;
  }

  const quotaFailure = details.find((entry) => String(entry?.['@type'] || '').includes('QuotaFailure'));
  const retryInfo = details.find((entry) => String(entry?.['@type'] || '').includes('RetryInfo'));
  const violation = Array.isArray(quotaFailure?.violations) ? quotaFailure.violations[0] : undefined;

  if (!violation && !retryInfo) {
    return undefined;
  }

  return {
    quotaMetric: violation?.quotaMetric,
    quotaId: violation?.quotaId,
    quotaValue: violation?.quotaValue,
    quotaDimensions: violation?.quotaDimensions,
    retryDelay: retryInfo?.retryDelay,
  };
};

const buildServerErrorPayload = (error: unknown) => ({
  status: getErrorStatus(error),
  message: errorToString(error) || 'Server error',
  quotaInfo: extractQuotaInfo(error),
});

const getAi = () => {
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    throw new Error('Server API key missing. Set GOOGLE_API_KEY or GEMINI_API_KEY in the environment.');
  }
  return new GoogleGenAI({ apiKey });
};

const normalizeAspectRatio = (value: unknown): '16:9' | '9:16' => (value === '9:16' ? '9:16' : '16:9');

const aspectRatioToSize = (ratio: '16:9' | '9:16'): { width: number; height: number } =>
  ratio === '9:16' ? { width: 1024, height: 1792 } : { width: 1792, height: 1024 };

const sanitizePrompt = (value: unknown): string =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);

const buildEnhancedPrompt = (input: {
  rawPrompt: string;
  toolId: string;
  tone?: string;
  length?: string;
  outputFormat?: string;
  style?: string;
  cameraMotion?: string;
  aspectRatio?: string;
}): string => {
  const definition = getToolDefinition(input.toolId);
  const parts = [
    definition ? `Tool: ${definition.name}.` : '',
    definition ? `Expected output: ${definition.requiredApi}.` : '',
    'Clean the prompt, preserve the user intent, and add only useful context.',
    input.tone ? `Tone: ${input.tone}.` : '',
    input.length ? `Length preference: ${input.length}.` : '',
    input.outputFormat ? `Output format: ${input.outputFormat}.` : '',
    input.style ? `Style: ${input.style}.` : '',
    input.cameraMotion ? `Camera motion: ${input.cameraMotion}.` : '',
    input.aspectRatio ? `Aspect ratio: ${input.aspectRatio}.` : '',
    `User request: ${input.rawPrompt}`,
  ].filter(Boolean);

  return parts.join('\n');
};

const getCacheKey = (action: string, payload: Record<string, unknown>) =>
  JSON.stringify({
    action,
    toolId: payload.toolId || '',
    prompt: payload.prompt || '',
    imageSize: payload.imageSize || '',
    aspectRatio: payload.aspectRatio || '',
    tone: payload.tone || '',
    length: payload.length || '',
    outputFormat: payload.outputFormat || '',
    note: payload.note || '',
    intent: payload.intent || '',
    url: payload.url || '',
  });

const getCachedResponse = (key: string): CacheValue | null => {
  const entry = responseCache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return entry;
};

const setCachedResponse = (key: string, data: unknown, meta: ResponseMeta, ttlMs = 5 * 60_000) => {
  responseCache.set(key, {
    data,
    meta,
    expiresAt: Date.now() + ttlMs,
  });
};

const buildToolMeta = (toolId: string, providerResult: ProviderResult<unknown>): ResponseMeta => {
  const definition = getToolDefinition(toolId);
  const fallbackMeta = {
    toolId,
    toolName: toolId,
    generationType: 'utility' as ToolGenerationType,
    category: 'utility-ai-tools' as ToolCategory,
    requiredApi: 'Local runtime',
    requiredAiEngine: 'local-runtime',
    provider: providerResult.provider,
    model: providerResult.model,
    providerChain: providerResult.providerChain,
    fallbackUsed: providerResult.fallbackUsed,
    creditsRequired: 0,
    estimatedCostUsd: 0,
    notice: providerResult.notice,
  };

  if (!definition) {
    return fallbackMeta;
  }

  return {
    toolId: definition.id,
    toolName: definition.name,
    generationType: definition.generationType,
    category: definition.category,
    requiredApi: definition.requiredApi,
    requiredAiEngine: definition.requiredAiEngine,
    provider: providerResult.provider,
    model: providerResult.model,
    providerChain: providerResult.providerChain,
    fallbackUsed: providerResult.fallbackUsed,
    creditsRequired: definition.creditsRequired,
    estimatedCostUsd: definition.estimatedCostUsd,
    notice:
      providerResult.notice ||
      (providerResult.fallbackUsed ? 'Primary generation engine was busy. Switched to a backup provider.' : undefined),
  };
};

const getAvailableProviders = (toolId: string, requestedType?: ToolGenerationType): ToolProvider[] => {
  const definition = getToolDefinition(toolId);
  const fallbackByType: Record<ToolGenerationType, ToolProvider[]> = {
    text: ['gemini', 'openrouter', 'together', 'huggingface'],
    image: ['gemini', 'stability', 'replicate'],
    video: ['gemini', 'replicate', 'runway'],
    audio: ['gemini'],
    prompt: ['gemini', 'openrouter', 'together', 'huggingface'],
    code: ['gemini', 'openrouter', 'together', 'huggingface'],
    'image-analysis': ['gemini'],
    'video-analysis': ['gemini'],
    knowledge: ['gemini', 'openrouter'],
    course: ['gemini', 'openrouter', 'together'],
    utility: ['local'],
  };

  const type = requestedType || definition?.generationType || 'utility';
  const preferred = definition ? [definition.primaryProvider, ...definition.fallbackProviders] : fallbackByType[type];

  return preferred.filter((provider, index, array) => {
    const isAvailable =
      provider === 'local' ||
      (provider === 'gemini' && !!getGoogleApiKey()) ||
      (provider === 'openrouter' && !!getOpenRouterKey()) ||
      (provider === 'together' && !!getTogetherKey()) ||
      (provider === 'huggingface' && !!getHuggingFaceKey()) ||
      (provider === 'stability' && !!getStabilityKey()) ||
      (provider === 'replicate' && !!getReplicateKey()) ||
      (provider === 'runway' && !!getRunwayKey());

    return isAvailable && array.indexOf(provider) === index;
  });
};

const runWithModelFallback = async <T>(
  models: readonly string[],
  runner: (model: string) => Promise<T>
): Promise<{ result: T; model: string }> => {
  let lastError: unknown = null;

  for (const model of models) {
    try {
      return {
        result: await runner(model),
        model,
      };
    } catch (error) {
      lastError = error;
      if (!isModelNotFoundError(error)) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('No supported model available.');
};

const fetchJson = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init);
  const raw = await response.text();
  let parsed: any = {};
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    parsed = { raw };
  }

  if (!response.ok) {
    const error = new Error(parsed?.error?.message || parsed?.message || raw || `Request failed (${response.status})`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return parsed;
};

const fetchBinaryAsBase64 = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Failed to download media (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    base64: buffer.toString('base64'),
    mimeType: response.headers.get('content-type') || 'application/octet-stream',
  };
};

const runTextProviderSequence = async (input: {
  toolId: string;
  prompt: string;
  tone?: string;
  length?: string;
  outputFormat?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: 'text/plain' | 'application/json';
  systemPrompt?: string;
}): Promise<ProviderResult<{ text: string }>> => {
  const providers = getAvailableProviders(input.toolId, getToolDefinition(input.toolId)?.generationType || 'text');
  if (providers.length === 0) {
    throw new Error('No text generation provider is configured. Add a Gemini or fallback API key.');
  }

  const prompt = buildEnhancedPrompt({
    rawPrompt: sanitizePrompt(input.prompt),
    toolId: input.toolId,
    tone: input.tone,
    length: input.length,
    outputFormat: input.outputFormat,
  });
  const ai = getGoogleApiKey() ? getAi() : null;
  let lastError: unknown = null;

  for (let index = 0; index < providers.length; index += 1) {
    const provider = providers[index];
    try {
      if (provider === 'gemini') {
        if (!ai) {
          throw new Error('Gemini API key missing.');
        }

        const { result, model } = await runWithModelFallback(TEXT_MODELS, (selectedModel) =>
          ai.models.generateContent({
            model: selectedModel,
            contents: input.systemPrompt ? `${input.systemPrompt}\n\n${prompt}` : prompt,
            config: {
              temperature: input.temperature ?? 0.6,
              maxOutputTokens: input.maxOutputTokens ?? 1500,
              responseMimeType: input.responseMimeType ?? 'text/plain',
            },
          })
        );

        return {
          data: { text: result.text || '' },
          provider,
          model,
          fallbackUsed: index > 0,
          providerChain: providers,
        };
      }

      if (provider === 'openrouter') {
        const completion = await fetchJson('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getOpenRouterKey()}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': getEnv('APP_BASE_URL', 'VERCEL_URL') || 'https://skills-hub.local',
            'X-OpenRouter-Title': 'Skills Hub',
          },
          body: JSON.stringify({
            model: getEnv('OPENROUTER_MODEL') || undefined,
            messages: [
              ...(input.systemPrompt ? [{ role: 'system', content: input.systemPrompt }] : []),
              { role: 'user', content: prompt },
            ],
            temperature: input.temperature ?? 0.6,
            max_tokens: input.maxOutputTokens ?? 1500,
            response_format:
              input.responseMimeType === 'application/json' ? { type: 'json_object' } : undefined,
          }),
        });

        return {
          data: { text: completion?.choices?.[0]?.message?.content || '' },
          provider,
          model: completion?.model || getEnv('OPENROUTER_MODEL') || 'openrouter-default',
          fallbackUsed: index > 0,
          providerChain: providers,
          notice: index > 0 ? 'Primary generation engine was busy. Switched to OpenRouter.' : undefined,
        };
      }

      if (provider === 'together') {
        const completion = await fetchJson('https://api.together.xyz/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getTogetherKey()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: getEnv('TOGETHER_MODEL') || 'openai/gpt-oss-20b',
            messages: [
              ...(input.systemPrompt ? [{ role: 'system', content: input.systemPrompt }] : []),
              { role: 'user', content: prompt },
            ],
            temperature: input.temperature ?? 0.6,
            max_tokens: input.maxOutputTokens ?? 1500,
          }),
        });

        return {
          data: { text: completion?.choices?.[0]?.message?.content || '' },
          provider,
          model: completion?.model || getEnv('TOGETHER_MODEL') || 'openai/gpt-oss-20b',
          fallbackUsed: index > 0,
          providerChain: providers,
          notice: index > 0 ? 'Primary generation engine was busy. Switched to Together AI.' : undefined,
        };
      }

      if (provider === 'huggingface') {
        const completion = await fetchJson('https://router.huggingface.co/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getHuggingFaceKey()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: getEnv('HUGGINGFACE_TEXT_MODEL') || 'Qwen/Qwen2.5-7B-Instruct-1M:preferred',
            messages: [
              ...(input.systemPrompt ? [{ role: 'system', content: input.systemPrompt }] : []),
              { role: 'user', content: prompt },
            ],
            temperature: input.temperature ?? 0.6,
            max_tokens: input.maxOutputTokens ?? 1500,
          }),
        });

        return {
          data: { text: completion?.choices?.[0]?.message?.content || '' },
          provider,
          model: completion?.model || getEnv('HUGGINGFACE_TEXT_MODEL') || 'Qwen/Qwen2.5-7B-Instruct-1M:preferred',
          fallbackUsed: index > 0,
          providerChain: providers,
          notice: index > 0 ? 'Primary generation engine was busy. Switched to Hugging Face.' : undefined,
        };
      }
    } catch (error) {
      lastError = error;
      if (!shouldFallbackProvider(error) || index === providers.length - 1) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('Text generation failed.');
};

const runGeminiImageGeneration = async (input: {
  prompt: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  imageSize: '1K' | '2K' | '4K';
  sourceImageBase64?: string;
  sourceImageMimeType?: string;
}) => {
  const ai = getAi();
  const contents: Array<string | { inlineData: { data: string; mimeType: string } }> = [input.prompt];
  if (input.sourceImageBase64) {
    contents.push({
      inlineData: {
        data: input.sourceImageBase64,
        mimeType: input.sourceImageMimeType || 'image/png',
      },
    });
  }

  const { result, model } = await runWithModelFallback(IMAGE_MODELS, (selectedModel) =>
    ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        imageConfig: {
          aspectRatio: input.aspectRatio,
          imageSize: input.imageSize,
        } as any,
      } as any,
    })
  );

  let imageUrl = '';
  let altText = 'Generated image';
  const parts = result.candidates?.[0]?.content?.parts || (result as any).parts || [];

  for (const part of parts) {
    if (part.inlineData?.data) {
      imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    } else if (part.text) {
      altText = String(part.text);
    }
  }

  if (!imageUrl) {
    throw new Error('Gemini did not return an image payload.');
  }

  return { imageUrl, altText, model };
};

const runStabilityImageGeneration = async (input: {
  prompt: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  style?: string;
}) => {
  const formData = new FormData();
  formData.set('prompt', input.prompt);
  formData.set('aspect_ratio', input.aspectRatio);
  formData.set('output_format', 'png');
  if (input.style) {
    formData.set('style_preset', input.style);
  }

  const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getStabilityKey()}`,
      Accept: 'image/*',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText || `Stability request failed (${response.status})`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    imageUrl: `data:image/png;base64,${buffer.toString('base64')}`,
    altText: 'Generated image',
    model: 'stable-image-core',
  };
};

const runReplicatePrediction = async (
  modelRef: string,
  input: Record<string, unknown>,
  waitSeconds = 60
): Promise<any> => {
  const [owner, name] = modelRef.split('/');
  if (!owner || !name) {
    throw new Error(`Replicate model is invalid: ${modelRef}`);
  }

  return fetchJson(`https://api.replicate.com/v1/models/${owner}/${name}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getReplicateKey()}`,
      'Content-Type': 'application/json',
      Prefer: `wait=${waitSeconds}`,
    },
    body: JSON.stringify({ input }),
  });
};

const runReplicateImageGeneration = async (input: {
  prompt: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
}) => {
  const prediction = await runReplicatePrediction(
    getEnv('REPLICATE_IMAGE_MODEL') || 'black-forest-labs/flux-schnell',
    {
      prompt: input.prompt,
      aspect_ratio: input.aspectRatio,
      output_format: 'png',
    }
  );

  const output = Array.isArray(prediction?.output) ? prediction.output[0] : prediction?.output;
  if (!isNonEmptyString(output)) {
    throw new Error('Replicate did not return an image URL.');
  }

  return {
    imageUrl: output,
    altText: 'Generated image',
    model: prediction?.model || getEnv('REPLICATE_IMAGE_MODEL') || 'black-forest-labs/flux-schnell',
  };
};

const runImageProviderSequence = async (input: {
  toolId: string;
  prompt: string;
  imageSize: '1K' | '2K' | '4K';
  aspectRatio: '16:9' | '9:16' | '1:1';
  style?: string;
  sourceImageBase64?: string;
  sourceImageMimeType?: string;
}): Promise<ProviderResult<{ imageUrl: string; altText: string }>> => {
  const providers = getAvailableProviders(input.toolId, 'image');
  if (providers.length === 0) {
    throw new Error('No image generation provider is configured. Add a Gemini or fallback image API key.');
  }

  const prompt = buildEnhancedPrompt({
    rawPrompt: sanitizePrompt(input.prompt),
    toolId: input.toolId,
    style: input.style,
    aspectRatio: input.aspectRatio,
  });

  let lastError: unknown = null;
  for (let index = 0; index < providers.length; index += 1) {
    const provider = providers[index];
    try {
      if (provider === 'gemini') {
        const result = await runGeminiImageGeneration({
          prompt,
          imageSize: input.imageSize,
          aspectRatio: input.aspectRatio,
          sourceImageBase64: input.sourceImageBase64,
          sourceImageMimeType: input.sourceImageMimeType,
        });
        return {
          data: { imageUrl: result.imageUrl, altText: result.altText },
          provider,
          model: result.model,
          fallbackUsed: index > 0,
          providerChain: providers,
        };
      }

      if (provider === 'stability') {
        const result = await runStabilityImageGeneration({
          prompt,
          aspectRatio: input.aspectRatio,
          style: input.style,
        });
        return {
          data: { imageUrl: result.imageUrl, altText: result.altText },
          provider,
          model: result.model,
          fallbackUsed: index > 0,
          providerChain: providers,
          notice: 'Primary generation engine was busy. Switched to Stability AI.',
        };
      }

      if (provider === 'replicate') {
        const result = await runReplicateImageGeneration({
          prompt,
          aspectRatio: input.aspectRatio,
        });
        return {
          data: { imageUrl: result.imageUrl, altText: result.altText },
          provider,
          model: result.model,
          fallbackUsed: index > 0,
          providerChain: providers,
          notice: 'Primary generation engine was busy. Switched to Replicate.',
        };
      }
    } catch (error) {
      lastError = error;
      if (!shouldFallbackProvider(error) || index === providers.length - 1) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('Image generation failed.');
};

const startGeminiVideoGeneration = async (input: {
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
  aspectRatio: '16:9' | '9:16';
  durationSeconds: number;
  fps: number;
  resolution: string;
}) => {
  const ai = getAi();
  let selectedModel = VIDEO_MODELS[0];

  const { result, model } = await runWithModelFallback(VIDEO_MODELS, (videoModel) => {
    selectedModel = videoModel;
    return (ai.models as any).generateVideos({
      model: videoModel,
      prompt: input.prompt,
      ...(input.imageBase64
        ? {
            image: {
              imageBytes: input.imageBase64,
              mimeType: input.mimeType || 'image/png',
            },
          }
        : {}),
      config: {
        numberOfVideos: 1,
        resolution: input.resolution,
        aspectRatio: input.aspectRatio,
        durationSeconds: input.durationSeconds,
        fps: input.fps,
      },
    });
  });

  const operation = result as any;
  return {
    operationName: operation.name || '',
    model: model || selectedModel,
    status: operation.done ? 'done' : 'in_progress',
  };
};

const startReplicateVideoGeneration = async (input: {
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
  aspectRatio: '16:9' | '9:16';
  durationSeconds: number;
  fps: number;
}) => {
  const prediction = await runReplicatePrediction(
    getEnv('REPLICATE_VIDEO_MODEL') || 'wavespeedai/wan-2.1-i2v-480p',
    {
      prompt: input.prompt,
      image: input.imageBase64 ? `data:${input.mimeType || 'image/png'};base64,${input.imageBase64}` : undefined,
      aspect_ratio: input.aspectRatio,
      duration: input.durationSeconds,
      fps: input.fps,
    },
    5
  );

  return {
    operationName: `replicate:${prediction.id}`,
    model: prediction?.model || getEnv('REPLICATE_VIDEO_MODEL') || 'wavespeedai/wan-2.1-i2v-480p',
    status: prediction?.status === 'succeeded' ? 'done' : 'in_progress',
  };
};

const startRunwayVideoGeneration = async (input: {
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
  aspectRatio: '16:9' | '9:16';
  durationSeconds: number;
}) => {
  const ratio = input.aspectRatio === '9:16' ? '720:1280' : '1280:720';
  const endpoint = input.imageBase64
    ? 'https://api.dev.runwayml.com/v1/image_to_video'
    : 'https://api.dev.runwayml.com/v1/text_to_video';

  const task = await fetchJson(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getRunwayKey()}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': getEnv('RUNWAY_API_VERSION') || '2024-11-06',
    },
    body: JSON.stringify({
      model: getEnv('RUNWAY_VIDEO_MODEL') || (input.imageBase64 ? 'veo3.1' : 'gen4.5'),
      promptText: input.prompt,
      ...(input.imageBase64
        ? {
            promptImage: `data:${input.mimeType || 'image/png'};base64,${input.imageBase64}`,
          }
        : {}),
      ratio,
      duration: input.durationSeconds,
    }),
  });

  return {
    operationName: `runway:${task.id}`,
    model: getEnv('RUNWAY_VIDEO_MODEL') || (input.imageBase64 ? 'veo3.1' : 'gen4.5'),
    status: 'in_progress' as const,
  };
};

const startVideoProviderSequence = async (input: {
  toolId: string;
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
  aspectRatio: '16:9' | '9:16';
  durationSeconds: number;
  fps: number;
  resolution: string;
  style?: string;
  cameraMotion?: string;
}): Promise<ProviderResult<VideoStartResponse>> => {
  const providers = getAvailableProviders(input.toolId, 'video');
  if (providers.length === 0) {
    throw new Error('No video generation provider is configured. Add a Veo, Replicate, or Runway API key.');
  }

  const prompt = buildEnhancedPrompt({
    rawPrompt: sanitizePrompt(input.prompt),
    toolId: input.toolId,
    style: input.style,
    cameraMotion: input.cameraMotion,
    aspectRatio: input.aspectRatio,
  });

  let lastError: unknown = null;
  for (let index = 0; index < providers.length; index += 1) {
    const provider = providers[index];
    try {
      if (provider === 'gemini') {
        const result = await startGeminiVideoGeneration({
          prompt,
          imageBase64: input.imageBase64,
          mimeType: input.mimeType,
          aspectRatio: input.aspectRatio,
          durationSeconds: input.durationSeconds,
          fps: input.fps,
          resolution: input.resolution,
        });

        return {
          data: {
            operationName: result.operationName,
            model: result.model,
            status: result.status,
            aspectRatio: input.aspectRatio,
            resolution: input.resolution,
            numberOfVideos: 1,
          },
          provider,
          model: result.model,
          fallbackUsed: index > 0,
          providerChain: providers,
        };
      }

      if (provider === 'replicate') {
        const result = await startReplicateVideoGeneration({
          prompt,
          imageBase64: input.imageBase64,
          mimeType: input.mimeType,
          aspectRatio: input.aspectRatio,
          durationSeconds: input.durationSeconds,
          fps: input.fps,
        });

        return {
          data: {
            operationName: result.operationName,
            model: result.model,
            status: result.status,
            aspectRatio: input.aspectRatio,
            resolution: input.resolution,
            numberOfVideos: 1,
          },
          provider,
          model: result.model,
          fallbackUsed: index > 0,
          providerChain: providers,
          notice: 'Primary generation engine was busy. Switched to Replicate video.',
        };
      }

      if (provider === 'runway') {
        const result = await startRunwayVideoGeneration({
          prompt,
          imageBase64: input.imageBase64,
          mimeType: input.mimeType,
          aspectRatio: input.aspectRatio,
          durationSeconds: input.durationSeconds,
        });

        return {
          data: {
            operationName: result.operationName,
            model: result.model,
            status: result.status,
            aspectRatio: input.aspectRatio,
            resolution: input.resolution,
            numberOfVideos: 1,
          },
          provider,
          model: result.model,
          fallbackUsed: index > 0,
          providerChain: providers,
          notice: 'Primary generation engine was busy. Switched to Runway.',
        };
      }
    } catch (error) {
      lastError = error;
      if (!shouldFallbackProvider(error) || index === providers.length - 1) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('Video generation failed.');
};

const pollReplicateVideo = async (predictionId: string): Promise<VideoPollResponse> => {
  const prediction = await fetchJson(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: {
      Authorization: `Bearer ${getReplicateKey()}`,
    },
  });

  if (!['succeeded', 'failed', 'canceled'].includes(prediction?.status)) {
    return {
      status: 'in_progress',
      operationName: `replicate:${predictionId}`,
      progressMessage: 'Replicate is still rendering the video.',
    };
  }

  if (prediction?.status !== 'succeeded') {
    throw new Error(prediction?.error || 'Replicate video generation failed.');
  }

  const output = Array.isArray(prediction?.output) ? prediction.output[0] : prediction?.output;
  if (!isNonEmptyString(output)) {
    throw new Error('Replicate returned no video output URL.');
  }

  const binary = await fetchBinaryAsBase64(output);
  return {
    status: 'done',
    operationName: `replicate:${predictionId}`,
    videoBase64: binary.base64,
    mimeType: binary.mimeType,
  };
};

const pollRunwayVideo = async (taskId: string): Promise<VideoPollResponse> => {
  const task = await fetchJson(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${getRunwayKey()}`,
      'X-Runway-Version': getEnv('RUNWAY_API_VERSION') || '2024-11-06',
    },
  });

  if (task?.status !== 'SUCCEEDED') {
    if (task?.status === 'FAILED' || task?.status === 'CANCELED') {
      throw new Error(task?.failure || 'Runway video generation failed.');
    }

    return {
      status: 'in_progress',
      operationName: `runway:${taskId}`,
      progressMessage: 'Runway is still generating the video.',
    };
  }

  const outputUrl = Array.isArray(task?.output) ? task.output[0] : undefined;
  if (!isNonEmptyString(outputUrl)) {
    throw new Error('Runway returned no video output URL.');
  }

  const binary = await fetchBinaryAsBase64(outputUrl);
  return {
    status: 'done',
    operationName: `runway:${taskId}`,
    videoBase64: binary.base64,
    mimeType: binary.mimeType,
  };
};

const toHistoryLines = (history: any[] | undefined) => {
  if (!Array.isArray(history)) {
    return [];
  }
  return history
    .slice(-12)
    .map((item) => {
      const role = item?.role === 'user' ? 'User' : 'Assistant';
      const text = isNonEmptyString(item?.text) ? item.text.trim() : '';
      return text ? `${role}: ${text}` : '';
    })
    .filter(Boolean);
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    json(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const body: ReqBody = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const action = body.action || '';
    const payload = body.payload || {};

    if (!action) {
      json(res, 400, { ok: false, error: 'Missing action' });
      return;
    }

    if (action === 'getPlatformAudit') {
      json(res, 200, {
        ok: true,
        data: {
          tools: TOOL_DEFINITIONS,
          audit: PLATFORM_AUDIT_ROWS,
          creditConfig: CREDIT_CONFIG,
        },
      });
      return;
    }

    const cacheableActions = new Set(['generateSkillContent', 'generateFastText', 'generateImage', 'analyzeSmartLink']);
    const cacheKey = getCacheKey(action, payload);
    if (cacheableActions.has(action)) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        json(res, 200, {
          ok: true,
          data: cached.data,
          meta: {
            ...cached.meta,
            cached: true,
          },
        });
        return;
      }
    }

    if (action === 'generateSkillContent') {
      const skillName = sanitizePrompt(payload.skillName || 'Freelance Skill');
      const preferredLanguage = sanitizePrompt(payload.preferredLanguage || 'English');
      const prompt = `Create a practical beginner-friendly course for ${skillName}.
Preferred language: ${preferredLanguage}.
Return only strict JSON with:
{
  "skillName": string,
  "subPages": [{
    "title": string,
    "imageSuggestion": string,
    "motionStoryboard": string,
    "content": []
  }]
}
Generate 8 subPages. Each page should feel like a creator-led lesson, include compact explanations, and contain at least one interactive block such as quiz, poll, qAndA, doAndDont, or flashcard.`;

      const result = await runTextProviderSequence({
        toolId: 'course-generator',
        prompt,
        outputFormat: 'json',
        responseMimeType: 'application/json',
        temperature: 0.6,
        maxOutputTokens: 4000,
      });

      let jsonText = result.data.text || '{}';
      if (!jsonText.trim().startsWith('{')) {
        jsonText = '{}';
      }

      const meta = buildToolMeta('course-generator', result);
      setCachedResponse(cacheKey, { jsonText }, meta, 20 * 60_000);
      json(res, 200, { ok: true, data: { jsonText }, meta });
      return;
    }

    if (action === 'generateFastText') {
      const toolId = isNonEmptyString(payload.toolId) ? payload.toolId : 'rocket-writer';
      const result = await runTextProviderSequence({
        toolId,
        prompt: sanitizePrompt(payload.prompt),
        tone: sanitizePrompt(payload.tone),
        length: sanitizePrompt(payload.length),
        outputFormat: sanitizePrompt(payload.outputFormat),
        temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.6,
        maxOutputTokens: typeof payload.maxOutputTokens === 'number' ? payload.maxOutputTokens : 1800,
      });

      const meta = buildToolMeta(toolId, result);
      setCachedResponse(cacheKey, { text: result.data.text }, meta, 10 * 60_000);
      json(res, 200, { ok: true, data: { text: result.data.text }, meta });
      return;
    }

    if (action === 'askQna') {
      const message = sanitizePrompt(payload.message);
      const languageName = sanitizePrompt(payload.languageName || 'English');
      const history = toHistoryLines(payload.history);
      const prompt = `You are AI Buddy, a practical assistant for freelancers.
Preferred language: ${languageName}.
Use search when fresh information is needed.

Conversation so far:
${history.join('\n')}

User question:
${message}`;

      const result = await runTextProviderSequence({
        toolId: 'qna-bot',
        prompt,
        temperature: 0.4,
        maxOutputTokens: 1200,
      });

      let sources: Array<{ uri: string; title: string }> = [];
      if (result.provider === 'gemini' && getGoogleApiKey()) {
        const ai = getAi();
        const response = await ai.models.generateContent({
          model: TEXT_MODELS[0],
          contents: prompt,
          config: { tools: [{ googleSearch: {} }], temperature: 0.4, maxOutputTokens: 1200 },
        });
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        sources = groundingChunks
          .map((chunk: any) => chunk?.web)
          .filter((web: any) => web?.uri && web?.title)
          .map((web: any) => ({ uri: web.uri, title: web.title }))
          .filter((entry: any, index: number, array: any[]) => array.findIndex((item) => item.uri === entry.uri) === index);
      }

      json(res, 200, {
        ok: true,
        data: {
          text: result.data.text,
          sources,
        },
        meta: buildToolMeta('qna-bot', result),
      });
      return;
    }

    if (action === 'generateImage') {
      const toolId = isNonEmptyString(payload.toolId) ? payload.toolId : 'image-generator';
      const result = await runImageProviderSequence({
        toolId,
        prompt: sanitizePrompt(payload.prompt),
        imageSize: payload.imageSize === '2K' || payload.imageSize === '4K' ? payload.imageSize : '1K',
        aspectRatio:
          payload.aspectRatio === '16:9' || payload.aspectRatio === '9:16' ? payload.aspectRatio : '1:1',
        style: sanitizePrompt(payload.style),
        sourceImageBase64: isNonEmptyString(payload.sourceImageBase64) ? payload.sourceImageBase64 : undefined,
        sourceImageMimeType: isNonEmptyString(payload.sourceImageMimeType) ? payload.sourceImageMimeType : undefined,
      });

      const meta = buildToolMeta(toolId, result);
      setCachedResponse(cacheKey, result.data, meta, 15 * 60_000);
      json(res, 200, { ok: true, data: result.data, meta });
      return;
    }

    if (action === 'analyzeImage') {
      const ai = getAi();
      const prompt = buildEnhancedPrompt({
        rawPrompt: sanitizePrompt(payload.prompt),
        toolId: 'image-analyzer',
      });
      const { result, model } = await runWithModelFallback(ANALYSIS_MODELS, (selectedModel) =>
        ai.models.generateContent({
          model: selectedModel,
          contents: {
            parts: [
              { text: prompt },
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
      const providerResult: ProviderResult<{ text: string }> = {
        data: { text: result.text || '' },
        provider: 'gemini',
        model,
        fallbackUsed: false,
        providerChain: ['gemini'],
      };
      json(res, 200, { ok: true, data: providerResult.data, meta: buildToolMeta('image-analyzer', providerResult) });
      return;
    }

    if (action === 'analyzeVideo') {
      const ai = getAi();
      const prompt = buildEnhancedPrompt({
        rawPrompt: sanitizePrompt(payload.prompt),
        toolId: 'video-analyzer',
      });
      const { result, model } = await runWithModelFallback(ANALYSIS_MODELS, (selectedModel) =>
        ai.models.generateContent({
          model: selectedModel,
          contents: {
            parts: [
              { text: prompt },
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
      const providerResult: ProviderResult<{ text: string }> = {
        data: { text: result.text || '' },
        provider: 'gemini',
        model,
        fallbackUsed: false,
        providerChain: ['gemini'],
      };
      json(res, 200, { ok: true, data: providerResult.data, meta: buildToolMeta('video-analyzer', providerResult) });
      return;
    }

    if (action === 'generateSpeech') {
      const ai = getAi();
      const { result, model } = await runWithModelFallback(TTS_MODELS, (selectedModel) =>
        ai.models.generateContent({
          model: selectedModel,
          contents: [{ parts: [{ text: `Read this clearly in a helpful voice: ${sanitizePrompt(payload.text)}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: getEnv('GEMINI_TTS_VOICE') || 'Kore',
                },
              },
            },
          } as any,
        })
      );

      const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
      const providerResult: ProviderResult<{ base64Audio: string }> = {
        data: { base64Audio },
        provider: 'gemini',
        model,
        fallbackUsed: false,
        providerChain: ['gemini'],
      };
      json(res, 200, { ok: true, data: providerResult.data, meta: buildToolMeta('rocket-writer', providerResult) });
      return;
    }

    if (action === 'analyzeSmartLink') {
      const url = String(payload.url || '').trim();
      if (!url.startsWith('http')) {
        json(res, 400, { ok: false, error: 'Valid HTTP URL required' });
        return;
      }

      const metadata = await getPageMetadata(url);
      const prompt = `You are the Smart Link Intelligence Engine.
Analyze this link and return strict JSON with content_type, intent_category, difficulty_level, primary_topic, tags, short_summary, detailed_summary, key_insights, tools_mentioned, methods_frameworks, action_steps, utility_score, learning_value_score, actionability_score, related_topics, knowledge_cluster, duplicate_status, recommendation.

URL: ${url}
Title: ${metadata.title}
Description: ${metadata.description}
Author: ${metadata.author || 'Unknown'}
Text: ${metadata.text.slice(0, 4000)}
User note: ${sanitizePrompt(payload.note)}
Intent: ${sanitizePrompt(payload.intent)}`;

      const result = await runTextProviderSequence({
        toolId: 'smart-link-hub',
        prompt,
        outputFormat: 'json',
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 1800,
      });

      let parsedData: any = {};
      try {
        parsedData = JSON.parse(result.data.text || '{}');
      } catch {
        parsedData = {};
      }

      const meta = buildToolMeta('smart-link-hub', result);
      setCachedResponse(cacheKey, parsedData, meta, 30 * 60_000);
      json(res, 200, { ok: true, data: parsedData, meta });
      return;
    }

    if (action === 'animateImage' || action === 'startVideoGeneration') {
      const toolId = isNonEmptyString(payload.toolId) ? payload.toolId : 'image-animator';
      const result = await startVideoProviderSequence({
        toolId,
        prompt: sanitizePrompt(payload.prompt),
        imageBase64: isNonEmptyString(payload.imageBase64) ? payload.imageBase64 : undefined,
        mimeType: isNonEmptyString(payload.mimeType) ? payload.mimeType : undefined,
        aspectRatio: normalizeAspectRatio(payload.aspectRatio),
        durationSeconds: Math.max(3, Math.min(12, Number(payload.videoDuration || 5))),
        fps: Math.max(12, Math.min(30, Number(payload.fps || 24))),
        resolution: isNonEmptyString(payload.resolution) ? payload.resolution : '720p',
        style: sanitizePrompt(payload.style),
        cameraMotion: sanitizePrompt(payload.cameraMotion),
      });

      json(res, 200, { ok: true, data: result.data, meta: buildToolMeta(toolId, result) });
      return;
    }

    if (action === 'pollVideoGeneration') {
      const operationName = String(payload.operationName || '');
      if (!operationName) {
        json(res, 400, { ok: false, error: 'Missing operation name' });
        return;
      }

      if (operationName.startsWith('replicate:')) {
        json(res, 200, { ok: true, data: await pollReplicateVideo(operationName.replace('replicate:', '')) });
        return;
      }

      if (operationName.startsWith('runway:')) {
        json(res, 200, { ok: true, data: await pollRunwayVideo(operationName.replace('runway:', '')) });
        return;
      }

      const ai = getAi();
      const operation = await (ai.operations as any).getVideosOperation({
        operation: { name: operationName },
      });

      if (!operation.done) {
        json(res, 200, {
          ok: true,
          data: {
            status: 'in_progress',
            operationName: operation.name || operationName,
            progressMessage: 'Video generation is still running. Please keep this tab open.',
          },
        });
        return;
      }

      if (operation.error) {
        throw new Error(JSON.stringify(operation.error));
      }

      const generatedVideo = operation.response?.generatedVideos?.[0];
      const downloadLink = generatedVideo?.video?.uri;
      if (!downloadLink) {
        throw new Error('Video generated but download link was unavailable.');
      }

      const downloadUrl = new URL(downloadLink);
      downloadUrl.searchParams.set('key', getGoogleApiKey());
      const binary = await fetchBinaryAsBase64(downloadUrl);

      json(res, 200, {
        ok: true,
        data: {
          status: 'done',
          operationName: operation.name || operationName,
          videoBase64: binary.base64,
          mimeType: generatedVideo?.video?.mimeType || binary.mimeType || 'video/mp4',
        },
      });
      return;
    }

    json(res, 400, { ok: false, error: 'Unknown action' });
  } catch (error) {
    const payload = buildServerErrorPayload(error);
    json(res, payload.status || 500, {
      ok: false,
      error: payload.message,
      quotaInfo: payload.quotaInfo,
    });
  }
}

