'use client';

/**
 * Email Inbox Page
 * Display list of emails from IMAP account
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Inbox, RefreshCw, Mail, MailOpen, Paperclip, AlertCircle, Settings, Edit } from 'lucide-react';
import Link from 'next/link';

interface Email {
  uid: number;
  messageId: string;
  from: {
    address: string;
    name?: string;
  };
  subject: string;
  date: string;
  snippet: string;
  isRead: boolean;
  hasAttachments: boolean;
}

export default function EmailInboxPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('/api/admin/email/inbox?limit=50');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch emails');
      }

      const data = await response.json();
      
      setEmails(data.emails || []);
      setAccountInfo(data.account);
    } catch (err: any) {
      console.error('Error fetching emails:', err);
      setError(err.message || 'Er is een fout opgetreden bij het ophalen van emails.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('nl-NL', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  const openEmail = (email: Email) => {
    router.push(`/admin/email/inbox/${email.uid}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error && error.includes('No email account configured')) {
    return (
      <div className="p-6">
        <Alert className="bg-yellow-900/20 border-yellow-700">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-400">
            Geen email account geconfigureerd. Ga naar{' '}
            <Link href="/admin/email/instellingen" className="underline font-semibold">
              Email Instellingen
            </Link>{' '}
            om uw email account in te stellen.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
            <Inbox className="h-8 w-8 text-orange-500" />
            Email Inbox
          </h1>
          {accountInfo && (
            <p className="text-gray-400 mt-2">
              {accountInfo.displayName || accountInfo.email}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Link href="/admin/email/compose">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Edit className="h-4 w-4 mr-2" />
              Nieuwe Email
            </Button>
          </Link>

          <Button
            onClick={() => fetchEmails(true)}
            disabled={refreshing}
            variant="outline"
            className="bg-gray-700 text-gray-100 hover:bg-gray-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Ververs
          </Button>

          <Link href="/admin/email/instellingen">
            <Button variant="outline" className="bg-gray-700 text-gray-100 hover:bg-gray-600">
              <Settings className="h-4 w-4 mr-2" />
              Instellingen
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert className="bg-red-900/20 border-red-700">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {/* Email List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">
            Inbox ({emails.length} {emails.length === 1 ? 'email' : 'emails'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Geen emails gevonden</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-gray-700">
              {emails.map((email) => (
                <div
                  key={email.uid}
                  onClick={() => openEmail(email)}
                  className={`
                    p-4 cursor-pointer transition-colors hover:bg-gray-700/50
                    ${!email.isRead ? 'bg-gray-750' : ''}
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {email.isRead ? (
                        <MailOpen className="h-5 w-5 text-gray-500" />
                      ) : (
                        <Mail className="h-5 w-5 text-orange-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <p className={`text-sm ${!email.isRead ? 'font-semibold text-gray-100' : 'text-gray-300'}`}>
                          {email.from.name || email.from.address}
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatDate(email.date)}
                        </span>
                      </div>

                      <p className={`text-sm mb-1 ${!email.isRead ? 'font-medium text-gray-200' : 'text-gray-400'}`}>
                        {email.subject || '(Geen onderwerp)'}
                      </p>

                      <p className="text-sm text-gray-500 truncate">
                        {email.snippet}
                      </p>

                      {/* Badges */}
                      <div className="flex items-center gap-2 mt-2">
                        {email.hasAttachments && (
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            <Paperclip className="h-3 w-3 mr-1" />
                            Bijlage
                          </Badge>
                        )}
                        {!email.isRead && (
                          <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/50">
                            Ongelezen
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
