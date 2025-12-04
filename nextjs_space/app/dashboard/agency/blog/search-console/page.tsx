'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, MousePointerClick, Eye, BarChart3 } from 'lucide-react';

export default function SearchConsolePage() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Google Search Console</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Verbind je Google Search Console account voor geavanceerde SEO insights
        </p>
      </div>

      {/* Connection Status */}
      <Card className="p-6">
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Google Search Console Niet Verbonden
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Verbind je Google Search Console account om performance data, rankings
            en zoekwoord statistieken te bekijken.
          </p>
          <Button className="bg-gradient-to-r from-[#FF9933] to-[#FFAD33]">
            Verbind Search Console
          </Button>
        </div>
      </Card>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 opacity-60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Clicks</p>
              <p className="text-3xl font-bold mt-1">-</p>
            </div>
            <MousePointerClick className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 opacity-60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Impressions</p>
              <p className="text-3xl font-bold mt-1">-</p>
            </div>
            <Eye className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6 opacity-60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">CTR</p>
              <p className="text-3xl font-bold mt-1">-</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 opacity-60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
              <p className="text-3xl font-bold mt-1">-</p>
            </div>
            <BarChart3 className="w-8 h-8 text-[#FF9933]" />
          </div>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-4">Wat krijg je na verbinding?</h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex gap-2">
            <span className="text-blue-600">✓</span>
            <span>Performance data per artikel (clicks, impressions, CTR, positie)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">✓</span>
            <span>Historische trends en grafieken</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">✓</span>
            <span>Top zoekwoorden per artikel</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">✓</span>
            <span>Indexering status per URL</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">✓</span>
            <span>Rankings tracking over tijd</span>
          </li>
        </ul>
      </Card>

      {/* Setup Instructions */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Hoe te verbinden?</h3>
        <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF9933] text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>
              Ga naar{' '}
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF9933] hover:underline"
              >
                Google Search Console
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF9933] text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>Voeg je website toe en verifieer eigendom</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF9933] text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>Klik op "Verbind Search Console" hierboven om OAuth te starten</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF9933] text-white flex items-center justify-center text-xs font-bold">
              4
            </span>
            <span>Geef WritgoAI toegang tot je Search Console data</span>
          </li>
        </ol>
      </Card>
    </div>
  );
}
