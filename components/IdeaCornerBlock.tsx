import React from 'react';
import type { IdeaCornerBlock as IdeaCornerBlockType } from '../types';
import { useLocale } from '../hooks/useLocale';

interface IdeaCornerBlockProps {
  block: IdeaCornerBlockType;
}

const IdeaCornerBlock: React.FC<IdeaCornerBlockProps> = ({ block }) => {
  const { t } = useLocale();

  return (
    <div className="my-4 rounded-lg border-l-4 border-blue-400 bg-blue-500/10 p-4">
      <p className="mb-2 font-semibold text-blue-300">{t('idea.title')}</p>
      <p className="text-brand-text-secondary">{block.prompt}</p>
    </div>
  );
};

export default IdeaCornerBlock;
