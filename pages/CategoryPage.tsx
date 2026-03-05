import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Play,
  Pause,
  Loader2,
  Clapperboard,
  Lightbulb,
  ListChecks,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
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
import { logUsageEvent } from '../services/analyticsService';

type GiftResource = {
  title: string;
  description: string;
  url: string;
  tag: string;
};

const LESSON_VIDEOS = [
  'https://cdn.pixabay.com/video/2024/02/16/200854-913632171_large.mp4',
  'https://cdn.pixabay.com/video/2021/08/04/83854-584418641_large.mp4',
  'https://cdn.pixabay.com/video/2020/03/24/34015-399677271_large.mp4',
];

const DEFAULT_GIFTS: GiftResource[] = [
  {
    title: 'Roadmap.sh',
    description: 'Structured skill roadmaps jo learning ko fast and practical banate hain.',
    url: 'https://roadmap.sh/',
    tag: 'Learning Map',
  },
  {
    title: 'Excalidraw',
    description: 'Ideas aur workflows ko quickly visualize karne ka super clean whiteboard tool.',
    url: 'https://excalidraw.com/',
    tag: 'Visual Thinking',
  },
  {
    title: 'Photopea',
    description: 'Browser-based pro-level editor jo quick creative experiments ke liye perfect hai.',
    url: 'https://www.photopea.com/',
    tag: 'Creative Tool',
  },
  {
    title: 'Regex101',
    description: 'Text automation aur pattern understanding ke liye hidden gem.',
    url: 'https://regex101.com/',
    tag: 'Power Utility',
  },
];

const SKILL_GIFT_MAP: Record<string, GiftResource> = {
  'graphic-design': {
    title: 'Coolors Palette Generator',
    description: 'Professional color palette building ka fast tool jo design quality instantly improve karta hai.',
    url: 'https://coolors.co/',
    tag: 'Design Gift',
  },
  'video-editing': {
    title: 'Shotdeck Style Frames',
    description: 'Visual framing aur cinematic inspiration ke liye advanced reference library.',
    url: 'https://shotdeck.com/',
    tag: 'Video Gift',
  },
  'content-writing': {
    title: 'Hemingway Editor',
    description: 'Writing clarity boost karne ka tool jo text ko readable aur sharp banata hai.',
    url: 'https://hemingwayapp.com/',
    tag: 'Writing Gift',
  },
  programming: {
    title: 'DevDocs',
    description: 'Multiple docs ek jagah. Fast coding flow ke liye minimal docs engine.',
    url: 'https://devdocs.io/',
    tag: 'Code Gift',
  },
  'digital-marketing': {
    title: 'AlsoAsked',
    description: 'Real query tree se content strategy aur intent mapping improve hoti hai.',
    url: 'https://alsoasked.com/',
    tag: 'Marketing Gift',
  },
  animation: {
    title: 'LottieFiles',
    description: 'Micro-animations aur smooth UI motion assets ka trusted source.',
    url: 'https://lottiefiles.com/',
    tag: 'Animation Gift',
  },
};

const makeTrustedSourceLinks = (skillName: string, pageTitle: string) => {
  const query = encodeURIComponent(`${skillName} ${pageTitle} tutorial guide`);
  return [
    {
      label: 'Google',
      href: `https://www.google.com/search?q=${query}`,
      note: 'Quick verified web results',
    },
    {
      label: 'YouTube',
      href: `https://www.youtube.com/results?search_query=${query}`,
      note: 'Video walkthroughs and demos',
    },
    {
      label: 'Reddit',
      href: `https://www.reddit.com/search/?q=${query}`,
      note: 'Community discussion and practical tips',
    },
    {
      label: 'Pinterest',
      href: `https://in.pinterest.com/search/pins/?q=${query}`,
      note: 'Visual references and idea boards',
    },
  ];
};

const textFromBlock = (block: ContentBlock): string => {
  switch (block.type) {
    case 'heading':
    case 'paragraph':
    case 'tip':
    case 'template':
    case 'benefits':
    case 'infographic':
    case 'funFact':
      return block.text;
    case 'qAndA':
      return `${block.question} ${block.answer}`;
    case 'mythBuster':
      return `${block.myth} ${block.reality}`;
    case 'shockingFact':
      return block.fact;
    case 'ideaCorner':
      return block.prompt;
    default:
      return '';
  }
};

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t, localizeItem } = useLocale();
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [audioPlayer, setAudioPlayer] = useState<{ context: AudioContext; source: AudioBufferSourceNode } | null>(null);
  const [playingBlock, setPlayingBlock] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [activityChecks, setActivityChecks] = useState<boolean[]>([]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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
  const activityStorageKey = `course-activity-${skill?.id || 'unknown'}-${currentPage}`;
  const feedbackStorageKey = `course-feedback-${skill?.id || 'unknown'}`;

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
  const lessonVideoUrl = LESSON_VIDEOS[currentPage % LESSON_VIDEOS.length];
  const visualHighlights = currentSubPage.content
    .map((block) => textFromBlock(block))
    .filter((text) => text.trim().length > 0)
    .slice(0, 3)
    .map((text) => (text.length > 120 ? `${text.slice(0, 117)}...` : text));

  while (visualHighlights.length < 3) {
    visualHighlights.push('Is section me step-by-step practice points milenge. Focus mode me padho aur apply karo.');
  }

  const practiceQuestions = [
    `${currentSubPage.title} ka main goal 1 line me explain karo.`,
    'Is page ka sabse practical step kaunsa hai jo tum aaj apply kar sakte ho?',
    'Agar client ko ye topic samjhana ho, tum kaise explain karoge?',
  ];

  const whyBlock =
    currentSubPage.content.find((block) => block.type === 'benefits')?.type === 'benefits'
      ? (currentSubPage.content.find((block) => block.type === 'benefits') as { type: 'benefits'; text: string }).text
      : 'Ye topic aapko real client problems solve karna sikhaata hai, isliye iski demand high rehti hai.';
  const howBlock =
    currentSubPage.content.find((block) => block.type === 'template')?.type === 'template'
      ? (currentSubPage.content.find((block) => block.type === 'template') as { type: 'template'; text: string }).text
      : 'Step-by-step plan follow karke, har step ko practical output me convert karo.';
  const riskPoints =
    currentSubPage.content.find((block) => block.type === 'doAndDont')?.type === 'doAndDont'
      ? (currentSubPage.content.find((block) => block.type === 'doAndDont') as DoAndDontBlockType).donts
      : ['Without practice learning stick nahi hoti', 'Random direction se time waste hota hai', 'No review means slow growth'];

  const deepDiveCards = [
    {
      title: 'Kyun Zaroori Hai?',
      content: whyBlock,
    },
    {
      title: 'Kaise Karein?',
      content: howBlock.split('\n').join(' '),
    },
    {
      title: 'Kya Fayda Hoga?',
      content: 'Aap faster projects complete karoge, better portfolio banega, aur client confidence boost hoga.',
    },
    {
      title: 'Kya Nuksan Ho Sakta Hai?',
      content: riskPoints.join(', '),
    },
  ];

  const quickActivities = [
    `2-minute recap: ${currentSubPage.title} ka summary bolo.`,
    '3 key terms pick karo aur har term ka 1 practical example do.',
    '1 mini output banao jo aaj hi kisi ko dikhaya ja sake.',
    'Self review: 1 strength + 1 improvement point likho.',
  ];

  const activityProgress =
    activityChecks.length > 0
      ? Math.round((activityChecks.filter(Boolean).length / activityChecks.length) * 100)
      : 0;

  const chartStats = [
    { label: 'Concept Clarity', value: Math.min(98, 58 + currentPage * 6) },
    { label: 'Practical Readiness', value: Math.min(97, 52 + currentPage * 7) },
    { label: 'Client Confidence', value: Math.min(96, 47 + currentPage * 6) },
    { label: 'Speed Learning', value: Math.min(95, 54 + currentPage * 5) },
  ];

  const faqItems = [
    {
      q: `${skill.name} seekhne ka fastest path kya hai?`,
      a: 'Daily short practice + weekly mini project + real feedback cycle. Sirf content consume mat karo, output build karo.',
    },
    {
      q: 'Agar topic difficult lage to kya karu?',
      a: 'Topic ko micro-steps me tod do: observe, replicate, customize, publish. Har step ke baad quick revision karo.',
    },
    {
      q: 'Client-ready hone me kitna time lag sakta hai?',
      a: 'Consistency par depend karta hai, lekin focused routine ke saath 4-8 hafton me strong beginner level aa sakta hai.',
    },
    {
      q: 'Is course ko YouTube se better kaise use karu?',
      a: 'Yahan structured flow + activities + checkpoints + feedback loop use karo. Har page ko ek mini mission treat karo.',
    },
  ];

  const giftResource = SKILL_GIFT_MAP[skill.id] || DEFAULT_GIFTS[currentPage % DEFAULT_GIFTS.length];
  const giftUnlocked = currentPage === subPages.length - 1;

  const stepFlow = [
    `Step 1: ${currentSubPage.title} ka objective clear karo aur expected output likho.`,
    `Step 2: Video section dekhkar kam se kam 3 practical notes likho.`,
    `Step 3: Visual points me se 1 point choose karke mini task execute karo.`,
    'Step 4: Quick Q&A, Poll aur Quiz solve karo for instant recall.',
    'Step 5: Apna final output publish karo aur next page pe improve version banao.',
  ];

  const trustedSources = makeTrustedSourceLinks(skill.name, currentSubPage.title);
  const existingQnA = currentSubPage.content.find((block) => block.type === 'qAndA') as QAndABlockType | undefined;
  const existingPoll = currentSubPage.content.find((block) => block.type === 'poll') as PollBlockType | undefined;
  const existingQuiz = currentSubPage.content.find((block) => block.type === 'quiz') as QuizBlockType | undefined;

  const quickQnA: QAndABlockType =
    existingQnA ??
    ({
      type: 'qAndA',
      question: `${currentSubPage.title} ka fastest starting point kya hai?`,
      answer: visualHighlights[0] || 'Pehle objective clear karo, phir ek small action lekar start karo.',
    } as QAndABlockType);

  const quickPoll: PollBlockType =
    existingPoll ??
    ({
      type: 'poll',
      question: 'Aapka preferred learning style kya hai?',
      options: ['Pehle video phir practice', 'Pehle reading phir notes', 'Direct project build karke seekhna'],
    } as PollBlockType);

  const quickQuiz: QuizBlockType =
    existingQuiz ??
    ({
      type: 'quiz',
      question: `${currentSubPage.title} me best first step kaunsa hai?`,
      options: ['Objective clear karna', 'Random advanced tool se start karna', 'Bina plan practice skip karna'],
      correctAnswerIndex: 0,
      explanation: 'Clear objective se speed, accuracy aur confidence teeno improve hote hain.',
    } as QuizBlockType);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(activityStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === quickActivities.length) {
          setActivityChecks(parsed.map(Boolean));
          return;
        }
      }
    } catch {
      // ignore
    }
    setActivityChecks(new Array(quickActivities.length).fill(false));
  }, [activityStorageKey, currentPage]);

  useEffect(() => {
    if (activityChecks.length === 0) {
      return;
    }
    try {
      localStorage.setItem(activityStorageKey, JSON.stringify(activityChecks));
    } catch {
      // ignore
    }
  }, [activityChecks, activityStorageKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(feedbackStorageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (typeof parsed?.rating === 'number') {
        setFeedbackRating(parsed.rating);
      }
      if (typeof parsed?.text === 'string') {
        setFeedbackText(parsed.text);
      }
      if (typeof parsed?.submitted === 'boolean') {
        setFeedbackSubmitted(parsed.submitted);
      }
    } catch {
      // ignore
    }
  }, [feedbackStorageKey, skill.id]);

  const toggleActivity = (idx: number) => {
    setActivityChecks((prev) => prev.map((item, index) => (index === idx ? !item : item)));
  };

  const handleFeedbackSubmit = () => {
    try {
      localStorage.setItem(
        feedbackStorageKey,
        JSON.stringify({
          rating: feedbackRating,
          text: feedbackText,
          submitted: true,
        })
      );
    } catch {
      // ignore
    }
    setFeedbackSubmitted(true);
    void logUsageEvent('tool_action', {
      toolId: `course-feedback-${skill.id}`,
      action: 'submit_feedback',
      rating: feedbackRating,
    });
  };

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
    <div className="mx-auto max-w-4xl pb-24 motion-smooth">
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

              <div className="mb-10 grid gap-4 md:grid-cols-3">
                {visualHighlights.map((highlight, idx) => (
                  <div key={`${currentPage}-highlight-${idx}`} className="ios-card border border-brand-accent/10 p-4">
                    <p className="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent">
                      <Lightbulb size={14} />
                      Visual Point {idx + 1}
                    </p>
                    <p className="text-sm leading-relaxed text-brand-text-secondary">{highlight}</p>
                  </div>
                ))}
              </div>

              <div className="mb-10 ios-card border border-brand-accent/15 p-5">
                <p className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent">
                  <Sparkles size={14} />
                  Step-by-Step Fast Learning Flow
                </p>
                <div className="space-y-3">
                  {stepFlow.map((step, idx) => (
                    <motion.div
                      key={`${currentPage}-step-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-3"
                    >
                      <p className="text-sm font-semibold text-brand-text">{step}</p>
                    </motion.div>
                  ))}
                </div>
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

              <div className="mb-10 grid gap-6 lg:grid-cols-2">
                <div className="ios-card overflow-hidden border border-brand-accent/20 p-4">
                  <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent">
                    <Clapperboard size={14} />
                    Visual Lesson Video
                  </p>
                  <video
                    key={`${currentPage}-video`}
                    controls
                    preload="metadata"
                    poster={`https://picsum.photos/seed/${encodeURIComponent(currentSubPage.title)}/1200/600`}
                    className="aspect-video w-full rounded-xl border border-brand-text-secondary/10 bg-black/40"
                  >
                    <source src={lessonVideoUrl} type="video/mp4" />
                  </video>
                  <p className="mt-3 text-sm text-brand-text-secondary">
                    Video dekhne ke baad neeche ke questions ka answer khud se likho. Isse retention aur speed dono improve hoti hai.
                  </p>
                </div>

                <div className="ios-card border border-brand-accent/20 p-4">
                  <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent">
                    <ListChecks size={14} />
                    Speed Check Questions
                  </p>
                  <div className="space-y-3">
                    {practiceQuestions.map((question, idx) => (
                      <div key={`${currentPage}-question-${idx}`} className="rounded-xl bg-brand-primary/40 p-3">
                        <p className="text-sm font-semibold text-brand-text">Q{idx + 1}. {question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-10 space-y-6">
                <div className="ios-card border border-brand-accent/20 p-5">
                  <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent">
                    <ListChecks size={14} />
                    Quick Practice Zone
                  </p>
                  <div className="space-y-4">
                    <QAndABlock block={quickQnA} />
                    <PollBlock block={quickPoll} />
                    <QuizBlock block={quickQuiz} />
                  </div>
                </div>

                <div className="ios-card border border-brand-accent/20 p-5">
                  <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent">
                    <ExternalLink size={14} />
                    Trusted Learning Sources
                  </p>
                  <p className="mb-4 text-sm text-brand-text-secondary">
                    Is topic ko aur deep samajhne ke liye niche trusted source links diye gaye hain.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {trustedSources.map((source) => (
                      <a
                        key={`${currentPage}-${source.label}`}
                        href={source.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-3 transition hover:border-brand-accent/40"
                      >
                        <p className="text-sm font-black text-brand-text">{source.label}</p>
                        <p className="text-xs text-brand-text-secondary">{source.note}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-10 grid gap-6 lg:grid-cols-2">
                <div className="ios-card border border-brand-accent/20 p-5">
                  <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent">
                    <Sparkles size={14} />
                    Learning Performance Chart
                  </p>
                  <div className="space-y-3">
                    {chartStats.map((item) => (
                      <div key={`${currentPage}-${item.label}`}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-semibold text-brand-text-secondary">{item.label}</span>
                          <span className="text-xs font-black text-brand-accent">{item.value}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-brand-primary/60">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-brand-accent to-cyan-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ios-card border border-brand-accent/20 p-5">
                  <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent">
                    <ListChecks size={14} />
                    Activity Board
                  </p>
                  <p className="mb-3 text-sm text-brand-text-secondary">
                    In activities ko tick karo. Progress badhegi to retention bhi improve hoga.
                  </p>
                  <div className="mb-3 h-2 overflow-hidden rounded-full bg-brand-primary/60">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${activityProgress}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-brand-accent"
                    />
                  </div>
                  <p className="mb-4 text-xs font-black uppercase tracking-widest text-brand-accent">
                    Progress: {activityProgress}%
                  </p>
                  <div className="space-y-2">
                    {quickActivities.map((activity, idx) => (
                      <label
                        key={`${currentPage}-activity-${idx}`}
                        className="flex items-start gap-3 rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-3"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(activityChecks[idx])}
                          onChange={() => toggleActivity(idx)}
                          className="mt-1"
                        />
                        <span className="text-sm text-brand-text">{activity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-10 grid gap-6 lg:grid-cols-2">
                <div className="ios-card border border-brand-accent/20 p-5">
                  <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent">
                    <Sparkles size={14} />
                    End Reward
                  </p>
                  {!giftUnlocked ? (
                    <div className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4">
                      <p className="text-sm font-semibold text-brand-text">
                        Gift unlock karne ke liye last page tak complete karo.
                      </p>
                      <p className="mt-2 text-sm text-brand-text-secondary">
                        Last page pe ek hidden useful resource/tool milega jo daily workflow ko upgrade karega.
                      </p>
                    </div>
                  ) : (
                    <a
                      href={giftResource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 transition hover:border-emerald-400/60"
                    >
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-400">{giftResource.tag}</p>
                      <h3 className="mt-1 text-lg font-black text-brand-text">{giftResource.title}</h3>
                      <p className="mt-2 text-sm text-brand-text-secondary">{giftResource.description}</p>
                      <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-400">
                        Open Resource <ExternalLink size={14} />
                      </p>
                    </a>
                  )}
                </div>

                <div className="ios-card border border-brand-accent/20 p-5">
                  <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent">
                    <Sparkles size={14} />
                    Feedback
                  </p>
                  <p className="mb-3 text-sm text-brand-text-secondary">
                    Course quality improve karne ke liye quick feedback do.
                  </p>
                  <div className="mb-3 flex gap-2">
                    {[1, 2, 3, 4, 5].map((rate) => (
                      <button
                        key={`${currentPage}-rate-${rate}`}
                        onClick={() => setFeedbackRating(rate)}
                        className={`rounded-lg px-3 py-2 text-sm font-bold ${
                          feedbackRating === rate ? 'bg-brand-accent text-white' : 'bg-brand-primary/50 text-brand-text'
                        }`}
                      >
                        {rate}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={4}
                    placeholder="Aapko kya best laga, aur kya improve hona chahiye?"
                    className="w-full rounded-xl border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-3 text-brand-text outline-none"
                  />
                  <button
                    onClick={handleFeedbackSubmit}
                    className="mt-3 rounded-xl bg-brand-accent px-4 py-2 text-sm font-bold text-white"
                  >
                    {feedbackSubmitted ? 'Feedback Saved' : 'Submit Feedback'}
                  </button>
                </div>
              </div>

              <div className="mb-10 ios-card border border-brand-accent/20 p-5">
                <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent">
                  <ListChecks size={14} />
                  FAQ
                </p>
                <div className="space-y-2">
                  {faqItems.map((item, idx) => (
                    <div key={`${currentPage}-faq-${idx}`} className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40">
                      <button
                        onClick={() => setOpenFaqIndex((prev) => (prev === idx ? null : idx))}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <span className="text-sm font-bold text-brand-text">{item.q}</span>
                        <span className="text-brand-accent">{openFaqIndex === idx ? '−' : '+'}</span>
                      </button>
                      <AnimatePresence>
                        {openFaqIndex === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden px-4 pb-4"
                          >
                            <p className="text-sm text-brand-text-secondary">{item.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

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
