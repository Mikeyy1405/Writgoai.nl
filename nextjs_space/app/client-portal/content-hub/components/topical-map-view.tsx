'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  Sparkles,
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  Eye,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import ClusterCard from './cluster-card';
import ArticleRow from './article-row';

interface Article {
  id: string;
  title: string;
  cluster: string;
  keywords: string[];
  status: string;
  priority: number;
  searchVolume: number | null;
  difficulty: number | null;
  searchIntent: string | null;
  wordpressUrl: string | null;
  publishedAt: string | null;
}

interface Cluster {
  name: string;
  articleCount: number;
  articles: Article[];
}

interface TopicalMapViewProps {
  siteId: string;
  filter?: 'all' | 'pending' | 'published';
}

export default function TopicalMapView({ siteId, filter = 'all' }: TopicalMapViewProps) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [filteredClusters, setFilteredClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  // Use ref to track if we're syncing to prevent duplicate calls
  const isSyncingRef = useRef(false);
  // Use ref to track if initial sync for this filter has been done
  const hasSyncedForFilterRef = useRef<Set<string>>(new Set());

  const loadTopicalMap = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content-hub/generate-map?siteId=${siteId}`);
      
      if (!response.ok) {
        throw new Error('Kon topical map niet laden');
      }

      const data = await response.json();
      setClusters(data.clusters || []);
      
      // Auto-select first cluster
      if (data.clusters && data.clusters.length > 0) {
        setSelectedCluster(data.clusters[0].name);
      }
    } catch (error: any) {
      console.error('Failed to load topical map:', error);
      toast.error('Kon artikelen niet laden');
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  const filterClusters = useCallback(() => {
    let filtered = clusters;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.map(cluster => ({
        ...cluster,
        articles: cluster.articles.filter(article => {
          if (filter === 'pending') {
            return article.status === 'pending' || article.status === 'failed';
          } else if (filter === 'published') {
            return article.status === 'published';
          }
          return true;
        }),
      })).filter(cluster => cluster.articles.length > 0);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.map(cluster => ({
        ...cluster,
        articles: cluster.articles.filter(article =>
          article.title.toLowerCase().includes(query) ||
          article.keywords.some(k => k.toLowerCase().includes(query))
        ),
      })).filter(cluster => cluster.articles.length > 0);
    }

    // Filter by selected cluster
    if (selectedCluster) {
      filtered = filtered.filter(cluster => cluster.name === selectedCluster);
    }

    setFilteredClusters(filtered);
  }, [clusters, filter, searchQuery, selectedCluster]);

  const syncExistingContent = useCallback(async (silent = false) => {
    // Prevent multiple simultaneous syncs using both state and ref
    if (syncing || isSyncingRef.current) return;
    
    // Check cooldown - minimum 30 seconds between syncs
    const SYNC_COOLDOWN_MS = 30000; // 30 seconds
    const lastSyncKey = `content-hub-last-sync-${siteId}`;
    const lastSyncTime = localStorage.getItem(lastSyncKey);
    
    if (lastSyncTime) {
      const timeSinceLastSync = Date.now() - parseInt(lastSyncTime, 10);
      if (timeSinceLastSync < SYNC_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((SYNC_COOLDOWN_MS - timeSinceLastSync) / 1000);
        if (!silent) {
          toast.info(`Wacht nog ${remainingSeconds} seconden voor de volgende sync`, { id: 'sync' });
        }
        return;
      }
    }
    
    isSyncingRef.current = true;
    setSyncing(true);
    setSyncError(null);
    setSyncMessage(null);
    
    if (!silent) {
      toast.loading('Bestaande WordPress content synchroniseren...', { id: 'sync' });
    }
    
    try {
      const response = await fetch('/api/content-hub/sync-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Synchronisatie mislukt');
      }
      
      // Store sync timestamp
      localStorage.setItem(lastSyncKey, Date.now().toString());
      
      // Handle success or warning
      if (data.warning) {
        setSyncMessage(data.message);
        if (!silent) {
          toast.warning(data.message, { id: 'sync' });
        }
      } else {
        setSyncMessage(`${data.stats.synced} artikelen gesynchroniseerd`);
        if (!silent) {
          toast.success(data.message || 'Content gesynchroniseerd!', { id: 'sync' });
        }
      }
      
      // Reload the data to show synced content
      await loadTopicalMap();
    } catch (error: any) {
      console.error('Sync failed:', error);
      setSyncError(error.message);
      if (!silent) {
        toast.error(error.message || 'Kon WordPress content niet synchroniseren', { id: 'sync' });
      }
    } finally {
      setSyncing(false);
      isSyncingRef.current = false;
    }
  }, [syncing, siteId, loadTopicalMap]);

  // useEffect hooks after function definitions
  useEffect(() => {
    loadTopicalMap();
  }, [loadTopicalMap]);

  useEffect(() => {
    filterClusters();
  }, [filterClusters]);

  // Auto-sync when published filter is active (only once per filter change)
  useEffect(() => {
    if (filter === 'published' && siteId) {
      const syncKey = `${siteId}-${filter}`;
      // Only sync once per filter change, not on every render
      if (!hasSyncedForFilterRef.current.has(syncKey)) {
        hasSyncedForFilterRef.current.add(syncKey);
        syncExistingContent(true); // silent sync on initial load
      }
    }
  }, [filter, siteId]); // Remove syncExistingContent from dependencies to prevent loops

  const handleGenerateMap = async () => {
    setGenerating(true);
    toast.loading('Topical map genereren... Dit kan 1-2 minuten duren.', { id: 'generating' });
    
    try {
      const response = await fetch('/api/content-hub/generate-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          targetArticles: 500,
          language: 'nl',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kon topical map niet genereren');
      }

      const data = await response.json();
      toast.success(`${data.map.totalArticles} artikel ideeën gegenereerd!`, { id: 'generating' });
      await loadTopicalMap();
    } catch (error: any) {
      console.error('Failed to generate map:', error);
      toast.error(error.message || 'Kon topical map niet genereren. Probeer het later opnieuw.', { id: 'generating' });
    } finally {
      setGenerating(false);
    }
  };

  const getArticlesByCluster = (clusterName: string) => {
    return clusters.find(c => c.name === clusterName)?.articles || [];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'writing':
      case 'researching':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'published': 'Gepubliceerd',
      'pending': 'Wachtend',
      'writing': 'Schrijven...',
      'researching': 'Onderzoeken...',
      'publishing': 'Publiceren...',
      'failed': 'Mislukt',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nog geen topical map gegenereerd</h3>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            Genereer een uitgebreide topical authority map met 400-500+ artikel ideeën.
            Dit proces duurt ongeveer 1-2 minuten.
          </p>
          <Button onClick={handleGenerateMap} disabled={generating} className="gap-2">
            {generating && <Loader2 className="h-4 w-4 animate-spin" />}
            <Sparkles className="h-4 w-4" />
            {generating ? 'Genereren...' : 'Genereer Topical Map'}
          </Button>
          {generating && (
            <p className="text-sm text-muted-foreground mt-4">
              Even geduld, we analyseren je niche en creëren een contentplan...
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      {/* Clusters Sidebar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Clusters</h3>
          <Button variant="outline" size="sm" onClick={handleGenerateMap} disabled={generating} title="Regenereer topical map">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="space-y-2">
          {clusters.map((cluster) => (
            <button
              key={cluster.name}
              onClick={() => setSelectedCluster(cluster.name)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                selectedCluster === cluster.name
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-accent border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">{cluster.name}</span>
                <Badge variant={selectedCluster === cluster.name ? 'secondary' : 'outline'}>
                  {cluster.articleCount}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {/* Sync Status - Only show for published filter */}
        {filter === 'published' && (syncMessage || syncError) && (
          <Card className={syncError ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {syncError ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  )}
                  <span className={`text-sm ${syncError ? 'text-red-700' : 'text-blue-700'}`}>
                    {syncError || syncMessage}
                  </span>
                </div>
                {syncError && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => syncExistingContent(false)}
                    disabled={syncing}
                    className="gap-2"
                  >
                    {syncing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Probeer opnieuw
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek artikelen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* Manual Sync Button - Only for published filter */}
          {filter === 'published' && (
            <Button 
              variant="outline"
              onClick={() => syncExistingContent(false)}
              disabled={syncing}
              className="gap-2"
              title="Synchroniseer bestaande WordPress artikelen"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync WordPress
            </Button>
          )}
        </div>

        {/* Cluster Header */}
        {selectedCluster && (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{selectedCluster}</h2>
              <p className="text-muted-foreground">
                {getArticlesByCluster(selectedCluster).length} artikelen
              </p>
            </div>
          </div>
        )}

        {/* Articles */}
        <div className="space-y-3">
          {filteredClusters.map((cluster) =>
            cluster.articles.map((article) => (
              <ArticleRow 
                key={article.id} 
                article={article}
                onUpdate={loadTopicalMap}
              />
            ))
          )}

          {filteredClusters.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {filter === 'published' ? 'Geen gepubliceerde artikelen' : 'Geen artikelen gevonden'}
                </h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  {filter === 'published' 
                    ? 'Er zijn nog geen artikelen gesynchroniseerd of gepubliceerd. Klik op "Sync WordPress" om bestaande artikelen te importeren.'
                    : searchQuery 
                      ? 'Geen artikelen komen overeen met je zoekopdracht.'
                      : 'Geen artikelen beschikbaar in deze categorie.'}
                </p>
                {filter === 'published' && (
                  <Button 
                    onClick={() => syncExistingContent(false)}
                    disabled={syncing}
                    className="gap-2"
                  >
                    {syncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Sync WordPress
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
