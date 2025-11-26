
/**
 * Google Search Console Dashboard Component
 * Toont performance metrics en trends voor een project
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  MousePointer, 
  Eye, 
  Target,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface PerformanceData {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  averagePosition: number;
  clicksChange: number;
  impressionsChange: number;
  ctrChange: number;
  positionChange: number;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    position: number;
  }>;
}

interface ProjectGSCDashboardProps {
  projectId: string;
}

export default function ProjectGSCDashboard({ projectId }: ProjectGSCDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PerformanceData[]>([]);
  const [summary, setSummary] = useState({
    totalClicks: 0,
    totalImpressions: 0,
    averageCTR: 0,
    averagePosition: 0,
    clicksChange: 0,
    impressionsChange: 0,
  });

  useEffect(() => {
    loadPerformanceData();
  }, [projectId]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/client/google-search-console/performance?projectId=${projectId}&sortBy=clicks&order=desc`
      );
      
      if (!response.ok) {
        throw new Error('Fout bij laden performance data');
      }
      
      const result = await response.json();
      setData(result.performance || []);
      
      // Calculate summary
      if (result.performance && result.performance.length > 0) {
        const totalClicks = result.performance.reduce((sum: number, p: PerformanceData) => sum + p.clicks, 0);
        const totalImpressions = result.performance.reduce((sum: number, p: PerformanceData) => sum + p.impressions, 0);
        const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const avgPosition = result.performance.reduce((sum: number, p: PerformanceData) => sum + p.averagePosition, 0) / result.performance.length;
        
        const avgClicksChange = result.performance.reduce((sum: number, p: PerformanceData) => sum + (p.clicksChange || 0), 0) / result.performance.length;
        const avgImpressionsChange = result.performance.reduce((sum: number, p: PerformanceData) => sum + (p.impressionsChange || 0), 0) / result.performance.length;
        
        setSummary({
          totalClicks,
          totalImpressions,
          averageCTR: avgCTR,
          averagePosition: avgPosition,
          clicksChange: avgClicksChange,
          impressionsChange: avgImpressionsChange,
        });
      }
    } catch (error: any) {
      console.error('Error loading GSC performance:', error);
      toast.error('Fout bij laden GSC data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('nl-NL').format(Math.round(num));
  };

  const formatPercent = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Dashboard</CardTitle>
          <CardDescription>Laatste 28 dagen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Dashboard</CardTitle>
          <CardDescription>Laatste 28 dagen</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nog geen performance data beschikbaar. Sync eerst je Google Search Console data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MousePointer className="h-8 w-8 text-blue-500" />
              {getTrendIcon(summary.clicksChange)}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{formatNumber(summary.totalClicks)}</div>
              <p className="text-xs text-muted-foreground">Clicks</p>
              {summary.clicksChange !== 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatPercent(summary.clicksChange)} vs vorige periode
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Eye className="h-8 w-8 text-purple-500" />
              {getTrendIcon(summary.impressionsChange)}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{formatNumber(summary.totalImpressions)}</div>
              <p className="text-xs text-muted-foreground">Impressies</p>
              {summary.impressionsChange !== 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatPercent(summary.impressionsChange)} vs vorige periode
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{summary.averageCTR.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Gemiddelde CTR</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{summary.averagePosition.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Gemiddelde Positie</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Top Presterende Pagina's</CardTitle>
          <CardDescription>Laatste 28 dagen - gesorteerd op clicks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.slice(0, 10).map((page, index) => (
              <div key={index} className="border-b border-gray-700 pb-4 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{page.url}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                    
                    {/* Top Keywords */}
                    {page.topQueries && page.topQueries.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {page.topQueries.slice(0, 3).map((query, qIndex) => (
                          <Badge
                            key={qIndex}
                            variant="secondary"
                            className="text-xs"
                          >
                            {query.query}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div>
                    <div className="text-sm font-semibold">{formatNumber(page.clicks)}</div>
                    <div className="text-xs text-muted-foreground">Clicks</div>
                    {page.clicksChange !== 0 && (
                      <div className="text-xs flex items-center gap-1 mt-0.5">
                        {getTrendIcon(page.clicksChange)}
                        <span className={page.clicksChange > 0 ? 'text-green-500' : 'text-red-500'}>
                          {formatPercent(page.clicksChange)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-semibold">{formatNumber(page.impressions)}</div>
                    <div className="text-xs text-muted-foreground">Impressies</div>
                    {page.impressionsChange !== 0 && (
                      <div className="text-xs flex items-center gap-1 mt-0.5">
                        {getTrendIcon(page.impressionsChange)}
                        <span className={page.impressionsChange > 0 ? 'text-green-500' : 'text-red-500'}>
                          {formatPercent(page.impressionsChange)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-semibold">{page.ctr.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">CTR</div>
                    {page.ctrChange !== 0 && (
                      <div className="text-xs flex items-center gap-1 mt-0.5">
                        {getTrendIcon(page.ctrChange)}
                        <span className={page.ctrChange > 0 ? 'text-green-500' : 'text-red-500'}>
                          {formatPercent(page.ctrChange)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-semibold">{page.averagePosition.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Positie</div>
                    {page.positionChange !== 0 && (
                      <div className="text-xs flex items-center gap-1 mt-0.5">
                        {getTrendIcon(-page.positionChange)} {/* Negative change = improvement */}
                        <span className={page.positionChange < 0 ? 'text-green-500' : 'text-red-500'}>
                          {page.positionChange > 0 ? '+' : ''}{page.positionChange.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
