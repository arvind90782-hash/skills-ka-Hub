import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft, Play, Pause, Loader2 } from 'lucide-react';
import { SKILLS } from '../constants';
import type {
  GeneratedContent,
  ContentBlock,
  SubPage,
  QuizBlock as QuizBlockType,
  AiChallengeBlock as AiChallengeBlockType,
  PollBlock as PollBlockType,
  QAndABlock as QAndABlockType,
  ExpertSaysBlock as ExpertSaysBlockType,
  MythBusterBlock as MythBusterBlockType,
  DoAndDontBlock as DoAndDontBlockType,
  ShockingFactBlock as ShockingFactBlockType,
  IdeaCornerBlock as IdeaCornerBlockType,
} from '../types';
import { generateSkillContent, generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import CopyButton from '../components/CopyButton';
import QuizBlock from '../components/QuizBlock';
import AiChallengeBlock from '../components/AiChallengeBlock';
import PollBlock from '../components/PollBlock';
import QAndABlock from '../components/QAndABlock';
import ExpertSaysBlock from '../components/ExpertSaysBlock';
import MythBusterBlock from '../components/MythBusterBlock';
import DoAndDontBlock from '../components/DoAndDontBlock';
import ShockingFactBlock from '../components/ShockingFactBlock';
import IdeaCornerBlock from '../components/IdeaCornerBlock';
import FlashcardBlock from '../components/FlashcardBlock';
import { useLocale } from '../hooks/useLocale';

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t, localizeItem } = useLocale();
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [audioPlayer, setAudioPlayer] = useState<{ context: AudioContext; source: AudioBufferSourceNode } | null>(null);
  const [playingBlock, setPlayingBlock] = useState<string | null>(null);

  const skill = useMemo(() => {
    const found = SKILLS.find((s) => s.id === categoryId);
    return found ? localizeItem(found) : undefined;
  }, [categoryId, localizeItem]);

  const stopAudio = useCallback(() => {
    if (audioPlayer) {
      try {
        audioPlayer.source.stop();
      } catch {
        // ignore stop errors for already-ended sources
      }
      void audioPlayer.context.close();
      setAudioPlayer(null);
      setPlayingBlock(null);
    }
  }, [audioPlayer]);

  const fetchContent = useCallback(async () => {
    if (!skill) {
      setError(t('category.skillNotFound'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const generatedData = await generateSkillContent(skill.name);
      setContent(generatedData);
      setCurrentPage(0);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t('category.empty');
      setError(message);
      setContent(null);
    } finally {
      setLoading(false);
    }
  }, [skill, t]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const subPages = content?.subPages ?? [];

  useEffect(() => {
    if (subPages.length === 0) {
      return;
    }

    setCurrentPage((prev) => Math.min(Math.max(prev, 0), subPages.length - 1));
  }, [subPages.length]);

  const currentSubPage: SubPage | null = subPages[currentPage] ?? null;

  const handleNext = () => {
    if (subPages.length === 0) {
      return;
    }

    setCurrentPage((prev) => {
      const next = Math.min(prev + 1, subPages.length - 1);
      return next;
    });

    stopAudio();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
    stopAudio();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayAudio = async (text: string, blockId: string) => {
    if (!text?.trim()) {
      return;
    }

    if (playingBlock === blockId) {
      stopAudio();
      return;
    }

    stopAudio();
    setPlayingBlock(`loading-${blockId}`);

    try {
      const base64Audio = await generateSpeech(text);
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
      const source = outputAudioContext.createBufferSource();

      source.buffer = audioBuffer;
      source.connect(outputAudioContext.destination);
      source.start();

      setPlayingBlock(blockId);
      setAudioPlayer({ context: outputAudioContext, source });

      source.onended = () => {
        setPlayingBlock(null);
        setAudioPlayer(null);
      };
    } catch (e) {
      console.error('Audio playback error:', e);
      setPlayingBlock(null);
    }
  };

  if (!skill) {
    return (
      <div className="py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-red-500">{t('category.skillNotFound')}</h2>
        <Link to="/" className="ios-btn inline-flex items-center gap-2 bg-brand-accent text-white">
          <ArrowLeft size={20} />
          {t('category.backHome')}
        </Link>
      </div>
    );
  }

  if (loading) {
    return <Loading message={t('category.generating', { skill: skill.name })} />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchContent} />;
  }

  if (subPages.length === 0 || !currentSubPage) {
    return <ErrorMessage message={t('category.empty')} onRetry={fetchContent} />;
  }

  const progressPercentage = ((currentPage + 1) / subPages.length) * 100;

  const renderContentBlock = (block: ContentBlock, index: number) => {
    const blockId = `${currentPage}-${index}`;
    const isPlaying = playingBlock === blockId;
    const isLoadingAudio = playingBlock === `loading-${blockId}`;

    const renderAudioButton = (text: string) => (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handlePlayAudio(text, blockId)}
        className="rounded-full ios-glass p-2 text-brand-accent transition-all duration-300"
      >
        {isLoadingAudio ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isPlaying ? (
          <Pause size={18} />
        ) : (
          <Play size={18} />
        )}
      </motion.button>
    );

    const blockVariants = {
      hidden: { opacity: 0, y: 30, scale: 0.98 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: 'spring',
          damping: 25,
          stiffness: 200,
          delay: index * 0.08,
        },
      },
    };

    let contentNode: React.ReactNode = null;

    switch (block.type) {
      case 'heading':
        contentNode = (
          <div className="mb-6 mt-10 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-black tracking-tight text-brand-text">{block.text}</h2>
            {renderAudioButton(block.text)}
          </div>
        );
        break;
      case 'paragraph':
        contentNode = (
          <div className="mb-6 flex items-start gap-4">
            <p className="flex-grow text-lg leading-relaxed text-brand-text-secondary">{block.text}</p>
            {renderAudioButton(block.text)}
          </div>
        );
        break;
      case 'tip':
        contentNode = (
          <div className="ios-card relative my-8 overflow-hidden border-l-4 border-amber-400 p-6">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-amber-400/5 blur-2xl" />
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-amber-500">{t('category.expertTip')}</p>
                <p className="text-lg leading-relaxed text-brand-text">{block.text}</p>
              </div>
              {renderAudioButton(block.text)}
            </div>
          </div>
        );
        break;
      case 'template':
        contentNode = (
          <div className="ios-card my-8 border border-brand-accent/20 bg-brand-primary/30 p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-brand-accent">{t('category.template')}</p>
              <CopyButton textToCopy={block.text} />
            </div>
            <pre className="whitespace-pre-wrap rounded-xl border border-brand-accent/10 bg-brand-primary/50 p-4 font-mono text-sm text-brand-text">
              {block.text}
            </pre>
          </div>
        );
        break;
      case 'benefits':
        contentNode = (
          <div className="ios-card my-8 border-l-4 border-emerald-400 bg-emerald-500/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-500">{t('category.reward')}</p>
                <p className="text-lg leading-relaxed text-brand-text">{block.text}</p>
              </div>
              {renderAudioButton(block.text)}
            </div>
          </div>
        );
        break;
      case 'funFact':
        contentNode = (
          <div className="ios-card my-8 border-l-4 border-rose-400 bg-rose-500/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-rose-500">{t('category.didYouKnow')}</p>
                <p className="text-lg italic leading-relaxed text-brand-text">{block.text}</p>
              </div>
              {renderAudioButton(block.text)}
            </div>
          </div>
        );
        break;
      case 'infographic':
        contentNode = (
          <div className="ios-card my-8 border border-cyan-400/20 bg-cyan-500/5 p-6">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-cyan-400">{t('category.infographic')}</p>
            <p className="text-lg leading-relaxed text-brand-text">{block.text}</p>
          </div>
        );
        break;
      case 'quiz':
        contentNode = <QuizBlock block={block as QuizBlockType} />;
        break;
      case 'aiChallenge':
        contentNode = <AiChallengeBlock block={block as AiChallengeBlockType} />;
        break;
      case 'poll':
        contentNode = <PollBlock block={block as PollBlockType} />;
        break;
      case 'qAndA':
        contentNode = <QAndABlock block={block as QAndABlockType} />;
        break;
      case 'expertSays':
        contentNode = <ExpertSaysBlock block={block as ExpertSaysBlockType} />;
        break;
      case 'mythBuster':
        contentNode = <MythBusterBlock block={block as MythBusterBlockType} />;
        break;
      case 'doAndDont':
        contentNode = <DoAndDontBlock block={block as DoAndDontBlockType} />;
        break;
      case 'shockingFact':
        contentNode = <ShockingFactBlock block={block as ShockingFactBlockType} />;
        break;
      case 'ideaCorner':
        contentNode = <IdeaCornerBlock block={block as IdeaCornerBlockType} />;
        break;
      case 'flashcard':
        contentNode = <FlashcardBlock block={block as any} />;
        break;
      default:
        contentNode = null;
    }

    if (!contentNode) {
      return null;
    }

    return (
      <motion.div
        key={blockId}
        variants={blockVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        {contentNode}
      </motion.div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <Link to="/" className="group mb-8 inline-flex items-center gap-2 text-brand-text-secondary transition-colors hover:text-brand-accent">
        <div className="rounded-full p-2 ios-glass transition-all group-hover:bg-brand-accent group-hover:text-white">
          <ChevronLeft size={20} />
        </div>
        <span className="font-semibold">{t('common.backSkills')}</span>
      </Link>

      <div className="ios-card overflow-hidden">
        <div className="relative h-1.5 w-full overflow-hidden bg-brand-primary">
          <motion.div
            className="absolute left-0 top-0 h-full bg-brand-accent shadow-[0_0_15px_rgba(0,122,255,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ type: 'spring', damping: 30, stiffness: 100 }}
          />
        </div>

        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 1.05 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="mb-8 space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-accent">
                  {t('common.page')} {currentPage + 1} {t('common.of')} {subPages.length}
                </p>
                <h1 className="text-4xl font-black leading-none tracking-tighter text-brand-text md:text-6xl">
                  {currentSubPage.title}
                </h1>
              </div>

              <motion.div
                className="relative mb-12 overflow-hidden rounded-[var(--radius-ios-lg)] shadow-2xl"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <motion.img
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  src={`https://picsum.photos/seed/${encodeURIComponent(currentSubPage.imageSuggestion)}/1200/600`}
                  alt={currentSubPage.imageSuggestion}
                  className="aspect-video w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-medium italic text-white/80 backdrop-blur-md">
                    {t('common.story')}: {currentSubPage.motionStoryboard}
                  </p>
                </div>
              </motion.div>

              <div className="space-y-4">{currentSubPage.content.map(renderContentBlock)}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="fixed bottom-8 left-0 right-0 z-40 px-4">
        <div className="mx-auto flex max-w-lg items-center justify-between rounded-full p-2 shadow-2xl ios-glass">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrev}
            disabled={currentPage === 0}
            className="rounded-full bg-brand-primary/50 p-4 text-brand-text transition-all disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={24} />
          </motion.button>

          <div className="flex gap-1">
            {subPages.map((_, idx) => (
              <motion.div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === currentPage ? 'w-8 bg-brand-accent' : 'w-2 bg-brand-text-secondary/20'
                }`}
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            disabled={currentPage === subPages.length - 1}
            className="rounded-full bg-brand-accent p-4 text-white shadow-lg shadow-brand-accent/30 transition-all disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={24} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
