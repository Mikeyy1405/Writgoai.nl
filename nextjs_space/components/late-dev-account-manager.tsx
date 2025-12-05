
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  RefreshCw,
  Link as LinkIcon,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface LateDevAccount {
  id: string;
  lateDevProfileId: string;
  platform: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  connectedAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

interface LateDevAccountManagerProps {
  projectId: string;
  onAccountsChange?: () => void;
}

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  twitter: <Twitter className="h-5 w-5" />,
  tiktok: <div className="h-5 w-5 text-sm font-bold">TT</div>,
  youtube: <Youtube className="h-5 w-5" />,
  pinterest: <div className="h-5 w-5 text-sm font-bold">P</div>,
  reddit: <div className="h-5 w-5 text-sm font-bold">R</div>,
  threads: <div className="h-5 w-5 text-sm font-bold">@</div>,
  bluesky: <div className="h-5 w-5 text-sm font-bold">🦋</div>,
};

const platformColors: Record<string, string> = {
  facebook: 'bg-blue-600 hover:bg-blue-700',
  instagram: 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
  linkedin: 'bg-blue-700 hover:bg-blue-800',
  twitter: 'bg-sky-500 hover:bg-sky-600',
  tiktok: 'bg-black hover:bg-gray-900',
  youtube: 'bg-red-600 hover:bg-red-700',
  pinterest: 'bg-red-700 hover:bg-red-800',
  reddit: 'bg-orange-600 hover:bg-orange-700',
  threads: 'bg-gray-800 hover:bg-gray-900',
  bluesky: 'bg-sky-400 hover:bg-sky-500',
};

const platformLabels: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'X (Twitter)',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  reddit: 'Reddit',
  threads: 'Threads',
  bluesky: 'Bluesky',
};

const availablePlatforms = [
  'facebook',
  'instagram',
  'linkedin',
  'twitter',
  'tiktok',
  'youtube',
  'pinterest',
  'reddit',
  'threads',
  'bluesky',
];

export function LateDevAccountManager({ projectId, onAccountsChange }: LateDevAccountManagerProps) {
  const [accounts, setAccounts] = useState<LateDevAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');

  // Load accounts
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/late-dev/accounts?projectId=${projectId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load accounts');
      }

      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      toast.error('Kon accounts niet laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadAccounts();
    }
  }, [projectId]);

  // Generate invite link for specific platform
  const handleConnect = async (platform?: string) => {
    try {
      setConnecting(true);
      console.log('[Social Connect] Starting connection for:', platform, 'project:', projectId);
      
      const response = await fetch('/api/client/late-dev/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, platform }),
      });

      console.log('[Social Connect] Response status:', response.status);
      const data = await response.json();
      console.log('[Social Connect] Response data:', data);

      if (!response.ok) {
        // Specifieke foutmeldingen
        if (response.status === 503) {
          toast.error('Social media service tijdelijk niet beschikbaar. Probeer later opnieuw.');
        } else if (response.status === 404) {
          toast.error('Project niet gevonden. Ververs de pagina en probeer opnieuw.');
        } else if (response.status === 400) {
          toast.error(data.error || 'Ongeldige aanvraag. Controleer je project instellingen.');
        } else {
          toast.error(data.error || `Fout bij koppelen (${response.status})`);
        }
        return;
      }

      if (!data.inviteUrl) {
        console.error('[Social Connect] No inviteUrl in response:', data);
        toast.error('Geen koppellink ontvangen. Probeer opnieuw of neem contact op met support.');
        return;
      }

      setInviteUrl(data.inviteUrl);
      setInviteDialog(true);

      // Open in new window
      const popup = window.open(data.inviteUrl, '_blank', 'width=600,height=700');
      
      if (!popup || popup.closed) {
        // Popup blocked
        toast.error('Pop-up geblokkeerd! Sta pop-ups toe voor deze site of gebruik de "Open Handmatig" knop.');
      } else {
        toast.success('Volg de stappen in het nieuwe venster om je account te koppelen.');
      }
    } catch (error: any) {
      console.error('[Social Connect] Error:', error);
      toast.error('Netwerkfout bij koppelen. Controleer je internetverbinding.');
    } finally {
      setConnecting(false);
    }
  };

  // Sync accounts from Late.dev
  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/client/late-dev/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync');
      }

      const data = await response.json();
      toast.success(`✅ ${data.new} nieuwe accounts gekoppeld, ${data.synced} bijgewerkt`);
      
      await loadAccounts();
      onAccountsChange?.();
    } catch (error) {
      console.error('Failed to sync:', error);
      toast.error('Synchronisatie mislukt');
    } finally {
      setSyncing(false);
    }
  };

  // Disconnect account
  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Weet je zeker dat je dit account wilt ontkoppelen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/client/late-dev/accounts?accountId=${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success('Account ontkoppeld');
      await loadAccounts();
      onAccountsChange?.();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Ontkoppelen mislukt');
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Social Media Accounts</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Klik op een platform om te koppelen
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Vernieuwen
          </Button>
        </div>

        {/* Platform Connection Buttons */}
        <div className="mb-8">
          <h4 className="text-sm font-medium mb-3">Verbind Social Media Accounts</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {availablePlatforms.map(platform => {
              const isConnected = accounts.some(acc => acc.platform === platform);
              return (
                <Button
                  key={platform}
                  onClick={() => handleConnect(platform)}
                  disabled={connecting}
                  variant={isConnected ? "outline" : "default"}
                  className={`flex flex-col items-center justify-center h-24 relative ${
                    !isConnected ? platformColors[platform] + ' text-white border-0' : ''
                  }`}
                >
                  {isConnected && (
                    <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-green-600" />
                  )}
                  <div className="mb-2">
                    {platformIcons[platform]}
                  </div>
                  <span className="text-xs font-medium">
                    {platformLabels[platform]}
                  </span>
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            💡 Tip: Na het klikken opent er een venster waar je je accounts kunt koppelen. 
            Na het koppelen klik je op "Vernieuwen" om je accounts te zien.
          </p>
        </div>

        {/* Connected Accounts List */}
        {accounts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Gekoppelde Accounts ({accounts.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map(account => (
                <div
                  key={account.id}
                  className="border rounded-lg p-4 flex items-start justify-between hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`${platformColors[account.platform]?.split(' ')[0] || 'bg-gray-600'} text-white p-2 rounded-lg`}>
                      {platformIcons[account.platform] || <LinkIcon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">
                          {account.displayName || account.username || 'Onbekend'}
                        </h4>
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        @{account.username || 'unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        {platformLabels[account.platform] || account.platform}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 -mr-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Koppelen</DialogTitle>
            <DialogDescription>
              Er is een nieuw venster geopend om je account te koppelen.
              Volg de instructies in dat venster.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm mb-2">Venster niet geopend?</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(inviteUrl, '_blank', 'width=600,height=700')}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Open Handmatig
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Na het koppelen:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Klik op "Sync" om de nieuwe accounts te laden</li>
                <li>Je gekoppelde accounts verschijnen hier</li>
                <li>Je kunt direct beginnen met publiceren</li>
              </ol>
            </div>
            <Button
              onClick={() => {
                setInviteDialog(false);
                handleSync();
              }}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Nu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
