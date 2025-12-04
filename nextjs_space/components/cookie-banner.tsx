'use client';

import { useState, useEffect } from 'react';
import { Cookie, Settings, X } from 'lucide-react';
import { hasConsent, acceptAllCookies, acceptNecessaryOnly } from '@/lib/cookie-consent';
import CookieSettingsModal from './cookie-settings-modal';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = hasConsent();
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    acceptAllCookies();
    setIsVisible(false);
  };

  const handleNecessaryOnly = () => {
    acceptNecessaryOnly();
    setIsVisible(false);
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  const handleSaveSettings = () => {
    setIsSettingsOpen(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <div 
        className="fixed bottom-0 left-0 right-0 z-[9998] animate-slide-up"
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
      >
        <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-t border-blue-500/30 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Icon & Text */}
              <div className="flex-1 flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Cookie className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                </div>
                <div>
                  <h2 
                    id="cookie-banner-title"
                    className="text-lg sm:text-xl font-bold text-white mb-1"
                  >
                    🍪 Cookie Voorkeuren
                  </h2>
                  <p 
                    id="cookie-banner-description"
                    className="text-sm sm:text-base text-gray-300 leading-relaxed"
                  >
                    Wij gebruiken cookies om uw ervaring te verbeteren en onze diensten te optimaliseren. 
                    U kunt uw voorkeuren aanpassen of alle cookies accepteren.{' '}
                    <a 
                      href="/cookiebeleid" 
                      className="text-blue-400 hover:text-blue-300 underline transition-colors"
                    >
                      Meer info
                    </a>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={handleOpenSettings}
                  className="px-4 sm:px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg border border-gray-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                  aria-label="Cookie instellingen openen"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Instellingen</span>
                  <span className="sm:hidden">Aanpassen</span>
                </button>
                
                <button
                  onClick={handleNecessaryOnly}
                  className="px-4 sm:px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg border border-gray-700 transition-all whitespace-nowrap"
                  aria-label="Alleen noodzakelijke cookies accepteren"
                >
                  <span className="hidden sm:inline">Alleen Noodzakelijke</span>
                  <span className="sm:hidden">Alleen Nodig</span>
                </button>
                
                <button
                  onClick={handleAcceptAll}
                  className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all whitespace-nowrap"
                  aria-label="Alle cookies accepteren"
                >
                  Accepteer Alle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <CookieSettingsModal 
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
      />

      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </>
  );
}
