
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, RefreshCw, Settings, Link as LinkIcon } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface GetlateAccount {
  id: string;
  platform: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  isActive: boolean;
}

export default function GetlateSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [getlateAccounts, setGetlateAccounts] = useState<GetlateAccount[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [connectionTest, setConnectionTest] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated') {
      loadProjects();
      testConnection();
    }
  }, [status, router]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/client/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        
        // Auto-select first project
        if (data.projects?.length > 0) {
          setSelectedProjectId(data.projects[0].id);
          loadProjectConfig(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadProjectConfig = async (projectId: string) => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      // Load accounts
      const accountsResponse = await fetch(`/api/client/getlate/accounts?projectId=${projectId}`);
      if (accountsResponse.ok) {
        const data = await accountsResponse.json();
        setGetlateAccounts(data.accounts || []);
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('/api/client/getlate/test');
      if (response.ok) {
        const data = await response.json();
        setConnectionTest(data);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
    }
  };

  const handleSetup = async () => {
    if (!selectedProjectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    setIsSettingUp(true);
    try {
      const response = await fetch('/api/client/getlate/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Getlate succesvol ingesteld!');
        loadProjectConfig(selectedProjectId);
      } else {
        toast.error(data.error || 'Setup gefaald');
      }
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error('Setup gefaald');
    } finally {
      setIsSettingUp(false);
    }
  };

  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const handleConnectPlatform = async (platform: string) => {
    if (!selectedProjectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    setConnectingPlatform(platform);
    try {
      // Generate platform-specific invite link
      const response = await fetch('/api/client/late-dev/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: selectedProjectId,
          platform: platform 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Fout bij aanmaken invite link');
        return;
      }

      const data = await response.json();
      
      // Open OAuth flow in popup window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        data.inviteUrl,
        `LateDev-Connect-${platform}`,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
      
      if (popup) {
        toast.success(`Verbind je ${getPlatformName(platform)} account in het popup venster`);
        
        // Auto-refresh after popup closes
        const checkPopup = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopup);
            setTimeout(() => {
              handleRefreshAccounts();
            }, 1000);
          }
        }, 500);
      } else {
        toast.error('Popup geblokkeerd - sta popups toe voor deze site');
      }
    } catch (error: any) {
      console.error('Connect error:', error);
      toast.error('Fout bij aanmaken invite link');
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleRefreshAccounts = async () => {
    if (!selectedProjectId) return;
    
    setIsLoading(true);
    try {
      // First, sync accounts from Late.dev
      const syncResponse = await fetch('/api/client/late-dev/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });

      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        if (syncData.new > 0 || syncData.synced > 0) {
          toast.success(`✅ ${syncData.new} nieuwe accounts gekoppeld, ${syncData.synced} bijgewerkt`);
        } else {
          toast.success('Accounts gesynchroniseerd');
        }
      }
      
      // Then reload project config to show updated accounts
      await loadProjectConfig(selectedProjectId);
    } catch (error) {
      console.error('Error refreshing accounts:', error);
      toast.error('Fout bij synchroniseren accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformEmoji = (platform: string): string => {
    const emojiMap: Record<string, string> = {
      'twitter': '𝕏',
      'instagram': '📸',
      'facebook': '👤',
      'linkedin': '💼',
      'tiktok': '🎵',
      'youtube': '📹',
      'threads': '🧵',
      'reddit': '🤖',
      'pinterest': '📌',
      'bluesky': '🦋',
    };
    return emojiMap[platform.toLowerCase()] || '📱';
  };

  const getPlatformName = (platform: string): string => {
    const nameMap: Record<string, string> = {
      'twitter': 'X (Twitter)',
      'instagram': 'Instagram',
      'facebook': 'Facebook',
      'linkedin': 'LinkedIn',
      'tiktok': 'TikTok',
      'youtube': 'YouTube',
      'threads': 'Threads',
      'reddit': 'Reddit',
      'pinterest': 'Pinterest',
      'bluesky': 'Bluesky',
    };
    return nameMap[platform.toLowerCase()] || platform;
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {language === 'nl' ? 'Getlate Social Media Scheduling' : 'Getlate Social Media Scheduling'}
        </h1>
        <p className="text-gray-600">
          {language === 'nl' 
            ? 'Beheer je social media planning via Getlate.dev - Plan posts op 10 platforms' 
            : 'Manage your social media scheduling via Getlate.dev - Schedule posts on 10 platforms'}
        </p>
      </div>

      {/* API Connection Status */}
      {connectionTest && (
        <Card className="mb-6 p-4">
          <div className="flex items-center gap-3">
            {connectionTest.success ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <div>
              <p className="font-semibold">
                {connectionTest.success 
                  ? (language === 'nl' ? 'API Verbinding Actief' : 'API Connection Active')
                  : (language === 'nl' ? 'API Verbinding Fout' : 'API Connection Error')}
              </p>
              <p className="text-sm text-gray-600">{connectionTest.message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Project Selection */}
      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {language === 'nl' ? 'Project Selectie' : 'Project Selection'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {language === 'nl' ? 'Selecteer Project' : 'Select Project'}
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                loadProjectConfig(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                {language === 'nl' ? '-- Selecteer een project --' : '-- Select a project --'}
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProjectId && !config?.profileId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">
                {language === 'nl' 
                  ? 'Getlate is nog niet ingesteld voor dit project. Klik op de knop hieronder om te starten.' 
                  : 'Getlate is not yet set up for this project. Click the button below to get started.'}
              </p>
              <Button
                onClick={handleSetup}
                disabled={isSettingUp}
                className="w-full"
              >
                {isSettingUp ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {language === 'nl' ? 'Bezig met instellen...' : 'Setting up...'}
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    {language === 'nl' ? 'Getlate Instellen' : 'Setup Getlate'}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Social Media Platform Configuration */}
      {selectedProjectId && config?.profileId && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                {language === 'nl' ? 'Social Media Configuratie' : 'Social Media Configuration'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {language === 'nl' 
                  ? 'Koppel je social media accounts voor automatische content publicatie' 
                  : 'Connect your social media accounts for automatic content publishing'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAccounts}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {language === 'nl' ? 'Vernieuwen' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Individual Platform Connection Buttons */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              {language === 'nl' ? 'Verbind Social Media Accounts' : 'Connect Social Media Accounts'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {language === 'nl' 
                ? 'Klik op een platform knop om dat specifieke account te koppelen.' 
                : 'Click on a platform button to connect that specific account.'}
            </p>

            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-gray-600">
                  {language === 'nl' ? 'Accounts laden...' : 'Loading accounts...'}
                </p>
              </div>
            ) : (
              <>
                {/* Platform Grid with Individual Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { platform: 'twitter', name: 'X (Twitter)', emoji: '𝕏', color: 'from-sky-500 to-blue-600' },
                    { platform: 'instagram', name: 'Instagram', emoji: '📸', color: 'from-purple-500 to-pink-600' },
                    { platform: 'facebook', name: 'Facebook', emoji: '👤', color: 'from-blue-600 to-blue-700' },
                    { platform: 'linkedin', name: 'LinkedIn', emoji: '💼', color: 'from-blue-700 to-blue-800' },
                    { platform: 'tiktok', name: 'TikTok', emoji: '🎵', color: 'from-gray-800 to-black' },
                    { platform: 'youtube', name: 'YouTube', emoji: '📹', color: 'from-red-600 to-red-700' },
                    { platform: 'threads', name: 'Threads', emoji: '🧵', color: 'from-gray-700 to-gray-800' },
                    { platform: 'reddit', name: 'Reddit', emoji: '🤖', color: 'from-orange-500 to-orange-600' },
                    { platform: 'pinterest', name: 'Pinterest', emoji: '📌', color: 'from-red-700 to-red-800' },
                    { platform: 'bluesky', name: 'Bluesky', emoji: '🦋', color: 'from-blue-400 to-blue-500' },
                  ].map((platformInfo) => {
                    const connectedAccount = getlateAccounts.find(
                      acc => acc.platform.toLowerCase() === platformInfo.platform
                    );
                    const isConnecting = connectingPlatform === platformInfo.platform;

                    return (
                      <div
                        key={platformInfo.platform}
                        className={`relative border-2 rounded-xl p-4 transition-all ${
                          connectedAccount
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`text-4xl flex-shrink-0`}>
                            {platformInfo.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {platformInfo.name}
                            </h4>
                            {connectedAccount ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-green-700">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-sm font-medium">
                                    {language === 'nl' ? 'Verbonden' : 'Connected'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700 truncate">
                                  {connectedAccount.displayName || connectedAccount.username || 'Account'}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleConnectPlatform(platformInfo.platform)}
                                  disabled={isConnecting}
                                  className="w-full text-xs"
                                >
                                  <RefreshCw className={`h-3 w-3 mr-1 ${isConnecting ? 'animate-spin' : ''}`} />
                                  {language === 'nl' ? 'Opnieuw koppelen' : 'Reconnect'}
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleConnectPlatform(platformInfo.platform)}
                                disabled={isConnecting}
                                className={`w-full mt-2 bg-gradient-to-r ${platformInfo.color} text-white hover:opacity-90 transition-opacity`}
                                size="sm"
                              >
                                {isConnecting ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    {language === 'nl' ? 'Koppelen...' : 'Connecting...'}
                                  </>
                                ) : (
                                  <>
                                    <LinkIcon className="h-4 w-4 mr-2" />
                                    {language === 'nl' ? 'Koppelen' : 'Connect'}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* How to Connect Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span>💡</span>
              {language === 'nl' 
                ? 'Tip: Klik op een platform knop om dat account te koppelen. Na het koppelen kun je direct beginnen met het plannen en publiceren van social media posts. Posts worden automatisch gepubliceerd naar de geselecteerde platforms.' 
                : 'Tip: Click on a platform button to connect that account. After connecting you can start planning and publishing social media posts. Posts are automatically published to the selected platforms.'}
            </h3>
          </div>
        </Card>
      )}
    </div>
  );
}
