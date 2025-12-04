/**
 * Email Marketing Suite
 * Main page for Email Marketing Suite
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, List, Send, Inbox, Settings, BarChart3, Mailbox, Zap } from 'lucide-react';
import { EmailListsManager } from '@/components/email-marketing/email-lists-manager';
import { CampaignsManager } from '@/components/email-marketing/campaigns-manager';
import { EmailInboxView } from '@/components/email-marketing/email-inbox-view';
import { MailboxConnections } from '@/components/email-marketing/mailbox-connections';
import { AutoReplySettings } from '@/components/email-marketing/auto-reply-settings';

export default function EmailMarketingSuitePage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-orange-500/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
              <Mail className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Email Marketing Suite</h1>
              <p className="text-gray-400">Beheer campagnes, subscribers, en AI-powered inbox</p>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Subscribers</CardTitle>
            <List className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-xs text-gray-400">Across all lists</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Campaigns Sent</CardTitle>
            <Send className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-xs text-gray-400">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Avg. Open Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0%</div>
            <p className="text-xs text-gray-400">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Inbox Emails</CardTitle>
            <Inbox className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-xs text-gray-400">Unread messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 bg-gray-900 border border-gray-800">
          <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
            <Send className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="lists" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
            <List className="h-4 w-4" />
            Lists
          </TabsTrigger>
          <TabsTrigger value="inbox" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
            <Inbox className="h-4 w-4" />
            AI Inbox
          </TabsTrigger>
          <TabsTrigger value="mailbox" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
            <Mailbox className="h-4 w-4" />
            Mailboxes
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
            <Zap className="h-4 w-4" />
            Automations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-900 border-orange-500/20 hover:border-orange-500/40 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Send className="w-6 h-6 text-orange-500" />
                  </div>
                  <CardTitle className="text-white">Email Generator</CardTitle>
                </div>
                <CardDescription>
                  Maak professionele emails met AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <button 
                  onClick={() => setActiveTab('campaigns')}
                  className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Start Campagne
                </button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-orange-500/20 hover:border-orange-500/40 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <List className="w-6 h-6 text-orange-500" />
                  </div>
                  <CardTitle className="text-white">Email Lijsten</CardTitle>
                </div>
                <CardDescription>
                  Beheer je subscriber lijsten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <button 
                  onClick={() => setActiveTab('lists')}
                  className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Beheer Lijsten
                </button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-orange-500/20 hover:border-orange-500/40 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Inbox className="w-6 h-6 text-orange-500" />
                  </div>
                  <CardTitle className="text-white">AI Inbox</CardTitle>
                </div>
                <CardDescription>
                  Beheer inkomende emails met AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <button 
                  onClick={() => setActiveTab('inbox')}
                  className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Open Inbox
                </button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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

// Import missing component
import { LayoutDashboard } from 'lucide-react';
