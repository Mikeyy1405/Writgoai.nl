
'use client';

import { Card } from '@/components/ui/card';
import { Lightbulb, Loader2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DailyTip {
  title: string;
  description: string;
  action: string;
  href: string;
  reason: string;
}

const FALLBACK_TIPS: DailyTip[] = [
  {
    title: "Content Generator - 10 Talen",
    description: "Genereer complete SEO-artikelen in 10 verschillende talen. Perfect voor internationale content strategie.",
    action: "Start Content Generator",
    href: "/client-portal/content-generator",
    reason: "Bereik een internationaal publiek"
  },
  {
    title: "Image Specialist",
    description: "Maak unieke AI afbeeldingen met 15+ modellen. Van realistische foto's tot creatieve kunst.",
    action: "Probeer Image Specialist",
    href: "/client-portal/image-specialist",
    reason: "Verhoog engagement met visuele content"
  },
  {
    title: "WordPress Integratie",
    description: "Publiceer direct naar WordPress en bespaar 80% van je tijd met one-click publishing.",
    action: "Configureer WordPress",
    href: "/client-portal/wordpress-content",
    reason: "Stroomlijn je publicatie workflow"
  },
  {
    title: "Content Bibliotheek",
    description: "Bewaar al je content op één plek. Bewerk, exporteer of hergebruik eerdere artikelen.",
    action: "Bekijk Bibliotheek",
    href: "/client-portal/content-library",
    reason: "Organiseer je content beter"
  },
  {
    title: "Projecten Organiseren",
    description: "Gebruik projecten om je content te structureren en overzichtelijk te houden.",
    action: "Beheer Projecten",
    href: "/client-portal/projects",
    reason: "Werk efficiënter met projecten"
  }
];

export function DailyTips() {
  const [tip, setTip] = useState<DailyTip | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    loadPersonalizedTip();
  }, []);

  const loadPersonalizedTip = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/daily-tip');
      if (response.ok) {
        const data = await response.json();
        setTip(data.tip);
      } else {
        // Use fallback tip if API fails
        const today = new Date().getDate();
        setTip(FALLBACK_TIPS[today % FALLBACK_TIPS.length]);
      }
    } catch (error) {
      console.error('Failed to load personalized tip:', error);
      // Use fallback tip
      const today = new Date().getDate();
      setTip(FALLBACK_TIPS[today % FALLBACK_TIPS.length]);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-to-br from-orange-900/30 via-gray-900 to-gray-900 border-orange-500/20 p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/5 to-transparent rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Lightbulb className="text-orange-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">💡 Persoonlijke Tip</h3>
              <p className="text-sm text-gray-400">Speciaal voor jou gegenereerd met AI</p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-orange-400" size={32} />
          </div>
        ) : tip ? (
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/20 flex items-center justify-center">
              <Sparkles className="text-orange-400" size={20} />
            </div>
            
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-2">{tip.title}</h4>
              <p className="text-gray-400 text-sm mb-3">{tip.description}</p>
              {tip.reason && (
                <p className="text-purple-300 text-xs mb-4 italic">
                  💡 {tip.reason}
                </p>
              )}
              
              <Link
                href={tip.href}
                className="inline-flex items-center gap-2 text-sm font-medium text-orange-400 hover:text-purple-300 transition-colors"
              >
                {tip.action}
                <span>→</span>
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">
            Kon geen tip laden. Probeer het later opnieuw.
          </p>
        )}
      </div>
    </Card>
  );
}
