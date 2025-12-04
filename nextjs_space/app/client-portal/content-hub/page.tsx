'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Plus, 
  BarChart3, 
  FileText, 
  CheckCircle2, 
  Clock,
  Settings,
  RefreshCw,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import WebsiteConnector from './components/website-connector';
import TopicalMapView from './components/topical-map-view';
import AutopilotSettings from './components/autopilot-settings';

interface ContentHubSite {
  id: string;
  wordpressUrl: string;
  isConnected: boolean;
  lastSyncedAt: string | null;
  existingPages: number;
  authorityScore: number | null;
  niche: string | null;
  totalArticles: number;
  completedArticles: number;
  createdAt: string;
}

export default function ContentHubPage() {
  const { data: session } = useSession();
  const [sites, setSites] = useState<ContentHubSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<ContentHubSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConnector, setShowConnector] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/content-hub/connect-wordpress');
      
      if (!response.ok) {
        throw new Error('Failed to load sites');
      }

      const data = await response.json();
      setSites(data.sites || []);
      
      // Auto-select first site if available
      if (data.sites && data.sites.length > 0 && !selectedSite) {
        setSelectedSite(data.sites[0]);
      }
    } catch (error: any) {
      console.error('Failed to load sites:', error);
      toast.error('Failed to load connected websites');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteConnected = (site: any) => {
    loadSites();
    setShowConnector(false);
    setSelectedSite(site);
    toast.success('Website succesvol verbonden!');
  };

  const handleSyncExisting = async () => {
    if (!selectedSite) return;
    
    setSyncing(true);
    toast.loading('Bestaande WordPress content synchroniseren...', { id: 'sync' });
    
    try {
      const response = await fetch('/api/content-hub/sync-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: selectedSite.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Synchronisatie mislukt');
      }

      const data = await response.json();
      toast.success(`${data.stats.synced} artikelen gesynchroniseerd!`, { id: 'sync' });
      
      // Reload sites and topical map to show synced content
      await loadSites();
    } catch (error: any) {
      console.error('Failed to sync:', error);
      toast.error(error.message || 'Kon bestaande content niet synchroniseren', { id: 'sync' });
    } finally {
      setSyncing(false);
    }
  };

  const getAuthorityProgress = (site: ContentHubSite) => {
    const current = site.authorityScore || 0;
    const target = 85;
    return (current / target) * 100;
  };

  const getCompletionPercentage = (site: ContentHubSite) => {
    if (site.totalArticles === 0) return 0;
    return Math.round((site.completedArticles / site.totalArticles) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Content Hub laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-[#FF9933]" />
            Content Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Unified content workflow - from research to publishing
          </p>
        </div>
        <Button onClick={() => setShowConnector(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Website Toevoegen
        </Button>
      </div>

      {/* No sites connected */}
      {sites.length === 0 && !showConnector && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Geen websites gekoppeld</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Koppel je WordPress website om automatisch SEO-geoptimaliseerde content te genereren.
            </p>
            <Button onClick={() => setShowConnector(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Koppel Je Eerste Website
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Website Connector Modal */}
      {showConnector && (
        <WebsiteConnector
          onClose={() => setShowConnector(false)}
          onSuccess={handleSiteConnected}
        />
      )}

      {/* Sites List - Horizontal Tabs */}
      {sites.length > 0 && (
        <div className="space-y-6">
          {/* Site Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sites.map((site) => (
              <Button
                key={site.id}
                variant={selectedSite?.id === site.id ? 'default' : 'outline'}
                onClick={() => setSelectedSite(site)}
                className="flex-shrink-0"
              >
                <Globe className="h-4 w-4 mr-2" />
                {new URL(site.wordpressUrl).hostname}
              </Button>
            ))}
          </div>

          {/* Selected Site Overview */}
          {selectedSite && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-6 w-6 text-[#FF9933]" />
                      <div>
                        <CardTitle>{selectedSite.wordpressUrl}</CardTitle>
                        <CardDescription>
                          {selectedSite.niche || 'General Content'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSyncExisting}
                        disabled={syncing}
                        title="Synchroniseer bestaande WordPress artikelen"
                      >
                        {syncing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Authority Score */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Autoriteit</span>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold">
                        {selectedSite.authorityScore || 0}/100
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#FF9933] transition-all"
                          style={{ width: `${getAuthorityProgress(selectedSite)}%` }}
                        />
                      </div>
                    </div>

                    {/* Existing Pages */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Bestaand</span>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold">
                        {selectedSite.existingPages}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        pagina's
                      </div>
                    </div>

                    {/* To Write */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Te Schrijven</span>
                        <Clock className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="text-2xl font-bold text-orange-500">
                        {selectedSite.totalArticles - selectedSite.completedArticles}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        artikelen
                      </div>
                    </div>

                    {/* Completed */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Voltooid</span>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-green-500">
                        {selectedSite.completedArticles}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getCompletionPercentage(selectedSite)}% klaar
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Tabs */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">Alle Artikelen</TabsTrigger>
                  <TabsTrigger value="pending">Te Schrijven</TabsTrigger>
                  <TabsTrigger value="published">Gepubliceerd</TabsTrigger>
                  <TabsTrigger value="autopilot">Autopilot</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <TopicalMapView siteId={selectedSite.id} filter="all" />
                </TabsContent>

                <TabsContent value="pending" className="mt-6">
                  <TopicalMapView siteId={selectedSite.id} filter="pending" />
                </TabsContent>

                <TabsContent value="published" className="mt-6">
                  <TopicalMapView siteId={selectedSite.id} filter="published" />
                </TabsContent>

                <TabsContent value="autopilot" className="mt-6">
                  <AutopilotSettings siteId={selectedSite.id} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      )}
    </div>
  );
}
