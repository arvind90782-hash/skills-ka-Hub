
import React from 'react';
import { Link } from 'react-router-dom';
import type { AiChallengeBlock as AiChallengeBlockType } from '../types';
import { TOOLS } from '../constants';

interface AiChallengeBlockProps {
  block: AiChallengeBlockType;
}

const AiChallengeBlock: React.FC<AiChallengeBlockProps> = ({ block }) => {
  const tool = TOOLS.find(t => t.id === block.toolId);
  if (!tool) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4 my-4 rounded-lg border-l-4 border-indigo-400">
      <p className="font-semibold text-indigo-300 mb-2">🤖 AI Challenge Time!</p>
      <p className="text-brand-text-secondary mb-4">{block.challenge}</p>
      <Link 
        to={tool.path}
        className="inline-block px-4 py-2 bg-brand-accent hover:bg-brand-accent-light text-white font-semibold rounded-lg transition-colors text-sm"
      >
        Try {tool.name} Now
      </Link>
    </div>
  );
};

export default AiChallengeBlock;
