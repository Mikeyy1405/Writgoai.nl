
/**
 * Google Search Console Performance Dashboard
 * Toont performance metrics per artikel
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  MousePointer,
  Eye,
  Target,
  Search,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';

interface ProjectGSCPerformanceProps {
  projectId: string;
}

interface PerformanceData {
  id: string;
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  averagePosition: number;
  clicksChange: number;
  impressionsChange: number;
  ctrChange: number;
  positionChange: number;
  topQueries: any;
  articleIdea: {
    id: string;
    title: string;
    slug: string;
    focusKeyword: string;
  } | null;
}

export default function ProjectGSCPerformance({ projectId }: ProjectGSCPerformanceProps) {
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<'clicks' | 'impressions' | 'ctr' | 'averagePosition'>('clicks');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

  useEffect(() => {
    loadPerformance();
  }, [projectId, sortBy, order]);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/client/google-search-console/performance?projectId=${projectId}&sortBy=${sortBy}&order=${order}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          // No data yet
          setPerformance([]);
          setTotals(null);
          return;
        }
        throw new Error('Fout bij laden performance data');
      }

      const data = await response.json();
      setPerformance(data.performance || []);
      setTotals(data.totals);
      setLastSync(data.lastSync ? new Date(data.lastSync) : null);
    } catch (error: any) {
      toast.error('Fout bij laden performance data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setOrder(order === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('nl-NL').format(Math.round(num));
  };

  const formatPercentage = (num: number) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getTrendIcon = (change: number) => {
    if (Math.abs(change) < 5) return null;
    return change > 0 ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    );
  };

  const getTrendColor = (change: number) => {
    if (Math.abs(change) < 5) return 'text-muted-foreground';
    return change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (performance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Dashboard</CardTitle>
          <CardDescription>
            Geen data beschikbaar. Synchroniseer eerst je Google Search Console data.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totaal Clicks</p>
                <p className="text-2xl font-bold">{formatNumber(totals.clicks)}</p>
              </div>
              <MousePointer className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totaal Impressies</p>
                <p className="text-2xl font-bold">{formatNumber(totals.impressions)}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gemiddelde CTR</p>
                <p className="text-2xl font-bold">{totals.averageCTR.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gem. Positie</p>
                <p className="text-2xl font-bold">{totals.averagePosition.toFixed(1)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Performance</CardTitle>
              <CardDescription>
                Laatste 28 dagen • {lastSync && `Gesynchroniseerd: ${lastSync.toLocaleString('nl-NL')}`}
              </CardDescription>
            </div>
            <Button onClick={loadPerformance} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Vernieuwen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted rounded-lg text-sm font-medium">
              <div className="col-span-4">Artikel</div>
              <div className="col-span-2 flex items-center gap-1 cursor-pointer" onClick={() => toggleSort('clicks')}>
                Clicks
                <ArrowUpDown className="h-3 w-3" />
              </div>
              <div className="col-span-2 flex items-center gap-1 cursor-pointer" onClick={() => toggleSort('impressions')}>
                Impressies
                <ArrowUpDown className="h-3 w-3" />
              </div>
              <div className="col-span-2 flex items-center gap-1 cursor-pointer" onClick={() => toggleSort('ctr')}>
                CTR
                <ArrowUpDown className="h-3 w-3" />
              </div>
              <div className="col-span-2 flex items-center gap-1 cursor-pointer" onClick={() => toggleSort('averagePosition')}>
                Positie
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </div>

            {/* Table Rows */}
            {performance.map((item) => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                <div
                  className="grid grid-cols-12 gap-2 px-3 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setExpandedUrl(expandedUrl === item.url ? null : item.url)}
                >
                  <div className="col-span-4">
                    <div className="space-y-1">
                      <p className="font-medium text-sm line-clamp-1">
                        {item.articleIdea?.title || item.url.split('/').pop() || item.url}
                      </p>
                      {item.articleIdea && (
                        <Badge variant="secondary" className="text-xs">
                          {item.articleIdea.focusKeyword}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold">{formatNumber(item.clicks)}</p>
                    {item.clicksChange !== 0 && (
                      <p className={`text-xs flex items-center gap-1 ${getTrendColor(item.clicksChange)}`}>
                        {getTrendIcon(item.clicksChange)}
                        {formatPercentage(item.clicksChange)}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold">{formatNumber(item.impressions)}</p>
                    {item.impressionsChange !== 0 && (
                      <p className={`text-xs flex items-center gap-1 ${getTrendColor(item.impressionsChange)}`}>
                        {getTrendIcon(item.impressionsChange)}
                        {formatPercentage(item.impressionsChange)}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold">{item.ctr.toFixed(1)}%</p>
                    {item.ctrChange !== 0 && (
                      <p className={`text-xs flex items-center gap-1 ${getTrendColor(item.ctrChange)}`}>
                        {getTrendIcon(item.ctrChange)}
                        {formatPercentage(item.ctrChange)}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold">{item.averagePosition.toFixed(1)}</p>
                    {item.positionChange !== 0 && (
                      <p className={`text-xs flex items-center gap-1 ${getTrendColor(-item.positionChange)}`}>
                        {getTrendIcon(-item.positionChange)}
                        {formatPercentage(Math.abs(item.positionChange))}
                      </p>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedUrl === item.url && (
                  <div className="px-3 py-3 border-t bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Top Zoekwoorden
                      </h4>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Bekijk pagina
                      </a>
                    </div>

                    {item.topQueries && Array.isArray(item.topQueries) && item.topQueries.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {item.topQueries.slice(0, 6).map((query: any, idx: number) => (
                          <div key={idx} className="bg-background rounded p-2 space-y-1">
                            <p className="text-sm font-medium line-clamp-1">{query.query}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatNumber(query.clicks)} clicks</span>
                              <span>Pos. {query.position.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Geen zoekwoorden data beschikbaar</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
