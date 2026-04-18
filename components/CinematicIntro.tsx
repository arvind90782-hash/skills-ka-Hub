
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Palette, 
  Video, 
  Code, 
  TrendingUp, 
  PlayCircle, 
  MessageSquare, 
  Image as ImageIcon, 
  Type, 
  Search, 
  Film,
  X,
  CheckCircle2,
  DollarSign,
  Laptop,
  Volume2,
  VolumeX
} from 'lucide-react';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';

interface CinematicIntroProps {
  isOpen: boolean;
  onClose: () => void;
}

const CinematicIntro: React.FC<CinematicIntroProps> = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceBufferRef = useRef<Record<number, AudioBuffer>>({});

  const voiceScripts: Record<number, string> = {
    0: "What if learning... felt different?",
    1: "Introducing a new era of skills. Introducing... Skills Ka Adda.",
    2: "Design. Edit. Code. Market. Animate. All in one intelligent ecosystem.",
    3: "Powered by advanced artificial intelligence. Built for creators. Built for freelancers. Built for you.",
    4: "Your freelance journey... Starts here.",
    5: "Skills Ka Adda. Start learning. Start earning."
  };

  // Preload Voiceover
  useEffect(() => {
    const preloadVoice = async () => {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = context;

        for (const [p, text] of Object.entries(voiceScripts)) {
          const base64 = await generateSpeech(text);
          const buffer = await decodeAudioData(decode(base64), context, 24000, 1);
          voiceBufferRef.current[Number(p)] = buffer;
        }
      } catch (e) {
        console.error("Voice preloading failed:", e);
      }
    };

    if (isOpen) {
      preloadVoice();
    }
  }, [isOpen]);

  // Play Voice for current phase
  useEffect(() => {
    if (!isOpen || isMuted || !audioContextRef.current) return;

    const buffer = voiceBufferRef.current[phase];
    if (buffer) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;

      // Add Reverb Effect
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 1.2;
      
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      source.start();
    }
  }, [phase, isOpen, isMuted]);

  useEffect(() => {
    if (!isOpen) {
      setPhase(0);
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current.currentTime = 0;
      }
      return;
    }

    if (musicRef.current) {
      musicRef.current.volume = 0.4;
      musicRef.current.play();
    }

    const timers = [
      setTimeout(() => setPhase(1), 5000),
      setTimeout(() => setPhase(2), 12000),
      setTimeout(() => setPhase(3), 25000),
      setTimeout(() => setPhase(4), 40000),
      setTimeout(() => setPhase(5), 50000),
      setTimeout(() => onClose(), 62000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isOpen, onClose]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 2, ease: "easeInOut" } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[100] bg-black overflow-hidden flex items-center justify-center selection:bg-brand-accent/30"
        >
          {/* Cinematic Background Video */}
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            onError={() => console.error("Video failed to load")}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-2000 ${phase >= 1 ? 'opacity-30' : 'opacity-0'}`}
            style={{ filter: 'contrast(1.2) brightness(0.8)', mixBlendMode: 'screen' }}
          >
            <source src="https://cdn.pixabay.com/video/2020/03/24/34015-399677271_large.mp4" type="video/mp4" />
          </video>

          {/* Background Music */}
          <audio 
            ref={musicRef} 
            loop 
            muted={isMuted}
            onError={() => console.error("Audio failed to load")}
            src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
          />

          {/* Controls */}
          <div className="absolute top-8 right-8 z-[110] flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 rounded-full ios-glass text-white/60 hover:text-white transition-all"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </motion.button>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-2 rounded-full ios-glass text-white/40 hover:text-white hover:bg-white/10 transition-all group"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Skip Film</span>
              <X size={14} />
            </motion.button>
          </div>

          {/* Phase 0: 0-5s - The Whisper */}
          <AnimatePresence>
            {phase === 0 && (
              <motion.div
                key="phase0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, filter: 'blur(20px)' }}
                transition={{ duration: 2 }}
                className="relative z-10 text-center"
              >
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 2 }}
                  className="text-2xl md:text-3xl font-light text-white/70 italic tracking-wide"
                >
                  "What if learning... felt different?"
                </motion.p>
                <div className="mt-8 flex gap-1 justify-center">
                   {[0, 1, 2].map(i => (
                     <motion.div 
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                        className="w-1 h-1 bg-brand-accent rounded-full"
                     />
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 1: 5-12s - Neural Network & Logo */}
          <AnimatePresence>
            {phase === 1 && (
              <motion.div
                key="phase1"
                className="relative z-10 flex flex-col items-center gap-12"
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 1.5 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="space-y-4 text-center"
                >
                  <p className="text-xs font-black uppercase tracking-[0.5em] text-brand-accent/60">Introducing a new era of skills</p>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 3, type: 'spring', damping: 20 }}
                    className="relative"
                  >
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter">
                      Skills Ka <span className="text-brand-accent">Adda</span>
                    </h1>
                    <motion.div 
                      animate={{ opacity: [0, 1, 0], scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 4 }}
                      className="absolute -inset-4 bg-brand-accent/10 blur-3xl rounded-full"
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 2: 12-25s - Skill Explosion */}
          <AnimatePresence>
            {phase === 2 && (
              <motion.div
                key="phase2"
                className="absolute inset-0 z-20 flex items-center justify-center"
                exit={{ opacity: 0, filter: 'blur(30px)' }}
              >
                {[
                  { icon: Palette, color: 'from-pink-500 to-rose-500', label: 'Graphic Design', x: -350, y: -250, delay: 0 },
                  { icon: Video, color: 'from-blue-500 to-cyan-500', label: 'Video Editing', x: 350, y: -180, delay: 0.5 },
                  { icon: Code, color: 'from-purple-500 to-indigo-500', label: 'Programming', x: -300, y: 220, delay: 1 },
                  { icon: TrendingUp, color: 'from-orange-500 to-amber-500', label: 'Digital Marketing', x: 300, y: 200, delay: 1.5 },
                  { icon: PlayCircle, color: 'from-emerald-500 to-teal-500', label: 'Animation', x: 0, y: -350, delay: 2 },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{ x: item.x, y: item.y, scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 80, delay: item.delay }}
                    className="absolute flex flex-col items-center gap-4"
                  >
                    <div className={`p-8 rounded-[32px] ios-glass border-white/10 shadow-2xl bg-gradient-to-br ${item.color} bg-opacity-10`}>
                      <item.icon size={56} className="text-white" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-white/40">{item.label}</span>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 0.05, scale: 1 }}
                  className="text-white font-black text-[30vw] pointer-events-none select-none"
                >
                  ECOSYSTEM
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 3: 25-40s - AI Tools Reveal */}
          <AnimatePresence>
            {phase === 3 && (
              <motion.div
                key="phase3"
                className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-16"
                exit={{ opacity: 0, y: -50 }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Advanced Intelligence</h2>
                  <p className="text-brand-accent font-bold tracking-widest uppercase text-sm">Built for the next generation of creators</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-12 px-12">
                  {[
                    { icon: MessageSquare, label: 'AI Dost', desc: 'Chat Assistant', delay: 0 },
                    { icon: ImageIcon, label: 'Chitra AI', desc: '4K Upscaling', delay: 0.3 },
                    { icon: Type, label: 'Rocket Writer', desc: 'Fast Copywriting', delay: 0.6 },
                    { icon: Search, label: 'Video Jasoos', desc: 'Deep Analysis', delay: 0.9 },
                    { icon: Film, label: 'Photo Jivdan', desc: 'Motion Magic', delay: 1.2 },
                  ].map((tool, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: tool.delay + 1, type: 'spring' }}
                      className="flex flex-col items-center gap-6 group"
                    >
                      <div className="w-28 h-28 rounded-[32px] ios-glass border-white/10 flex items-center justify-center relative overflow-hidden">
                        <tool.icon size={40} className="text-brand-accent" />
                        <motion.div 
                          animate={{ y: ['100%', '-100%'] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-t from-transparent via-brand-accent/10 to-transparent"
                        />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-lg font-bold text-white">{tool.label}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent/60">{tool.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 4: 40-50s - Emotional Shift */}
          <AnimatePresence>
            {phase === 4 && (
              <motion.div
                key="phase4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 flex items-center justify-center"
              >
                <div className="max-w-4xl w-full px-8 flex flex-col md:flex-row items-center gap-16">
                  <motion.div 
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="relative"
                  >
                    <div className="w-80 h-56 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
                       <Laptop size={120} className="text-white/5 opacity-20" />
                       <motion.div 
                         animate={{ opacity: [0.3, 0.6, 0.3] }}
                         transition={{ repeat: Infinity, duration: 4 }}
                         className="absolute inset-0 bg-brand-accent/5"
                       />
                    </div>
                    {/* Notification Overlay */}
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 3 }}
                      className="absolute -bottom-6 -right-6 w-64 p-4 ios-glass rounded-2xl border-emerald-500/30 shadow-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-500">
                          <DollarSign size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-emerald-500">Payment Received</p>
                          <p className="text-xs font-bold text-white">Client: "Approved. Great work!"</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  <div className="space-y-6 text-center md:text-left">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2 }}
                      className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight"
                    >
                      Your freelance journey... <br />
                      <span className="text-brand-accent">Starts here.</span>
                    </motion.p>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: 4, duration: 2 }}
                      className="h-px bg-gradient-to-r from-brand-accent to-transparent"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 5: 50-60s - Grand Finale */}
          <AnimatePresence>
            {phase === 5 && (
              <motion.div
                key="phase5"
                className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-16"
              >
                <div className="relative text-center space-y-8">
                  <motion.h2
                    animate={{ 
                      x: [0, -2, 2, -1, 1, 0],
                      filter: ['hue-rotate(0deg)', 'hue-rotate(45deg)', 'hue-rotate(0deg)']
                    }}
                    transition={{ repeat: Infinity, duration: 0.15 }}
                    className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none"
                  >
                    APKA FREELANCE SAFAR <br />
                    <span className="text-brand-accent">YAHA SE SHURU HOTA HAI</span>
                  </motion.h2>

                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="w-24 h-24 rounded-[28px] bg-brand-accent flex items-center justify-center shadow-[0_0_60px_rgba(0,122,255,0.6)]">
                      <Sparkles size={48} className="text-white" />
                    </div>
                    <div className="space-y-1">
                      <h1 className="text-4xl font-black text-white tracking-tighter">Skills Ka Adda</h1>
                      <p className="text-brand-accent font-bold uppercase tracking-[0.4em] text-[10px]">Start Learning. Start Earning.</p>
                    </div>
                  </motion.div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0,122,255,0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 4 }}
                  onClick={onClose}
                  className="px-16 py-6 bg-brand-accent text-white rounded-[24px] font-black text-2xl shadow-2xl flex items-center gap-4 group"
                >
                  Enter Ecosystem
                  <CheckCircle2 size={28} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lighting & Cinematic Effects */}
          <div className="absolute inset-0 pointer-events-none z-[60]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-80" />
            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-brand-accent/10 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-brand-accent/5 to-transparent" />
            
            {/* Impact Flashes (Simulating Sound Design) */}
            <AnimatePresence>
              {(phase === 1 || phase === 2 || phase === 5) && (
                <motion.div
                  key={`flash-${phase}`}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 bg-white mix-blend-overlay"
                />
              )}
            </AnimatePresence>

            {/* Grain/Noise Effect */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CinematicIntro;
