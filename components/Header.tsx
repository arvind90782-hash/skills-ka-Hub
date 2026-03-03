
import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  const { theme, toggleTheme } = useTheme();

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
              aria-label="Toggle theme"
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
                Skills Ka Adda
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-text-secondary">
              Aapka Freelance Safar
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
