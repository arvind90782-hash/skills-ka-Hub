
import React from 'react';
import type { MythBusterBlock as MythBusterBlockType } from '../types';

interface MythBusterBlockProps {
  block: MythBusterBlockType;
}

const MythBusterBlock: React.FC<MythBusterBlockProps> = ({ block }) => {
  return (
    <div className="bg-red-900/20 p-4 my-4 rounded-lg border-l-4 border-red-400">
      <p className="font-semibold text-red-300 mb-2">💥 Myth Busted!</p>
      <div className="pl-4 border-l-2 border-red-400/30">
        <p className="text-brand-text-secondary italic"><span className="font-bold text-brand-text not-italic">Myth:</span> {block.myth}</p>
      </div>
      <div className="pl-4 border-l-2 border-green-400/30 mt-3">
        <p className="text-brand-text-secondary"><span className="font-bold text-green-300">Reality:</span> {block.reality}</p>
      </div>
    </div>
  );
};

export default MythBusterBlock;
