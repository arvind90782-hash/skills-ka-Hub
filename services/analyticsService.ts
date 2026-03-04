import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from './firebase';

type UsageEventType = 'route_view' | 'tool_open' | 'tool_action' | 'language_change';
type AuthEventType = 'signup' | 'login' | 'logout';

const getActor = () => {
  const user = firebaseAuth?.currentUser;
  return {
    uid: user?.uid ?? 'anonymous',
    email: user?.email ?? 'unknown',
  };
};

export const logUsageEvent = async (
  eventType: UsageEventType,
  details: Record<string, unknown> = {}
): Promise<void> => {
  if (!isFirebaseConfigured || !firestoreDb) {
    return;
  }

  try {
    const actor = getActor();
    await addDoc(collection(firestoreDb, 'usageEvents'), {
      eventType,
      ...details,
      ...actor,
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch (error) {
    console.warn('Usage event log failed:', error);
  }
};

export const logAuthEvent = async (
  eventType: AuthEventType,
  details: Record<string, unknown> = {}
): Promise<void> => {
  if (!isFirebaseConfigured || !firestoreDb) {
    return;
  }

  try {
    const actor = getActor();
    await addDoc(collection(firestoreDb, 'authEvents'), {
      eventType,
      ...details,
      ...actor,
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch (error) {
    console.warn('Auth event log failed:', error);
  }
};
