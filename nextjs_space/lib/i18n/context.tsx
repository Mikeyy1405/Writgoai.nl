
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'nl' | 'en' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('nl');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated and load saved language
    setIsHydrated(true);
    const saved = localStorage.getItem('writgo_language');
    if (saved && ['nl', 'en', 'de'].includes(saved)) {
      setLanguageState(saved as Language);
    }
  }, []);

  useEffect(() => {
    // Only load translations after hydration to avoid SSR mismatch
    if (isHydrated) {
      import(`./translations/${language}.json`)
        .then((module) => setTranslations(module.default))
        .catch(() => setTranslations({}));
    }
  }, [language, isHydrated]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('writgo_language', lang);
    }
  };

  const t = (key: string): string => {
    // Return key during SSR to avoid hydration mismatch
    if (!isHydrated) {
      return key;
    }
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
