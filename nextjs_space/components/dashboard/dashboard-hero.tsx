
'use client';

import { Sparkles, Wand2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function DashboardHero() {
  const { data: session } = useSession() || {};
  
  const firstName = session?.user?.name?.split(' ')[0] || 'Daar';

  return (
    <div className="bg-gradient-to-r from-orange-900/30 via-pink-900/20 to-orange-900/30 border border-orange-500/20 rounded-2xl p-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              AI Content Platform
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Hoi, {firstName}! 👋
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl">
            Welkom bij WritGo, jouw AI-powered content platform. 
            Maak SEO-optimized content in seconden met de kracht van Gemini 3 Pro.
          </p>
        </div>
        
        <div className="hidden md:block opacity-20">
          <Wand2 size={120} className="text-orange-400" />
        </div>
      </div>
    </div>
  );
}
