
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft, Play, Pause, Loader2 } from 'lucide-react';
import { SKILLS } from '../constants';
import type { GeneratedContent, ContentBlock, SubPage, QuizBlock as QuizBlockType, AiChallengeBlock as AiChallengeBlockType, PollBlock as PollBlockType, QAndABlock as QAndABlockType, ExpertSaysBlock as ExpertSaysBlockType, MythBusterBlock as MythBusterBlockType, DoAndDontBlock as DoAndDontBlockType, ShockingFactBlock as ShockingFactBlockType, IdeaCornerBlock as IdeaCornerBlockType } from '../types';
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

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [audioPlayer, setAudioPlayer] = useState<{ context: AudioContext; source: AudioBufferSourceNode } | null>(null);
  const [playingBlock, setPlayingBlock] = useState<string | null>(null);

  const skill = useMemo(() => SKILLS.find(s => s.id === categoryId), [categoryId]);

  const fetchContent = useCallback(async () => {
    if (!skill) {
        setError("Invalid skill category.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const generatedData = await generateSkillContent(skill.name);
      if (generatedData) {
        setContent(generatedData);
      } else {
        throw new Error("Content generate nahi ho paaya. AI guru shayad busy hain.");
      }
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, [skill]);

  useEffect(() => {
    fetchContent();
    setCurrentPage(0);
  }, [fetchContent]);

  const handleNext = () => {
    if (content && currentPage < content.subPages.length - 1) {
      setCurrentPage(currentPage + 1);
      stopAudio();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      stopAudio();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const stopAudio = () => {
    if (audioPlayer) {
      audioPlayer.source.stop();
      audioPlayer.context.close();
      setAudioPlayer(null);
      setPlayingBlock(null);
    }
  };

  const handlePlayAudio = async (text: string, blockId: string) => {
    if (playingBlock === blockId) {
        stopAudio();
        return;
    }
    
    stopAudio();
    setPlayingBlock('loading-' + blockId);

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
        console.error("Audio playback error:", e);
        setPlayingBlock(null);
    }
  };

  if (!skill) {
    return (
        <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-red-500 mb-4 tracking-tight">Skill nahi mili!</h2>
            <Link to="/" className="ios-btn bg-brand-accent text-white inline-flex items-center gap-2">
              <ArrowLeft size={20} />
              Home par wapas jaayein
            </Link>
        </div>
    );
  }

  if (loading) {
    return <Loading message={`Aapka ${skill.name} course ban raha hai...`} />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchContent} />;
  }
  
  if (!content || !content.subPages || content.subPages.length === 0) {
    return <ErrorMessage message="Iss skill ke liye koi content nahi mila." onRetry={fetchContent} />;
  }
  
  const currentSubPage: SubPage = content.subPages[currentPage];
  const progressPercentage = ((currentPage + 1) / content.subPages.length) * 100;

  const renderContentBlock = (block: ContentBlock, index: number) => {
    const blockId = `${currentPage}-${index}`;
    const isPlaying = playingBlock === blockId;
    const isLoadingAudio = playingBlock === 'loading-' + blockId;

    const renderAudioButton = (text: string) => (
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handlePlayAudio(text, blockId)} 
        className="p-2 rounded-full ios-glass text-brand-accent transition-all duration-300"
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
          delay: index * 0.08 
        } 
      }
    };

    let contentNode = null;

    switch (block.type) {
      case 'heading':
        contentNode = (
          <div className="flex items-center justify-between gap-4 mt-10 mb-6">
            <h2 className="text-3xl font-black text-brand-text tracking-tight">{block.text}</h2>
            {renderAudioButton(block.text)}
          </div>
        );
        break;
      case 'paragraph':
        contentNode = (
          <div className="flex gap-4 items-start mb-6">
            <p className="text-lg text-brand-text-secondary leading-relaxed flex-grow">{block.text}</p>
            {renderAudioButton(block.text)}
          </div>
        );
        break;
      case 'tip':
        contentNode = (
          <div className="ios-card p-6 border-l-4 border-amber-400 my-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-amber-500">💡 Expert Salah</p>
                <p className="text-lg text-brand-text leading-relaxed">{block.text}</p>
              </div>
              {renderAudioButton(block.text)}
            </div>
          </div>
        );
        break;
      case 'template':
        contentNode = (
          <div className="ios-card p-6 my-8 border border-brand-accent/20 bg-brand-primary/30">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-black uppercase tracking-widest text-brand-accent">📋 Template</p>
              <CopyButton textToCopy={block.text} />
            </div>
            <pre className="text-sm text-brand-text whitespace-pre-wrap font-mono bg-brand-primary/50 p-4 rounded-xl border border-brand-accent/10">
              {block.text}
            </pre>
          </div>
        );
        break;
      case 'benefits':
        contentNode = (
          <div className="ios-card p-6 border-l-4 border-emerald-400 my-8 bg-emerald-500/5">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-500">🚀 Aapka Inaam</p>
                <p className="text-lg text-brand-text leading-relaxed">{block.text}</p>
              </div>
              {renderAudioButton(block.text)}
            </div>
          </div>
        );
        break;
      case 'funFact':
        contentNode = (
          <div className="ios-card p-6 border-l-4 border-rose-400 my-8 bg-rose-500/5">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-rose-500">🤯 Kya Aap Jaante Hain?</p>
                <p className="text-lg text-brand-text leading-relaxed italic">{block.text}</p>
              </div>
              {renderAudioButton(block.text)}
            </div>
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
        return null;
    }

    return (
      <motion.div
        key={blockId}
        variants={blockVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {contentNode}
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <Link to="/" className="inline-flex items-center gap-2 text-brand-text-secondary hover:text-brand-accent mb-8 transition-colors group">
        <div className="p-2 rounded-full ios-glass group-hover:bg-brand-accent group-hover:text-white transition-all">
          <ChevronLeft size={20} />
        </div>
        <span className="font-semibold">Sabhi Skills</span>
      </Link>

      <div className="ios-card overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-brand-primary relative overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-brand-accent shadow-[0_0_15px_rgba(0,122,255,0.5)]" 
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
              <div className="space-y-2 mb-8">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-accent">
                  Page {currentPage + 1} of {content.subPages.length}
                </p>
                <h1 className="text-4xl md:text-6xl font-black text-brand-text tracking-tighter leading-none">
                  {currentSubPage.title}
                </h1>
              </div>

              <motion.div 
                className="relative rounded-[var(--radius-ios-lg)] overflow-hidden mb-12 shadow-2xl"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <motion.img 
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  src={`https://picsum.photos/seed/${encodeURIComponent(currentSubPage.imageSuggestion)}/1200/600`} 
                  alt={currentSubPage.imageSuggestion}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-white/80 text-sm font-medium italic backdrop-blur-md bg-black/20 p-3 rounded-2xl border border-white/10">
                    ✨ {currentSubPage.motionStoryboard}
                  </p>
                </div>
              </motion.div>

              <div className="space-y-4">
                {currentSubPage.content.map(renderContentBlock)}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-8 left-0 right-0 px-4 z-40">
        <div className="max-w-lg mx-auto ios-glass rounded-full p-2 flex items-center justify-between shadow-2xl">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrev} 
            disabled={currentPage === 0}
            className="p-4 rounded-full bg-brand-primary/50 text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={24} />
          </motion.button>
          
          <div className="flex gap-1">
            {content.subPages.map((_, idx) => (
              <motion.div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentPage ? 'w-8 bg-brand-accent' : 'w-2 bg-brand-text-secondary/20'}`}
              />
            ))}
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext} 
            disabled={currentPage === content.subPages.length - 1}
            className="p-4 rounded-full bg-brand-accent text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-brand-accent/30 transition-all"
          >
            <ChevronRight size={24} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
