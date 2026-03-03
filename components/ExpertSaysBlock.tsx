
import React from 'react';
import type { ExpertSaysBlock as ExpertSaysBlockType } from '../types';

interface ExpertSaysBlockProps {
  block: ExpertSaysBlockType;
}

const ExpertSaysBlock: React.FC<ExpertSaysBlockProps> = ({ block }) => {
  return (
    <div className="bg-gradient-to-r from-brand-accent/20 to-brand-secondary p-4 my-4 rounded-lg border-l-4 border-brand-accent-light">
      <p className="font-semibold text-brand-accent-light mb-2">😎 Guru Gyan</p>
      <blockquote className="text-brand-text italic">"{block.quote}"</blockquote>
      <cite className="block text-right mt-2 text-brand-text-secondary text-sm">- {block.expertName}</cite>
    </div>
  );
};

export default ExpertSaysBlock;
