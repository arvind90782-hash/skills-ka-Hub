import React from 'react';
import type { QuotaInfo } from '../types';
import { AlertTriangle, Coins, Cpu, DollarSign, Layers3 } from 'lucide-react';
import { getToolDefinition } from '../services/toolCatalog';
import { useCredits } from '../hooks/useCredits';

interface AiGenerationMetaProps {
  toolId: string;
  progressLabel?: string;
  quotaInfo?: QuotaInfo;
  usageTokens?: { input: number; output: number };
}

const AiGenerationMeta: React.FC<AiGenerationMetaProps> = ({ toolId, progressLabel, quotaInfo, usageTokens }) => {
  const definition = getToolDefinition(toolId);
  const { balance, creditsRequired, estimatedCostUsd } = useCredits(toolId);

  if (!definition) {
    return null;
  }

  const isLowBalance = balance < creditsRequired;
  const quotaValue = quotaInfo?.quotaValue ?? 0;
  const isLowQuota = quotaValue > 0 && quotaValue < creditsRequired * 2;
  const retryDelay = quotaInfo?.retryDelayMs ? Math.round(quotaInfo.retryDelayMs / 1000) : 0;

  return (
    <div className="grid gap-3 rounded-2xl border border-brand-accent/15 bg-brand-primary/40 p-4 md:grid-cols-4 lg:grid-cols-5">
      <div className={`rounded-xl border p-3 ${isLowBalance ? 'border-amber-400/50 bg-amber-500/10' : 'border-brand-text-secondary/10 bg-brand-primary/40'}`}>
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand-text-secondary">
          <Coins size={12} />
          Credits Required
        </p>
        <p className={`mt-2 text-2xl font-black ${isLowBalance ? 'text-amber-500' : 'text-brand-text'}`}>{creditsRequired}</p>
        {isLowBalance && <p className="mt-1 text-xs font-bold text-amber-500">Low balance</p>}
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
          Est. Cost
        </p>
        <p className="mt-2 text-2xl font-black text-brand-text">${estimatedCostUsd.toFixed(2)}</p>
      </div>
      <div className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-3">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand-text-secondary">
          <Cpu size={12} />
          Engine
        </p>
        <p className="mt-2 text-sm font-bold text-brand-text truncate">{definition.requiredApi}</p>
        {progressLabel ? <p className="mt-1 text-xs text-brand-text-secondary truncate">{progressLabel}</p> : null}
      </div>
      {usageTokens && (
        <div className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-3">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand-text-secondary">
            Tokens
          </p>
          <p className="mt-1 text-xs text-brand-text">In: {usageTokens.input.toLocaleString()} Out: {usageTokens.output.toLocaleString()}</p>
        </div>
      )}
      {quotaInfo && (
        <div className={`rounded-xl p-3 ${isLowQuota ? 'border-amber-400/50 bg-amber-500/10' : 'border-brand-text-secondary/10 bg-brand-primary/40'}`}>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand-text-secondary">
            {isLowQuota ? <AlertTriangle size={12} className="text-amber-500" /> : <Cpu size={12} />}
            Quota
          </p>
          <p className="mt-1 text-xs font-mono text-brand-text">{quotaInfo.quotaMetric || 'Unknown'}: {quotaValue || '?'}</p>
          {retryDelay > 0 && <p className="mt-1 text-xs text-amber-500">Retry in {retryDelay}s</p>}
        </div>
      )}
    </div>
  );
};

export default AiGenerationMeta;

