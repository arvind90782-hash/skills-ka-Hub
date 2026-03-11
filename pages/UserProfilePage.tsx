import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Camera,
  Save,
  Award,
  Trophy,
  Star,
  Zap,
  Target,
  Lock,
  Unlock,
  CheckCircle,
  BookOpen,
  Gift,
  TrendingUp,
  Edit3,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  getCreatorLevel,
  getLevelProgress,
  getCompletedCourseCount,
  isSecretCreatorLabUnlocked,
  getOverallProgressChecklist
} from '../services/courseProgressService';

type UserProfile = {
  displayName: string;
  username: string;
  bio: string;
  skillLevel: string;
  interests: string[];
  avatarUrl: string;
  xpPoints: number;
  badges: string[];
  joinDate: string;
};

const SKILL_LEVELS = [
  { id: 'beginner', label: 'Beginner', color: 'from-green-400 to-emerald-500', xpNeeded: 0 },
  { id: 'intermediate', label: 'Intermediate', color: 'from-blue-400 to-cyan-500', xpNeeded: 500 },
  { id: 'advanced', label: 'Advanced', color: 'from-purple-400 to-pink-500', xpNeeded: 1500 },
  { id: 'expert', label: 'Expert', color: 'from-amber-400 to-orange-500', xpNeeded: 3000 },
  { id: 'master', label: 'Master', color: 'from-red-400 to-pink-600', xpNeeded: 5000 }
];

const INTERESTS = [
  'Video Editing',
  'Graphic Design',
  'Content Writing',
  'Programming',
  'Digital Marketing',
  'Animation',
  'Thumbnail Design',
  'YouTube Growth',
  'Freelancing',
  'AI Tools'
];

const DEFAULT_BADGES = [
  { id: 'first-course', name: 'First Step', description: 'Complete your first course', icon: <BookOpen size={20} /> },
  { id: 'quiz-master', name: 'Quiz Master', description: 'Score 100% in 5 quizzes', icon: <Award size={20} /> },
  { id: 'early-bird', name: 'Early Bird', description: 'Login 7 days in a row', icon: <Zap size={20} /> },
  { id: 'creator-lab', name: 'Secret Explorer', description: 'Unlock Secret Creator Lab', icon: <Gift size={20} /> },
  { id: 'completionist', name: 'Completionist', description: 'Complete all courses', icon: <Trophy size={20} /> }
];

const LEVEL_REWARD_SEQUENCE = [
  { label: 'Beginner Creator', detail: 'Creator Motivation Tool + Content Idea Generator' },
  { label: 'Smart Creator', detail: 'Skill Practice Generator + Boring Content Fixer' },
  { label: 'Pro Creator', detail: 'Reel Idea Builder + Reel Script Maker' },
  { label: 'Elite Creator', detail: 'Thumbnail Title Tester + Full Secret Lab Access' }
];

const ENGAGEMENT_PROMPTS = [
  {
    tag: '🔥 Quick Tip',
    text: 'Socho zara... Poll aur Q&A ek hi session me complete karne se streak bana rahega aur secret lab unlock jaldi hoga.'
  },
  {
    tag: '🤯 Mind Blowing Fact',
    text: 'Ye trick 90% log nahi jaante: har quiz attempt ke baad turant ek short reflection note likhne se revision ke liye content ready ho jata hai.'
  },
  {
    tag: '⚡ Pro Shortcut',
    text: 'Thoda dhyan se samjho aur ek mini challenge me 60 second me result share karo – yeh micro-task se commitment build hota hai.'
  },
  {
    tag: '🎯 Try This Right Now',
    text: 'Open Video Editing path aur current page ka poll + quiz solve karo. Fir ek quick note likho: “Maine abhi kya apply kiya”.',
    actionLabel: 'Open Video Editing',
    actionLink: '/category/video-editing'
  },
  {
    tag: '🧠 Creator Mindset Trick',
    text: 'Agar tum yaha tak pahunch gaye ho to iska matlab tum normal learner nahi ho. Mini challenge ke baad victory pose imagine karo aur phir agle lesson me jump maro.'
  }
];

const SECRET_REWARD_LIST = [
  'CapCut reel hook presets aur template switches',
  'Notion viral script frameworks + AI prompt library',
  'Free premium LUT kits for cinematic reels',
  'Creator automation workflow checklist (Zapier + shortcuts)'
];

const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    displayName: '',
    username: '',
    bio: '',
    skillLevel: 'beginner',
    interests: [],
    avatarUrl: '',
    xpPoints: 0,
    badges: [],
    joinDate: new Date().toISOString()
  });

  const [editForm, setEditForm] = useState<UserProfile>(profile);
  const creatorLevel = getCreatorLevel();
  const levelProgress = getLevelProgress();
  const completedCourses = getCompletedCourseCount();
  const labUnlocked = isSecretCreatorLabUnlocked();
  const progressChecklist = getOverallProgressChecklist();
  const requirementStats = [
    { label: 'Lessons', current: progressChecklist.lessonCount, target: progressChecklist.totalLessons },
    { label: 'Quizzes', current: progressChecklist.quizCount, target: progressChecklist.totalLessons },
    { label: 'Polls', current: progressChecklist.pollCount, target: progressChecklist.totalLessons },
    { label: 'Q&A', current: progressChecklist.qnaCount, target: progressChecklist.totalLessons },
    { label: 'Mini Challenges', current: progressChecklist.miniChallengeCount, target: progressChecklist.totalLessons }
  ];
  const requirementsDone = requirementStats.every((item) => item.target > 0 && item.current >= item.target);
  const labStatusText = labUnlocked ? 'Unlocked' : requirementsDone ? 'Almost ready' : 'Locked';
  const levelRewards = LEVEL_REWARD_SEQUENCE.map((reward, index) => ({
    ...reward,
    unlocked: levelProgress.levelIndex >= index && levelProgress.levelIndex >= 0
  }));

  useEffect(() => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setEditForm(parsed);
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    } else if (user) {
      const initialProfile = {
        displayName: user.displayName || user.email?.split('@')[0] || '',
        username: user.email?.split('@')[0] || '',
        bio: '',
        skillLevel: 'beginner',
        interests: [],
        avatarUrl: user.photoURL || '',
        xpPoints: completedCourses * 100,
        badges: completedCourses > 0 ? ['first-course'] : [],
        joinDate: new Date().toISOString()
      };
      setProfile(initialProfile);
      setEditForm(initialProfile);
    }
  }, [user, completedCourses]);

  const saveProfile = () => {
    const updatedProfile = {
      ...editForm,
      xpPoints: profile.xpPoints,
      badges: profile.badges,
      joinDate: profile.joinDate
    };
    setProfile(updatedProfile);
    localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
    setIsEditing(false);
  };

  const toggleInterest = (interest: string) => {
    setEditForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const currentLevel = SKILL_LEVELS.find(l => l.id === profile.skillLevel) || SKILL_LEVELS[0];
  const nextLevel = SKILL_LEVELS[SKILL_LEVELS.findIndex(l => l.id === profile.skillLevel) + 1];
  const levelProgressPercent = nextLevel 
    ? Math.min(100, ((profile.xpPoints - currentLevel.xpNeeded) / (nextLevel.xpNeeded - currentLevel.xpNeeded)) * 100)
    : 100;

  const unlockedBadges = DEFAULT_BADGES.filter(b => profile.badges.includes(b.id));
  const lockedBadges = DEFAULT_BADGES.filter(b => !profile.badges.includes(b.id));

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <Link to="/" className="group mb-8 inline-flex items-center gap-2 text-brand-text-secondary transition-colors hover:text-brand-accent">
        <div className="rounded-full p-2 ios-glass transition-all group-hover:bg-brand-accent group-hover:text-white">
          <ArrowLeft size={20} />
        </div>
        <span className="font-semibold">Back to Home</span>
      </Link>

      {/* Profile Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-card overflow-hidden"
      >
        <div className="relative bg-gradient-to-br from-brand-accent/20 via-brand-primary to-purple-500/10 p-8">
          {/* Banner decorations */}
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

          <div className="relative flex flex-col items-center gap-6 md:flex-row">
            {/* Avatar */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-accent to-purple-400 blur-xl opacity-50"></div>
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-brand-accent/30 shadow-2xl">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand-primary">
                    <User size={48} className="text-brand-text-secondary" />
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-brand-accent p-2 text-white shadow-lg transition-transform hover:scale-110">
                  <Camera size={16} />
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
              {/* Level Badge */}
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -bottom-2 -right-2 rounded-full bg-gradient-to-r from-brand-accent to-purple-500 p-2 shadow-lg"
              >
                <Star size={16} className="text-white" />
              </motion.div>
            </motion.div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Display Name"
                        value={editForm.displayName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                        className="rounded-lg border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-2 text-brand-text outline-none focus:border-brand-accent/40"
                      />
                      <input
                        type="text"
                        placeholder="Username"
                        value={editForm.username}
                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                        className="rounded-lg border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-2 text-brand-text outline-none focus:border-brand-accent/40"
                      />
                    </div>
                    <textarea
                      placeholder="Bio (tell us about yourself)"
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      rows={2}
                      className="w-full rounded-lg border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-2 text-brand-text outline-none focus:border-brand-accent/40"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center justify-center gap-2 md:justify-start">
                      <h1 className="text-3xl font-black text-brand-text">
                        {profile.displayName || profile.username || 'Creator'}
                      </h1>
                      <span className="text-lg text-brand-text-secondary">@{profile.username}</span>
                    </div>
                    <p className="mt-2 text-brand-text-secondary">
                      {profile.bio || 'No bio yet. Click edit to add one!'}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                      <span className={`rounded-full bg-gradient-to-r ${currentLevel.color} px-3 py-1 text-xs font-bold text-white`}>
                        {currentLevel.label}
                      </span>
                      <span className="rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-1 text-xs font-bold text-brand-accent">
                        {creatorLevel || 'New Creator'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Edit Button */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-lg border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-2 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-primary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-accent/80"
                  >
                    <Save size={16} />
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-2 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-accent/10"
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* XP & Level Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="ios-card mt-6 border border-brand-accent/20 p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-brand-accent to-purple-500">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-text-secondary">XP Points</p>
              <p className="text-2xl font-black text-brand-text">{profile.xpPoints}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-brand-text-secondary">
              {nextLevel ? `Next: ${nextLevel.label}` : 'Max Level!'}
            </p>
            <p className="text-xs text-brand-text-secondary">
              {nextLevel ? `${nextLevel.xpNeeded - profile.xpPoints} XP to go` : 'Congratulations!'}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold text-brand-text-secondary mb-1">
            <span>Level Progress</span>
            <span>{Math.round(levelProgressPercent)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-brand-primary/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${levelProgressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-brand-accent to-purple-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        <div className="ios-card p-4 text-center">
          <BookOpen className="mx-auto mb-2 text-brand-accent" size={24} />
          <p className="text-2xl font-black text-brand-text">{completedCourses}</p>
          <p className="text-xs font-semibold text-brand-text-secondary">Courses Completed</p>
        </div>
        <div className="ios-card p-4 text-center">
          <Trophy className="mx-auto mb-2 text-amber-400" size={24} />
          <p className="text-2xl font-black text-brand-text">{profile.badges.length}</p>
          <p className="text-xs font-semibold text-brand-text-secondary">Badges Earned</p>
        </div>
        <div className="ios-card p-4 text-center">
          <Target className="mx-auto mb-2 text-emerald-400" size={24} />
          <p className="text-2xl font-black text-brand-text">{levelProgress.currentLevel || 'New'}</p>
          <p className="text-xs font-semibold text-brand-text-secondary">Creator Level</p>
        </div>
        <div className="ios-card p-4 text-center">
          <Gift className="mx-auto mb-2 text-purple-400" size={24} />
          <p className="text-2xl font-black text-brand-text">{profile.interests.length}</p>
          <p className="text-xs font-semibold text-brand-text-secondary">Interests Selected</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-card mt-6 border border-brand-accent/20 p-6 space-y-6"
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.95fr]">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Gift size={24} className="text-brand-accent" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-brand-accent">Secret Creator Lab</p>
                  <h3 className="text-2xl font-black text-brand-text">Unlock ke liye mission</h3>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  labUnlocked
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : requirementsDone
                      ? 'bg-amber-500/10 text-amber-300'
                      : 'bg-brand-primary/20 text-brand-text-secondary'
                }`}
              >
                {labStatusText}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              Socho zara… quiz, poll, Q&A aur mini challenge ek hi rhythm me finish karte hi lab unlock ho jayega. Thoda dhyan se samjho kyunki ye powerful hai.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {requirementStats.map((req) => {
                const percent = req.target ? Math.min(100, Math.round((req.current / req.target) * 100)) : 0;
                const done = req.target > 0 && req.current >= req.target;
                return (
                  <div key={req.label} className="rounded-3xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className={`${done ? 'text-emerald-400' : 'text-brand-text-secondary'}`} />
                        <span className="text-brand-text">{req.label}</span>
                      </div>
                      <span className="text-xs text-brand-text-secondary">
                        {req.target > 0 ? `${req.current}/${req.target}` : '--/--'}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-brand-primary/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${done ? 'bg-emerald-400' : 'bg-brand-accent'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className={`rounded-3xl border px-4 py-3 text-sm ${
                labUnlocked
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                  : requirementsDone
                    ? 'border-amber-400/40 bg-amber-500/10 text-amber-100'
                    : 'border-brand-text-secondary/20 bg-brand-primary/40 text-brand-text-secondary'
              }`}
            >
              <p className="font-semibold">
                {labUnlocked
                  ? '🎉 Congratulations! Tumne ye course properly complete kiya hai. Ab tumhare liye Secret Creator Lab unlock ho gaya hai.'
                  : 'Quiz + Poll + Q&A + Mini challenges sab complete karo – agar tumne ye samajh liya to game change ho jayega.'}
              </p>
              <p className="mt-2 text-xs">
                Abhi {labUnlocked ? 'secret lab ke doors khule hain' : 'thoda push aur chahiye'}. Secret reward ready hai.
              </p>
            </div>
            <div className="rounded-3xl border border-brand-text-secondary/10 bg-brand-primary/40 p-3 text-sm">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-brand-accent">Creator Level Meter</p>
              <p className="mt-2 font-black text-brand-text">
                {levelProgress.currentLevel || 'Locked'} • Remaining for next: {levelProgress.remainingForNext}
              </p>
              <p className="text-xs text-brand-text-secondary">
                {levelProgress.nextLevel ? `Next: ${levelProgress.nextLevel}` : 'Max level reached'}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-3">
              {ENGAGEMENT_PROMPTS.map((prompt) => (
                <div key={prompt.tag} className="rounded-3xl border border-brand-accent/15 bg-brand-primary/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-brand-accent" />
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-brand-accent">{prompt.tag}</p>
                    </div>
                    {prompt.actionLink && (
                      <Link to={prompt.actionLink} className="inline-flex items-center gap-1 text-xs font-bold text-brand-accent">
                        {prompt.actionLabel}
                        <ChevronRight size={14} />
                      </Link>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-brand-text">{prompt.text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-brand-accent/20 bg-brand-primary/40 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-amber-400" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-brand-accent">Secret Creator Level</p>
              </div>
              <p className="text-sm text-brand-text">
                Agar tum yaha tak pahunch gaye ho to iska matlab tum normal learner nahi ho. Yaha kuch tools aur prompts milengi jo creators usually free me share nahi karte.
              </p>
              <ul className="space-y-1 text-xs text-brand-text-secondary">
                {levelRewards.map((reward) => (
                  <li key={reward.label} className="flex items-center justify-between">
                    <span>{reward.label}</span>
                    <span className={`text-[0.65rem] font-semibold uppercase ${reward.unlocked ? 'text-emerald-400' : 'text-brand-text-secondary'}`}>
                      {reward.unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-brand-accent/20 bg-brand-primary/40 p-4">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-brand-accent">🎁 Secret Reward (Only for people who finished this lesson)</p>
              <ul className="mt-3 space-y-1 text-sm text-brand-text-secondary">
                {SECRET_REWARD_LIST.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-brand-accent/30 bg-brand-primary/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-brand-accent" />
                <p className="text-sm font-black text-brand-text">🚀 Growth Hack</p>
              </div>
              <p className="text-sm leading-relaxed text-brand-text-secondary">
                Agar tum next lesson se pehle poll + quiz mark karoge to engagement streak badge milta hai. Ek 10 minute reflection timer set karo aur phir agle lesson me jump maro.
              </p>
            </div>
            <div className="rounded-3xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200 flex items-center gap-2">
              <AlertTriangle size={16} />
              ⚠ Next Lesson Warning — Agla lesson shayad sabse important hai kyunki usme ek aisi trick hai jo beginners ko pro bana deti hai.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Skill Level Selection (when editing) */}
      {isEditing && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ios-card mt-6 border border-brand-accent/20 p-6"
        >
          <h3 className="text-lg font-black text-brand-text mb-4">Select Your Skill Level</h3>
          <div className="flex flex-wrap gap-2">
            {SKILL_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setEditForm(prev => ({ ...prev, skillLevel: level.id }))}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                  editForm.skillLevel === level.id
                    ? `bg-gradient-to-r ${level.color} border-transparent text-white`
                    : 'border-brand-text-secondary/20 bg-brand-primary/50 text-brand-text hover:border-brand-accent/40'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Interests */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="ios-card mt-6 border border-brand-accent/20 p-6"
      >
        <h3 className="text-lg font-black text-brand-text mb-4">Your Interests</h3>
        {isEditing ? (
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                  editForm.interests.includes(interest)
                    ? 'border-brand-accent bg-brand-accent/20 text-brand-accent'
                    : 'border-brand-text-secondary/20 bg-brand-primary/50 text-brand-text-secondary hover:border-brand-accent/40'
                }`}
              >
                {editForm.interests.includes(interest) && <CheckCircle size={14} className="inline mr-1" />}
                {interest}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.interests.length > 0 ? (
              profile.interests.map((interest, idx) => (
                <span key={idx} className="rounded-full border border-brand-accent/30 bg-brand-accent/5 px-4 py-2 text-sm font-semibold text-brand-text">
                  {interest}
                </span>
              ))
            ) : (
              <p className="text-brand-text-secondary">No interests selected yet.</p>
            )}
          </div>
        )}
      </motion.div>

      {/* Badges */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="ios-card mt-6 border border-brand-accent/20 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-brand-text">Your Badges</h3>
          <span className="text-sm text-brand-text-secondary">{unlockedBadges.length}/{DEFAULT_BADGES.length} unlocked</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Unlocked Badges */}
          <div>
            <p className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
              <Unlock size={14} /> Unlocked
            </p>
            <div className="space-y-2">
              {unlockedBadges.length > 0 ? (
                unlockedBadges.map((badge) => (
                  <motion.div
                    key={badge.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      {badge.icon}
                    </div>
                    <div>
                      <p className="font-bold text-brand-text">{badge.name}</p>
                      <p className="text-xs text-brand-text-secondary">{badge.description}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-brand-text-secondary py-4">Complete courses to earn badges!</p>
              )}
            </div>
          </div>

          {/* Locked Badges */}
          <div>
            <p className="text-sm font-semibold text-brand-text-secondary mb-2 flex items-center gap-2">
              <Lock size={14} /> Locked
            </p>
            <div className="space-y-2">
              {lockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-3 opacity-60"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-brand-text-secondary">
                    {badge.icon}
                  </div>
                  <div>
                    <p className="font-bold text-brand-text">{badge.name}</p>
                    <p className="text-xs text-brand-text-secondary">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Account Info */}
      {user && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="ios-card mt-6 border border-brand-text-secondary/10 p-6"
        >
          <h3 className="text-lg font-black text-brand-text mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-brand-text-secondary" />
              <span className="text-brand-text">{user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <User size={16} className="text-brand-text-secondary" />
              <span className="text-brand-text">User ID: {user.uid.substring(0, 8)}...</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp size={16} className="text-brand-text-secondary" />
              <span className="text-brand-text">Joined: {new Date(profile.joinDate).toLocaleDateString()}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UserProfilePage;

