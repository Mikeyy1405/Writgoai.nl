'use client';

/**
 * Email Detail Page
 * Display single email with full content
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Mail, Paperclip, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface EmailDetail {
  uid: number;
  messageId: string;
  from: {
    address: string;
    name?: string;
  };
  to: Array<{
    address: string;
    name?: string;
  }>;
  cc?: Array<{
    address: string;
    name?: string;
  }>;
  subject: string;
  date: string;
  textBody?: string;
  htmlBody?: string;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
}

export default function EmailDetailPage() {
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');

  useEffect(() => {
    if (uid) {
      fetchEmail();
    }
  }, [uid]);

  const fetchEmail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/email/message?uid=${uid}&markRead=true`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch email');
      }

      const data = await response.json();
      
      if (!data.email) {
        throw new Error('Email not found');
      }

      setEmail(data.email);
      
      // Prefer HTML view if available
      if (data.email.htmlBody) {
        setViewMode('html');
      } else {
        setViewMode('text');
      }
    } catch (err: any) {
      console.error('Error fetching email:', err);
      setError(err.message || 'Er is een fout opgetreden bij het ophalen van de email.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="p-6">
        <Alert className="bg-red-900/20 border-red-700 mb-4">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-400">
            {error || 'Email niet gevonden'}
          </AlertDescription>
        </Alert>
        <Link href="/admin/email/inbox">
          <Button variant="outline" className="bg-gray-700 text-gray-100 hover:bg-gray-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Inbox
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Link href="/admin/email/inbox">
        <Button variant="outline" className="bg-gray-700 text-gray-100 hover:bg-gray-600">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar Inbox
        </Button>
      </Link>

      {/* Email Header */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl text-gray-100 mb-4">
                {email.subject || '(Geen onderwerp)'}
              </CardTitle>
              
              <div className="space-y-2 text-sm">
                {/* From */}
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 min-w-[60px]">Van:</span>
                  <span className="text-gray-200">
                    {email.from.name ? (
                      <>
                        <strong>{email.from.name}</strong>{' '}
                        <span className="text-gray-400">&lt;{email.from.address}&gt;</span>
                      </>
                    ) : (
                      email.from.address
                    )}
                  </span>
                </div>

                {/* To */}
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 min-w-[60px]">Aan:</span>
                  <span className="text-gray-200">
                    {email.to.map((recipient, index) => (
                      <span key={index}>
                        {recipient.name ? (
                          <>
                            {recipient.name} <span className="text-gray-400">&lt;{recipient.address}&gt;</span>
                          </>
                        ) : (
                          recipient.address
                        )}
                        {index < email.to.length - 1 && ', '}
                      </span>
                    ))}
                  </span>
                </div>

                {/* CC */}
                {email.cc && email.cc.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 min-w-[60px]">CC:</span>
                    <span className="text-gray-200">
                      {email.cc.map((recipient, index) => (
                        <span key={index}>
                          {recipient.name ? (
                            <>
                              {recipient.name} <span className="text-gray-400">&lt;{recipient.address}&gt;</span>
                            </>
                          ) : (
                            recipient.address
                          )}
                          {index < email.cc.length - 1 && ', '}
                        </span>
                      ))}
                    </span>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 min-w-[60px]">Datum:</span>
                  <span className="text-gray-200">{formatDate(email.date)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Mail className="h-6 w-6 text-orange-500" />
              {email.hasAttachments && (
                <Badge variant="outline" className="border-gray-600 text-gray-400">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {email.attachments?.length} bijlage(n)
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Attachments */}
      {email.attachments && email.attachments.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-100">Bijlagen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {email.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-200">{attachment.filename}</p>
                      <p className="text-xs text-gray-500">
                        {attachment.contentType} • {formatFileSize(attachment.size)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Body */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-gray-100">Email Inhoud</CardTitle>
            
            {/* View Mode Toggle */}
            {email.htmlBody && email.textBody && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === 'html' ? 'default' : 'outline'}
                  onClick={() => setViewMode('html')}
                  className={viewMode === 'html' ? 'bg-orange-500' : 'bg-gray-700 text-gray-100'}
                >
                  HTML
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'text' ? 'default' : 'outline'}
                  onClick={() => setViewMode('text')}
                  className={viewMode === 'text' ? 'bg-orange-500' : 'bg-gray-700 text-gray-100'}
                >
                  Tekst
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'html' && email.htmlBody ? (
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: email.htmlBody }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-gray-300 font-mono text-sm">
              {email.textBody || 'Geen tekstinhoud beschikbaar'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
