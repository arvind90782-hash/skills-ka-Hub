import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { canRunToolWithBalance, estimateCostForTool, estimateCreditsForTool, subscribeToCreditBalance } from '../services/creditService';

export const useCredits = (toolId?: string) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCreditBalance(user?.uid, (snapshot) => {
      setBalance(snapshot.balance);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  const creditsRequired = toolId ? estimateCreditsForTool(toolId) : 0;
  const estimatedCostUsd = toolId ? estimateCostForTool(toolId) : 0;

  return {
    balance,
    loading,
    creditsRequired,
    estimatedCostUsd,
    canAfford: toolId ? canRunToolWithBalance(toolId, balance) : true,
  };
};

