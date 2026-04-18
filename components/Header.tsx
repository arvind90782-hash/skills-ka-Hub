import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  LogOut,
  ShieldCheck,
  Home,
  LayoutGrid,
  UserCircle2,
  Info,
  Settings,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../hooks/useLocale';

interface HeaderProps {
  onLogoClick?: () => void;
}

const NAV_ITEMS = [
  { label: 'Home', to: '/' as const, icon: Home },
  { label: 'Tools', to: '/tools' as const, icon: LayoutGrid },
  { label: 'My Profile', to: '/my-profile' as const, icon: UserCircle2 },
  { label: 'About', to: '/about' as const, icon: Info },
  { label: 'Settings', to: '/settings' as const, icon: Settings },
];

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, signOutUser } = useAuth();
  const { t } = useLocale();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/tools') {
      return location.pathname === '/tools' || location.pathname.startsWith('/tools/');
    }
    return location.pathname === path;
  };

  const navButtonClass = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active ? 'bg-brand-accent/10 text-brand-accent' : 'text-brand-text-secondary hover:bg-brand-primary/60 hover:text-brand-text'
    }`;

  const drawerLinkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
      active ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-primary/30 text-brand-text-secondary hover:text-brand-text'
    }`;

  return (
    <header className="sticky top-0 z-50 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="ios-glass flex items-center justify-between rounded-[28px] px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onLogoClick}
            className="group flex items-center gap-3 text-left"
            aria-label={t('header.brand')}
          >
            <motion.div
              whileHover={{ rotate: 12, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-2xl bg-brand-accent p-2 shadow-lg shadow-brand-accent/20"
            >
              <Sparkles size={20} className="text-white" />
            </motion.div>
            <div className="leading-tight">
              <span className="block text-lg font-black tracking-tight text-brand-text group-hover:text-brand-accent">
                {t('header.brand')}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.35em] text-brand-text-secondary">
                {t('header.journey')}
              </span>
            </div>
          </button>

          <div className="hidden lg:flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className={navButtonClass(isActive(item.to))}>
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center rounded-full bg-brand-primary/50 p-2 text-brand-text-secondary transition-colors hover:text-brand-text"
              aria-label={t('header.toggleTheme')}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1 rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-bold text-brand-accent"
              >
                <ShieldCheck size={14} />
                {t('header.admin')}
              </Link>
            )}

            <span className="max-w-44 truncate text-xs font-semibold text-brand-text-secondary">{user?.email ?? t('header.userFallback')}</span>

            <button
              type="button"
              onClick={() => {
                void signOutUser();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-brand-text-secondary/20 px-3 py-1 text-xs font-semibold text-brand-text-secondary transition-colors hover:text-brand-text"
            >
              <LogOut size={14} />
              {t('header.logout')}
            </button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center rounded-full bg-brand-primary/50 p-2 text-brand-text-secondary transition-colors hover:text-brand-text"
              aria-label={t('header.toggleTheme')}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex items-center justify-center rounded-full bg-brand-primary/50 p-2 text-brand-text"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="ml-auto flex h-full w-full max-w-sm flex-col border-l border-brand-text-secondary/10 bg-brand-secondary p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-brand-accent">Menu</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-brand-text">{t('header.brand')}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full bg-brand-primary/50 p-2 text-brand-text-secondary"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 space-y-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.to} to={item.to} className={drawerLinkClass(isActive(item.to))}>
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 rounded-3xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-brand-text-secondary">Account</p>
                <p className="mt-2 break-words text-sm font-semibold text-brand-text">{user?.email ?? t('header.userFallback')}</p>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-bold text-brand-accent"
                  >
                    <ShieldCheck size={14} />
                    {t('header.admin')}
                  </Link>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-primary/50 px-4 py-3 font-semibold text-brand-text transition-colors hover:bg-brand-primary"
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void signOutUser();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-text-secondary/20 px-4 py-3 font-semibold text-brand-text-secondary transition-colors hover:text-brand-text"
                >
                  <LogOut size={16} />
                  {t('header.logout')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
