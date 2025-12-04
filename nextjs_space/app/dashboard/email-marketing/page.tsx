/**
 * Email Marketing Dashboard
 * Main page for email marketing suite
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, List, Send, Inbox, Settings, BarChart3 } from 'lucide-react';
import { EmailListsManager } from '@/components/email-marketing/email-lists-manager';
import { CampaignsManager } from '@/components/email-marketing/campaigns-manager';
import { EmailInboxView } from '@/components/email-marketing/email-inbox-view';
import { MailboxConnections } from '@/components/email-marketing/mailbox-connections';
import { AutoReplySettings } from '@/components/email-marketing/auto-reply-settings';

export default function EmailMarketingPage() {
  const [activeTab, setActiveTab] = useState('campaigns');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Marketing Suite</h1>
          <p className="text-muted-foreground">
            Manage campaigns, subscribers, and AI-powered inbox
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Across all lists</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inbox Emails</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Unread messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="lists" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lists
          </TabsTrigger>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            AI Inbox
          </TabsTrigger>
          <TabsTrigger value="mailbox" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Mailboxes
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Auto-Reply
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <CampaignsManager />
        </TabsContent>

        <TabsContent value="lists">
          <EmailListsManager />
        </TabsContent>

        <TabsContent value="inbox">
          <EmailInboxView />
        </TabsContent>

        <TabsContent value="mailbox">
          <MailboxConnections />
        </TabsContent>

        <TabsContent value="settings">
          <AutoReplySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
