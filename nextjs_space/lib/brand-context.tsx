'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface BrandSettings {
  companyName: string;
  tagline: string | null;
  logoUrl: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  logoIconUrl: string | null;
  faviconUrl: string | null;
  favicon192Url: string | null;
  favicon512Url: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  defaultMetaTitle: string | null;
  defaultMetaDescription: string | null;
}

const defaultBrandSettings: BrandSettings = {
  companyName: 'Writgo Media',
  tagline: 'AI-First Omnipresence Content Agency',
  logoUrl: 'https://computerstartgids.nl/wp-content/uploads/2025/12/Writgo-Media-logo-4.png',
  logoLightUrl: null,
  logoDarkUrl: null,
  logoIconUrl: null,
  faviconUrl: null,
  favicon192Url: null,
  favicon512Url: null,
  primaryColor: '#FF9933',
  secondaryColor: '#0B3C5D',
  accentColor: '#FF6B35',
  email: null,
  phone: null,
  address: null,
  linkedinUrl: null,
  twitterUrl: null,
  facebookUrl: null,
  instagramUrl: null,
  defaultMetaTitle: null,
  defaultMetaDescription: null,
};

const BrandContext = createContext<BrandSettings>(defaultBrandSettings);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(defaultBrandSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch brand settings from API
    const fetchBrandSettings = async () => {
      try {
        const response = await fetch('/api/brand');
        if (response.ok) {
          const data = await response.json();
          setBrandSettings(data);
          
          // Inject CSS variables for colors
          if (typeof document !== 'undefined') {
            const root = document.documentElement;
            root.style.setProperty('--brand-primary-color', data.primaryColor);
            root.style.setProperty('--brand-secondary-color', data.secondaryColor);
            if (data.accentColor) {
              root.style.setProperty('--brand-accent-color', data.accentColor);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch brand settings:', error);
        // Use default settings if fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrandSettings();
  }, []);

  // Don't render children until brand settings are loaded to prevent flash
  // But use a very short timeout to avoid blocking
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => setIsLoading(false), 100);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return (
    <BrandContext.Provider value={brandSettings}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
