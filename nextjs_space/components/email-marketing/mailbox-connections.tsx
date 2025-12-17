/**
 * Mailbox Connections Component
 * Manage email account connections
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Mailbox {
  id: string;
  provider: string;
  email: string;
  displayName: string | null;
  authType: string;
  isActive: boolean;
  lastSyncAt: string | null;
  emailsCount: number;
  createdAt: string;
}

export function MailboxConnections() {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMailboxes();
  }, []);

  const fetchMailboxes = async () => {
    try {
      const response = await fetch('/api/admin/email-marketing/mailbox');
      const data = await response.json();
      
      if (response.ok) {
        setMailboxes(data.mailboxes || []);
      } else {
        toast.error(data.error || 'Failed to fetch mailboxes');
      }
    } catch (error) {
      console.error('Error fetching mailboxes:', error);
      toast.error('Failed to fetch mailboxes');
    } finally {
      setLoading(false);
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'gmail':
        return <Badge className="bg-red-500">Gmail</Badge>;
      case 'outlook':
        return <Badge className="bg-blue-500">Outlook</Badge>;
      case 'custom':
        return <Badge className="bg-slate-8000">Custom IMAP</Badge>;
      default:
        return <Badge>{provider}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading mailboxes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mailbox Connections</h2>
          <p className="text-muted-foreground">
            Connect your email accounts for AI inbox management
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Connect Mailbox
        </Button>
      </div>

      {mailboxes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No mailboxes connected</h3>
              <p className="text-muted-foreground">
                Connect your email accounts to use AI inbox features
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  </svg>
                  Connect Gmail
                </Button>
                <Button variant="outline">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#0078D4">
                    <path d="M23.5 11.5v1h-23v-1h23zM0 0h11.5v11.5H0V0zm12.5 0H24v11.5H12.5V0zM0 12.5h11.5V24H0V12.5zm12.5 0H24V24H12.5V12.5z"/>
                  </svg>
                  Connect Outlook
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mailboxes.map((mailbox) => (
            <Card key={mailbox.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{mailbox.email}</CardTitle>
                    {mailbox.displayName && (
                      <CardDescription>{mailbox.displayName}</CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Delete this mailbox connection?')) {
                        toast.info('Delete functionality not yet implemented');
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {getProviderBadge(mailbox.provider)}
                    <Badge variant={mailbox.isActive ? 'default' : 'secondary'}>
                      {mailbox.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Emails synced: {mailbox.emailsCount}</p>
                    <p>
                      Last sync:{' '}
                      {mailbox.lastSyncAt
                        ? new Date(mailbox.lastSyncAt).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Sync Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
