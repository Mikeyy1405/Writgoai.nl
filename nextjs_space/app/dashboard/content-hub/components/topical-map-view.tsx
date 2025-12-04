'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadTopicalMap();
  }, [siteId]);

  useEffect(() => {
    filterClusters();
  }, [clusters, filter, searchQuery, selectedCluster]);

  const loadTopicalMap = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content-hub/generate-map?siteId=${siteId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load topical map');
      }

      const data = await response.json();
      setClusters(data.clusters || []);
      
      // Auto-select first cluster
      if (data.clusters && data.clusters.length > 0) {
        setSelectedCluster(data.clusters[0].name);
      }
    } catch (error: any) {
      console.error('Failed to load topical map:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const filterClusters = () => {
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
  };

  const handleGenerateMap = async () => {
    setGenerating(true);
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
        throw new Error('Failed to generate map');
      }

      const data = await response.json();
      toast.success(`Generated ${data.map.totalArticles} article ideas!`);
      await loadTopicalMap();
    } catch (error: any) {
      console.error('Failed to generate map:', error);
      toast.error('Failed to generate topical map');
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
          <h3 className="text-xl font-semibold mb-2">No topical map generated yet</h3>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            Generate a comprehensive topical authority map with 400-500+ article ideas.
          </p>
          <Button onClick={handleGenerateMap} disabled={generating} className="gap-2">
            {generating && <Loader2 className="h-4 w-4 animate-spin" />}
            <Sparkles className="h-4 w-4" />
            Generate Topical Map
          </Button>
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
          <Button variant="outline" size="sm" onClick={handleGenerateMap} disabled={generating}>
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
        {/* Search & Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Cluster Header */}
        {selectedCluster && (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{selectedCluster}</h2>
              <p className="text-muted-foreground">
                {getArticlesByCluster(selectedCluster).length} articles
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
                <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No articles found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
