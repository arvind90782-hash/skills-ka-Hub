import React from 'react';
import type { ShockingFactBlock as ShockingFactBlockType } from '../types';
import { useLocale } from '../hooks/useLocale';

interface ShockingFactBlockProps {
  block: ShockingFactBlockType;
}

const ShockingFactBlock: React.FC<ShockingFactBlockProps> = ({ block }) => {
  const { t } = useLocale();

  return (
    <div className="my-4 rounded-lg border-l-4 border-yellow-400 bg-yellow-500/10 p-4">
      <p className="mb-2 font-semibold text-yellow-300">{t('shock.title')}</p>
      <p className="text-brand-text-secondary">{block.fact}</p>
    </div>
  );
};

export default ShockingFactBlock;
