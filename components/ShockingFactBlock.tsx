
import React from 'react';
import type { ShockingFactBlock as ShockingFactBlockType } from '../types';

interface ShockingFactBlockProps {
  block: ShockingFactBlockType;
}

const ShockingFactBlock: React.FC<ShockingFactBlockProps> = ({ block }) => {
  return (
    <div className="bg-yellow-500/10 p-4 my-4 rounded-lg border-l-4 border-yellow-400">
      <p className="font-semibold text-yellow-300 mb-2">🤯 Shocking Fact!</p>
      <p className="text-brand-text-secondary">{block.fact}</p>
    </div>
  );
};

export default ShockingFactBlock;
