
import React from 'react';
import type { IdeaCornerBlock as IdeaCornerBlockType } from '../types';

interface IdeaCornerBlockProps {
  block: IdeaCornerBlockType;
}

const IdeaCornerBlock: React.FC<IdeaCornerBlockProps> = ({ block }) => {
  return (
    <div className="bg-blue-500/10 p-4 my-4 rounded-lg border-l-4 border-blue-400">
      <p className="font-semibold text-blue-300 mb-2">💡 Idea Corner</p>
      <p className="text-brand-text-secondary">{block.prompt}</p>
    </div>
  );
};

export default IdeaCornerBlock;
