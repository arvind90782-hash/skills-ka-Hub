import React from 'react';
import { Coins, Cpu, DollarSign, Layers3 } from 'lucide-react';
import { getToolDefinition } from '../services/toolCatalog';
import { useCredits } from '../hooks/useCredits';

interface AiGenerationMetaProps {
  toolId: string;
  progressLabel?: string;
}

const AiGenerationMeta: React.FC<AiGenerationMetaProps> = ({ toolId, progressLabel }) => {
  const definition = getToolDefinition(toolId);
  const { balance, creditsRequired, estimatedCostUsd } = useCredits(toolId);

  if (!definition) {
    return null;
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-brand-accent/15 bg-brand-primary/40 p-4 md:grid-cols-4">
      <div className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-3">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand-text-secondary">
          <Coins size={12} />
          Credits Required
        </p>
        <p className="mt-2 text-2xl font-black text-brand-text">{creditsRequired}</p>
      </div>
      <div className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-3">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand-text-secondary">
          <Layers3 size={12} />
          Your Balance
        </p>
        <p className="mt-2 text-2xl font-black text-brand-text">{balance}</p>
      </div>
      <div className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-3">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand-text-secondary">
          <DollarSign size={12} />
          Estimated Cost
        </p>
        <p className="mt-2 text-2xl font-black text-brand-text">${estimatedCostUsd.toFixed(2)}</p>
      </div>
      <div className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-3">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand-text-secondary">
          <Cpu size={12} />
          Engine
        </p>
        <p className="mt-2 text-sm font-bold text-brand-text">{definition.requiredApi}</p>
        {progressLabel ? <p className="mt-1 text-xs text-brand-text-secondary">{progressLabel}</p> : null}
      </div>
    </div>
  );
};

export default AiGenerationMeta;

