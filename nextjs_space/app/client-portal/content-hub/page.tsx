'use client';

import { useState, useEffect, useRef } from 'react';
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
  Library,
} from 'lucide-react';
import { toast } from 'sonner';
import WebsiteConnector from './components/website-connector';
import TopicalMapView from './components/topical-map-view';
import AutopilotSettings from './components/autopilot-settings';
import BibliotheekView from './components/bibliotheek-view';
import WordPressPostsList from './components/wordpress-posts-list';

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
  
  // Use ref to prevent duplicate syncs
  const isSyncingRef = useRef(false);

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
      toast.error('Kon verbonden websites niet laden');
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
    if (!selectedSite || syncing || isSyncingRef.current) return;
    
    // Check cooldown - minimum 30 seconds between syncs
    const SYNC_COOLDOWN_MS = 30000;
    const lastSyncKey = `content-hub-last-sync-${selectedSite.id}`;
    const lastSyncTime = localStorage.getItem(lastSyncKey);
    
    if (lastSyncTime) {
      const timeSinceLastSync = Date.now() - parseInt(lastSyncTime, 10);
      if (timeSinceLastSync < SYNC_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((SYNC_COOLDOWN_MS - timeSinceLastSync) / 1000);
        toast.info(`Wacht nog ${remainingSeconds} seconden voor de volgende sync`, { id: 'sync' });
        return;
      }
    }
    
    isSyncingRef.current = true;
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
      
      // Store sync timestamp
      localStorage.setItem(lastSyncKey, Date.now().toString());
      
      toast.success(`${data.stats.synced} artikelen gesynchroniseerd!`, { id: 'sync' });
      
      // Reload sites but don't trigger another sync
      await loadSites();
    } catch (error: any) {
      console.error('Failed to sync:', error);
      toast.error(error.message || 'Kon bestaande content niet synchroniseren', { id: 'sync' });
    } finally {
      setSyncing(false);
      isSyncingRef.current = false;
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
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-[#FF9933]" />
            Content Hub
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Geïntegreerde content workflow - van onderzoek tot publicatie
          </p>
        </div>
        <Button onClick={() => setShowConnector(true)} className="gap-2 w-full sm:w-auto">
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
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {sites.map((site) => (
              <Button
                key={site.id}
                variant={selectedSite?.id === site.id ? 'default' : 'outline'}
                onClick={() => setSelectedSite(site)}
                className="flex-shrink-0 text-xs sm:text-sm"
              >
                <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="max-w-[120px] sm:max-w-none truncate">
                  {new URL(site.wordpressUrl).hostname}
                </span>
              </Button>
            ))}
          </div>

          {/* Selected Site Overview */}
          {selectedSite && (
            <>
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-[#FF9933] flex-shrink-0" />
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-base truncate">{selectedSite.wordpressUrl}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {selectedSite.niche || 'Algemene Content'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSyncExisting}
                        disabled={syncing}
                        title="Synchroniseer bestaande WordPress artikelen"
                        className="flex-1 sm:flex-initial"
                      >
                        {syncing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Authority Score */}
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">Autoriteit</span>
                        <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold">
                        {selectedSite.authorityScore || 0}/100
                      </div>
                      <div className="w-full bg-secondary h-1.5 sm:h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#FF9933] transition-all"
                          style={{ width: `${getAuthorityProgress(selectedSite)}%` }}
                        />
                      </div>
                    </div>

                    {/* Existing Pages */}
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">Bestaand</span>
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold">
                        {selectedSite.existingPages}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        pagina's
                      </div>
                    </div>

                    {/* To Write */}
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">Te Schrijven</span>
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-orange-500">
                        {selectedSite.totalArticles - selectedSite.completedArticles}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        artikelen
                      </div>
                    </div>

                    {/* Completed */}
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">Voltooid</span>
                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-green-500">
                        {selectedSite.completedArticles}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {getCompletionPercentage(selectedSite)}% klaar
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Tabs */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full flex-wrap h-auto gap-1 sm:gap-0">
                  <TabsTrigger value="all" className="text-xs sm:text-sm flex-1 sm:flex-initial">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Alle Artikelen</span>
                    <span className="sm:hidden">Alle</span>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs sm:text-sm flex-1 sm:flex-initial">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Te Schrijven</span>
                    <span className="sm:hidden">Pending</span>
                  </TabsTrigger>
                  <TabsTrigger value="published" className="text-xs sm:text-sm flex-1 sm:flex-initial">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Gepubliceerd</span>
                    <span className="sm:hidden">Klaar</span>
                  </TabsTrigger>
                  <TabsTrigger value="wordpress" className="text-xs sm:text-sm flex-1 sm:flex-initial">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">WordPress Posts</span>
                    <span className="sm:hidden">WP</span>
                  </TabsTrigger>
                  <TabsTrigger value="library" className="text-xs sm:text-sm flex-1 sm:flex-initial">
                    <Library className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Bibliotheek</span>
                    <span className="sm:hidden">Bib</span>
                  </TabsTrigger>
                  <TabsTrigger value="autopilot" className="text-xs sm:text-sm flex-1 sm:flex-initial">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Autopilot</span>
                    <span className="sm:hidden">Auto</span>
                  </TabsTrigger>
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

                <TabsContent value="wordpress" className="mt-6">
                  <WordPressPostsList siteId={selectedSite.id} wordpressUrl={selectedSite.wordpressUrl} />
                </TabsContent>

                <TabsContent value="library" className="mt-6">
                  <BibliotheekView siteId={selectedSite.id} />
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
