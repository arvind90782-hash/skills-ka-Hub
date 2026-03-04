
import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Sparkles, LogOut, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../hooks/useLocale';

interface HeaderProps {
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, signOutUser } = useAuth();
  const { language, languages, setLanguage, t } = useLocale();

  return (
    <header className="sticky top-0 z-50 px-4 py-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <nav className="ios-glass rounded-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-full bg-brand-primary/50 text-brand-text hover:bg-brand-primary transition-colors"
              aria-label={t('header.toggleTheme')}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ y: -20, opacity: 0, rotate: -90 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: 20, opacity: 0, rotate: 90 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                >
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
            
            <div 
              onClick={onLogoClick}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-brand-accent p-1.5 rounded-lg shadow-lg shadow-brand-accent/20"
              >
                <Sparkles size={20} className="text-white" />
              </motion.div>
              <span className="text-xl font-bold tracking-tight text-brand-text group-hover:text-brand-accent transition-colors">
                {t('header.brand')}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-full border border-brand-text-secondary/20 bg-brand-primary/40 px-3 py-1 text-xs font-semibold text-brand-text outline-none"
              aria-label={t('header.language')}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>

            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1 rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-bold text-brand-accent"
              >
                <ShieldCheck size={14} />
                {t('header.admin')}
              </Link>
            )}

            <span className="max-w-44 truncate text-xs font-semibold text-brand-text-secondary">
              {user?.email ?? t('header.userFallback')}
            </span>

            <button
              type="button"
              onClick={() => {
                void signOutUser();
              }}
              className="inline-flex items-center gap-1 rounded-full border border-brand-text-secondary/20 px-3 py-1 text-xs font-semibold text-brand-text-secondary transition-colors hover:text-brand-text"
            >
              <LogOut size={14} />
              {t('header.logout')}
            </button>

            <span className="text-xs font-semibold uppercase tracking-widest text-brand-text-secondary">
              {t('header.journey')}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="max-w-[118px] rounded-full border border-brand-text-secondary/20 bg-brand-primary/40 px-3 py-1 text-xs font-semibold text-brand-text outline-none"
              aria-label={t('header.language')}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                void signOutUser();
              }}
              className="inline-flex items-center justify-center rounded-full border border-brand-text-secondary/20 p-2 text-brand-text-secondary transition-colors hover:text-brand-text"
              aria-label={t('header.logout')}
            >
              <LogOut size={14} />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
