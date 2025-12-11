'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, ExternalLink, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Email {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  preview: string;
  receivedAt: string;
  isRead: boolean;
}

interface EmailInboxWidgetProps {
  initialData?: {
    unread: number;
    recent: Email[];
  };
  onRefresh?: () => void;
}

export function EmailInboxWidget({ initialData, onRefresh }: EmailInboxWidgetProps) {
  const loading = !initialData;
  const unreadCount = initialData?.unread || 0;
  const emails = initialData?.recent || [];

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              📧 Email Inbox
            </span>
            <Link href="/admin/emails">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full bg-zinc-800" />
          <Skeleton className="h-16 w-full bg-zinc-800" />
          <Skeleton className="h-16 w-full bg-zinc-800" />
        </CardContent>
      </Card>
    );
  }

  if (emails.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              📧 Email Inbox
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-[#FF6B35] text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </span>
            <Link href="/admin/emails">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Inbox leeg! 🎉
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              Geen nieuwe emails om te bekijken.
            </p>
            <Link href="/admin/emails">
              <Button className="bg-zinc-800 hover:bg-zinc-700 text-white">
                Bekijk alle emails
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            📧 Email Inbox
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-[#FF6B35] text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </span>
          <Link href="/admin/emails">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {emails.map((email) => (
            <Link key={email.id} href={`/admin/emails?emailId=${email.id}`}>
              <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#FF6B35] rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-white truncate">
                        {email.fromName}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(email.receivedAt), {
                          addSuffix: true,
                          locale: nl,
                        })}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 truncate mb-1">
                      {email.subject}
                    </p>
                    <p className="text-xs text-zinc-600 line-clamp-2">
                      {email.preview}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/admin/emails">
            <Button className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white">
              Bekijk alle emails ({unreadCount})
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
