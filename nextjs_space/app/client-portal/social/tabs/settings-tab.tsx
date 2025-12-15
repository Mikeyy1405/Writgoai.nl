'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings, Loader2, CheckCircle2, XCircle, Link as LinkIcon } from 'lucide-react';

interface SettingsTabProps {
  projectId: string;
}

interface ConnectedAccount {
  _id: string;
  platform: string;
  username?: string;
  connected: boolean;
}

const AVAILABLE_PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: '🔵', color: 'bg-blue-500' },
  { id: 'instagram', name: 'Instagram', icon: '🟢', color: 'bg-pink-500' },
  { id: 'twitter', name: 'X (Twitter)', icon: '🟠', color: 'bg-gray-800' },
  { id: 'facebook', name: 'Facebook', icon: '🔴', color: 'bg-blue-600' },
  { id: 'tiktok', name: 'TikTok', icon: '⚫', color: 'bg-black' },
];

export default function SettingsTab({ projectId }: SettingsTabProps) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, [projectId]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/late-dev/accounts?projectId=${projectId}`);

      if (!response.ok) {
        throw new Error('Failed to load accounts');
      }

      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error: any) {
      console.error('Error loading accounts:', error);
      toast.error('Kon accounts niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      setConnecting(platform);
      toast.loading(`${platform} verbinden...`, { id: 'connect' });

      const response = await fetch('/api/client/late-dev/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, platform }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate connection');
      }

      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to OAuth
        window.location.href = data.authUrl;
      } else {
        toast.error('Geen authenticatie URL ontvangen', { id: 'connect' });
      }
    } catch (error: any) {
      console.error('Error connecting account:', error);
      toast.error('Kon account niet verbinden', { id: 'connect' });
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string, platform: string) => {
    if (!confirm(`Weet je zeker dat je ${platform} wilt ontkoppelen?`)) return;

    try {
      toast.loading(`${platform} ontkoppelen...`, { id: 'disconnect' });

      const response = await fetch(`/api/client/late-dev/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success(`${platform} ontkoppeld`, { id: 'disconnect' });
      loadAccounts();
    } catch (error: any) {
      console.error('Error disconnecting account:', error);
      toast.error('Kon account niet ontkoppelen', { id: 'disconnect' });
    }
  };

  const isConnected = (platformId: string) => {
    return accounts.some(acc => acc.platform.toLowerCase() === platformId.toLowerCase());
  };

  const getAccount = (platformId: string) => {
    return accounts.find(acc => acc.platform.toLowerCase() === platformId.toLowerCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            ⚙️ Gekoppelde Accounts
          </CardTitle>
          <CardDescription>
            Beheer je social media verbindingen via getLate.dev
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {AVAILABLE_PLATFORMS.map((platform) => {
              const account = getAccount(platform.id);
              const connected = isConnected(platform.id);

              return (
                <Card key={platform.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${platform.color} flex items-center justify-center text-xl`}>
                        {platform.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{platform.name}</h3>
                        {connected && account?.username && (
                          <p className="text-sm text-muted-foreground">@{account.username}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {connected ? (
                        <>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verbonden
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(account!._id, platform.name)}
                          >
                            Ontkoppel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline">
                            <XCircle className="w-3 h-3 mr-1" />
                            Niet verbonden
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => handleConnect(platform.id)}
                            disabled={connecting === platform.id}
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            {connecting === platform.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Verbinden...
                              </>
                            ) : (
                              <>
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Koppel
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Default Posting Times */}
      <Card>
        <CardHeader>
          <CardTitle>Standaard Post Tijden</CardTitle>
          <CardDescription>
            Stel standaard tijden in voor automatische planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Coming soon - Stel je standaard post tijden per dag in
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
