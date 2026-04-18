import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
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
  signUp: (email: string, password: string, remember?: boolean) => Promise<void>;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signInWithGoogle: (remember?: boolean) => Promise<void>;
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
      return 'The email format is invalid.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'No account was found for that email and password.';
    case 'auth/wrong-password':
      return 'The password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account already exists with that email.';
    case 'auth/weak-password':
      return 'The password is too weak. Please choose a stronger one.';
    case 'auth/popup-closed-by-user':
      return 'The Google sign-in popup was closed. Please try again.';
    case 'auth/popup-blocked':
      return 'The popup was blocked. Please allow popups in your browser.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled in Firebase yet.';
    case 'auth/too-many-requests':
      return 'Too many attempts were made. Please try again later.';
    default:
      return fallback;
  }
};

const setAuthPersistenceMode = async (remember = true) => {
  if (!firebaseAuth) {
    return;
  }
  await setPersistence(firebaseAuth, remember ? browserLocalPersistence : browserSessionPersistence);
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

  const signUp = async (email: string, password: string, remember = true) => {
    if (!firebaseAuth) {
      throw new Error('Firebase auth not configured');
    }

    try {
      await setAuthPersistenceMode(remember);
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await upsertUserProfile(cred.user, true);
      await logAuthEvent('signup', { targetEmail: email.toLowerCase(), method: 'password' });
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, 'Sign up failed.'));
    }
  };

  const signIn = async (email: string, password: string, remember = true) => {
    if (!firebaseAuth) {
      throw new Error('Firebase auth not configured');
    }

    try {
      await setAuthPersistenceMode(remember);
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      await upsertUserProfile(cred.user, false);
      await logAuthEvent('login', { targetEmail: email.toLowerCase(), method: 'password' });
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, 'Login failed.'));
    }
  };

  const signInWithGoogle = async (remember = true) => {
    if (!firebaseAuth) {
      throw new Error('Firebase auth not configured');
    }

    try {
      await setAuthPersistenceMode(remember);
      const cred = await signInWithPopup(firebaseAuth, googleProvider);
      const userEmail = cred.user.email?.toLowerCase() ?? '';
      const isSignup = cred.user.metadata.creationTime === cred.user.metadata.lastSignInTime;
      await upsertUserProfile(cred.user, isSignup);
      await logAuthEvent(isSignup ? 'signup' : 'login', {
        targetEmail: userEmail,
        method: 'google',
      });
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, 'Google login failed.'));
    }
  };

  const resetPassword = async (email: string) => {
    if (!firebaseAuth) {
      throw new Error('Firebase auth not configured');
    }

    try {
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, 'There was a problem sending the password reset email.'));
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
