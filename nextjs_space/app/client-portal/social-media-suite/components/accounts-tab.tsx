'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music2,
  Pin,
  MessageCircle,
  Cloud,
  AtSign,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: '#000000' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: '#000000' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'pinterest', name: 'Pinterest', icon: Pin, color: '#E60023' },
  { id: 'reddit', name: 'Reddit', icon: MessageCircle, color: '#FF4500' },
  { id: 'bluesky', name: 'Bluesky', icon: Cloud, color: '#0085FF' },
  { id: 'threads', name: 'Threads', icon: AtSign, color: '#000000' },
];

interface Account {
  id: string;
  platform: string;
  accountName?: string;
  accountHandle?: string;
  isActive: boolean;
  connectedAt: string;
}

interface AccountsTabProps {
  projectId: string | null;
}

export default function AccountsTab({ projectId }: AccountsTabProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [projectId]);

  const loadAccounts = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/client/late-dev/accounts?projectId=${projectId}`);
      
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      } else {
        toast.error('Kon accounts niet laden');
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Fout bij laden van accounts');
    } finally {
      setLoading(false);
    }
  };

  const connectPlatform = async (platformId: string) => {
    if (!projectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    try {
      setConnecting(platformId);
      
      const response = await fetch('/api/client/late-dev/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, platform: platformId }),
      });

      const data = await response.json();

      if (response.ok && data.inviteUrl) {
        // Open invite URL in new window
        window.open(data.inviteUrl, '_blank', 'width=600,height=700');
        toast.success('Volg de stappen in het nieuwe venster om je account te koppelen');
        
        // Refresh accounts after 5 seconds
        setTimeout(() => {
          loadAccounts();
        }, 5000);
      } else {
        toast.error(data.error || 'Kon connectie niet starten');
      }
    } catch (error) {
      console.error('Error connecting platform:', error);
      toast.error('Fout bij koppelen van platform');
    } finally {
      setConnecting(null);
    }
  };

  const syncAccounts = async () => {
    if (!projectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    try {
      setSyncing(true);
      
      const response = await fetch('/api/client/late-dev/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Accounts gesynchroniseerd');
        loadAccounts();
      } else {
        toast.error(data.error || 'Kon niet synchroniseren');
      }
    } catch (error) {
      console.error('Error syncing accounts:', error);
      toast.error('Fout bij synchroniseren');
    } finally {
      setSyncing(false);
    }
  };

  if (!projectId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">Geen project geselecteerd</p>
              <p>Selecteer een project om je social media accounts te koppelen</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Accounts Koppelen</CardTitle>
              <CardDescription>
                Koppel je social media accounts om posts automatisch te kunnen publiceren
              </CardDescription>
            </div>
            <Button
              onClick={syncAccounts}
              variant="outline"
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Synchroniseren
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Buttons */}
          <div>
            <h3 className="text-sm font-medium mb-3">Beschikbare Platformen</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isConnected = accounts.some(
                  (acc) => acc.platform === platform.id && acc.isActive
                );
                const isConnecting = connecting === platform.id;

                return (
                  <Button
                    key={platform.id}
                    onClick={() => connectPlatform(platform.id)}
                    disabled={isConnecting || loading}
                    variant={isConnected ? 'default' : 'outline'}
                    className="h-auto flex flex-col items-center gap-2 p-4"
                  >
                    {isConnecting ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Icon className="h-6 w-6" style={{ color: platform.color }} />
                        <span className="text-xs">{platform.name}</span>
                        {isConnected && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Connected Accounts */}
          <div>
            <h3 className="text-sm font-medium mb-3">Gekoppelde Accounts</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nog geen accounts gekoppeld</p>
                <p className="text-sm mt-1">Klik op een platform hierboven om te koppelen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => {
                  const platform = PLATFORMS.find((p) => p.id === account.platform);
                  const Icon = platform?.icon || MessageCircle;

                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" style={{ color: platform?.color }} />
                        <div>
                          <p className="font-medium">
                            {account.accountName || platform?.name || account.platform}
                          </p>
                          {account.accountHandle && (
                            <p className="text-sm text-muted-foreground">
                              {account.accountHandle}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={account.isActive ? 'default' : 'secondary'}>
                        {account.isActive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Actief
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactief
                          </>
                        )}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="text-blue-600 dark:text-blue-400">ℹ️</div>
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Hoe werkt het?</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Klik op een platform om te koppelen</li>
                  <li>Log in met je social media account</li>
                  <li>Geef toestemming voor automatisch posten</li>
                  <li>Je account wordt automatisch gesynchroniseerd</li>
                </ol>
                <p className="mt-2 text-xs">
                  💡 Alle koppelingen worden via Late.dev beheerd met één centrale API key
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
