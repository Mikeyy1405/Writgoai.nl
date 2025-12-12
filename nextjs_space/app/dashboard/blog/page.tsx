'use client';

import { useState } from 'react';
import { Sparkles, BookOpen, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

// Dynamically import heavy components
const WebsiteAnalyzer = dynamic(() => import('@/components/analyzer/WebsiteAnalyzer'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-48"></div>
});

const TopicalAuthorityMapGenerator = dynamic(() => import('@/components/blog/TopicalAuthorityMapGenerator'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-96"></div>
});

const BlogContentLibrary = dynamic(() => import('@/components/blog/BlogContentLibrary'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-96"></div>
});

export default function ClientBlogPage() {
  const { data: session } = useSession();
  const [websiteAnalysis, setWebsiteAnalysis] = useState<any>(null);
  
  // Get clientId from session - assuming it's stored there
  const clientId = (session?.user as any)?.clientId || (session?.user as any)?.id || '';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#FF9933]/10 via-gray-900 to-gray-900 rounded-2xl p-8 border border-gray-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF9933]/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#FF9933]/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-[#FF9933]" />
            </div>
            <h1 className="text-3xl font-bold text-white">Blog Content Pipeline</h1>
          </div>
          <p className="text-gray-400 text-lg max-w-3xl">
            Maak een topical authority map en genereer hoogwaardige blog artikelen met AI.
            Van strategie tot automatische publicatie.
          </p>
        </div>
      </div>

      {/* Pipeline Steps - Correcte 5 stappen flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] font-bold text-sm">
              1
            </div>
            <h3 className="font-semibold text-white text-sm">Website Verbinden</h3>
          </div>
          <p className="text-xs text-gray-400">
            Koppel je WordPress website voor automatische publicatie
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] font-bold text-sm">
              2
            </div>
            <h3 className="font-semibold text-white text-sm">Content Map</h3>
          </div>
          <p className="text-xs text-gray-400">
            Maak een topical authority map met AI
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] font-bold text-sm">
              3
            </div>
            <h3 className="font-semibold text-white text-sm">Genereren</h3>
          </div>
          <p className="text-xs text-gray-400">
            Genereer artikelen met AI batch processing
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] font-bold text-sm">
              4
            </div>
            <h3 className="font-semibold text-white text-sm">Publiceren</h3>
          </div>
          <p className="text-xs text-gray-400">
            Automatisch publiceren naar WordPress
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] font-bold text-sm">
              5
            </div>
            <h3 className="font-semibold text-white text-sm">Overzicht</h3>
          </div>
          <p className="text-xs text-gray-400">
            Beheer je content bibliotheek
          </p>
        </div>
      </div>

      {/* Stap 1: Website Verbinden (WordPress) */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] font-bold">
            1
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">WordPress Verbinden</h2>
            <p className="text-sm text-gray-400">
              Koppel je WordPress website voor automatische blog publicatie
            </p>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-4">
            WordPress connectie zorgt ervoor dat gegenereerde artikelen automatisch worden gepubliceerd op je website.
          </p>
          <button className="px-4 py-2 bg-[#FF9933] text-white rounded-lg hover:bg-[#FF9933]/90 transition-colors">
            WordPress Koppelen (Binnenkort)
          </button>
        </div>
      </div>

      {/* Stap 2: Content Map (Topical Authority Map) */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] font-bold">
            2
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Topical Authority Map</h2>
            <p className="text-sm text-gray-400">
              Maak een complete content strategie met pillar en cluster artikelen
            </p>
          </div>
        </div>
        
        {/* Website Analyzer voor content map input */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#FF9933]" />
            <h3 className="font-semibold text-white">Optioneel: AI Website Analyzer</h3>
          </div>
          <WebsiteAnalyzer clientId={clientId} onAnalysisComplete={setWebsiteAnalysis} />
        </div>
        
        {/* Topical Map Generator */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#FF9933]" />
            <h3 className="font-semibold text-white">Content Map Generator</h3>
          </div>
          <TopicalAuthorityMapGenerator websiteAnalysis={websiteAnalysis} />
        </div>
      </div>

      {/* Stap 3: Genereren (gebeurt via Topical Authority Map component) */}
      {/* Stap 4: Publiceren (autopilot in Topical Authority Map component) */}

      {/* Stap 5: Overzicht (Content Library) */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] font-bold">
            5
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Content Bibliotheek</h2>
            <p className="text-sm text-gray-400">
              Overzicht van alle gegenereerde blog artikelen
            </p>
          </div>
        </div>
        <BlogContentLibrary />
      </div>
    </div>
  );
}
