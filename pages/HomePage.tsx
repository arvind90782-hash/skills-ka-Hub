
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MAKER_PROFILE, SKILLS, TOOLS, WEBSITE_FAQ } from '../constants';
import Card from '../components/SkillCard';
import { Sparkles, Zap, BookOpen, UserCircle2, Mail, Globe, Instagram } from 'lucide-react';
import { useLocale } from '../hooks/useLocale';

const HomePage: React.FC = () => {
  const { t, localizeItem } = useLocale();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="text-center space-y-8 pt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20"
        >
          <Sparkles size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">{t('home.badge')}</span>
        </motion.div>
        
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-brand-text"
          >
            {t('home.title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-brand-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            {t('home.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Skills Section */}
      <section className="space-y-10">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-accent">
              <BookOpen size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">{t('home.learningPaths')}</span>
            </div>
            <h2 className="text-3xl font-bold text-brand-text tracking-tight">{t('home.freelanceSkills')}</h2>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {SKILLS.map((skill) => (
            <Card key={skill.id} item={localizeItem(skill)} />
          ))}
        </motion.div>
      </section>

      {/* AI Tools Section */}
      <section className="space-y-10">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-accent">
              <Zap size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">{t('home.aiPowerups')}</span>
            </div>
            <h2 className="text-3xl font-bold text-brand-text tracking-tight">{t('home.smartTools')}</h2>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {TOOLS.map((tool) => (
            <Card key={tool.id} item={localizeItem(tool)} />
          ))}
        </motion.div>
      </section>

      <section className="space-y-8">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-accent">
              <UserCircle2 size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Maker</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-brand-text">Developer of this Website</h2>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="ios-card relative overflow-hidden border border-brand-accent/20 p-6 md:p-8"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-brand-accent/15 blur-3xl" />
          <p className="text-xs font-black uppercase tracking-widest text-brand-accent">Creative Builder</p>
          <h3 className="mt-2 text-3xl font-black text-brand-text">{MAKER_PROFILE.name}</h3>
          <p className="mt-1 text-sm font-semibold text-brand-accent">{MAKER_PROFILE.role}</p>
          <p className="mt-4 max-w-3xl text-brand-text-secondary">{MAKER_PROFILE.bio}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <a
              href={`mailto:${MAKER_PROFILE.email}`}
              className="rounded-xl border border-brand-text-secondary/15 bg-brand-primary/40 p-3 transition hover:border-brand-accent/40"
            >
              <p className="inline-flex items-center gap-2 text-sm font-bold text-brand-text">
                <Mail size={16} /> Email
              </p>
              <p className="mt-1 text-xs text-brand-text-secondary">{MAKER_PROFILE.email}</p>
            </a>
            <a
              href={MAKER_PROFILE.website}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-brand-text-secondary/15 bg-brand-primary/40 p-3 transition hover:border-brand-accent/40"
            >
              <p className="inline-flex items-center gap-2 text-sm font-bold text-brand-text">
                <Globe size={16} /> Website
              </p>
              <p className="mt-1 text-xs text-brand-text-secondary">{MAKER_PROFILE.website}</p>
            </a>
            <a
              href={MAKER_PROFILE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-brand-text-secondary/15 bg-brand-primary/40 p-3 transition hover:border-brand-accent/40"
            >
              <p className="inline-flex items-center gap-2 text-sm font-bold text-brand-text">
                <Instagram size={16} /> Instagram
              </p>
              <p className="mt-1 text-xs text-brand-text-secondary">{MAKER_PROFILE.instagram}</p>
            </a>
          </div>
        </motion.div>
      </section>

      <section className="space-y-8">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-accent">
              <Sparkles size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">FAQ</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-brand-text">Website FAQ</h2>
          </div>
        </div>

        <div className="space-y-3">
          {WEBSITE_FAQ.map((item, idx) => (
            <div key={`web-faq-${idx}`} className="ios-card border border-brand-accent/15">
              <button
                onClick={() => setOpenFaqIndex((prev) => (prev === idx ? null : idx))}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-bold text-brand-text">{item.q}</span>
                <span className="text-brand-accent">{openFaqIndex === idx ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {openFaqIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-5 pb-5"
                  >
                    <p className="text-sm leading-relaxed text-brand-text-secondary">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
