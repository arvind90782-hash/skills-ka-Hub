import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles, Wand2, TrendingUp, Lightbulb, FileText, Target, RefreshCw } from 'lucide-react';
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

const SecretCreatorLabPage: React.FC = () => {
  const labUnlocked = isSecretCreatorLabUnlocked();
  const creatorLevel = getCreatorLevel();
  const levelProgress = getLevelProgress();

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
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:underline">
        ← Home par wapas
      </Link>

      <div className="ios-card border border-brand-accent/20 p-6 md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-accent">Secret Creator Lab</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-brand-text md:text-4xl">Exclusive Reward System</h1>
        <p className="mt-3 text-brand-text-secondary">
          Ye section sirf un users ke liye hai jo course ko seriously complete karte hain.
        </p>

        {!labUnlocked ? (
          <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
            <p className="font-bold text-red-300">
              Secret Creator Lab abhi locked hai. Unlock ke liye saare lessons + quiz + poll + Q&A + mini challenge complete karo.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <p className="font-bold text-emerald-300">
                🎉 Congratulations!
                <br />
                Tumne ye course properly complete kiya hai.
                <br />
                Ab tumhare liye Secret Creator Lab unlock ho gaya hai.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-text-secondary/15 bg-brand-primary/40 p-4">
              <p className="text-sm font-semibold text-brand-text">
                Current Level: <span className="text-brand-accent">{creatorLevel || 'Locked'}</span>
              </p>
              <p className="mt-1 text-sm text-brand-text-secondary">
                Completed Courses: {levelProgress.completedCourses}
                {levelProgress.nextLevel
                  ? ` | Next Level: ${levelProgress.nextLevel} (${levelProgress.remainingForNext} course aur complete karo)`
                  : ' | Maximum level unlocked'}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

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
                    rows={4}
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
    </div>
  );
};

export default SecretCreatorLabPage;
