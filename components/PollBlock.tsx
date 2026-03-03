
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Check } from 'lucide-react';
import type { PollBlock as PollBlockType } from '../types';

interface PollBlockProps {
  block: PollBlockType;
}

const PollBlock: React.FC<PollBlockProps> = ({ block }) => {
  const [voted, setVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  const [percentages] = useState(() => {
    let remaining = 100;
    const results = [];
    for (let i = 0; i < block.options.length - 1; i++) {
      const vote = Math.floor(Math.random() * (remaining / 1.5));
      results.push(vote);
      remaining -= vote;
    }
    results.push(remaining);
    return results;
  });

  const handleVote = (index: number) => {
    if (voted) return;
    setSelectedOption(index);
    setVoted(true);
  };

  return (
    <div className="ios-card p-8 my-8 border-l-4 border-cyan-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
          <BarChart3 size={20} />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-cyan-500">Aapki Kya Raay Hai?</p>
      </div>

      <h3 className="text-xl font-bold text-brand-text mb-8 leading-tight">{block.question}</h3>
      
      <div className="space-y-3">
        {block.options.map((option, index) => (
          <motion.button
            key={index}
            whileHover={!voted ? { scale: 1.01 } : {}}
            whileTap={!voted ? { scale: 0.99 } : {}}
            onClick={() => handleVote(index)}
            disabled={voted}
            className={`w-full text-left p-4 rounded-2xl transition-all duration-500 group overflow-hidden relative border-2 ${
              voted 
                ? selectedOption === index 
                  ? 'border-cyan-500 bg-cyan-500/10' 
                  : 'border-transparent bg-brand-primary/30'
                : 'border-transparent bg-brand-primary/50 hover:bg-brand-primary'
            }`}
          >
            {/* Progress Bar Background */}
            <AnimatePresence>
              {voted && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentages[index]}%` }}
                  transition={{ type: 'spring', damping: 30, stiffness: 100, delay: index * 0.1 }}
                  className="absolute top-0 left-0 h-full bg-cyan-500/10 z-0"
                />
              )}
            </AnimatePresence>

            <div className="relative z-10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={`font-semibold transition-colors ${voted && selectedOption === index ? 'text-cyan-600 dark:text-cyan-400' : 'text-brand-text'}`}>
                  {option}
                </span>
                {voted && selectedOption === index && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Check size={16} className="text-cyan-500" />
                  </motion.div>
                )}
              </div>
              {voted && (
                <motion.span 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-black text-cyan-600 dark:text-cyan-400"
                >
                  {percentages[index]}%
                </motion.span>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {voted && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-center text-xs font-bold text-brand-text-secondary uppercase tracking-widest"
        >
          Shukriya! Aapka vote count ho gaya hai.
        </motion.p>
      )}
    </div>
  );
};

export default PollBlock;
