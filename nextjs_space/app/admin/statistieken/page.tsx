'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, FileText, Share2, BarChart3, Activity } from 'lucide-react';

export default function StatistiekenPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-[#FF9933]" />
          Statistieken & KPIs
        </h1>
        <p className="text-muted-foreground mt-1">
          Platform statistieken en key performance indicators
        </p>
      </div>

      {/* Key Platform Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Klanten</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              geregistreerde klanten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Gegenereerd</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              totaal content stukken
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social Media Posts</CardTitle>
            <Share2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              gedistribueerd deze maand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Projecten</CardTitle>
            <Activity className="h-4 w-4 text-[#FF9933]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              lopende projecten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Gebruikstrends</CardTitle>
          <CardDescription>
            Platform activiteit over de afgelopen 30 dagen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p>Geen data beschikbaar</p>
            <p className="text-xs mt-2">
              Statistieken worden verzameld zodra er platformactiviteit is
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Section */}
      <Card>
        <CardHeader>
          <CardTitle>Geavanceerde Analytics - Binnenkort Beschikbaar</CardTitle>
          <CardDescription>
            Uitgebreide statistieken en rapportages worden momenteel ontwikkeld
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Binnenkort beschikbaar:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Real-time platform usage metrics</li>
              <li>Klant engagement scores</li>
              <li>Content performance analytics</li>
              <li>API usage en cost tracking per klant</li>
              <li>Growth trends en voorspellingen</li>
              <li>Exporteer functionaliteit (CSV, PDF)</li>
              <li>Custom dashboards en rapporten</li>
            </ul>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Bekijk de{' '}
              <a href="/admin/distribution/analytics" className="text-blue-500 hover:underline">
                Content Analytics
              </a>{' '}
              pagina voor social media performance metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
