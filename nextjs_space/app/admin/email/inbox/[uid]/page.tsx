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
import { Loader2, ArrowLeft, Mail, Paperclip, AlertCircle, Reply, Forward, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

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

  // AI Features State
  const [aiSummary, setAiSummary] = useState<any | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

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

  // ═══════════════════════════════════════════════════════
  // 🤖 AI FEATURES
  // ═══════════════════════════════════════════════════════

  const handleGenerateSummary = async () => {
    if (!email) return;

    try {
      setLoadingSummary(true);
      
      const emailContent = email.textBody || email.htmlBody?.replace(/<[^>]*>/g, '') || '';
      
      const response = await fetch('/api/admin/email/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailContent,
          subject: email.subject,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fout bij genereren samenvatting');
      }

      setAiSummary(data.summary);
      toast.success('✨ Samenvatting gegenereerd!');
    } catch (err: any) {
      console.error('Error generating summary:', err);
      toast.error(err.message || 'Fout bij genereren samenvatting');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!email) return;

    try {
      setLoadingSuggestions(true);
      
      const emailContent = email.textBody || email.htmlBody?.replace(/<[^>]*>/g, '') || '';
      
      const response = await fetch('/api/admin/email/ai/suggest-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailContent,
          subject: email.subject,
          from: email.from.address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fout bij genereren suggesties');
      }

      setAiSuggestions(data.suggestions);
      setShowSuggestionsModal(true);
      toast.success('✨ Reply suggesties gegenereerd!');
    } catch (err: any) {
      console.error('Error generating suggestions:', err);
      toast.error(err.message || 'Fout bij genereren suggesties');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleUseSuggestion = (suggestion: any) => {
    // Redirect naar composer met pre-filled text
    const encodedText = encodeURIComponent(suggestion.text);
    router.push(`/admin/email/compose?reply=${uid}&prefill=${encodedText}`);
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

              {/* Action Buttons */}
              <div className="mt-4 flex gap-3 flex-wrap">
                <Link href={`/admin/email/compose?reply=${uid}`}>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Reply className="h-4 w-4 mr-2" />
                    Beantwoorden
                  </Button>
                </Link>
                <Button
                  onClick={handleGenerateSuggestions}
                  disabled={loadingSuggestions}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {loadingSuggestions ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  AI Suggesties
                </Button>
                <Link href={`/admin/email/compose?forward=${uid}`}>
                  <Button variant="outline" className="bg-gray-700 text-gray-100 hover:bg-gray-600 border-gray-600">
                    <Forward className="h-4 w-4 mr-2" />
                    Doorsturen
                  </Button>
                </Link>
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

      {/* AI Samenvatting */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Samenvatting
            </CardTitle>
            {!aiSummary && (
              <Button
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loadingSummary ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Genereren...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Genereer Samenvatting
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        {aiSummary && (
          <CardContent className="space-y-4">
            {/* Summary Text */}
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-200 leading-relaxed">{aiSummary.summary}</p>
            </div>

            {/* Sentiment Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Sentiment:</span>
              <Badge
                variant="outline"
                className={`
                  ${aiSummary.sentiment === 'positive' ? 'border-green-600 text-green-400' : ''}
                  ${aiSummary.sentiment === 'negative' ? 'border-red-600 text-red-400' : ''}
                  ${aiSummary.sentiment === 'urgent' ? 'border-orange-600 text-orange-400' : ''}
                  ${aiSummary.sentiment === 'neutral' ? 'border-gray-600 text-gray-400' : ''}
                `}
              >
                {aiSummary.sentiment === 'positive' && '😊 Positief'}
                {aiSummary.sentiment === 'negative' && '😟 Negatief'}
                {aiSummary.sentiment === 'urgent' && '⚠️ Urgent'}
                {aiSummary.sentiment === 'neutral' && '😐 Neutraal'}
              </Badge>
            </div>

            {/* Key Points */}
            {aiSummary.keyPoints && aiSummary.keyPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Belangrijke punten:</h4>
                <ul className="space-y-1">
                  {aiSummary.keyPoints.map((point: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {aiSummary.actionItems && aiSummary.actionItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Actie items:</h4>
                <ul className="space-y-1">
                  {aiSummary.actionItems.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        )}
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

      {/* AI Suggestions Modal */}
      {showSuggestionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800 z-10">
              <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Reply Suggesties
              </h3>
              <button
                onClick={() => setShowSuggestionsModal(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {aiSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-purple-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-200 capitalize">{suggestion.type}</h4>
                      <p className="text-sm text-gray-400">{suggestion.description}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-purple-600 text-purple-400 text-xs"
                    >
                      {suggestion.type}
                    </Badge>
                  </div>

                  <p className="text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">
                    {suggestion.text}
                  </p>

                  <Button
                    onClick={() => handleUseSuggestion(suggestion)}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Gebruik deze suggestie
                  </Button>
                </div>
              ))}

              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-500 text-center">
                  Klik op een suggestie om deze te gebruiken als antwoord
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
