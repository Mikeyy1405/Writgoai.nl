
'use client';

/**
 * Admin Email Manager
 * View and manage all emails from info@WritgoAI.nl
 */

import { useState, useEffect } from 'react';
import { Mail, Inbox, Star, Clock, CheckCircle, Archive, RefreshCw, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-hot-toast';

interface Email {
  id: string;
  from: string;
  fromName?: string;
  subject: string;
  snippet: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  receivedAt: string;
  isIncoming: boolean;
  textBody?: string;
  htmlBody?: string;
  aiDraft?: string;
  to: string[];
  cc: string[];
}

interface EmailThread {
  id: string;
  subject: string;
  participants: string[];
  status: string;
  priority: string;
  lastActivity: string;
  emails: Email[];
  _count: {
    emails: number;
  };
}

export default function AdminEmailsPage() {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [statusFilter, setStatusFilter] = useState('open');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [replyTone, setReplyTone] = useState('professional');

  useEffect(() => {
    loadThreads();
  }, [statusFilter]);

  async function loadThreads() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/emails/threads?status=${statusFilter}`);
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Error loading threads:', error);
      toast.error('Fout bij laden van emails');
    } finally {
      setLoading(false);
    }
  }

  async function fetchNewEmails() {
    try {
      setFetching(true);
      const res = await fetch('/api/admin/emails/fetch', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.count} nieuwe emails opgehaald`);
        loadThreads();
      } else {
        toast.error(data.error || 'Fout bij ophalen emails');
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error('Fout bij ophalen emails');
    } finally {
      setFetching(false);
    }
  }

  async function selectThread(threadId: string) {
    try {
      const res = await fetch(`/api/admin/emails/threads/${threadId}`);
      const data = await res.json();
      setSelectedThread(data);
      setReplyText('');
    } catch (error) {
      console.error('Error loading thread:', error);
      toast.error('Fout bij laden email thread');
    }
  }

  async function generateAIReply(emailId: string) {
    try {
      setGenerating(true);
      const res = await fetch('/api/admin/emails/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, tone: replyTone }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText(data.draft);
        toast.success('AI antwoord gegenereerd');
      } else {
        toast.error(data.error || 'Fout bij genereren antwoord');
      }
    } catch (error) {
      console.error('Error generating reply:', error);
      toast.error('Fout bij genereren antwoord');
    } finally {
      setGenerating(false);
    }
  }

  async function sendReply() {
    if (!selectedThread || !replyText.trim()) {
      toast.error('Vul een antwoord in');
      return;
    }

    try {
      setSending(true);
      const latestEmail = selectedThread.emails[selectedThread.emails.length - 1];
      
      const res = await fetch('/api/admin/emails/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: latestEmail.id,
          message: replyText,
          includeHtml: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Antwoord verzonden!');
        setReplyText('');
        // Reload thread to show sent reply
        selectThread(selectedThread.id);
        loadThreads();
      } else {
        toast.error(data.error || 'Fout bij verzenden antwoord');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Fout bij verzenden antwoord');
    } finally {
      setSending(false);
    }
  }

  async function updateThreadStatus(status: string) {
    if (!selectedThread) return;

    try {
      const res = await fetch(`/api/admin/emails/threads/${selectedThread.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success('Status bijgewerkt');
        setSelectedThread({ ...selectedThread, status });
        loadThreads();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Fout bij bijwerken status');
    }
  }

  function formatDate(date: string) {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Gisteren';
    } else {
      return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  }

  return (
    <div className="min-h-screen bg-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-300 flex items-center gap-2">
                <Mail className="w-6 h-6" />
                Email Manager
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Alle emails van info@WritgoAI.nl
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Gesloten</SelectItem>
                  <SelectItem value="archived">Gearchiveerd</SelectItem>
                  <SelectItem value="all">Alle</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={fetchNewEmails}
                disabled={fetching}
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
                Emails Ophalen
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thread List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-300 flex items-center gap-2">
                  <Inbox className="w-4 h-4" />
                  Inbox ({threads.length})
                </h3>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Laden...
                </div>
              ) : threads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Geen emails gevonden
                </div>
              ) : (
                <div className="space-y-2">
                  {threads.map((thread) => {
                    const latestEmail = thread.emails[0];
                    const unreadCount = thread.emails.filter(e => !e.isRead).length;
                    
                    return (
                      <div
                        key={thread.id}
                        onClick={() => selectThread(thread.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedThread?.id === thread.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-slate-800 hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${unreadCount > 0 ? 'text-slate-300' : 'text-slate-300'}`}>
                                {latestEmail?.fromName || latestEmail?.from || 'Unknown'}
                              </span>
                              {unreadCount > 0 && (
                                <Badge variant="default" className="h-5 px-2 text-xs">
                                  {unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm ${unreadCount > 0 ? 'font-medium' : 'font-normal'} text-slate-300 truncate`}>
                              {thread.subject}
                            </p>
                            <p className="text-xs text-gray-600 truncate mt-0.5">
                              {latestEmail?.snippet}
                            </p>
                          </div>
                          <div className="ml-2 flex flex-col items-end gap-1">
                            <span className="text-xs text-gray-500">
                              {formatDate(thread.lastActivity)}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(thread.priority)}`} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Email Detail */}
          <div className="lg:col-span-2">
            {selectedThread ? (
              <div className="space-y-4">
                {/* Thread Header */}
                <Card className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-slate-300 mb-2">
                        {selectedThread.subject}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{selectedThread._count.emails} berichten</span>
                        <span>·</span>
                        <span>{selectedThread.participants.length} deelnemers</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedThread.status}
                        onValueChange={updateThreadStatus}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Gesloten</SelectItem>
                          <SelectItem value="archived">Gearchiveerd</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Email Messages */}
                <Card className="p-4">
                  <div className="space-y-4">
                    {selectedThread.emails.map((email, index) => (
                      <div
                        key={email.id}
                        className={`p-4 rounded-lg ${
                          email.isIncoming
                            ? 'bg-slate-800'
                            : 'bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium text-slate-300">
                              {email.fromName || email.from}
                            </div>
                            <div className="text-sm text-gray-600">
                              {email.from}
                            </div>
                            {email.to.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Aan: {email.to.join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(email.receivedAt).toLocaleString('nl-NL')}
                          </div>
                        </div>
                        <div className="text-slate-300 whitespace-pre-wrap">
                          {email.textBody || email.snippet}
                        </div>
                        {email.hasAttachments && (
                          <div className="mt-3 text-sm text-gray-600">
                            📎 Bevat bijlagen
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Reply Box */}
                {selectedThread.status !== 'archived' && (
                  <Card className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-300">Antwoord versturen</h3>
                      <div className="flex items-center gap-2">
                        <Select value={replyTone} onValueChange={setReplyTone}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professioneel</SelectItem>
                            <SelectItem value="friendly">Vriendelijk</SelectItem>
                            <SelectItem value="concise">Kort</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => {
                            const latestEmail = selectedThread.emails[selectedThread.emails.length - 1];
                            generateAIReply(latestEmail.id);
                          }}
                          disabled={generating}
                          variant="outline"
                          size="sm"
                        >
                          <Sparkles className={`w-4 h-4 mr-2 ${generating ? 'animate-pulse' : ''}`} />
                          AI Antwoord
                        </Button>
                      </div>
                    </div>
                    
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Typ je antwoord hier..."
                      rows={8}
                      className="mb-3"
                    />
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={sendReply}
                        disabled={sending || !replyText.trim()}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sending ? 'Versturen...' : 'Verstuur Antwoord'}
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  Geen email geselecteerd
                </h3>
                <p className="text-gray-600">
                  Selecteer een email uit de lijst om te bekijken
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
