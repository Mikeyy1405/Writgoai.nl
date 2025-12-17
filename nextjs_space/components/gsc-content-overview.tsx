
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Eye, 
  MousePointer, 
  Search,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface ExistingPage {
  url: string;
  title: string;
  clicks: number;
  impressions: number;
  ctr: number;
  averagePosition: number;
  indexStatus: 'INDEXED' | 'NOT_INDEXED' | 'PROCESSING' | 'UNKNOWN';
  lastCrawlTime?: string;
  topKeywords: string[];
  isDuplicate?: boolean;
  duplicateScore?: number;
}

interface GSCContentOverviewProps {
  projectId: string;
  onContentAnalyzed?: (pages: ExistingPage[]) => void;
}

export default function GSCContentOverview({ projectId, onContentAnalyzed }: GSCContentOverviewProps) {
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<ExistingPage[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [categories, setCategories] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'improve' | 'low'>('all');
  const [needsSetup, setNeedsSetup] = useState(false);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/search-console/content?projectId=${projectId}`);
      
      if (!response.ok) {
        const error = await response.json();
        if (error.needsSetup) {
          setNeedsSetup(true);
          toast.error(error.message);
          return;
        }
        throw new Error(error.message || 'Failed to fetch content');
      }

      const data = await response.json();
      
      if (data.needsWait) {
        toast.info(data.message, { duration: 5000 });
        return;
      }

      setPages(data.pages || []);
      setSummary(data.summary || null);
      setCategories(data.categories || null);
      
      if (onContentAnalyzed) {
        onContentAnalyzed(data.pages || []);
      }

      toast.success(`✅ ${data.pages?.length || 0} pagina's geanalyseerd`);
    } catch (error) {
      console.error('Error fetching GSC content:', error);
      toast.error(error instanceof Error ? error.message : 'Kon content niet ophalen');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayPages = () => {
    if (!pages.length) return [];
    
    switch (activeTab) {
      case 'high':
        return categories?.highPerformers || [];
      case 'improve':
        return categories?.needsImprovement || [];
      case 'low':
        return categories?.lowVisibility || [];
      default:
        return pages;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.round(num).toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'INDEXED':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'NOT_INDEXED':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'PROCESSING':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-slate-8000/10 text-gray-400 border-gray-500/30';
    }
  };

  const getPerformanceColor = (position: number) => {
    if (position <= 3) return 'text-green-400';
    if (position <= 10) return 'text-blue-400';
    if (position <= 20) return 'text-yellow-400';
    return 'text-gray-400';
  };

  if (needsSetup) {
    return (
      <Card className="p-8 bg-gradient-to-br from-orange-500/10 to-orange-700/10 border-2 border-orange-500/20">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Google Search Console Niet Gekoppeld
          </h3>
          <p className="text-gray-400 mb-6">
            Koppel Google Search Console om je bestaande content te analyseren en te verbeteren.
          </p>
          <Button 
            onClick={() => window.location.href = '/client-portal/settings?tab=gsc'}
            className="bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800"
          >
            <Search className="w-4 h-4 mr-2" />
            Google Search Console Koppelen
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            📊 Bestaande Content Analyse
          </h3>
          <p className="text-gray-400">
            Zie welke content je al hebt, hoe ze scoren en wat verbeterd moet worden
          </p>
        </div>
        <Button
          onClick={fetchContent}
          disabled={loading}
          className="bg-slate-900/10 hover:bg-slate-900/20 border border-white/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Laden...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Ververs Data
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-900/5 border-white/10">
            <div className="text-sm text-gray-400 mb-1">Totaal Pagina's</div>
            <div className="text-3xl font-black text-white">{summary.totalPages}</div>
          </Card>
          <Card className="p-4 bg-green-500/10 border-green-500/20">
            <div className="text-sm text-gray-400 mb-1">Top Performers</div>
            <div className="text-3xl font-black text-green-400">{summary.highPerformers}</div>
          </Card>
          <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
            <div className="text-sm text-gray-400 mb-1">Moet Verbeterd</div>
            <div className="text-3xl font-black text-yellow-400">{summary.needsImprovement}</div>
          </Card>
          <Card className="p-4 bg-slate-8000/10 border-gray-500/20">
            <div className="text-sm text-gray-400 mb-1">Lage Zichtbaarheid</div>
            <div className="text-3xl font-black text-gray-400">{summary.lowVisibility}</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      {pages.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            onClick={() => setActiveTab('all')}
            variant={activeTab === 'all' ? 'default' : 'outline'}
            className={activeTab === 'all' ? 'bg-slate-900/20' : 'bg-slate-900/5'}
          >
            Alle ({pages.length})
          </Button>
          <Button
            onClick={() => setActiveTab('high')}
            variant={activeTab === 'high' ? 'default' : 'outline'}
            className={activeTab === 'high' ? 'bg-green-500/20 border-green-500/30' : 'bg-slate-900/5'}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Top ({categories?.highPerformers?.length || 0})
          </Button>
          <Button
            onClick={() => setActiveTab('improve')}
            variant={activeTab === 'improve' ? 'default' : 'outline'}
            className={activeTab === 'improve' ? 'bg-yellow-500/20 border-yellow-500/30' : 'bg-slate-900/5'}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Verbeteren ({categories?.needsImprovement?.length || 0})
          </Button>
          <Button
            onClick={() => setActiveTab('low')}
            variant={activeTab === 'low' ? 'default' : 'outline'}
            className={activeTab === 'low' ? 'bg-slate-8000/20 border-gray-500/30' : 'bg-slate-900/5'}
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Laag ({categories?.lowVisibility?.length || 0})
          </Button>
        </div>
      )}

      {/* Content List */}
      <div className="space-y-3">
        {getDisplayPages().length === 0 && !loading && (
          <Card className="p-8 bg-slate-900/5 border-white/10 text-center">
            <p className="text-gray-400">
              {pages.length === 0 
                ? 'Klik op "Ververs Data" om je content te analyseren' 
                : 'Geen pagina\'s in deze categorie'}
            </p>
          </Card>
        )}

        {getDisplayPages().map((page, index) => (
          <Card key={index} className="p-4 bg-slate-900/5 border-white/10 hover:bg-slate-900/10 transition-all">
            <div className="flex items-start gap-4">
              {/* Status Icon */}
              <div className="mt-1">
                {page.indexStatus === 'INDEXED' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : page.indexStatus === 'NOT_INDEXED' ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1 line-clamp-1">{page.title}</h4>
                    <a 
                      href={page.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-gray-400 hover:text-orange-400 flex items-center gap-1 line-clamp-1"
                    >
                      {page.url}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                  
                  <Badge className={getStatusColor(page.indexStatus)}>
                    {page.indexStatus}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm mb-3">
                  <div className="flex items-center gap-1">
                    <MousePointer className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-semibold">{formatNumber(page.clicks)}</span>
                    <span className="text-gray-500">clicks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-semibold">{formatNumber(page.impressions)}</span>
                    <span className="text-gray-500">views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-white font-semibold">{(page.ctr * 100).toFixed(1)}%</span>
                    <span className="text-gray-500">CTR</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`font-semibold ${getPerformanceColor(page.averagePosition)}`}>
                      #{page.averagePosition.toFixed(1)}
                    </span>
                    <span className="text-gray-500">positie</span>
                  </div>
                </div>

                {/* Keywords */}
                {page.topKeywords.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">Top keywords:</span>
                    {page.topKeywords.slice(0, 3).map((keyword, i) => (
                      <Badge key={i} className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
        </div>
      )}
    </div>
  );
}
