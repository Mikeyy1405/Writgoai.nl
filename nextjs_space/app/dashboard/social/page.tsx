'use client';

import { useState } from 'react';
import { Sparkles, Share2, Zap, Calendar } from 'lucide-react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

// Dynamically import heavy components
const WebsiteAnalyzer = dynamic(() => import('@/components/analyzer/WebsiteAnalyzer'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-48"></div>
});

const SocialMediaPipeline = dynamic(() => import('@/components/social/SocialMediaPipeline').catch(() => {
  // Fallback als component niet bestaat
  return () => (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
      <p className="text-gray-400">Social Media Pipeline component wordt binnenkort toegevoegd</p>
    </div>
  );
}), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-96"></div>
});

const SocialMediaContentLibrary = dynamic(() => import('@/components/social/SocialMediaContentLibrary').catch(() => {
  // Fallback als component niet bestaat
  return () => (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
      <p className="text-gray-400">Social Media Content Library wordt binnenkort toegevoegd</p>
    </div>
  );
}), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-96"></div>
});

export default function ClientSocialPage() {
  const { data: session } = useSession();
  const [websiteAnalysis, setWebsiteAnalysis] = useState<any>(null);
  
  // Get clientId from session - assuming it's stored there
  const clientId = (session?.user as any)?.clientId || (session?.user as any)?.id || '';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-gray-900 to-gray-900 rounded-2xl p-8 border border-gray-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Share2 className="w-6 h-6 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Social Media Pipeline</h1>
          </div>
          <p className="text-gray-400 text-lg max-w-3xl">
            Maak een social media strategie en genereer content voor alle platforms.
            Van planning tot automatische publicatie.
          </p>
        </div>
      </div>

      {/* Pipeline Steps - Correcte 5 stappen flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-sm">
              1
            </div>
            <h3 className="font-semibold text-white text-sm">Socials Connecten</h3>
          </div>
          <p className="text-xs text-gray-400">
            Koppel je social media accounts via Getlate.dev
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-sm">
              2
            </div>
            <h3 className="font-semibold text-white text-sm">Content Plan</h3>
          </div>
          <p className="text-xs text-gray-400">
            Maak een social media strategie met AI
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-sm">
              3
            </div>
            <h3 className="font-semibold text-white text-sm">Posts Maken</h3>
          </div>
          <p className="text-xs text-gray-400">
            Genereer posts met AI voor alle platforms
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-sm">
              4
            </div>
            <h3 className="font-semibold text-white text-sm">Publiceren</h3>
          </div>
          <p className="text-xs text-gray-400">
            Automatisch posten op gekoppelde socials
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-sm">
              5
            </div>
            <h3 className="font-semibold text-white text-sm">Statistieken</h3>
          </div>
          <p className="text-xs text-gray-400">
            Bekijk performance en analytics
          </p>
        </div>
      </div>

      {/* Stap 1: Socials Connecten via Getlate.dev */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold">
            1
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Social Media Koppelen</h2>
            <p className="text-sm text-gray-400">
              Verbind je social media accounts via Getlate.dev voor automatische publicatie
            </p>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-4">
            Koppel LinkedIn, Instagram, Facebook, X (Twitter) en meer om automatisch posts te kunnen plaatsen.
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard/social/connect'}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Social Media Accounts Koppelen
          </button>
        </div>
      </div>

      {/* Stap 2: Social Media Content Plan */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold">
            2
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Social Media Strategie</h2>
            <p className="text-sm text-gray-400">
              Maak een complete social media content strategie met AI
            </p>
          </div>
        </div>
        
        {/* Website Analyzer voor content strategie input */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Optioneel: AI Website Analyzer</h3>
          </div>
          <WebsiteAnalyzer clientId={clientId} onAnalysisComplete={setWebsiteAnalysis} />
        </div>
        
        {/* Social Media Pipeline */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Strategie Generator</h3>
          </div>
          <SocialMediaPipeline websiteAnalysis={websiteAnalysis} />
        </div>
      </div>

      {/* Stap 3: Posts Maken gebeurt via Social Media Pipeline component */}
      {/* Stap 4: Publiceren gebeurt via autopilot in Social Media Pipeline */}

      {/* Stap 5: Statistieken en Overzicht */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold">
            5
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Content Kalender & Statistieken</h2>
            <p className="text-sm text-gray-400">
              Overzicht van je social media posts en performance
            </p>
          </div>
        </div>
        <SocialMediaContentLibrary />
      </div>
    </div>
  );
}
