/**
 * Email Inbox View Component
 * AI-powered inbox with categorization and auto-reply
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Inbox, Sparkles, ThumbsUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InboxEmail {
  id: string;
  subject: string;
  from: string;
  fromName: string | null;
  snippet: string | null;
  aiSummary: string | null;
  aiSentiment: string | null;
  aiCategory: string | null;
  aiPriority: string;
  isRead: boolean;
  receivedAt: string;
}

export function EmailInboxView() {
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchEmails();
  }, [selectedCategory]);

  const fetchEmails = async () => {
    try {
      const url = selectedCategory
        ? `/api/admin/email-marketing/inbox?category=${selectedCategory}`
        : '/api/admin/email-marketing/inbox';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setEmails(data.emails || []);
      } else {
        toast.error(data.error || 'Failed to fetch inbox');
      }
    } catch (error) {
      console.error('Error fetching inbox:', error);
      toast.error('Failed to fetch inbox');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500';
      case 'negative':
        return 'bg-red-500';
      case 'urgent':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'support':
        return 'bg-blue-500';
      case 'sales':
        return 'bg-green-500';
      case 'newsletter':
        return 'bg-purple-500';
      case 'spam':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading inbox...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Email Inbox</h2>
          <p className="text-muted-foreground">
            AI-analyzed emails with smart categorization
          </p>
        </div>
        <Button>
          <Sparkles className="mr-2 h-4 w-4" />
          Sync Mailboxes
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Button>
        <Button
          variant={selectedCategory === 'support' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('support')}
        >
          Support
        </Button>
        <Button
          variant={selectedCategory === 'sales' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('sales')}
        >
          Sales
        </Button>
        <Button
          variant={selectedCategory === 'personal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('personal')}
        >
          Personal
        </Button>
      </div>

      {emails.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No emails yet</h3>
              <p className="text-muted-foreground">
                Connect a mailbox to start receiving and analyzing emails
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => (
            <Card key={email.id} className={email.isRead ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{email.subject}</CardTitle>
                      {!email.isRead && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      From: {email.fromName || email.from}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {email.aiSentiment && (
                      <Badge className={getSentimentColor(email.aiSentiment)}>
                        {email.aiSentiment}
                      </Badge>
                    )}
                    {email.aiCategory && (
                      <Badge className={getCategoryColor(email.aiCategory)}>
                        {email.aiCategory}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {email.aiSummary && (
                  <div className="mb-3 p-3 bg-muted rounded-md">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium">AI Summary</p>
                        <p className="text-sm text-muted-foreground">{email.aiSummary}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    View Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Reply
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
