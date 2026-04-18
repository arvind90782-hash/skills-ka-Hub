import React from 'react';
import type { DoAndDontBlock as DoAndDontBlockType } from '../types';
import { useLocale } from '../hooks/useLocale';

interface DoAndDontBlockProps {
  block: DoAndDontBlockType;
}

const DoAndDontBlock: React.FC<DoAndDontBlockProps> = ({ block }) => {
  const { t } = useLocale();

  return (
    <div className="my-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-lg bg-green-500/10 p-4">
        <h4 className="mb-2 font-bold text-green-300">{t('do.title')}</h4>
        <ul className="list-inside list-disc space-y-1 text-brand-text-secondary">
          {block.dos.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg bg-red-500/10 p-4">
        <h4 className="mb-2 font-bold text-red-300">{t('dont.title')}</h4>
        <ul className="list-inside list-disc space-y-1 text-brand-text-secondary">
          {block.donts.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DoAndDontBlock;
