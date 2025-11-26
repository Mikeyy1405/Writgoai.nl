
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, DollarSign, Activity, Zap } from 'lucide-react';

export default function ApiUsagePage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [stats, setStats] = useState<any>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/api-usage/stats?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to load stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading API usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(4)}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('nl-NL').format(num);
  };

  const getFeatureName = (feature: string) => {
    const names: Record<string, string> = {
      blog_generator_research: 'Blog Generator (Research)',
      blog_generator_writing: 'Blog Generator (Writing)',
      blog_generator_metadata: 'Blog Generator (Metadata)',
      autopilot: 'Autopilot',
      deep_research_writer: 'Deep Research Writer',
      product_search: 'Product Search',
    };
    return names[feature] || feature;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">Geen data beschikbaar</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Credit Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Overzicht van alle AI API kosten en gebruik
          </p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecteer periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Laatste 7 dagen</SelectItem>
            <SelectItem value="30">Laatste 30 dagen</SelectItem>
            <SelectItem value="90">Laatste 90 dagen</SelectItem>
            <SelectItem value="365">Laatste jaar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Kosten</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stats.total.costUSD}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(stats.stats.total.tokens)} tokens gebruikt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.stats.total.requests)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Totaal aantal API calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gem. per Request</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.stats.total.cost / stats.stats.total.requests)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(stats.stats.total.tokens / stats.stats.total.requests)} tokens/request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groei</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{Math.round(stats.stats.total.requests / parseInt(timeRange) * 7)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Verwachte requests/week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Average Cost Per Article Type */}
      <Card>
        <CardHeader>
          <CardTitle>Gemiddelde Kosten per Artikel</CardTitle>
          <CardDescription>
            Overzicht van wat elk type artikel kost om te genereren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.avgCosts.map((item: any) => (
              <div key={item.feature} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{getFeatureName(item.feature)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatNumber(item.avgTokens)} tokens gemiddeld • {item.totalArticles} artikelen
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">${item.avgCostUSD}</p>
                  <p className="text-xs text-muted-foreground">per artikel</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage by Feature */}
      <Card>
        <CardHeader>
          <CardTitle>Gebruik per Feature</CardTitle>
          <CardDescription>Breakdown van kosten per functie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.stats.byFeature.map((item: any) => {
              const percentage = (item.cost / stats.stats.total.cost) * 100;
              return (
                <div key={item.feature} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{getFeatureName(item.feature)}</span>
                    <span className="text-sm font-bold">${item.costUSD}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatNumber(item.requests)} requests</span>
                    <span>{formatNumber(item.tokens)} tokens</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usage by Model */}
      <Card>
        <CardHeader>
          <CardTitle>Gebruik per Model</CardTitle>
          <CardDescription>Welke AI modellen worden het meest gebruikt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.stats.byModel.slice(0, 5).map((item: any) => {
              const percentage = (item.cost / stats.stats.total.cost) * 100;
              return (
                <div key={item.model} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.model}</span>
                    <span className="text-sm font-bold">${item.costUSD}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-blue-500 rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatNumber(item.requests)} requests</span>
                    <span>{formatNumber(item.tokens)} tokens</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Clients */}
      {stats.stats.byClient && stats.stats.byClient.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Klanten</CardTitle>
            <CardDescription>Klanten met hoogste API gebruik</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.stats.byClient.map((item: any, index: number) => (
                <div key={item.clientId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.clientName}</p>
                      <p className="text-sm text-muted-foreground">{item.clientEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">${item.costUSD}</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(item.requests)} requests</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
