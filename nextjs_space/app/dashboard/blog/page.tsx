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

      {/* Pipeline Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] font-bold">
              1
            </div>
            <h3 className="font-semibold text-white">Website Analyseren</h3>
          </div>
          <p className="text-sm text-gray-400">
            Laat AI je website analyseren om automatisch niche, doelgroep en tone te detecteren.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] font-bold">
              2
            </div>
            <h3 className="font-semibold text-white">Content Plan Maken</h3>
          </div>
          <p className="text-sm text-gray-400">
            Genereer een topical authority map met pillar en cluster artikelen voor SEO dominantie.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] font-bold">
              3
            </div>
            <h3 className="font-semibold text-white">Autopilot Activeren</h3>
          </div>
          <p className="text-sm text-gray-400">
            Zet autopilot aan en laat het systeem automatisch artikelen genereren en publiceren.
          </p>
        </div>
      </div>

      {/* Website Analyzer */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#FF9933]/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-[#FF9933]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Website Analyzer</h2>
            <p className="text-sm text-gray-400">
              Laat AI je website analyseren om content strategie te detecteren
            </p>
          </div>
        </div>
        <WebsiteAnalyzer clientId={clientId} onAnalysisComplete={setWebsiteAnalysis} />
      </div>

      {/* Topical Authority Map Generator */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#FF9933]/10 rounded-lg">
            <Zap className="w-5 h-5 text-[#FF9933]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Content Plan Generator</h2>
            <p className="text-sm text-gray-400">
              Maak een topical authority map en genereer artikelen
            </p>
          </div>
        </div>
        <TopicalAuthorityMapGenerator websiteAnalysis={websiteAnalysis} />
      </div>

      {/* Blog Content Library */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#FF9933]/10 rounded-lg">
            <BookOpen className="w-5 h-5 text-[#FF9933]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Content Bibliotheek</h2>
            <p className="text-sm text-gray-400">
              Beheer je gegenereerde blog artikelen
            </p>
          </div>
        </div>
        <BlogContentLibrary />
      </div>
    </div>
  );
}
