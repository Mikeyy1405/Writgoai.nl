
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from './context';

export function useHomepageTranslations() {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    import(`./translations/homepage-${language}.json`)
      .then((module) => {
        setTranslations(module.default);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load homepage translations:', error);
        // Fallback to Dutch if translation fails
        import('./translations/homepage-nl.json')
          .then((module) => {
            setTranslations(module.default);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  }, [language]);

  return { translations, loading, language };
}
