import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
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

    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    await upsertUserProfile(cred.user, true);
    await logAuthEvent('signup', { targetEmail: email.toLowerCase() });
  };

  const signIn = async (email: string, password: string) => {
    if (!firebaseAuth) {
      throw new Error('Firebase auth not configured');
    }

    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    await upsertUserProfile(cred.user, false);
    await logAuthEvent('login', { targetEmail: email.toLowerCase() });
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
