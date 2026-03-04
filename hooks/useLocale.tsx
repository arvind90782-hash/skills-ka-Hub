import React, { createContext, useContext, useMemo, useState } from 'react';
import { logUsageEvent } from '../services/analyticsService';

export interface LanguageOption {
  code: string;
  label: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bangla' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'mr', label: 'Marathi' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'ur', label: 'Urdu' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'tr', label: 'Turkish' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
];

interface LocaleContextType {
  language: string;
  languageName: string;
  languages: LanguageOption[];
  setLanguage: (code: string) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const STORAGE_KEY = 'app_language';

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGE_OPTIONS.some((l) => l.code === saved)) {
      return saved;
    }
    return 'en';
  });

  const setLanguage = (code: string) => {
    const selected = LANGUAGE_OPTIONS.find((l) => l.code === code);
    if (!selected) {
      return;
    }

    setLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code;
    void logUsageEvent('language_change', { language: code });
  };

  const value = useMemo(
    () => ({
      language,
      languageName: LANGUAGE_OPTIONS.find((l) => l.code === language)?.label ?? 'English',
      languages: LANGUAGE_OPTIONS,
      setLanguage,
    }),
    [language]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used inside LocaleProvider');
  }
  return context;
};
