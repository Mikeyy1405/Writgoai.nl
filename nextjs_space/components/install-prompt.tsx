
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useBrand } from '@/lib/brand-context';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const brand = useBrand();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Don't show prompt if already installed
    if (isInStandaloneMode) {
      return;
    }

    // 🚫 ALLEEN TONEN OP MOBIEL (niet op desktop)
    // Desktop = scherm breder dan 768px
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) {
      return; // Toon niet op desktop
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show again for 7 days
      }
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      // Show install prompt after 3 seconds
      setTimeout(() => setShowInstallPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show custom install instructions
    if (iOS && !isInStandaloneMode) {
      setTimeout(() => setShowInstallPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  // Don't show anything if app is already installed
  if (isStandalone) {
    return null;
  }

  // Don't show if dismissed
  if (!showInstallPrompt) {
    return null;
  }

  // iOS Install Instructions
  if (isIOS && !deferredPrompt) {
    return (
      <div 
        className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 border-2"
        style={{ borderColor: brand.accentColor || brand.primaryColor }}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Download className="h-6 w-6" style={{ color: brand.accentColor || brand.primaryColor }} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Installeer {brand.companyName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Voor de beste ervaring, installeer de app op je iPhone:
            </p>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>Tik op het deel-icoon <span className="inline-block">📤</span> onderaan</li>
              <li>Scroll naar beneden en tik op "Zet op beginscherm"</li>
              <li>Tik op "Voeg toe"</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Android/Chrome Install Button
  return (
    <div 
      className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 border-2"
      style={{ borderColor: brand.accentColor || brand.primaryColor }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Download className="h-8 w-8" style={{ color: brand.accentColor || brand.primaryColor }} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Installeer {brand.companyName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Voeg toe aan je startscherm voor snelle toegang
          </p>
        </div>
        <Button
          onClick={handleInstallClick}
          className="text-white transition-opacity hover:opacity-90"
          style={{ 
            backgroundColor: brand.accentColor || brand.primaryColor,
          }}
        >
          Installeer
        </Button>
      </div>
    </div>
  );
}
