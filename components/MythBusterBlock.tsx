import React from 'react';
import type { MythBusterBlock as MythBusterBlockType } from '../types';
import { useLocale } from '../hooks/useLocale';

interface MythBusterBlockProps {
  block: MythBusterBlockType;
}

const MythBusterBlock: React.FC<MythBusterBlockProps> = ({ block }) => {
  const { t } = useLocale();

  return (
    <div className="my-4 rounded-lg border-l-4 border-red-400 bg-red-900/20 p-4">
      <p className="mb-2 font-semibold text-red-300">{t('myth.title')}</p>
      <div className="border-l-2 border-red-400/30 pl-4">
        <p className="italic text-brand-text-secondary">
          <span className="font-bold not-italic text-brand-text">{t('myth.label')}:</span> {block.myth}
        </p>
      </div>
      <div className="mt-3 border-l-2 border-green-400/30 pl-4">
        <p className="text-brand-text-secondary">
          <span className="font-bold text-green-300">{t('reality.label')}:</span> {block.reality}
        </p>
      </div>
    </div>
  );
};

export default MythBusterBlock;
