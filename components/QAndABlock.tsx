
import React, { useState } from 'react';
import type { QAndABlock as QAndABlockType } from '../types';

interface QAndABlockProps {
  block: QAndABlockType;
  onAnswered?: () => void;
  answered?: boolean;
}

const QAndABlock: React.FC<QAndABlockProps> = ({ block, onAnswered, answered = false }) => {
  const [localAnswered, setLocalAnswered] = useState(answered);

  const isAnswered = answered || localAnswered;

  const handleMark = () => {
    if (isAnswered) {
      return;
    }
    setLocalAnswered(true);
    onAnswered?.();
  };

  return (
    <div className="my-4 rounded-lg bg-brand-secondary/50 p-4">
        <div className="flex items-start">
            <span className="text-xl font-bold text-amber-300 mr-3">Q.</span>
            <p className="text-brand-text font-semibold">{block.question}</p>
        </div>
        <div className="flex items-start mt-2">
            <span className="text-xl font-bold text-green-300 mr-3">A.</span>
            <p className="text-brand-text-secondary">{block.answer}</p>
        </div>
        <button
          type="button"
          onClick={handleMark}
          disabled={isAnswered}
          className="mt-3 rounded-lg bg-brand-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {isAnswered ? 'Answer Marked' : 'Mark as Answered'}
        </button>
    </div>
  );
};

export default QAndABlock;
