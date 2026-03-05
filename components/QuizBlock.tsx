
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { QuizBlock as QuizBlockType } from '../types';
import { useLocale } from '../hooks/useLocale';

interface QuizBlockProps {
  block: QuizBlockType;
  onAttempt?: () => void;
}

const QuizBlock: React.FC<QuizBlockProps> = ({ block, onAttempt }) => {
  const { t } = useLocale();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    onAttempt?.();
  };

  const getOptionStyles = (index: number) => {
    if (!isAnswered) {
      return 'bg-brand-primary/50 hover:bg-brand-primary border-transparent';
    }
    if (index === block.correctAnswerIndex) {
      return 'bg-green-500/20 border-green-500 text-green-600 dark:text-green-400';
    }
    if (index === selectedOption) {
      return 'bg-red-500/20 border-red-500 text-red-600 dark:text-red-400';
    }
    return 'bg-brand-primary/30 border-transparent opacity-50';
  };

  return (
    <div className="ios-card p-8 my-8 border-l-4 border-brand-accent relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full -mr-16 -mt-16 blur-2xl" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-brand-accent/10 text-brand-accent">
          <HelpCircle size={20} />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-brand-accent">{t('quiz.title')}</p>
      </div>

      <h3 className="text-xl font-bold text-brand-text mb-8 leading-tight">{block.question}</h3>
      
      <div className="grid grid-cols-1 gap-3">
        {block.options.map((option, index) => (
          <motion.button
            key={index}
            whileHover={!isAnswered ? { scale: 1.02, x: 5 } : {}}
            whileTap={!isAnswered ? { scale: 0.98 } : {}}
            onClick={() => handleOptionSelect(index)}
            className={`p-4 rounded-2xl text-left border-2 transition-all duration-300 flex items-center justify-between group ${getOptionStyles(index)}`}
            disabled={isAnswered}
          >
            <span className="font-semibold">{option}</span>
            <AnimatePresence>
              {isAnswered && index === block.correctAnswerIndex && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="text-green-500"
                >
                  <CheckCircle2 size={20} />
                </motion.div>
              )}
              {isAnswered && index === selectedOption && index !== block.correctAnswerIndex && (
                <motion.div
                  initial={{ scale: 0, rotate: 45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="text-red-500"
                >
                  <XCircle size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {isAnswered && (
          <motion.div 
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            className="mt-8 pt-8 border-t border-brand-text-secondary/10"
          >
            <div className={`p-6 rounded-3xl flex gap-4 items-start ${selectedOption === block.correctAnswerIndex ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <div className={`p-2 rounded-full ${selectedOption === block.correctAnswerIndex ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                {selectedOption === block.correctAnswerIndex ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
              </div>
              <div className="space-y-1">
                <p className={`text-lg font-black tracking-tight ${selectedOption === block.correctAnswerIndex ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {selectedOption === block.correctAnswerIndex ? t('quiz.correct') : t('quiz.wrong')}
                </p>
                <p className="text-brand-text-secondary leading-relaxed">{block.explanation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizBlock;
