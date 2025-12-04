'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { COOKIE_CATEGORIES, saveCookieConsent, getCookieConsent } from '@/lib/cookie-consent';

interface CookieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function CookieSettingsModal({ isOpen, onClose, onSave }: CookieSettingsModalProps) {
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent) {
      setPreferences({
        analytics: consent.analytics,
        marketing: consent.marketing,
        functional: consent.functional,
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveCookieConsent(preferences);
    onSave();
  };

  const handleToggle = (category: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-gray-900 to-black border border-blue-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Cookie Instellingen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Sluiten"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <p className="text-gray-300 mb-6">
            Wij gebruiken cookies om uw ervaring te verbeteren. U kunt hieronder per categorie kiezen welke cookies u wilt accepteren.
          </p>

          <div className="space-y-4">
            {/* Necessary Cookies - Always On */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {COOKIE_CATEGORIES.necessary.name}
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                      Altijd aan
                    </span>
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {COOKIE_CATEGORIES.necessary.description}
                  </p>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-6 bg-blue-500 rounded-full flex items-center justify-end px-1 cursor-not-allowed">
                    <div className="w-4 h-4 bg-white rounded-full shadow-lg" />
                  </div>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1 mt-3">
                {COOKIE_CATEGORIES.necessary.cookies.map((cookie, idx) => (
                  <li key={idx}>• {cookie}</li>
                ))}
              </ul>
            </div>

            {/* Analytics Cookies */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    {COOKIE_CATEGORIES.analytics.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {COOKIE_CATEGORIES.analytics.description}
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggle('analytics')}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                      preferences.analytics 
                        ? 'bg-blue-500 justify-end' 
                        : 'bg-gray-600 justify-start'
                    } px-1`}
                    aria-label={`${preferences.analytics ? 'Uitschakelen' : 'Inschakelen'} analytische cookies`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-lg" />
                  </button>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1 mt-3">
                {COOKIE_CATEGORIES.analytics.cookies.map((cookie, idx) => (
                  <li key={idx}>• {cookie}</li>
                ))}
              </ul>
            </div>

            {/* Marketing Cookies */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    {COOKIE_CATEGORIES.marketing.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {COOKIE_CATEGORIES.marketing.description}
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggle('marketing')}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                      preferences.marketing 
                        ? 'bg-blue-500 justify-end' 
                        : 'bg-gray-600 justify-start'
                    } px-1`}
                    aria-label={`${preferences.marketing ? 'Uitschakelen' : 'Inschakelen'} marketing cookies`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-lg" />
                  </button>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1 mt-3">
                {COOKIE_CATEGORIES.marketing.cookies.map((cookie, idx) => (
                  <li key={idx}>• {cookie}</li>
                ))}
              </ul>
            </div>

            {/* Functional Cookies */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    {COOKIE_CATEGORIES.functional.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {COOKIE_CATEGORIES.functional.description}
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggle('functional')}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                      preferences.functional 
                        ? 'bg-blue-500 justify-end' 
                        : 'bg-gray-600 justify-start'
                    } px-1`}
                    aria-label={`${preferences.functional ? 'Uitschakelen' : 'Inschakelen'} functionele cookies`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-lg" />
                  </button>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1 mt-3">
                {COOKIE_CATEGORIES.functional.cookies.map((cookie, idx) => (
                  <li key={idx}>• {cookie}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-800 bg-gray-900/50">
          <a
            href="/cookiebeleid"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Meer over cookies
          </a>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Voorkeuren Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
