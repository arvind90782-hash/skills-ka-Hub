
import React from 'react';
import type { QAndABlock as QAndABlockType } from '../types';

interface QAndABlockProps {
  block: QAndABlockType;
}

const QAndABlock: React.FC<QAndABlockProps> = ({ block }) => {
  return (
    <div className="bg-brand-secondary/50 p-4 my-4 rounded-lg">
        <div className="flex items-start">
            <span className="text-xl font-bold text-amber-300 mr-3">Q.</span>
            <p className="text-brand-text font-semibold">{block.question}</p>
        </div>
        <div className="flex items-start mt-2">
            <span className="text-xl font-bold text-green-300 mr-3">A.</span>
            <p className="text-brand-text-secondary">{block.answer}</p>
        </div>
    </div>
  );
};

export default QAndABlock;
