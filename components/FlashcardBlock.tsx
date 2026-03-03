
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Zap } from 'lucide-react';
import type { FlashcardBlock as FlashcardBlockType } from '../types';

interface FlashcardBlockProps {
  block: FlashcardBlockType;
}

const FlashcardBlock: React.FC<FlashcardBlockProps> = ({ block }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="my-10 perspective-1000">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
          <Zap size={20} />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-amber-500">Quick Flashcard</p>
      </div>

      <motion.div
        className="relative w-full h-64 cursor-pointer preserve-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front */}
        <div className={`absolute inset-0 w-full h-full backface-hidden ios-card p-8 flex flex-col items-center justify-center text-center gap-6 border-2 border-brand-accent/20 bg-brand-primary/40`}>
          <p className="text-2xl font-bold text-brand-text leading-tight">
            {block.front}
          </p>
          <div className="flex items-center gap-2 text-brand-accent font-bold text-sm uppercase tracking-widest">
            <RotateCw size={16} />
              Tap to Flip
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden ios-card p-8 flex flex-col items-center justify-center text-center gap-6 border-2 border-emerald-500/50 bg-emerald-500/10"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <p className="text-xl font-medium text-brand-text leading-relaxed">
            {block.back}
          </p>
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm uppercase tracking-widest">
            <RotateCw size={16} />
              Tap to Flip Back
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlashcardBlock;
