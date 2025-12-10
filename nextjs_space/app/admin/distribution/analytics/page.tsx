'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/distribution')}
            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Distributie Analytics</h1>
            <p className="text-zinc-400">
              Inzichten in content prestaties en platform statistieken
            </p>
          </div>
        </div>

        {/* Coming Soon */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Binnenkort Beschikbaar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#FF6B35]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#FF6B35]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Analytics Dashboard komt binnenkort
              </h3>
              <p className="text-zinc-400 max-w-md mx-auto mb-6">
                We werken hard aan een uitgebreide analytics dashboard met:
              </p>
              <ul className="text-left max-w-md mx-auto space-y-2 text-zinc-400">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full"></div>
                  <span>Succes- en faalpercentages per platform</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full"></div>
                  <span>Best presterende publicatietijden</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full"></div>
                  <span>Content prestatie metrics</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full"></div>
                  <span>Historische data grafieken</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full"></div>
                  <span>Engagement statistieken</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">Platform Prestaties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-zinc-500">
                Binnenkort beschikbaar
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">Engagement Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-zinc-500">
                Binnenkort beschikbaar
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">Beste Tijden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-zinc-500">
                Binnenkort beschikbaar
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
