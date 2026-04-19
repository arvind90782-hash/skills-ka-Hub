import { TOOLS } from '../constants';
import type { Tool } from '../types';

export type ToolCategory =
  | 'text-generation-tools'
  | 'image-generation-tools'
  | 'video-generation-tools'
  | 'audio-generation-tools'
  | 'prompt-generation-tools'
  | 'code-generation-tools'
  | 'image-editing-tools'
  | 'utility-ai-tools';

export type ToolGenerationType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'prompt'
  | 'code'
  | 'image-analysis'
  | 'video-analysis'
  | 'knowledge'
  | 'course'
  | 'utility';

export type ToolEngine =
  | 'gemini-llm'
  | 'gemini-image'
  | 'gemini-video'
  | 'gemini-audio'
  | 'gemini-vision'
  | 'gemini-video-understanding'
  | 'local-runtime';

export type ToolProvider =
  | 'gemini'
  | 'openrouter'
  | 'together'
  | 'huggingface'
  | 'stability'
  | 'replicate'
  | 'runway'
  | 'local';

type DetectionSignals = {
  uiLabels: string[];
  inputFields: string[];
  buttonLabels: string[];
  expectedOutputs: string[];
};

export interface ToolDefinition extends Tool {
  category: ToolCategory;
  generationType: ToolGenerationType;
  requiredAiEngine: ToolEngine;
  requiredApi: string;
  primaryProvider: ToolProvider;
  fallbackProviders: ToolProvider[];
  creditsRequired: number;
  estimatedCostUsd: number;
  requiresBackend: boolean;
  supportsPromptEnhancement: boolean;
  detectionSignals: DetectionSignals;
}

export interface PlatformAuditRow {
  toolName: string;
  toolType: ToolGenerationType;
  requiredAiEngine: ToolEngine;
  requiredApi: string;
  expectedOutput: string;
  missingRisk: string;
}

const USD_PER_CREDIT = 0.01;

const CATEGORY_RULES: Array<{
  category: ToolCategory;
  generationType: ToolGenerationType;
  keywords: string[];
}> = [
  {
    category: 'video-generation-tools',
    generationType: 'video',
    keywords: ['video', 'animate', 'animation', 'scene', 'cinematic', 'veo', 'camera motion', 'fps'],
  },
  {
    category: 'image-generation-tools',
    generationType: 'image',
    keywords: ['image', 'photo', 'visual', 'thumbnail', 'style', 'aspect ratio', 'resolution'],
  },
  {
    category: 'audio-generation-tools',
    generationType: 'audio',
    keywords: ['audio', 'voice', 'speech', 'tts', 'sound'],
  },
  {
    category: 'code-generation-tools',
    generationType: 'code',
    keywords: ['code', 'bug', 'refactor', 'snippet', 'developer'],
  },
  {
    category: 'prompt-generation-tools',
    generationType: 'prompt',
    keywords: ['prompt', 'hook', 'viral', 'brainstorm', 'caption', 'idea', 'calendar', 'strategy'],
  },
  {
    category: 'image-editing-tools',
    generationType: 'image-analysis',
    keywords: ['analyze image', 'image insight', 'image review', 'photo review'],
  },
  {
    category: 'utility-ai-tools',
    generationType: 'video-analysis',
    keywords: ['video analysis', 'detective', 'insights', 'knowledge', 'download', 'link', 'tracker', 'calculator'],
  },
  {
    category: 'text-generation-tools',
    generationType: 'text',
    keywords: ['write', 'writer', 'essay', 'report', 'resume', 'proposal', 'email', 'story', 'article', 'script'],
  },
];

const TOOL_SIGNAL_OVERRIDES: Record<string, Partial<DetectionSignals>> = {
  'secret-creator-lab': {
    uiLabels: ['premium prompts', 'creator ideas', 'prompt generator'],
    inputFields: ['creator brief', 'video topic'],
    buttonLabels: ['generate prompt'],
    expectedOutputs: ['optimized creator prompts'],
  },
  'ultra-tools': {
    uiLabels: ['viral video brain', 'thumbnail psychology', 'creator idea engine', 'edit planner ai'],
    inputFields: ['idea', 'topic', 'niche'],
    buttonLabels: ['generate'],
    expectedOutputs: ['structured prompt packs', 'creator strategy output'],
  },
  'qna-bot': {
    uiLabels: ['ask ai', 'search powered assistant'],
    inputFields: ['question', 'chat message'],
    buttonLabels: ['send'],
    expectedOutputs: ['search-backed answers'],
  },
  'image-generator': {
    uiLabels: ['image ai', 'style generation'],
    inputFields: ['prompt', 'aspect ratio', 'resolution', 'style'],
    buttonLabels: ['generate image'],
    expectedOutputs: ['generated image asset'],
  },
  'rocket-writer': {
    uiLabels: ['writer', 'copywriter', 'caption generator'],
    inputFields: ['prompt', 'tone', 'length'],
    buttonLabels: ['generate copy'],
    expectedOutputs: ['structured text output'],
  },
  'image-analyzer': {
    uiLabels: ['visual intelligence', 'image insights'],
    inputFields: ['image upload', 'question'],
    buttonLabels: ['analyze'],
    expectedOutputs: ['image analysis report'],
  },
  'video-analyzer': {
    uiLabels: ['video insights', 'video detective'],
    inputFields: ['video upload', 'question'],
    buttonLabels: ['analyze'],
    expectedOutputs: ['video summary and insights'],
  },
  'image-animator': {
    uiLabels: ['image to video', 'animate photo'],
    inputFields: ['image upload', 'prompt', 'duration', 'fps', 'resolution', 'camera motion'],
    buttonLabels: ['generate video'],
    expectedOutputs: ['animated video output'],
  },
  'media-downloader': {
    uiLabels: ['download media'],
    inputFields: ['url', 'quality'],
    buttonLabels: ['download'],
    expectedOutputs: ['downloaded file'],
  },
  'resume-cover-letter': {
    uiLabels: ['resume builder', 'cover letter'],
    inputFields: ['role', 'experience', 'skills', 'achievements', 'tone'],
    buttonLabels: ['generate resume'],
    expectedOutputs: ['resume and cover letter'],
  },
  'proposal-writer': {
    uiLabels: ['proposal writer', 'client proposal'],
    inputFields: ['client brief', 'budget', 'timeline'],
    buttonLabels: ['generate proposal'],
    expectedOutputs: ['proposal draft'],
  },
  'invoice-quotation': {
    uiLabels: ['invoice', 'quotation'],
    inputFields: ['line items', 'tax', 'client'],
    buttonLabels: ['generate invoice'],
    expectedOutputs: ['invoice document'],
  },
  'contract-generator': {
    uiLabels: ['contract', 'agreement'],
    inputFields: ['service scope', 'fees', 'timeline'],
    buttonLabels: ['generate contract'],
    expectedOutputs: ['contract draft'],
  },
  'portfolio-builder': {
    uiLabels: ['portfolio', 'case study'],
    inputFields: ['projects', 'audience', 'results'],
    buttonLabels: ['generate portfolio copy'],
    expectedOutputs: ['portfolio case study'],
  },
  'thumbnail-hook-generator': {
    uiLabels: ['thumbnail', 'hook', 'prompt'],
    inputFields: ['topic', 'audience', 'platform'],
    buttonLabels: ['generate hooks'],
    expectedOutputs: ['thumbnail text and prompt ideas'],
  },
  'seo-blog-toolkit': {
    uiLabels: ['seo', 'blog toolkit', 'outline'],
    inputFields: ['keyword', 'country', 'niche'],
    buttonLabels: ['generate seo plan'],
    expectedOutputs: ['seo outline and meta content'],
  },
  'social-calendar': {
    uiLabels: ['content calendar', 'social ideas', 'captions'],
    inputFields: ['niche', 'platforms', 'days'],
    buttonLabels: ['generate calendar'],
    expectedOutputs: ['social calendar'],
  },
  'meeting-action-items': {
    uiLabels: ['meeting notes', 'action items'],
    inputFields: ['meeting transcript', 'notes'],
    buttonLabels: ['generate action items'],
    expectedOutputs: ['task summary'],
  },
  'email-assistant': {
    uiLabels: ['email writer', 'follow-up email'],
    inputFields: ['context', 'tone', 'email type'],
    buttonLabels: ['generate email'],
    expectedOutputs: ['email draft'],
  },
  'pricing-calculator': {
    uiLabels: ['pricing calculator'],
    inputFields: ['target income', 'hours'],
    buttonLabels: ['calculate'],
    expectedOutputs: ['pricing estimate'],
  },
  'file-converter': {
    uiLabels: ['image convert', 'file converter'],
    inputFields: ['image upload', 'format', 'quality'],
    buttonLabels: ['convert'],
    expectedOutputs: ['converted file'],
  },
  'code-bug-finder': {
    uiLabels: ['code bug finder', 'refactor'],
    inputFields: ['issue', 'code snippet'],
    buttonLabels: ['analyze code'],
    expectedOutputs: ['bug report and refactor guidance'],
  },
  'interview-prep-bot': {
    uiLabels: ['interview prep', 'mock interview'],
    inputFields: ['role', 'level', 'background'],
    buttonLabels: ['generate prep plan'],
    expectedOutputs: ['interview plan'],
  },
  'habit-sprint-tracker': {
    uiLabels: ['habit tracker', 'sprint tracker'],
    inputFields: ['task list'],
    buttonLabels: ['add task'],
    expectedOutputs: ['tracked tasks'],
  },
  'smart-link-hub': {
    uiLabels: ['knowledge engine', 'smart link'],
    inputFields: ['url', 'note', 'intent'],
    buttonLabels: ['analyze link'],
    expectedOutputs: ['structured knowledge summary'],
  },
};

const TOOL_RUNTIME_OVERRIDES: Record<
  string,
  Partial<
    Pick<
      ToolDefinition,
      | 'category'
      | 'generationType'
      | 'requiredAiEngine'
      | 'requiredApi'
      | 'primaryProvider'
      | 'fallbackProviders'
      | 'creditsRequired'
      | 'requiresBackend'
      | 'supportsPromptEnhancement'
    >
  >
> = {
  'secret-creator-lab': {
    category: 'prompt-generation-tools',
    generationType: 'prompt',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'ultra-tools': {
    category: 'prompt-generation-tools',
    generationType: 'prompt',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'qna-bot': {
    category: 'text-generation-tools',
    generationType: 'knowledge',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini + Google Search grounding',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'image-generator': {
    category: 'image-generation-tools',
    generationType: 'image',
    requiredAiEngine: 'gemini-image',
    requiredApi: 'Gemini Image Generation',
    primaryProvider: 'gemini',
    fallbackProviders: ['stability', 'replicate', 'huggingface'],
    creditsRequired: 5,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'rocket-writer': {
    category: 'text-generation-tools',
    generationType: 'text',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'image-analyzer': {
    category: 'utility-ai-tools',
    generationType: 'image-analysis',
    requiredAiEngine: 'gemini-vision',
    requiredApi: 'Gemini Vision',
    primaryProvider: 'gemini',
    fallbackProviders: [],
    creditsRequired: 2,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'video-analyzer': {
    category: 'utility-ai-tools',
    generationType: 'video-analysis',
    requiredAiEngine: 'gemini-video-understanding',
    requiredApi: 'Gemini Video Understanding',
    primaryProvider: 'gemini',
    fallbackProviders: [],
    creditsRequired: 4,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'image-animator': {
    category: 'video-generation-tools',
    generationType: 'video',
    requiredAiEngine: 'gemini-video',
    requiredApi: 'Google Veo / Flow-compatible video generation',
    primaryProvider: 'gemini',
    fallbackProviders: ['replicate', 'runway'],
    creditsRequired: 25,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'media-downloader': {
    category: 'utility-ai-tools',
    generationType: 'utility',
    requiredAiEngine: 'local-runtime',
    requiredApi: 'Secure server downloader',
    primaryProvider: 'local',
    fallbackProviders: [],
    creditsRequired: 0,
    requiresBackend: true,
    supportsPromptEnhancement: false,
  },
  'resume-cover-letter': {
    category: 'text-generation-tools',
    generationType: 'text',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'proposal-writer': {
    category: 'text-generation-tools',
    generationType: 'text',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'invoice-quotation': {
    category: 'utility-ai-tools',
    generationType: 'utility',
    requiredAiEngine: 'local-runtime',
    requiredApi: 'Local invoice composer',
    primaryProvider: 'local',
    fallbackProviders: [],
    creditsRequired: 0,
    requiresBackend: false,
    supportsPromptEnhancement: false,
  },
  'contract-generator': {
    category: 'text-generation-tools',
    generationType: 'text',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'portfolio-builder': {
    category: 'text-generation-tools',
    generationType: 'text',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'thumbnail-hook-generator': {
    category: 'prompt-generation-tools',
    generationType: 'prompt',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'seo-blog-toolkit': {
    category: 'text-generation-tools',
    generationType: 'text',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'social-calendar': {
    category: 'prompt-generation-tools',
    generationType: 'prompt',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'meeting-action-items': {
    category: 'text-generation-tools',
    generationType: 'text',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'email-assistant': {
    category: 'text-generation-tools',
    generationType: 'text',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'pricing-calculator': {
    category: 'utility-ai-tools',
    generationType: 'utility',
    requiredAiEngine: 'local-runtime',
    requiredApi: 'Local pricing calculator',
    primaryProvider: 'local',
    fallbackProviders: [],
    creditsRequired: 0,
    requiresBackend: false,
    supportsPromptEnhancement: false,
  },
  'file-converter': {
    category: 'image-editing-tools',
    generationType: 'utility',
    requiredAiEngine: 'local-runtime',
    requiredApi: 'Local browser conversion',
    primaryProvider: 'local',
    fallbackProviders: [],
    creditsRequired: 0,
    requiresBackend: false,
    supportsPromptEnhancement: false,
  },
  'code-bug-finder': {
    category: 'code-generation-tools',
    generationType: 'code',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'interview-prep-bot': {
    category: 'text-generation-tools',
    generationType: 'text',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter', 'together', 'huggingface'],
    creditsRequired: 1,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
  'habit-sprint-tracker': {
    category: 'utility-ai-tools',
    generationType: 'utility',
    requiredAiEngine: 'local-runtime',
    requiredApi: 'Local task storage',
    primaryProvider: 'local',
    fallbackProviders: [],
    creditsRequired: 0,
    requiresBackend: false,
    supportsPromptEnhancement: false,
  },
  'smart-link-hub': {
    category: 'utility-ai-tools',
    generationType: 'knowledge',
    requiredAiEngine: 'gemini-llm',
    requiredApi: 'Google Gemini + page metadata fetch',
    primaryProvider: 'gemini',
    fallbackProviders: ['openrouter'],
    creditsRequired: 2,
    requiresBackend: true,
    supportsPromptEnhancement: true,
  },
};

const DEFAULT_ENGINE_BY_TYPE: Record<ToolGenerationType, ToolEngine> = {
  text: 'gemini-llm',
  image: 'gemini-image',
  video: 'gemini-video',
  audio: 'gemini-audio',
  prompt: 'gemini-llm',
  code: 'gemini-llm',
  'image-analysis': 'gemini-vision',
  'video-analysis': 'gemini-video-understanding',
  knowledge: 'gemini-llm',
  course: 'gemini-llm',
  utility: 'local-runtime',
};

const DEFAULT_API_BY_TYPE: Record<ToolGenerationType, string> = {
  text: 'Google Gemini',
  image: 'Gemini Image Generation',
  video: 'Google Veo / Flow-compatible video generation',
  audio: 'Gemini TTS',
  prompt: 'Google Gemini',
  code: 'Google Gemini',
  'image-analysis': 'Gemini Vision',
  'video-analysis': 'Gemini Video Understanding',
  knowledge: 'Google Gemini',
  course: 'Google Gemini',
  utility: 'Local runtime',
};

const DEFAULT_PROVIDER_BY_TYPE: Record<ToolGenerationType, ToolProvider> = {
  text: 'gemini',
  image: 'gemini',
  video: 'gemini',
  audio: 'gemini',
  prompt: 'gemini',
  code: 'gemini',
  'image-analysis': 'gemini',
  'video-analysis': 'gemini',
  knowledge: 'gemini',
  course: 'gemini',
  utility: 'local',
};

const DEFAULT_FALLBACKS_BY_TYPE: Record<ToolGenerationType, ToolProvider[]> = {
  text: ['openrouter', 'together', 'huggingface'],
  image: ['stability', 'replicate', 'huggingface'],
  video: ['replicate', 'runway'],
  audio: ['huggingface'],
  prompt: ['openrouter', 'together', 'huggingface'],
  code: ['openrouter', 'together', 'huggingface'],
  'image-analysis': [],
  'video-analysis': [],
  knowledge: ['openrouter'],
  course: ['openrouter', 'together'],
  utility: [],
};

const DEFAULT_CREDITS_BY_TYPE: Record<ToolGenerationType, number> = {
  text: 1,
  image: 5,
  video: 25,
  audio: 3,
  prompt: 1,
  code: 1,
  'image-analysis': 2,
  'video-analysis': 4,
  knowledge: 2,
  course: 2,
  utility: 0,
};

const getSignals = (tool: Tool): DetectionSignals => {
  const override = TOOL_SIGNAL_OVERRIDES[tool.id];
  return {
    uiLabels: override?.uiLabels ?? [tool.name],
    inputFields: override?.inputFields ?? ['prompt'],
    buttonLabels: override?.buttonLabels ?? ['generate'],
    expectedOutputs: override?.expectedOutputs ?? [tool.description],
  };
};

const scoreCategory = (sourceText: string, keywords: string[]) =>
  keywords.reduce((score, keyword) => (sourceText.includes(keyword) ? score + keyword.length : score), 0);

export const classifyToolBySignals = (tool: Tool): { category: ToolCategory; generationType: ToolGenerationType } => {
  const signals = getSignals(tool);
  const sourceText = [
    tool.id,
    tool.name,
    tool.description,
    tool.path,
    ...signals.uiLabels,
    ...signals.inputFields,
    ...signals.buttonLabels,
    ...signals.expectedOutputs,
  ]
    .join(' ')
    .toLowerCase();

  const ranked = CATEGORY_RULES.map((rule) => ({
    category: rule.category,
    generationType: rule.generationType,
    score: scoreCategory(sourceText, rule.keywords),
  })).sort((a, b) => b.score - a.score);

  const top = ranked[0];
  if (!top || top.score === 0) {
    return {
      category: 'utility-ai-tools',
      generationType: 'utility',
    };
  }

  return {
    category: top.category,
    generationType: top.generationType,
  };
};

const enrichTool = (tool: Tool): ToolDefinition => {
  const detected = classifyToolBySignals(tool);
  const override = TOOL_RUNTIME_OVERRIDES[tool.id];
  const generationType = override?.generationType ?? detected.generationType;
  const category = override?.category ?? detected.category;
  const creditsRequired = override?.creditsRequired ?? DEFAULT_CREDITS_BY_TYPE[generationType];

  return {
    ...tool,
    category,
    generationType,
    requiredAiEngine: override?.requiredAiEngine ?? DEFAULT_ENGINE_BY_TYPE[generationType],
    requiredApi: override?.requiredApi ?? DEFAULT_API_BY_TYPE[generationType],
    primaryProvider: override?.primaryProvider ?? DEFAULT_PROVIDER_BY_TYPE[generationType],
    fallbackProviders: override?.fallbackProviders ?? DEFAULT_FALLBACKS_BY_TYPE[generationType],
    creditsRequired,
    estimatedCostUsd: Number((creditsRequired * USD_PER_CREDIT).toFixed(2)),
    requiresBackend: override?.requiresBackend ?? generationType !== 'utility',
    supportsPromptEnhancement: override?.supportsPromptEnhancement ?? generationType !== 'utility',
    detectionSignals: getSignals(tool),
  };
};

export const TOOL_DEFINITIONS: ToolDefinition[] = TOOLS.map(enrichTool);

export const TOOL_DEFINITION_MAP = new Map(TOOL_DEFINITIONS.map((tool) => [tool.id, tool]));

export const getToolDefinition = (toolId: string): ToolDefinition | undefined => TOOL_DEFINITION_MAP.get(toolId);

export const getCreditsForTool = (toolId: string): number => getToolDefinition(toolId)?.creditsRequired ?? 0;

export const groupToolDefinitionsByCategory = (): Record<ToolCategory, ToolDefinition[]> => {
  return TOOL_DEFINITIONS.reduce(
    (acc, tool) => {
      acc[tool.category].push(tool);
      return acc;
    },
    {
      'text-generation-tools': [],
      'image-generation-tools': [],
      'video-generation-tools': [],
      'audio-generation-tools': [],
      'prompt-generation-tools': [],
      'code-generation-tools': [],
      'image-editing-tools': [],
      'utility-ai-tools': [],
    } as Record<ToolCategory, ToolDefinition[]>
  );
};

export const PLATFORM_AUDIT_ROWS: PlatformAuditRow[] = TOOL_DEFINITIONS.map((tool) => ({
  toolName: tool.name,
  toolType: tool.generationType,
  requiredAiEngine: tool.requiredAiEngine,
  requiredApi: tool.requiredApi,
  expectedOutput: tool.detectionSignals.expectedOutputs.join(' | '),
  missingRisk:
    tool.primaryProvider === 'local'
      ? 'No AI backend required'
      : tool.fallbackProviders.length > 0
        ? `Primary ${tool.primaryProvider} with fallback to ${tool.fallbackProviders.join(', ')}`
        : `Primary ${tool.primaryProvider} only`,
}));

export const CREDIT_CONFIG = {
  usdPerCredit: USD_PER_CREDIT,
  startingBalance: 120,
};

