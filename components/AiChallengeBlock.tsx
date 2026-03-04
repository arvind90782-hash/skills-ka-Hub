import React from 'react';
import { Link } from 'react-router-dom';
import type { AiChallengeBlock as AiChallengeBlockType } from '../types';
import { TOOLS } from '../constants';
import { useLocale } from '../hooks/useLocale';

interface AiChallengeBlockProps {
  block: AiChallengeBlockType;
}

const AiChallengeBlock: React.FC<AiChallengeBlockProps> = ({ block }) => {
  const { t, localizeItem } = useLocale();
  const tool = TOOLS.find((item) => item.id === block.toolId);
  if (!tool) {
    return null;
  }

  const localizedTool = localizeItem(tool);

  return (
    <div className="my-4 rounded-lg border-l-4 border-indigo-400 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4">
      <p className="mb-2 font-semibold text-indigo-300">{t('challenge.title')}</p>
      <p className="mb-4 text-brand-text-secondary">{block.challenge}</p>
      <Link
        to={localizedTool.path}
        className="inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-light"
      >
        {t('challenge.tryNow', { tool: localizedTool.name })}
      </Link>
    </div>
  );
};

export default AiChallengeBlock;
