import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  collection,
} from 'firebase/firestore';
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from './firebase';
import { CREDIT_CONFIG, getCreditsForTool, getToolDefinition, type ToolGenerationType, type ToolProvider } from './toolCatalog';

const LOCAL_BALANCE_KEY = 'skills_hub_credit_balance_v1';
const LOCAL_USAGE_KEY = 'skills_hub_usage_logs_v1';

export type CreditSnapshot = {
  balance: number;
  source: 'firestore' | 'local';
};

export type UsageLogPayload = {
  toolId: string;
  toolName: string;
  apiUsed: ToolProvider | string;
  creditsUsed: number;
  generationType: ToolGenerationType;
  estimatedCostUsd: number;
  model?: string;
  fallbackUsed?: boolean;
  status?: 'success' | 'failed';
};

const getAnonymousBalance = (): number => {
  if (typeof window === 'undefined') {
    return CREDIT_CONFIG.startingBalance;
  }

  const raw = localStorage.getItem(LOCAL_BALANCE_KEY);
  const value = Number.parseInt(raw || '', 10);
  if (Number.isFinite(value) && value >= 0) {
    return value;
  }
  localStorage.setItem(LOCAL_BALANCE_KEY, String(CREDIT_CONFIG.startingBalance));
  return CREDIT_CONFIG.startingBalance;
};

const setAnonymousBalance = (balance: number) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(LOCAL_BALANCE_KEY, String(Math.max(0, Math.floor(balance))));
};

const appendLocalUsageLog = (payload: UsageLogPayload) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_USAGE_KEY) || '[]');
    const next = Array.isArray(current) ? current : [];
    next.unshift({
      ...payload,
      user_id: firebaseAuth?.currentUser?.uid ?? 'anonymous',
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(LOCAL_USAGE_KEY, JSON.stringify(next.slice(0, 200)));
  } catch {
    // Ignore local cache failures.
  }
};

const getBalanceRef = (uid: string) => doc(firestoreDb!, 'user_credit_balances', uid);

const ensureFirestoreBalance = async (uid: string, email?: string | null) => {
  if (!isFirebaseConfigured || !firestoreDb) {
    return;
  }

  const ref = getBalanceRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        user_id: uid,
        email: email || 'unknown',
        balance: CREDIT_CONFIG.startingBalance,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
};

export const estimateCreditsForTool = (toolId: string): number => getCreditsForTool(toolId);

export const estimateCostForTool = (toolId: string): number => {
  const definition = getToolDefinition(toolId);
  return definition?.estimatedCostUsd ?? 0;
};

export const subscribeToCreditBalance = (
  uid: string | null | undefined,
  callback: (snapshot: CreditSnapshot) => void
) => {
  if (!uid || !isFirebaseConfigured || !firestoreDb) {
    callback({ balance: getAnonymousBalance(), source: 'local' });
    return () => undefined;
  }

  void ensureFirestoreBalance(uid, firebaseAuth?.currentUser?.email);

  return onSnapshot(getBalanceRef(uid), (snap) => {
    const balance = Number(snap.data()?.balance ?? CREDIT_CONFIG.startingBalance);
    callback({
      balance: Number.isFinite(balance) ? balance : CREDIT_CONFIG.startingBalance,
      source: 'firestore',
    });
  });
};

export const getCurrentCreditBalance = async (uid?: string | null): Promise<number> => {
  if (!uid || !isFirebaseConfigured || !firestoreDb) {
    return getAnonymousBalance();
  }

  await ensureFirestoreBalance(uid, firebaseAuth?.currentUser?.email);
  const snap = await getDoc(getBalanceRef(uid));
  const balance = Number(snap.data()?.balance ?? CREDIT_CONFIG.startingBalance);
  return Number.isFinite(balance) ? balance : CREDIT_CONFIG.startingBalance;
};

export const recordUsageAndConsumeCredits = async (payload: UsageLogPayload): Promise<void> => {
  const currentUser = firebaseAuth?.currentUser;

  if (!currentUser || !isFirebaseConfigured || !firestoreDb) {
    const currentBalance = getAnonymousBalance();
    const nextBalance = Math.max(0, currentBalance - Math.max(0, payload.creditsUsed));
    setAnonymousBalance(nextBalance);
    appendLocalUsageLog(payload);
    return;
  }

  await ensureFirestoreBalance(currentUser.uid, currentUser.email);

  const balanceRef = getBalanceRef(currentUser.uid);
  const usageRef = doc(collection(firestoreDb, 'user_usage_logs'));

  await runTransaction(firestoreDb, async (transaction) => {
    const balanceSnap = await transaction.get(balanceRef);
    const currentBalance = Number(balanceSnap.data()?.balance ?? CREDIT_CONFIG.startingBalance);
    const nextBalance = currentBalance - Math.max(0, payload.creditsUsed);

    if (nextBalance < 0) {
      throw new Error('Not enough credits to complete this generation.');
    }

    transaction.set(
      balanceRef,
      {
        user_id: currentUser.uid,
        email: currentUser.email || 'unknown',
        balance: nextBalance,
        updatedAt: serverTimestamp(),
        lastTool: payload.toolId,
      },
      { merge: true }
    );

    transaction.set(usageRef, {
      user_id: currentUser.uid,
      email: currentUser.email || 'unknown',
      tool_id: payload.toolId,
      tool_name: payload.toolName,
      api_used: payload.apiUsed,
      model: payload.model || '',
      credits_used: payload.creditsUsed,
      generation_type: payload.generationType,
      estimated_cost_usd: payload.estimatedCostUsd,
      fallback_used: !!payload.fallbackUsed,
      status: payload.status || 'success',
      timestamp: serverTimestamp(),
    });
  });
};

export const getLocalUsageLogs = (): UsageLogPayload[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_USAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

export const canRunToolWithBalance = (toolId: string, balance: number): boolean => {
  return balance >= getCreditsForTool(toolId);
};

