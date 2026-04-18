import React from 'react';
import type { ExpertSaysBlock as ExpertSaysBlockType } from '../types';
import { useLocale } from '../hooks/useLocale';

interface ExpertSaysBlockProps {
  block: ExpertSaysBlockType;
}

const ExpertSaysBlock: React.FC<ExpertSaysBlockProps> = ({ block }) => {
  const { t } = useLocale();

  return (
    <div className="my-4 rounded-lg border-l-4 border-brand-accent-light bg-gradient-to-r from-brand-accent/20 to-brand-secondary p-4">
      <p className="mb-2 font-semibold text-brand-accent-light">{t('expert.title')}</p>
      <blockquote className="italic text-brand-text">"{block.quote}"</blockquote>
      <cite className="mt-2 block text-right text-sm text-brand-text-secondary">- {block.expertName}</cite>
    </div>
  );
};

export default ExpertSaysBlock;
