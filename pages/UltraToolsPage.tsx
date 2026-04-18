import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Brain, 
  Eye, 
  Lightbulb, 
  Film, 
  TrendingUp,
  Zap,
  Target,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  Layout,
  Palette,
  Music,
  Clock,
  Users,
  ThumbsUp,
  Share2,
  Play
} from 'lucide-react';
import { generateFastText } from '../services/geminiService';
import { useLocale } from '../hooks/useLocale';

type ToolCategory = {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
};

const CATEGORIES: ToolCategory[] = [
  { 
    id: 'viral-video-brain', 
    name: '🎬 Viral Video Brain', 
    icon: <Brain size={24} />,
    color: 'from-red-500 to-pink-500',
    description: 'Idea dale → AI viral hook, script, title & thumbnail sab generate karega'
  },
  { 
    id: 'thumbnail-psychology', 
    name: '🎯 Thumbnail Psychology', 
    icon: <Eye size={24} />,
    color: 'from-amber-500 to-orange-500',
    description: 'Topic dale → AI best colors, emotional triggers & click psychology batayega'
  },
  { 
    id: 'creator-idea-engine', 
    name: '💡 Creator Idea Engine', 
    icon: <Lightbulb size={24} />,
    color: 'from-purple-500 to-pink-500',
    description: 'Niche dale → AI 30 viral content ideas, hooks & captions generate karega'
  },
  { 
    id: 'edit-planner', 
    name: '🎥 Edit Planner AI', 
    icon: <Film size={24} />,
    color: 'from-cyan-500 to-blue-500',
    description: 'Raw idea dale → AI shot list, transitions, sounds & pacing suggest karega'
  },
  { 
    id: 'viral-trend-scanner', 
    name: '📈 Viral Trend Scanner', 
    icon: <TrendingUp size={24} />,
    color: 'from-green-500 to-emerald-500',
    description: 'AI trends analyze karega aur bataega kaunsa content abhi viral ho raha hai'
  }
];

const UltraToolsPage: React.FC = () => {
  const { t } = useLocale();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const buildPrompt = (toolId: string, userInput: string): string => {
    switch (toolId) {
      case 'viral-video-brain':
        return `Tum ek viral content strategist ho. User ka idea: "${userInput}"
        
Hinglish output mein ye sab provide karo (clean format, no markdown):

🎯 VIRAL HOOK (2-3 options)
- Hook line jo first 3 seconds mein attention khiche

📝 FULL SCRIPT
- 60-second reel script
- Intro (5 sec) → Main Content (45 sec) → CTA (10 sec)

📌 VIRAL TITLE (3 options)
- YouTube/Instagram title jo curiosity create kare

🖼️ THUMBNAIL IDEAS
- 3 thumbnail concepts with text overlays
- Color scheme suggestion

💡 RETENTION TRICKS
- 3 specific tricks to keep viewers engaged

No markdown, straight Hinglish text.`;

      case 'thumbnail-psychology':
        return `Tum ek thumbnail psychology expert aur CTR specialist ho. Topic: "${userInput}"

Hinglish mein ye sab batao:

🎨 BEST COLORS
- Primary color palette
- Secondary accent colors
- Why these colors work for this topic

😮 EMOTIONAL TRIGGERS
- Top 5 emotions to trigger
- How to show them in thumbnail

👆 CLICK PSYCHOLOGY
- Why people click on such thumbnails
- Common mistakes to avoid

🖼️ LAYOUT IDEAS
- 3 different layout compositions
- Text placement suggestions
- Face vs object placement

📏 SIZE & STYLE
- Best aspect ratio
- Text size recommendations

No markdown, pure Hinglish.`;

      case 'creator-idea-engine':
        return `Tum ek content growth expert ho. Niche: "${userInput}"

30 viral content ideas generate karo Hinglish mein:

Har idea mein ye format:
🎬 Idea Number: [Hook/Caption/Format]

Categories:
- 10 Trending format ideas
- 10 Evergreen content ideas  
- 10 Quick/short form ideas

Har idea 1-2 lines max.
No markdown, numbered list format.`;

      case 'edit-planner':
        return `Tum ek professional video editor ho. Raw idea: "${userInput}"

Hinglish mein ye batao:

🎬 SHOT LIST
- Detailed shot breakdown
- Camera angles to use
- Duration of each shot

🔄 TRANSITIONS
- Best transitions for this content
- When to use each transition

🔊 SOUND EFFECTS
- SFX recommendations
- Background music mood
- Where to add sound effects

⚡ PACING
- Scene duration guide
- Fast cuts vs slow cuts
- Energy flow throughout

🎯 EDITING STYLE
- Suggested editing style
- Color grading mood
- Motion graphics needs

No markdown, clean structured format.`;

      case 'viral-trend-scanner':
        return `Tum ek social media trend analyst ho. Niche/Topic: "${userInput}"

Hinglish mein ye batao:

🔥 CURRENTLY TRENDING
- What type of content is viral right now
- Growing formats in this niche
- Rising topics

📊 FORMAT ANALYSIS
- Which content formats are growing
- Short-form vs long-form trends
- Platform-specific trends

🎯 SUCCESS PATTERNS
- Common elements in viral content
- What works vs what doesn't
- Audience preferences

💡 OPPORTUNITIES
- Untapped content angles
- Unique angles to try
- Gap in the market

🔮 PREDICTIONS
- What's likely to trend next
- Upcoming topics
- Seasonal trends

No markdown, detailed Hinglish report.`;

      default:
        return `Topic: ${userInput}`;
    }
  };

  const generateOutput = async () => {
    if (!input.trim() || !activeTool) return;
    
    setLoading(true);
    setOutput(null);
    
    try {
      const prompt = buildPrompt(activeTool, input);
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
      setOutput('Error generating output. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeCategory = CATEGORIES.find(c => c.id === activeTool);

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <Link to="/" className="group mb-8 inline-flex items-center gap-2 text-brand-text-secondary transition-colors hover:text-brand-accent">
        <div className="rounded-full p-2 ios-glass transition-all group-hover:bg-brand-accent group-hover:text-white">
          <ArrowLeft size={20} />
        </div>
        <span className="font-semibold">Back to Home</span>
      </Link>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-card border border-brand-accent/20 p-8"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-accent to-purple-500 shadow-lg shadow-brand-accent/30">
            <Brain className="text-white" size={28} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-brand-accent">✨ Ultra Rare Tools</p>
            <h1 className="text-3xl font-black tracking-tight text-brand-text">AI-Powered Creator Suite</h1>
          </div>
        </div>
        <p className="mt-4 text-brand-text-secondary">
          Ye powerful tools Gemini AI se powered hain. Bas input do aur magic dekho! 🎩
          <br />
          <span className="text-sm">Perfect for creators, editors aur developers jo instant results chahte hain.</span>
        </p>
      </motion.div>

      {/* Tool Categories */}
      {!activeTool ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          {CATEGORIES.map((category, idx) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.1 }}
              onClick={() => {
                setActiveTool(category.id);
                setInput('');
                setOutput(null);
              }}
              className="ios-card group border border-brand-accent/15 p-6 text-left transition-all hover:border-brand-accent/40 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} shadow-lg`}>
                  <div className="text-white">{category.icon}</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-brand-text group-hover:text-brand-accent transition-colors">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm text-brand-text-secondary">
                    {category.description}
                  </p>
                </div>
                <Sparkles className="text-brand-accent opacity-0 transition-opacity group-hover:opacity-100" size={20} />
              </div>
            </motion.button>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6"
        >
          {/* Back Button */}
          <button
            onClick={() => {
              setActiveTool(null);
              setInput('');
              setOutput(null);
            }}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:underline"
          >
            ← All Tools
          </button>

          {/* Active Tool Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="ios-card border border-brand-accent/20 p-6 md:p-8"
          >
            {/* Tool Header */}
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${activeCategory?.color} shadow-lg`}>
                <div className="text-white">{activeCategory?.icon}</div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-brand-text">{activeCategory?.name}</h2>
                <p className="text-brand-text-secondary">{activeCategory?.description}</p>
              </div>
            </div>

            {/* Input Area */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-brand-text">
                {activeTool === 'viral-video-brain' && '🎬 Apna Idea/Topic Likho'}
                {activeTool === 'thumbnail-psychology' && '🎯 Thumbnail Topic/Title Likho'}
                {activeTool === 'creator-idea-engine' && '💡 Apna Niche Likho'}
                {activeTool === 'edit-planner' && '🎥 Video Concept/Idea Likho'}
                {activeTool === 'viral-trend-scanner' && '📈 Niche/Topic Likho jisme trend check karna hai'}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  activeTool === 'viral-video-brain' ? 'Example: How to edit videos like pro, or 5 tips for better thumbnails...' :
                  activeTool === 'thumbnail-psychology' ? 'Example: Gaming video thumbnail, or Tech review...' :
                  activeTool === 'creator-idea-engine' ? 'Example: Coding tutorials, Food reviews, Travel vlogs...' :
                  activeTool === 'edit-planner' ? 'Example: A travel vlog about mountain trekking, or cooking tutorial...' :
                  'Example: Tech reviews, Fashion, Fitness...'
                }
                rows={4}
                className="w-full rounded-xl border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-3 text-brand-text outline-none focus:border-brand-accent/40"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generateOutput}
              disabled={loading || !input.trim()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-accent px-6 py-3 text-sm font-bold text-white disabled:opacity-60 hover:bg-brand-accent/80 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Generating Magic... ✨
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Generate Output
                </>
              )}
            </button>

            {/* Output */}
            {output && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
                    <Sparkles size={18} className="text-brand-accent" />
                    Output
                  </h3>
                  <button
                    onClick={copyOutput}
                    className="inline-flex items-center gap-1 rounded-lg border border-brand-text-secondary/20 bg-brand-primary/50 px-3 py-1 text-xs font-semibold text-brand-text transition-colors hover:bg-brand-accent/10"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="rounded-xl border border-brand-accent/20 bg-brand-primary/30 p-4 md:p-6">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-brand-text font-sans">
                    {output}
                  </pre>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Features Showcase */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 ios-card border border-brand-text-secondary/10 p-6"
      >
        <h3 className="text-lg font-black text-brand-text mb-4">🚀 Why These Tools Are Addictive</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
              <Brain size={16} />
            </div>
            <div>
              <p className="font-bold text-brand-text">Gemini AI Powered</p>
              <p className="text-xs text-brand-text-secondary">Advanced AI for best results</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
              <Zap size={16} />
            </div>
            <div>
              <p className="font-bold text-brand-text">Instant Results</p>
              <p className="text-xs text-brand-text-secondary">No waiting, get output in seconds</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <Target size={16} />
            </div>
            <div>
              <p className="font-bold text-brand-text">Creator Focused</p>
              <p className="text-xs text-brand-text-secondary">Made for editors & creators</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UltraToolsPage;

