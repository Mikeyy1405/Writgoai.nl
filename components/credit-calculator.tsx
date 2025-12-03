
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageSquare, Image, Video, Search, Share2 } from 'lucide-react';

export function CreditCalculator() {
  const items = [
    {
      icon: FileText,
      title: 'SEO Blogs',
      count: '14',
      description: '1500+ woorden, SEO geoptimaliseerd',
      credits: '70 credits per blog',
    },
    {
      icon: Share2,
      title: 'Social Media Posts',
      count: '50',
      description: 'Instagram, Facebook, LinkedIn',
      credits: '20 credits per post',
    },
    {
      icon: Video,
      title: 'AI Videos',
      count: '8',
      description: 'Met voiceover en muziek',
      credits: '120 credits per video',
    },
    {
      icon: MessageSquare,
      title: 'Chat Berichten',
      count: '1000+',
      description: 'AI assistent conversaties',
      credits: '1-5 credits per bericht',
    },
    {
      icon: Search,
      title: 'Web Research',
      count: '66',
      description: 'Real-time web searches',
      credits: '15 credits per search',
    },
    {
      icon: Image,
      title: 'AI Afbeeldingen',
      count: 'Onbeperkt',
      description: 'Via Pixabay API',
      credits: '✨ Gratis!',
    },
  ];

  return (
    <Card className="w-full bg-gradient-to-br from-[#FF9933]/5 to-transparent border-[#FF9933]/20">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl md:text-3xl font-bold">
          💡 Wat kun je maken met <span className="text-[#FF9933]">1000 gratis credits</span>?
        </CardTitle>
        <CardDescription className="text-base mt-2">
          Bij registratie krijg je direct 1000 credits cadeau om te testen 🎉
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-900/80 transition-all duration-200 hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-full bg-[#FF9933]/10 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-[#FF9933]" />
                </div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-3xl font-bold text-[#FF9933] mb-2">{item.count}</p>
                <p className="text-sm text-gray-300 mb-2">{item.description}</p>
                <p className="text-xs text-gray-500 font-mono bg-zinc-800 px-2 py-1 rounded">
                  {item.credits}
                </p>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 p-4 rounded-lg bg-gradient-to-r from-[#FF9933]/10 to-transparent border border-[#FF9933]/20">
          <p className="text-center text-sm text-gray-300">
            <span className="font-semibold text-[#FF9933]">Pro tip:</span> Alle plans komen met onbeperkte Pixabay afbeeldingen. 
            Betaal alleen voor AI generatie - niet voor stock photos! 📸
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
