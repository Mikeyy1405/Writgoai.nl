
/**
 * Google Search Console Configuratie Component
 * Configureer GSC integratie per project
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BarChart3, RefreshCw, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ProjectGSCConfigProps {
  projectId: string;
}

export default function ProjectGSCConfig({ projectId }: ProjectGSCConfigProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [siteUrl, setSiteUrl] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [gscConnected, setGscConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [availableSites, setAvailableSites] = useState<string[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [showSiteSelector, setShowSiteSelector] = useState(false);

  useEffect(() => {
    loadConfig();
    checkGSCStatus();
    
    // Check voor OAuth success/error in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('gsc') === 'success') {
      console.log('✅ OAuth success detected - reloading GSC status and sites...');
      toast.success('Google Search Console succesvol gekoppeld!', {
        description: 'Je sites worden nu geladen...',
      });
      // Verwijder de query parameter
      const currentPath = window.location.pathname + (params.get('tab') ? `?tab=${params.get('tab')}` : '');
      window.history.replaceState({}, '', currentPath);
      // Herlaad status EN sites
      checkGSCStatus().then(() => {
        // Forceer het laden van sites na status check
        setTimeout(() => {
          loadAvailableSites();
        }, 500);
      });
    } else if (params.get('gsc') === 'error') {
      const message = params.get('message');
      toast.error('Fout bij koppelen GSC', {
        description: message || 'Probeer het opnieuw',
      });
      const currentPath = window.location.pathname + (params.get('tab') ? `?tab=${params.get('tab')}` : '');
      window.history.replaceState({}, '', currentPath);
    }
  }, [projectId]);

  const checkGSCStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await fetch('/api/client/search-console/status');
      if (response.ok) {
        const data = await response.json();
        const isConnected = data.connected || false;
        setGscConnected(isConnected);
        
        // Als connected, laad automatisch beschikbare sites
        if (isConnected) {
          loadAvailableSites();
        }
      } else {
        setGscConnected(false);
      }
    } catch (error) {
      console.error('Fout bij checken GSC status:', error);
      setGscConnected(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  const loadAvailableSites = async () => {
    try {
      setLoadingSites(true);
      const response = await fetch('/api/client/search-console/sites');
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSites(data.sites || []);
        
        if (data.sites && data.sites.length > 0) {
          toast.success(`${data.sites.length} site${data.sites.length !== 1 ? 's' : ''} gevonden in je Google Search Console`);
        }
      } else {
        const error = await response.json();
        if (error.needsAuth) {
          toast.error('Koppel eerst je Google account om je sites te zien');
        } else {
          toast.error('Kon sites niet ophalen');
        }
      }
    } catch (error) {
      console.error('Fout bij ophalen sites:', error);
      toast.error('Fout bij ophalen van beschikbare sites');
    } finally {
      setLoadingSites(false);
    }
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/google-search-console/config?projectId=${projectId}`);
      if (!response.ok) throw new Error('Fout bij laden configuratie');
      
      const data = await response.json();
      setConfig(data);
      
      // Gebruik websiteUrl als fallback voor siteUrl
      const defaultSiteUrl = data.googleSearchConsoleSiteUrl || data.websiteUrl || '';
      setSiteUrl(defaultSiteUrl);
      setEnabled(data.googleSearchConsoleEnabled || false);
    } catch (error: any) {
      toast.error('Fout bij laden configuratie');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!siteUrl.trim()) {
      toast.error('Vul een Site URL in');
      return;
    }

    // Valideer URL format
    try {
      new URL(siteUrl);
    } catch {
      toast.error('Ongeldige URL. Gebruik format: https://example.com/');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/client/google-search-console/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          siteUrl: siteUrl.trim(),
          enabled,
        }),
      });

      if (!response.ok) throw new Error('Fout bij opslaan');

      const data = await response.json();
      setConfig(data.project);
      toast.success('Configuratie opgeslagen');
    } catch (error: any) {
      toast.error('Fout bij opslaan configuratie');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGSC = () => {
    console.log('🔗 Starting OAuth flow...');
    console.log('Project ID:', projectId);
    
    // Toon loading toast
    toast.loading('Je wordt doorgestuurd naar Google...', {
      duration: 3000,
    });
    
    // Redirect naar OAuth flow met projectId
    const oauthUrl = `/api/client/search-console/oauth?action=connect&projectId=${projectId}`;
    console.log('OAuth URL:', oauthUrl);
    
    // Gebruik setTimeout om ervoor te zorgen dat de toast eerst wordt getoond
    setTimeout(() => {
      window.location.href = oauthUrl;
    }, 500);
  };

  const handleSync = async () => {
    if (!enabled) {
      toast.error('Schakel eerst Google Search Console in');
      return;
    }

    try {
      setSyncing(true);
      const response = await fetch('/api/client/google-search-console/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fout bij synchroniseren');
      }

      const data = await response.json();
      toast.success(data.message || 'Data gesynchroniseerd');
      await loadConfig(); // Refresh config to show last sync time
    } catch (error: any) {
      if (error.message.includes('Geen Google Search Console toegang')) {
        toast.error('Koppel eerst je Google account', {
          description: 'Je moet je Google account koppelen om toegang te krijgen tot Search Console data.',
        });
      } else {
        toast.error(error.message || 'Fout bij synchroniseren');
      }
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Google Search Console
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Google Search Console
        </CardTitle>
        <CardDescription>
          Bekijk welke content goed scoort in Google zoekresultaten
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">OAuth Status</Label>
            {checkingStatus ? (
              <Badge variant="secondary">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Checking...
              </Badge>
            ) : gscConnected ? (
              <Badge className="bg-green-500 hover:bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Gekoppeld
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Niet Gekoppeld
              </Badge>
            )}
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Tracking Status</Label>
            {enabled ? (
              <Badge className="bg-blue-500 hover:bg-blue-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Actief
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Uitgeschakeld
              </Badge>
            )}
          </div>
        </div>

        {/* Last Sync Time */}
        {config?.googleSearchConsoleLastSync && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Laatste sync:</span>
            <span>
              {new Date(config.googleSearchConsoleLastSync).toLocaleString('nl-NL')}
            </span>
          </div>
        )}

        {/* Site URL Selector */}
        <div className="space-y-2">
          <Label htmlFor="gsc-site-url">
            Site URL
            <span className="text-muted-foreground ml-2 text-xs">
              (zoals geregistreerd in GSC)
            </span>
          </Label>
          
          {gscConnected && availableSites.length > 0 ? (
            <div className="space-y-2">
              <select
                id="gsc-site-selector"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                disabled={saving || loadingSites}
              >
                <option value="">Selecteer een site uit je Google Search Console</option>
                {availableSites.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={() => setShowSiteSelector(!showSiteSelector)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                {showSiteSelector ? 'Verberg handmatige invoer' : 'Of voer handmatig een URL in'}
              </button>
              
              {showSiteSelector && (
                <Input
                  id="gsc-site-url-manual"
                  type="url"
                  placeholder="https://example.com/"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  disabled={saving}
                  className="mt-2"
                />
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                id="gsc-site-url"
                type="url"
                placeholder="https://example.com/"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                disabled={saving}
              />
              {gscConnected && loadingSites && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Sites laden...
                </p>
              )}
              {gscConnected && !loadingSites && availableSites.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Geen sites gevonden in je Google Search Console. Voeg eerst een property toe.
                </p>
              )}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Let op: URL moet exact overeenkomen met de property in Google Search Console
          </p>
        </div>

        {/* Enable/Disable Switch */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="gsc-enabled">Activeer tracking</Label>
            <p className="text-xs text-muted-foreground">
              Haal automatisch performance data op
            </p>
          </div>
          <Switch
            id="gsc-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={saving}
          />
        </div>

        {/* Koppel knop - alleen tonen als OAuth niet gekoppeld is */}
        {!gscConnected && !checkingStatus && (
          <div className="flex gap-2">
            <Button 
              onClick={handleConnectGSC}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Google Account Koppelen
            </Button>
          </div>
        )}
        
        {/* Success Message - alleen tonen als OAuth wel gekoppeld is */}
        {gscConnected && !checkingStatus && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-900/20">
            <div className="flex gap-2 items-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-200">
                  ✅ Google Account Succesvol Gekoppeld
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Je kunt nu je Search Console data synchroniseren en inzicht krijgen in je content performance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || syncing} className="flex-1">
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Opslaan...
              </>
            ) : (
              'Opslaan'
            )}
          </Button>
          
          {enabled && (
            <Button
              onClick={handleSync}
              disabled={saving || syncing}
              variant="outline"
              className="flex-1"
            >
              {syncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Synchroniseren...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Nu synchroniseren
                </>
              )}
            </Button>
          )}
        </div>

        {/* Help Link */}
        <div className="pt-2">
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ExternalLink className="h-3 w-3" />
            Open Google Search Console
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
