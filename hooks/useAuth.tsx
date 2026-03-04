import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from '../services/firebase';
import { logAuthEvent } from '../services/analyticsService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authReady: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseAdminEmails = () => {
  const raw = import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '';
  return raw
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);
};

const ADMIN_EMAILS = parseAdminEmails();
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const getAuthErrorMessage = (error: unknown, fallback: string): string => {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as any).code) : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Email format sahi nahi hai.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Is email/password se account nahi mila.';
    case 'auth/wrong-password':
      return 'Password galat hai.';
    case 'auth/email-already-in-use':
      return 'Is email se account already bana hua hai.';
    case 'auth/weak-password':
      return 'Password weak hai. Thoda strong password use karo.';
    case 'auth/popup-closed-by-user':
      return 'Google popup close ho gaya. Dobara try karo.';
    case 'auth/popup-blocked':
      return 'Popup block ho gaya. Browser me popups allow karo.';
    case 'auth/operation-not-allowed':
      return 'Google login abhi Firebase me enabled nahi hai.';
    case 'auth/too-many-requests':
      return 'Bahut zyada attempts ho gaye. Thodi der baad try karo.';
    default:
      return fallback;
  }
};

const upsertUserProfile = async (user: User, isSignup = false) => {
  if (!firestoreDb) {
    return;
  }

  const email = user.email?.toLowerCase() ?? '';
  const isAdmin = ADMIN_EMAILS.includes(email);

  await setDoc(
    doc(firestoreDb, 'users', user.uid),
    {
      uid: user.uid,
      email,
      isAdmin,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      ...(isSignup ? { createdAt: serverTimestamp() } : {}),
    },
    { merge: true }
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseAuth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await upsertUserProfile(currentUser, false);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!firebaseAuth) {
      throw new Error('Firebase auth not configured');
    }

    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await upsertUserProfile(cred.user, true);
      await logAuthEvent('signup', { targetEmail: email.toLowerCase(), method: 'password' });
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, 'Signup fail ho gaya.'));
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!firebaseAuth) {
      throw new Error('Firebase auth not configured');
    }

    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      await upsertUserProfile(cred.user, false);
      await logAuthEvent('login', { targetEmail: email.toLowerCase(), method: 'password' });
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, 'Login fail ho gaya.'));
    }
  };

  const signInWithGoogle = async () => {
    if (!firebaseAuth) {
      throw new Error('Firebase auth not configured');
    }

    try {
      const cred = await signInWithPopup(firebaseAuth, googleProvider);
      const userEmail = cred.user.email?.toLowerCase() ?? '';
      const isSignup = cred.user.metadata.creationTime === cred.user.metadata.lastSignInTime;
      await upsertUserProfile(cred.user, isSignup);
      await logAuthEvent(isSignup ? 'signup' : 'login', {
        targetEmail: userEmail,
        method: 'google',
      });
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, 'Google login fail ho gaya.'));
    }
  };

  const resetPassword = async (email: string) => {
    if (!firebaseAuth) {
      throw new Error('Firebase auth not configured');
    }

    try {
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, 'Password reset email bhejne me issue aaya.'));
    }
  };

  const signOutUser = async () => {
    if (!firebaseAuth) {
      return;
    }

    await logAuthEvent('logout');
    await signOut(firebaseAuth);
  };

  const value = useMemo<AuthContextType>(() => {
    const email = user?.email?.toLowerCase() ?? '';
    const isAdmin = ADMIN_EMAILS.includes(email);

    return {
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin,
      authReady: isFirebaseConfigured,
      signUp,
      signIn,
      signInWithGoogle,
      resetPassword,
      signOutUser,
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
