import React from 'react';
import { motion } from 'framer-motion';
import { Settings, UserCircle2, Info, Sparkles, Zap, Video, Image as ImageIcon, Wrench, Download } from 'lucide-react';
import { TOOLS } from '../constants';
import type { CardItem } from '../types';
import Card from '../components/SkillCard';
import PageBackButton from '../components/PageBackButton';

type ToolGroup = {
  title: string;
  description: string;
  items: CardItem[];
};

const ACCOUNT_LINKS: CardItem[] = [
  {
    id: 'my-profile',
    name: 'My Profile',
    description: 'View your progress, badges, and account details.',
    icon: UserCircle2,
    color: 'from-cyan-500 to-blue-500',
    type: 'tool',
    path: '/my-profile',
  },
  {
    id: 'about',
    name: 'About',
    description: 'Read about the creator and the mission behind the product.',
    icon: Info,
    color: 'from-amber-500 to-orange-500',
    type: 'tool',
    path: '/about',
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Adjust appearance and local preferences.',
    icon: Settings,
    color: 'from-slate-500 to-zinc-600',
    type: 'tool',
    path: '/settings',
  },
];

const groupByIds = (ids: string[]): CardItem[] =>
  TOOLS.filter((tool) => ids.includes(tool.id)).map((tool) => tool as CardItem);

const TOOL_GROUPS: ToolGroup[] = [
  {
    title: 'AI Writing Tools',
    description: 'Fast writing, client messaging, and idea generation tools.',
    items: groupByIds([
      'rocket-writer',
      'qna-bot',
      'resume-cover-letter',
      'proposal-writer',
      'seo-blog-toolkit',
      'social-calendar',
      'meeting-action-items',
      'email-assistant',
      'interview-prep-bot',
      'code-bug-finder',
      'thumbnail-hook-generator',
      'portfolio-builder',
      'pricing-calculator',
      'contract-generator',
      'invoice-quotation',
      'habit-sprint-tracker',
    ]),
  },
  {
    title: 'AI Image Tools',
    description: 'Analyze, generate, and animate visuals from a single place.',
    items: groupByIds(['image-generator', 'image-analyzer', 'image-animator']),
  },
  {
    title: 'AI Video Tools',
    description: 'Deep video analysis and motion creation tools for creators.',
    items: groupByIds(['video-analyzer', 'ultra-tools']),
  },
  {
    title: 'Utility Tools',
    description: 'Reliable helpers for downloads, knowledge capture, and workflows.',
    items: groupByIds(['media-downloader', 'smart-link-hub', 'secret-creator-lab']),
  },
];

const ToolsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-24">
      <PageBackButton label="Back" fallbackTo="/" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-card overflow-hidden border border-brand-accent/20 p-6 md:p-8"
      >
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-brand-accent/10 blur-3xl" />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-xs font-black uppercase tracking-[0.35em] text-brand-accent">
            <Wrench size={12} />
            Tools
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-brand-text md:text-6xl">
            Everything in one place, grouped by purpose.
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-brand-text-secondary md:text-lg">
            Jump into the exact tool you need, whether you are writing, designing, editing, analyzing, or organizing your work.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand-accent">
                <Sparkles size={12} />
                Writing
              </div>
              <p className="mt-2 text-sm text-brand-text-secondary">Ideas, copy, email, and strategy tools.</p>
            </div>
            <div className="rounded-2xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand-accent">
                <ImageIcon size={12} />
                Images
              </div>
              <p className="mt-2 text-sm text-brand-text-secondary">Analyze, generate, and animate visuals.</p>
            </div>
            <div className="rounded-2xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand-accent">
                <Video size={12} />
                Video
              </div>
              <p className="mt-2 text-sm text-brand-text-secondary">Deep video analysis and creative suites.</p>
            </div>
            <div className="rounded-2xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand-accent">
                <Download size={12} />
                Utilities
              </div>
              <p className="mt-2 text-sm text-brand-text-secondary">Downloads, tracking, and knowledge tools.</p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="space-y-12">
        {TOOL_GROUPS.map((group, index) => (
          <motion.section
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: index * 0.05 }}
            className="space-y-5"
          >
            <div className="space-y-2 px-1">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-brand-accent">{group.title}</p>
              <h2 className="text-2xl font-black tracking-tight text-brand-text md:text-3xl">{group.description}</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => (
                <Card key={item.id} item={item} />
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      <section className="space-y-5">
        <div className="space-y-2 px-1">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-brand-accent">Account</p>
          <h2 className="text-2xl font-black tracking-tight text-brand-text md:text-3xl">Profile and preferences</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {ACCOUNT_LINKS.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ToolsPage;
