'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  FolderKanban,
} from 'lucide-react';
import { toast } from 'sonner';
import WebsiteConnector from '@/app/client-portal/content-hub/components/website-connector';
import TopicalMapView from '@/app/client-portal/content-hub/components/topical-map-view';
import AutopilotSettings from '@/app/client-portal/content-hub/components/autopilot-settings';
import BibliotheekView from '@/app/client-portal/content-hub/components/bibliotheek-view';
import WordPressPostsList from '@/app/client-portal/content-hub/components/wordpress-posts-list';

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
  projectId: string | null;
}

interface ProjectContentHubProps {
  projectId: string;
  projectUrl: string;
}

export default function ProjectContentHub({ projectId, projectUrl }: ProjectContentHubProps) {
  const [site, setSite] = useState<ContentHubSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConnector, setShowConnector] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Use ref to prevent duplicate syncs
  const isSyncingRef = useRef(false);
  // Use ref to prevent infinite recursion when auto-creating from project config
  const isAutoCreatingRef = useRef(false);

  const loadProjectSite = useCallback(async () => {
    try {
      setLoading(true);
      
      // First, check for existing ContentHubSite linked to this project
      const response = await fetch('/api/content-hub/connect-wordpress');
      
      if (!response.ok) {
        throw new Error('Failed to load sites');
      }

      const data = await response.json();
      const sites = data.sites || [];
      
      // Find site linked to this project
      const projectSite = sites.find((s: ContentHubSite) => s.projectId === projectId);
      
      if (projectSite) {
        setSite(projectSite);
        return;
      }
      
      // No ContentHubSite found - check if project has WordPress configured
      // But only do this once to prevent infinite recursion
      if (!isAutoCreatingRef.current) {
        const projectResponse = await fetch(`/api/client/projects/${projectId}`);
        if (!projectResponse.ok) {
          console.error('Failed to load project details');
          return;
        }
        
        const projectData = await projectResponse.json();
        const project = projectData.project;
        
        // Check if project has WordPress credentials configured
        if (project.wordpressUrl && project.wordpressUsername && project.wordpressPassword) {
          // Project has WordPress configured - auto-create ContentHubSite
          console.log('[Content Hub] Project has WordPress configured, auto-creating ContentHubSite');
          isAutoCreatingRef.current = true;
          
          const createResponse = await fetch('/api/content-hub/connect-wordpress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wordpressUrl: project.wordpressUrl,
              username: project.wordpressUsername,
              applicationPassword: project.wordpressPassword,
              projectId: projectId,
            }),
          });
          
          if (createResponse.ok) {
            const createData = await createResponse.json();
            if (createData.success && createData.site) {
              // Use the full response data with defaults for missing fields
              setSite({
                ...createData.site,
                lastSyncedAt: createData.site.lastSyncedAt || null,
                authorityScore: createData.site.authorityScore || null,
                niche: createData.site.niche || null,
                totalArticles: createData.site.totalArticles || 0,
                completedArticles: createData.site.completedArticles || 0,
                createdAt: createData.site.createdAt || new Date().toISOString(),
                projectId: projectId,
              });
              toast.success('WordPress configuratie overgenomen van project instellingen');
            }
          } else {
            const errorData = await createResponse.json().catch(() => ({}));
            console.error('Failed to auto-create ContentHubSite from project WordPress config:', errorData);
            toast.error('Kon WordPress configuratie niet overnemen. Probeer handmatig te verbinden.');
          }
          
          // Reset the flag after the auto-creation attempt
          isAutoCreatingRef.current = false;
        }
      }
    } catch (error: any) {
      console.error('Failed to load project site:', error);
      toast.error('Kon verbonden website niet laden');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    // Reset the auto-creating flag when projectId changes
    isAutoCreatingRef.current = false;
    loadProjectSite();
  }, [projectId, loadProjectSite]);

  const handleSiteConnected = (connectedSite: any) => {
    loadProjectSite();
    setShowConnector(false);
    toast.success('Website succesvol verbonden!');
  };

  const handleSyncExisting = async () => {
    if (!site || syncing || isSyncingRef.current) return;
    
    // Check cooldown - minimum 30 seconds between syncs
    const SYNC_COOLDOWN_MS = 30000;
    const lastSyncKey = `content-hub-last-sync-${site.id}`;
    const lastSyncTime = localStorage.getItem(lastSyncKey);
    
    if (lastSyncTime) {
      const timeSinceLastSync = Date.now() - parseInt(lastSyncTime, 10);
      if (timeSinceLastSync < SYNC_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((SYNC_COOLDOWN_MS - timeSinceLastSync) / 1000);
        toast.error(`Wacht nog ${remainingSeconds} seconden voordat je opnieuw synchroniseert`);
        return;
      }
    }

    try {
      setSyncing(true);
      isSyncingRef.current = true;
      
      // Store the sync time
      localStorage.setItem(lastSyncKey, Date.now().toString());

      const response = await fetch('/api/content-hub/sync-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: site.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync');
      }

      const result = await response.json();
      
      if (result.syncedCount > 0) {
        toast.success(`✅ ${result.syncedCount} artikelen succesvol gesynchroniseerd!`);
      } else {
        toast.info('Geen nieuwe artikelen gevonden om te synchroniseren');
      }

      // Reload site data
      await loadProjectSite();
      
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('Fout bij synchroniseren van artikelen');
      // Remove the sync timestamp on error so user can retry sooner
      localStorage.removeItem(lastSyncKey);
    } finally {
      setSyncing(false);
      isSyncingRef.current = false;
    }
  };

  const getAuthorityProgress = (s: ContentHubSite) => {
    if (!s.authorityScore) return 0;
    return Math.min(s.authorityScore, 100);
  };

  const getCompletionPercentage = (s: ContentHubSite) => {
    if (s.totalArticles === 0) return 0;
    return Math.round((s.completedArticles / s.totalArticles) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No site connected yet
  if (!site) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Content Strategy & Topical Map</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Genereer een topical map en plan je content strategie. WordPress publicatie gebeurt via je Project instellingen.
            </p>
            <div className="flex flex-col gap-2 items-center">
              <Button onClick={() => setShowConnector(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Start Content Planning
              </Button>
              <p className="text-xs text-muted-foreground">
                💡 Tip: Configureer WordPress eerst in je Project instellingen (Integraties tab)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Website Connector Modal */}
        {showConnector && (
          <WebsiteConnector
            onClose={() => setShowConnector(false)}
            onSuccess={handleSiteConnected}
            projectId={projectId}
          />
        )}
      </div>
    );
  }

  // Site is connected
  return (
    <div className="space-y-6">
      {/* Site Overview */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-[#FF9933] flex-shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base truncate" title={site.wordpressUrl}>
                  {site.wordpressUrl}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {site.niche || 'Algemene Content'}
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
                {site.authorityScore || 0}/100
              </div>
              <div className="w-full bg-secondary h-1.5 sm:h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#FF9933] transition-all"
                  style={{ width: `${getAuthorityProgress(site)}%` }}
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
                {site.existingPages}
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
                {site.totalArticles - site.completedArticles}
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
                {site.completedArticles}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {getCompletionPercentage(site)}% klaar
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
          <TabsTrigger value="completed" className="text-xs sm:text-sm flex-1 sm:flex-initial">
            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Voltooid</span>
            <span className="sm:hidden">Klaar</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="text-xs sm:text-sm flex-1 sm:flex-initial">
            <FolderKanban className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Topical Map</span>
            <span className="sm:hidden">Map</span>
          </TabsTrigger>
          <TabsTrigger value="bibliotheek" className="text-xs sm:text-sm flex-1 sm:flex-initial">
            <Library className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Bibliotheek</span>
            <span className="sm:hidden">📚</span>
          </TabsTrigger>
          <TabsTrigger value="autopilot" className="text-xs sm:text-sm flex-1 sm:flex-initial">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Autopilot</span>
            <span className="sm:hidden">🤖</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <WordPressPostsList siteId={site.id} wordpressUrl={site.wordpressUrl} />
        </TabsContent>

        <TabsContent value="pending">
          <WordPressPostsList siteId={site.id} wordpressUrl={site.wordpressUrl} />
        </TabsContent>

        <TabsContent value="completed">
          <WordPressPostsList siteId={site.id} wordpressUrl={site.wordpressUrl} />
        </TabsContent>

        <TabsContent value="map">
          <TopicalMapView siteId={site.id} />
        </TabsContent>

        <TabsContent value="bibliotheek">
          <BibliotheekView siteId={site.id} />
        </TabsContent>

        <TabsContent value="autopilot">
          <AutopilotSettings siteId={site.id} />
        </TabsContent>
      </Tabs>

      {/* Website Connector Modal (for reconfiguration) */}
      {showConnector && (
        <WebsiteConnector
          onClose={() => setShowConnector(false)}
          onSuccess={handleSiteConnected}
          projectId={projectId}
        />
      )}
    </div>
  );
}
