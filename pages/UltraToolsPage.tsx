import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Eye,
  Lightbulb,
  Film,
  TrendingUp,
  Sparkles,
  Target,
  Copy,
  Check,
  MessageSquare,
  Play,
} from 'lucide-react';
import { generateFastText } from '../services/geminiService';
import PageBackButton from '../components/PageBackButton';

type ToolCategory = {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  description: string;
};

const CATEGORIES: ToolCategory[] = [
  {
    id: 'viral-video-brain',
    name: 'Viral Video Brain',
    icon: Brain,
    color: 'from-red-500 to-pink-500',
    description: 'Generate a viral hook, full script, title ideas, thumbnail ideas, and retention tips.',
  },
  {
    id: 'thumbnail-psychology',
    name: 'Thumbnail Psychology',
    icon: Eye,
    color: 'from-amber-500 to-orange-500',
    description: 'Get the best colors, emotional triggers, click psychology, and layout ideas.',
  },
  {
    id: 'creator-idea-engine',
    name: 'Creator Idea Engine',
    icon: Lightbulb,
    color: 'from-purple-500 to-pink-500',
    description: 'Generate 30 viral content ideas, hooks, and captions for any niche.',
  },
  {
    id: 'edit-planner',
    name: 'Edit Planner AI',
    icon: Film,
    color: 'from-cyan-500 to-blue-500',
    description: 'Plan shots, transitions, sound design, pacing, and editing style from a raw idea.',
  },
  {
    id: 'viral-trend-scanner',
    name: 'Viral Trend Scanner',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500',
    description: 'Analyze trends and discover what content is currently gaining traction.',
  },
];

const buildPrompt = (toolId: string, userInput: string): string => {
  switch (toolId) {
    case 'viral-video-brain':
      return `You are a viral content strategist. User idea: "${userInput}"

Provide a clean English output with no markdown:

VIRAL HOOKS (2-3 options)
- Hook lines that grab attention in the first 3 seconds

FULL SCRIPT
- A 60-second reel script
- Intro (5 sec) -> Main Content (45 sec) -> CTA (10 sec)

VIRAL TITLES (3 options)
- YouTube/Instagram titles that create curiosity

THUMBNAIL IDEAS
- 3 thumbnail concepts with text overlays
- A color scheme suggestion

RETENTION TRICKS
- 3 specific tricks to keep viewers engaged`;

    case 'thumbnail-psychology':
      return `You are a thumbnail psychology expert and CTR specialist. Topic: "${userInput}"

Explain the following in English:

BEST COLORS
- Primary color palette
- Secondary accent colors
- Why these colors work for this topic

EMOTIONAL TRIGGERS
- Top 5 emotions to trigger
- How to show them in the thumbnail

CLICK PSYCHOLOGY
- Why people click on thumbnails like this
- Common mistakes to avoid

LAYOUT IDEAS
- 3 different layout compositions
- Text placement suggestions
- Face vs object placement

SIZE & STYLE
- Best aspect ratio
- Text size recommendations`;

    case 'creator-idea-engine':
      return `You are a content growth expert. Niche: "${userInput}"

Generate 30 viral content ideas in English:

Use this format for each idea:
Idea Number: [Hook/Caption/Format]

Categories:
- 10 trending format ideas
- 10 evergreen content ideas
- 10 quick short-form ideas

Keep each idea to 1-2 lines max.`;

    case 'edit-planner':
      return `You are a professional video editor. Raw idea: "${userInput}"

Explain the following in English:

SHOT LIST
- Detailed shot breakdown
- Camera angles to use
- Duration of each shot

TRANSITIONS
- Best transitions for this content
- When to use each transition

SOUND EFFECTS
- SFX recommendations
- Background music mood
- Where to add sound effects

PACING
- Scene duration guide
- Fast cuts vs slow cuts
- Energy flow throughout

EDITING STYLE
- Suggested editing style
- Color grading mood
- Motion graphics needs`;

    case 'viral-trend-scanner':
      return `You are a social media trend analyst. Niche/topic: "${userInput}"

Explain the following in English:

CURRENTLY TRENDING
- What type of content is viral right now
- Growing formats in this niche
- Rising topics

FORMAT ANALYSIS
- Which content formats are growing
- Short-form vs long-form trends
- Platform-specific trends

SUCCESS PATTERNS
- Common elements in viral content
- What works vs what does not
- Audience preferences

OPPORTUNITIES
- Untapped content angles
- Unique angles to try
- Gaps in the market

PREDICTIONS
- What is likely to trend next
- Upcoming topics
- Seasonal trends`;

    default:
      return `Topic: ${userInput}`;
  }
};

const UltraToolsPage: React.FC = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeCategory = CATEGORIES.find((category) => category.id === activeTool) || CATEGORIES[0];

  const generateOutput = async () => {
    if (!activeTool || !input.trim()) {
      return;
    }

    setLoading(true);
    setOutput(null);

    try {
      const prompt = buildPrompt(activeTool, input.trim());
      const stream = await generateFastText(prompt);
      let result = '';

      for await (const chunk of stream as AsyncIterable<{ text?: string }>) {
        if (chunk?.text) {
          result += chunk.text;
        }
      }

      setOutput(result.trim());
    } catch (error) {
      console.error('Generation error:', error);
      setOutput('There was a problem generating the output. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = async () => {
    if (!output) {
      return;
    }

    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-24">
      <PageBackButton label="Back" fallbackTo="/tools" />

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-card overflow-hidden border border-brand-accent/20 p-6 md:p-8"
      >
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-xs font-black uppercase tracking-[0.35em] text-brand-accent">
            <Sparkles size={12} />
            Ultra Tools
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-brand-text md:text-6xl">
            Advanced brainstorming tools for creators.
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-brand-text-secondary md:text-lg">
            Pick a category, enter your idea, and get a structured AI response you can use immediately.
          </p>
        </div>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {CATEGORIES.map((category, index) => {
          const Icon = category.icon;
          const selected = category.id === activeTool;

          return (
            <motion.button
              key={category.id}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setActiveTool(category.id)}
              className={`rounded-3xl border p-4 text-left transition ${
                selected
                  ? 'border-brand-accent/50 bg-brand-accent/10 shadow-lg shadow-brand-accent/10'
                  : 'border-brand-text-secondary/10 bg-brand-primary/40 hover:border-brand-accent/30'
              }`}
            >
              <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${category.color} p-3 text-white`}>
                <Icon size={24} />
              </div>
              <h2 className="text-lg font-black text-brand-text">{category.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{category.description}</p>
            </motion.button>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="ios-card space-y-5 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent">
              <Target size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-brand-text">{activeCategory.name}</h2>
              <p className="text-sm text-brand-text-secondary">{activeCategory.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-brand-text-secondary">Your idea or topic</label>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={6}
              placeholder="Describe your idea, topic, niche, or edit goal..."
              className="w-full rounded-2xl border border-brand-text-secondary/20 bg-brand-primary/50 p-4 text-brand-text outline-none transition focus:border-brand-accent/40"
            />
          </div>

          <button
            type="button"
            onClick={() => void generateOutput()}
            disabled={loading || !activeTool || !input.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-accent px-5 py-3 font-bold text-white transition hover:bg-brand-accent-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Play size={18} className="animate-pulse" /> : <Sparkles size={18} />}
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        <div className="ios-card space-y-4 p-6 md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-brand-text">Result</h2>
            {output ? (
              <button
                type="button"
                onClick={() => void copyOutput()}
                className="inline-flex items-center gap-2 rounded-full border border-brand-text-secondary/20 px-3 py-2 text-sm font-semibold text-brand-text-secondary transition hover:text-brand-text"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            ) : null}
          </div>

          <div className="min-h-[360px] rounded-2xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4">
            {loading && !output ? (
              <div className="flex h-full min-h-[320px] items-center justify-center text-brand-text-secondary">
                Generating a structured response...
              </div>
            ) : output ? (
              <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-brand-text">{output}</pre>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center text-brand-text-secondary">
                <MessageSquare size={28} className="mb-3 text-brand-accent" />
                <p className="font-semibold text-brand-text">Choose a tool, enter your idea, and generate the output.</p>
                <p className="mt-2 text-sm">Your result will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default UltraToolsPage;
