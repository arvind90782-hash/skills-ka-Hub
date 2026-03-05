import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Sparkles, 
  Wand2, 
  TrendingUp, 
  Lightbulb, 
  FileText, 
  Target, 
  RefreshCw,
  Gift,
  Download,
  Palette,
  Film,
  Music,
  Code,
  Crown,
  Star,
  Zap,
  Unlock,
  Eye,
  ThumbsUp,
  Share2,
  Play,
  Box,
  Layers,
  Image,
  Megaphone,
  PenTool,
  MousePointer,
  Instagram,
  Youtube
} from 'lucide-react';
import { generateFastText } from '../services/geminiService';
import ErrorMessage from '../components/ErrorMessage';
import {
  getCreatorLevel,
  getLevelProgress,
  getToolRequiredLevel,
  isSecretCreatorLabUnlocked,
  isToolUnlockedForCurrentLevel,
  type SecretLabToolId,
} from '../services/courseProgressService';
import { logUsageEvent } from '../services/analyticsService';

// ==================== ULTRA RARE GIFTS DATA ====================

type GiftCategory = {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  gifts: GiftItem[];
};

type GiftItem = {
  title: string;
  description: string;
  url: string;
  tag: string;
  isPremium?: boolean;
};

const ULTRA_RARE_GIFTS: GiftCategory[] = [
  {
    id: 'pro-creator-assets',
    name: '💎 Pro Creator Assets',
    icon: <Box size={20} />,
    color: 'from-purple-500 to-pink-500',
    gifts: [
      { title: 'Viral Reel Hook Templates', description: '10 ready-to-use hook templates that stop the scroll', url: '#', tag: 'Templates', isPremium: true },
      { title: 'YouTube Retention Script Templates', description: 'Scripts designed to keep viewers till the end', url: '#', tag: 'Templates', isPremium: true },
      { title: 'Viral Thumbnail PSD Packs', description: 'Professional PSD files with layered thumbnails', url: '#', tag: 'PSD Pack', isPremium: true },
      { title: 'Cinematic LUT Packs', description: 'Movie-grade color grading presets', url: '#', tag: 'LUTs', isPremium: true },
      { title: 'Sound Effect Libraries', description: '500+ premium SFX for editing', url: '#', tag: 'Sound', isPremium: true },
      { title: 'Meme Editing Assets', description: 'Trending meme templates and overlay packs', url: '#', tag: 'Assets', isPremium: true },
      { title: 'Motion Graphics Packs', description: 'Animated elements for professional videos', url: '#', tag: 'Motion', isPremium: true },
    ]
  },
  {
    id: 'hidden-ai-tools',
    name: '🤖 Hidden AI Tools',
    icon: <Sparkles size={20} />,
    color: 'from-cyan-500 to-blue-500',
    gifts: [
      { title: 'Prompt Generator for Viral Videos', description: 'AI prompts that generate viral content ideas', url: '#', tag: 'AI Tool', isPremium: true },
      { title: 'Auto Script Generator', description: 'Full scripts in your style automatically', url: '#', tag: 'AI Tool', isPremium: true },
      { title: 'Thumbnail Idea Generator', description: 'AI-generated thumbnail concepts on demand', url: '#', tag: 'AI Tool', isPremium: true },
      { title: 'Video Idea Generator', description: 'Endless content ideas for any niche', url: '#', tag: 'AI Tool', isPremium: true },
      { title: 'Content Strategy Generator', description: 'Complete content calendar in seconds', url: '#', tag: 'AI Tool', isPremium: true },
    ]
  },
  {
    id: 'creator-resources',
    name: '📚 Creator Resources',
    icon: <Layers size={20} />,
    color: 'from-green-500 to-emerald-500',
    gifts: [
      { title: 'Secret Free Stock Footage Sources', description: 'Hidden gems for free premium footage', url: '#', tag: 'Resources', isPremium: true },
      { title: 'Hidden AI Tools List', description: 'Tools nobody knows about but everyone needs', url: '#', tag: 'Resources', isPremium: true },
      { title: 'Editing Hacks Database', description: '100+ pro editing shortcuts and tricks', url: '#', tag: 'Resources', isPremium: true },
      { title: 'Algorithm Growth Tips', description: 'Platform-specific growth strategies', url: '#', tag: 'Resources', isPremium: true },
      { title: 'Viral Content Frameworks', description: 'Proven structures for viral posts', url: '#', tag: 'Resources', isPremium: true },
    ]
  },
  {
    id: 'pro-tools-packs',
    name: '🛠️ Pro Tools Packs',
    icon: <Code size={20} />,
    color: 'from-amber-500 to-orange-500',
    gifts: [
      { title: 'Editing Shortcuts Cheat Sheet', description: 'Keyboard shortcuts for every major software', url: '#', tag: 'Cheat Sheet', isPremium: true },
      { title: 'Premiere Pro Effect Packs', description: '50+ pro transitions and effects', url: '#', tag: 'Effects', isPremium: true },
      { title: 'CapCut Effect Packs', description: 'Trending effects for viral CapCut videos', url: '#', tag: 'Effects', isPremium: true },
      { title: 'Color Grading Presets', description: 'Pro color presets for any mood', url: '#', tag: 'Presets', isPremium: true },
      { title: 'Transition Packs', description: 'Seamless transitions for professional edits', url: '#', tag: 'Transitions', isPremium: true },
      { title: 'Viral Caption Generator', description: 'Captions that increase engagement 10x', url: '#', tag: 'Tool', isPremium: true },
    ]
  }
];

// ==================== CREATOR TOOLS ====================

type ToolConfig = {
  id: SecretLabToolId;
  title: string;
  description: string;
  placeholder: string;
  actionLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  buildPrompt: (input: string) => string;
};

const TOOLS: ToolConfig[] = [
  {
    id: 'reel-idea-builder',
    title: 'Reel Idea Builder',
    description: 'Topic do, 5 reel ideas + hook + concept turant.',
    placeholder: 'Topic likho... (example: freelance video editing)',
    actionLabel: 'Ideas Generate Karo',
    icon: Lightbulb,
    buildPrompt: (input) => `Tum creator strategist ho.
Topic: ${input}
Return only concise Hinglish output:
5 reel ideas.
Har idea me:
- Hook line
- 20-30 sec concept
No markdown, no code, fast readable format.`,
  },
  {
    id: 'reel-script-maker',
    title: 'Reel Script Maker',
    description: 'Idea ko short script me convert karo: intro, main, ending.',
    placeholder: 'Reel idea likho... (example: video editing se first client kaise mile)',
    actionLabel: 'Script Banao',
    icon: FileText,
    buildPrompt: (input) => `Tum short-form reel script writer ho.
Idea: ${input}
Output in Hinglish with this exact structure:
Intro:
Main:
Ending CTA:
Keep total under 140 words, no markdown, no code.`,
  },
  {
    id: 'thumbnail-title-tester',
    title: 'Thumbnail Title Tester',
    description: 'Titles compare karke batao kaunsa sabse clickable hai aur kyun.',
    placeholder: 'Multiple titles line by line likho...',
    actionLabel: 'Best Title Pick Karo',
    icon: TrendingUp,
    buildPrompt: (input) => `Tum YouTube CTR analyst ho.
Candidate titles:
${input}
Hinglish me output do:
1) Best title
2) Do second-best options
3) Kyun best hai (max 3 short lines)
No markdown, no code.`,
  },
  {
    id: 'content-idea-generator',
    title: 'Content Idea Generator',
    description: 'Niche do aur unique video/topic ideas pao.',
    placeholder: 'Apna niche likho... (example: coding for beginners)',
    actionLabel: 'Content Ideas Lo',
    icon: Wand2,
    buildPrompt: (input) => `Tum content growth expert ho.
Niche: ${input}
Hinglish me 10 fresh content ideas do.
Har idea max 1 line.
No markdown, no code, no explanation text.`,
  },
  {
    id: 'boring-content-fixer',
    title: 'Boring Content Fixer',
    description: 'Boring paragraph ko engaging storytelling tone me badlo.',
    placeholder: 'Boring paragraph paste karo...',
    actionLabel: 'Engaging Banao',
    icon: Sparkles,
    buildPrompt: (input) => `Tum engaging storyteller ho.
Is text ko readable, creator-style Hinglish me rewrite karo:
${input}
Rules:
- 4 to 7 short lines
- curiosity + emotion add karo
- no markdown
- no code`,
  },
  {
    id: 'skill-practice-generator',
    title: 'Skill Practice Generator',
    description: 'Skill ke liye real-world practice challenges generate karo.',
    placeholder: 'Skill likho... (example: motion graphics)',
    actionLabel: 'Practice Challenges Banao',
    icon: Target,
    buildPrompt: (input) => `Tum skill coach ho.
Skill: ${input}
Hinglish me 7 practical challenges do.
Easy se hard order me.
Har challenge 1 line.
No markdown, no code.`,
  },
  {
    id: 'creator-motivation',
    title: 'Creator Motivation Tool',
    description: 'Creative block me quick push + mini action plan.',
    placeholder: 'Current block/mood likho...',
    actionLabel: 'Motivation Unlock Karo',
    icon: Sparkles,
    buildPrompt: (input) => `Tum high-energy creator mentor ho.
User block: ${input}
Hinglish me do:
1) 3-line motivation reset
2) Next 30 minute ka mini action plan
3) 1 small challenge
Keep concise, no markdown, no code.`,
  },
];

const readStreamedText = async (prompt: string) => {
  const stream = await generateFastText(prompt);
  let finalText = '';
  for await (const chunk of stream as AsyncIterable<{ text?: string }>) {
    if (chunk?.text) {
      finalText += chunk.text;
    }
  }
  return finalText.trim();
};

// ==================== MAIN COMPONENT ====================

const SecretCreatorLabPage: React.FC = () => {
  const labUnlocked = isSecretCreatorLabUnlocked();
  const creatorLevel = getCreatorLevel();
  const levelProgress = getLevelProgress();

  const [activeTab, setActiveTab] = useState<'gifts' | 'tools'>('gifts');
  const [activeGiftCategory, setActiveGiftCategory] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [loadingTool, setLoadingTool] = useState<SecretLabToolId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedTools = useMemo(() => TOOLS, []);

  const updateInput = (toolId: SecretLabToolId, value: string) => {
    setInputs((prev) => ({ ...prev, [toolId]: value }));
  };

  const runTool = async (tool: ToolConfig) => {
    const input = (inputs[tool.id] || '').trim();
    if (!input) {
      setError('Pehle input do, phir generate karo.');
      return;
    }

    setError(null);
    setLoadingTool(tool.id);
    try {
      const text = await readStreamedText(tool.buildPrompt(input));
      setOutputs((prev) => ({ ...prev, [tool.id]: text || 'Output blank aaya. Dobara try karo.' }));
      void logUsageEvent('tool_action', { toolId: `secret-lab-${tool.id}`, action: 'generate' });
    } catch (e: any) {
      setError(e?.message || 'Secret tool run karte waqt issue aa gaya.');
    } finally {
      setLoadingTool(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-24">
      <Link to="/" className="group mb-8 inline-flex items-center gap-2 text-brand-text-secondary transition-colors hover:text-brand-accent">
        <div className="rounded-full p-2 ios-glass transition-all group-hover:bg-brand-accent group-hover:text-white">
          ←
        </div>
        <span className="font-semibold">Home par wapas</span>
      </Link>

      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-card overflow-hidden border-2 border-brand-accent/30"
      >
        <div className="relative bg-gradient-to-br from-brand-accent/20 via-brand-primary to-purple-500/10 p-8 md:p-12">
          {/* Floating elements */}
          <motion.div 
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 20 }}
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-accent/5"
          />
          <motion.div 
            animate={{ rotate: [0, -360] }}
            transition={{ repeat: Infinity, duration: 25 }}
            className="absolute -left-5 -bottom-5 h-32 w-32 rounded-full bg-purple-500/5"
          />

          <div className="relative flex flex-col items-center text-center md:flex-row md:text-left md:items-start md:justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-brand-accent">
                <Crown size={14} />
                Secret Reward Vault
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-text md:text-5xl">
                🎁 Secret Creator Lab
              </h1>
              <p className="mt-4 text-lg text-brand-text-secondary max-w-2xl">
                Yo! Agar tum ye tak pahunch gaye, matlab tumne koi course properly complete kiya hai. 
                <span className="text-brand-accent font-bold"> Ab tumhare liye ultra-rare gifts unlock hain!</span>
                <br />
                <span className="text-sm">Ye saari cheezein internet pe easily nahi milti. Enjoy! 🚀</span>
              </p>

              {!labUnlocked ? (
                <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 max-w-md">
                  <p className="font-bold text-red-300 flex items-center gap-2">
                    <Lock size={18} />
                    Abhi Locked Hai!
                  </p>
                  <p className="mt-2 text-sm text-brand-text-secondary">
                    Unlock ke liye course ke saare lessons + quiz + poll + Q&A + mini challenge complete karo.
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2">
                    <p className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <Unlock size={16} />
                      Unlocked!
                    </p>
                  </div>
                  <div className="rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-2">
                    <p className="text-sm font-bold text-brand-text">
                      Level: <span className="text-brand-accent">{creatorLevel || 'Beginner'}</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 px-4 py-2">
                    <p className="text-sm font-bold text-purple-300">
                      {levelProgress.completedCourses} Course Completed
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Gift Box Animation */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mt-6 md:mt-0"
            >
              <div className="text-8xl">🎁</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      {labUnlocked && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 flex gap-2"
        >
          <button
            onClick={() => setActiveTab('gifts')}
            className={`flex-1 rounded-xl px-6 py-3 text-sm font-bold transition-all ${
              activeTab === 'gifts' 
                ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/30' 
                : 'bg-brand-primary/50 text-brand-text-secondary hover:bg-brand-primary'
            }`}
          >
            <Gift size={18} className="inline mr-2" />
            Ultra Rare Gifts
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex-1 rounded-xl px-6 py-3 text-sm font-bold transition-all ${
              activeTab === 'tools' 
                ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/30' 
                : 'bg-brand-primary/50 text-brand-text-secondary hover:bg-brand-primary'
            }`}
          >
            <Sparkles size={18} className="inline mr-2" />
            AI Creator Tools
          </button>
        </motion.div>
      )}

      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      {/* GIFTS SECTION */}
      {activeTab === 'gifts' && labUnlocked && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6"
        >
          {!activeGiftCategory ? (
            // All Gift Categories
            <div className="grid gap-4 md:grid-cols-2">
              {ULTRA_RARE_GIFTS.map((category, idx) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setActiveGiftCategory(category.id)}
                  className="ios-card group border border-brand-accent/15 p-6 text-left transition-all hover:border-brand-accent/40 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} shadow-lg`}>
                      <div className="text-white">{category.icon}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-brand-text group-hover:text-brand-accent transition-colors">
                          {category.name}
                        </h3>
                        <span className="rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-bold text-brand-accent">
                          {category.gifts.length} items
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-brand-text-secondary">
                        Click to view all exclusive {category.name.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            // Single Category Gifts
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <button
                onClick={() => setActiveGiftCategory(null)}
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:underline"
              >
                ← All Gift Categories
              </button>

              {(() => {
                const category = ULTRA_RARE_GIFTS.find(c => c.id === activeGiftCategory);
                if (!category) return null;

                return (
                  <div className="ios-card border border-brand-accent/20 p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} shadow-lg`}>
                        <div className="text-white">{category.icon}</div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-brand-text">{category.name}</h2>
                        <p className="text-brand-text-secondary">{category.gifts.length} exclusive items</p>
                      </div>
                    </div>

                    {/* Coming Soon Notice */}
                    <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
                      <p className="text-sm font-bold text-amber-300 flex items-center gap-2">
                        <Star size={16} />
                        Coming Soon - Vault Unlocking Soon!
                      </p>
                      <p className="mt-1 text-xs text-brand-text-secondary">
                        These ultra-rare resources will be available for download soon. Keep learning to unlock them!
                      </p>
                    </div>

                    {/* Gift Grid (Locked Display) */}
                    <div className="grid gap-3 md:grid-cols-2">
                      {category.gifts.map((gift, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="relative rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4 opacity-75"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary">
                              <Lock size={16} className="text-brand-text-secondary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-brand-text">{gift.title}</h4>
                                {gift.isPremium && (
                                  <Crown size={12} className="text-amber-400" />
                                )}
                              </div>
                              <p className="mt-1 text-xs text-brand-text-secondary">{gift.description}</p>
                              <span className="mt-2 inline-block rounded-full border border-brand-text-secondary/20 bg-brand-primary px-2 py-0.5 text-xs font-semibold text-brand-text-secondary">
                                {gift.tag}
                              </span>
                            </div>
                          </div>
                          {/* Lock Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 backdrop-blur-[1px]">
                            <div className="rounded-full bg-brand-primary/80 px-4 py-2">
                              <Lock size={16} className="inline mr-1 text-brand-text-secondary" />
                              <span className="text-sm font-bold text-brand-text-secondary">Locked</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* TOOLS SECTION */}
      {activeTab === 'tools' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6"
        >
          <div className="grid grid-cols-1 gap-5">
            {sortedTools.map((tool) => {
              const unlocked = labUnlocked && isToolUnlockedForCurrentLevel(tool.id);
              const requiredLevel = getToolRequiredLevel(tool.id);
              const Icon = tool.icon;
              const output = outputs[tool.id];

              return (
                <div key={tool.id} className="ios-card border border-brand-accent/15 p-5">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent">
                        <Icon size={14} />
                        {tool.title}
                      </p>
                      <p className="mt-1 text-sm text-brand-text-secondary">{tool.description}</p>
                    </div>

                    {!unlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-brand-text-secondary/20 px-3 py-1 text-xs font-bold text-brand-text-secondary">
                        <Lock size={12} />
                        Unlock @ {requiredLevel}
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                        Unlocked
                      </span>
                    )}
                  </div>

                  {!unlocked ? (
                    <div className="rounded-xl border border-brand-text-secondary/15 bg-brand-primary/40 p-4 text-sm text-brand-text-secondary">
                      Is tool ko unlock karne ke liye level upgrade karo.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={inputs[tool.id] || ''}
                        onChange={(e) => updateInput(tool.id, e.target.value)}
                        rows={3}
                        placeholder={tool.placeholder}
                        className="w-full rounded-xl border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-3 text-brand-text outline-none focus:border-brand-accent/40"
                      />
                      <button
                        onClick={() => {
                          void runTool(tool);
                        }}
                        disabled={loadingTool === tool.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                      >
                        {loadingTool === tool.id ? <RefreshCw size={15} className="animate-spin" /> : null}
                        {loadingTool === tool.id ? 'Generating...' : tool.actionLabel}
                      </button>

                      {output && (
                        <div className="rounded-xl border border-brand-text-secondary/15 bg-brand-primary/45 p-4 text-sm leading-relaxed text-brand-text">
                          {output}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Locked State */}
      {!labUnlocked && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 ios-card border border-brand-text-secondary/10 p-8 text-center"
        >
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-2xl font-black text-brand-text">Secret Vault Locked!</h3>
          <p className="mt-4 text-brand-text-secondary max-w-md mx-auto">
            Ye ultra-rare gifts aur powerful tools tabhi unlock honge jab tum koi course properly complete karoge.
            <br />
            <span className="text-brand-accent font-bold">Quiz + Poll + Q&A + Mini Challenges sab complete karo!</span>
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-accent px-6 py-3 font-bold text-white"
          >
            Start Learning
            →
          </Link>
        </motion.div>
      )}

      {/* Footer CTA */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-lg font-medium text-brand-text-secondary">
          "Learning + Action = Success 🚀"
        </p>
      </motion.div>
    </div>
  );
};

export default SecretCreatorLabPage;

