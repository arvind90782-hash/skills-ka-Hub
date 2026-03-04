import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../hooks/useLocale';

const AuthGate: React.FC = () => {
  const { signIn, signUp, authReady } = useAuth();
  const { languageName, t } = useLocale();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === 'login' ? t('auth.loginTitle') : t('auth.signupTitle')),
    [mode, t]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(t('auth.errorRequired'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.errorPasswordMin'));
      return;
    }

    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.errorFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-primary p-4 text-center">
        <div className="ios-card max-w-xl p-8">
          <h2 className="mb-3 text-2xl font-black text-red-400">{t('auth.setupMissing')}</h2>
          <p className="text-brand-text-secondary">
            {t('auth.setupMissingDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-primary px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 180 }}
        className="ios-card w-full max-w-xl rounded-[28px] p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-brand-accent">
              <ShieldCheck size={14} />
              {t('auth.membersOnly')}
            </p>
            <h1 className="text-4xl font-black tracking-tight text-brand-text">Skills Ka Adda</h1>
            <p className="mt-2 text-sm text-brand-text-secondary">
              {t('auth.required')}. {t('auth.preferredLang')}: {languageName}
            </p>
          </div>
          <div className="rounded-2xl bg-brand-accent/10 p-3 text-brand-accent">
            <Sparkles size={24} />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-brand-primary/50 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${mode === 'login' ? 'bg-brand-accent text-white' : 'text-brand-text-secondary'}`}
          >
            {t('auth.login')}
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${mode === 'signup' ? 'bg-brand-accent text-white' : 'text-brand-text-secondary'}`}
          >
            {t('auth.signup')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-brand-text-secondary">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-brand-text-secondary/20 bg-brand-primary/60 px-4 py-3 text-brand-text outline-none transition focus:border-brand-accent/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-brand-text-secondary">{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full rounded-2xl border border-brand-text-secondary/20 bg-brand-primary/60 px-4 py-3 text-brand-text outline-none transition focus:border-brand-accent/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-accent px-6 py-3 font-black text-white transition-all hover:bg-brand-accent-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            {loading ? t('auth.wait') : title}
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AuthGate;
