
import React from 'react';
import type { DoAndDontBlock as DoAndDontBlockType } from '../types';

interface DoAndDontBlockProps {
  block: DoAndDontBlockType;
}

const DoAndDontBlock: React.FC<DoAndDontBlockProps> = ({ block }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        <div className="bg-green-500/10 p-4 rounded-lg">
            <h4 className="font-bold text-green-300 mb-2">✅ Kya Karein (Do's)</h4>
            <ul className="list-disc list-inside space-y-1 text-brand-text-secondary">
                {block.dos.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
        <div className="bg-red-500/10 p-4 rounded-lg">
            <h4 className="font-bold text-red-300 mb-2">❌ Kya Na Karein (Don'ts)</h4>
            <ul className="list-disc list-inside space-y-1 text-brand-text-secondary">
                {block.donts.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    </div>
  );
};

export default DoAndDontBlock;
