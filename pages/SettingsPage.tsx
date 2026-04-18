import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, ShieldCheck, Palette, RefreshCcw } from 'lucide-react';
import PageBackButton from '../components/PageBackButton';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../hooks/useLocale';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, isAuthenticated } = useAuth();
  const { languageName } = useLocale();

  const resetPreferences = () => {
    localStorage.removeItem('theme');
    localStorage.removeItem('app_language');
    window.location.reload();
  };

  const accountType = isAdmin ? 'Admin' : isAuthenticated ? 'Member' : 'Guest';

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-24">
      <PageBackButton label="Back" fallbackTo="/" />

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-card overflow-hidden border border-brand-accent/20 p-6 md:p-8"
      >
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-xs font-black uppercase tracking-[0.35em] text-brand-accent">
            <Palette size={12} />
            Settings
          </div>
          <h1 className="text-4xl font-black tracking-tight text-brand-text">Appearance and preferences</h1>
          <p className="max-w-2xl text-brand-text-secondary">
            Adjust the app theme and local preferences from one clean place.
          </p>
        </div>
      </motion.section>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="ios-card border border-brand-text-secondary/10 p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent">
              {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
            </div>
            <div>
              <h2 className="text-xl font-black text-brand-text">Theme</h2>
              <p className="text-sm text-brand-text-secondary">Switch between light and dark appearance.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-accent px-5 py-3 font-bold text-white transition hover:bg-brand-accent-light"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Use Light Mode' : 'Use Dark Mode'}
          </button>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ios-card border border-brand-text-secondary/10 p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-brand-text">Account summary</h2>
              <p className="text-sm text-brand-text-secondary">Current profile and local language state.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-brand-text-secondary">Account Type</p>
              <p className="mt-1 text-base font-semibold text-brand-text">{accountType}</p>
            </div>
            <div className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-brand-text-secondary">Language</p>
              <p className="mt-1 text-base font-semibold text-brand-text">{languageName}</p>
            </div>
            <div className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-brand-text-secondary">Signed in</p>
              <p className="mt-1 text-base font-semibold text-brand-text">{user?.email || 'Not signed in'}</p>
            </div>
          </div>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="ios-card border border-brand-text-secondary/10 p-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent">
            <RefreshCcw size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-text">Local preferences</h2>
            <p className="text-sm text-brand-text-secondary">Reset theme and app language back to the default state.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetPreferences}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-brand-text-secondary/20 bg-brand-primary/50 px-5 py-3 font-semibold text-brand-text transition hover:border-brand-accent/40 hover:bg-brand-accent/10"
        >
          <RefreshCcw size={18} />
          Reset Preferences
        </button>
      </motion.section>
    </div>
  );
};

export default SettingsPage;
