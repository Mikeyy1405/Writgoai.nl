'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { CommandCenterKPIs } from '@/components/admin/dashboard/command-center-kpis';
import { AIAssistantWidget } from '@/components/admin/dashboard/ai-assistant-widget';
import { ActivityFeed } from '@/components/admin/dashboard/activity-feed';
import { TodoWidget } from '@/components/admin/dashboard/todo-widget';
import { QuickActionsWidget } from '@/components/admin/dashboard/quick-actions-widget';
import { MoneybirdWidget } from '@/components/admin/dashboard/moneybird-widget';
import { SocialMediaWidget } from '@/components/admin/dashboard/social-media-widget';
import { ContentWidget } from '@/components/admin/dashboard/content-widget';
import { EmailInboxWidget } from '@/components/admin/dashboard/email-inbox-widget';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface WidgetsData {
  emails: {
    unread: number;
    recent: Array<{
      id: string;
      from: string;
      fromName: string;
      subject: string;
      preview: string;
      receivedAt: string;
      isRead: boolean;
    }>;
  };
  socialMedia: {
    scheduledPosts: number;
    recentPosts: Array<{
      id: string;
      platforms: string[];
      scheduledFor: string;
      content: string;
      status: string;
    }>;
  };
  content: {
    generatedToday: number;
    pending: number;
    published: number;
    recent: Array<{
      id: string;
      title: string;
      type: string;
      clientName: string;
      status: string;
      createdAt: string;
    }>;
  };
  platforms: Array<{
    id: string;
    platform: string;
    username: string;
  }>;
}

interface DashboardData {
  kpis: {
    totalClients: number;
    activeSubscriptions: number;
    mrr: number;
    arr: number;
    revenueThisMonth: number;
    revenuePreviousMonth: number;
    revenueGrowthPercent: number;
    outstandingInvoices: number;
    overdueInvoices: number;
    creditsUsedThisMonth: number;
  };
  charts: {
    revenueByMonth: Array<{
      month: string;
      revenue: number;
      expenses: number;
    }>;
    clientGrowth: Array<{
      month: string;
      total: number;
      new: number;
    }>;
    invoiceStatus: {
      paid: number;
      open: number;
      overdue: number;
      draft: number;
    };
  };
  recentActivity: Array<{
    type: string;
    description: string;
    amount?: number;
    date: string;
    client?: string;
  }>;
  topClients: Array<{
    name: string;
    email: string;
    totalRevenue: number;
    invoiceCount: number;
  }>;
  today: {
    invoicesToSend: number;
    overdueInvoices: number;
    subscriptionsRenewing: number;
    revenueToday: number;
    contentGenerated: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [widgetsData, setWidgetsData] = useState<WidgetsData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const hasFetchedRef = useRef(false);

  // Auth check and data fetching
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/client-login');
      return;
    }

    // Check if user is admin
    const isAdmin =
      session?.user?.email === 'info@writgo.nl' || session?.user?.role === 'admin';
    if (!isAdmin) {
      router.push('/client-portal');
      return;
    }

    // Only fetch data once
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [status, session, router]);

  // Set up auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (!hasFetchedRef.current) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both dashboard stats and widgets data in parallel
      const [dashboardResponse, widgetsResponse] = await Promise.all([
        fetch('/api/admin/dashboard-stats'),
        fetch('/api/admin/dashboard-widgets'),
      ]);

      if (!dashboardResponse.ok) {
        const errorData = await dashboardResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.details || `Server error: ${dashboardResponse.status}`
        );
      }

      const dashboardData = await dashboardResponse.json();
      setData(dashboardData);

      // Widgets data might fail independently
      if (widgetsResponse.ok) {
        const widgetsDataResult = await widgetsResponse.json();
        setWidgetsData(widgetsDataResult);
      } else {
        console.error('Failed to fetch widgets data');
        setWidgetsData({
          emails: { unread: 0, recent: [] },
          socialMedia: { scheduledPosts: 0, recentPosts: [] },
          content: { generatedToday: 0, pending: 0, published: 0, recent: [] },
          platforms: [],
        });
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Er is een fout opgetreden bij het laden van dashboard data'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    await fetchData();
    setSyncing(false);
  };

  // Loading state
  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35] mx-auto mb-4" />
          <p className="text-zinc-400">Command Center laden...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-zinc-900 border-zinc-800 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Fout bij laden</h2>
            <p className="text-zinc-400 mb-4">{error}</p>
            <Button
              onClick={() => {
                hasFetchedRef.current = false;
                fetchData();
              }}
              className="bg-[#FF6B35] hover:bg-[#FF8555]"
            >
              Opnieuw proberen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data yet
  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35] mx-auto mb-4" />
          <p className="text-zinc-400">Data laden...</p>
        </div>
      </div>
    );
  }

  // Generate todos from dashboard data
  const todos = [
    ...(data.today.invoicesToSend > 0
      ? [
          {
            id: 'invoices-to-send',
            title: `${data.today.invoicesToSend} concept facturen versturen`,
            type: 'Financiën',
            priority: 'high' as const,
            completed: false,
          },
        ]
      : []),
    ...(data.today.overdueInvoices > 0
      ? [
          {
            id: 'overdue-invoices',
            title: `${data.today.overdueInvoices} te late facturen opvolgen`,
            type: 'Financiën',
            priority: 'high' as const,
            completed: false,
          },
        ]
      : []),
    ...(data.kpis.outstandingInvoices > 0
      ? [
          {
            id: 'outstanding-invoices',
            title: 'Openstaande facturen controleren',
            type: 'Financiën',
            priority: 'medium' as const,
            completed: false,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            🚀 WritgoAI Command Center
          </h1>
          <p className="text-zinc-400 mt-2">
            Welkom terug, {session?.user?.name || 'Admin'}! Hier is je overzicht voor vandaag.
          </p>
          {lastUpdated && (
            <p className="text-xs text-zinc-500 mt-1">
              Laatst bijgewerkt:{' '}
              {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: nl })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button 
            onClick={() => router.push('/admin/settings')}
            className="bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <CommandCenterKPIs
        data={{
          unreadEmails: widgetsData?.emails.unread || 0,
          mrr: data.kpis.mrr,
          pendingContent: widgetsData?.content.pending || data.charts.invoiceStatus.draft || 0,
          scheduledPosts: widgetsData?.socialMedia.scheduledPosts || 0,
        }}
      />

      {/* Main Content Area (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column (60%) */}
        <div className="lg:col-span-3 space-y-6">
          {/* AI Assistant Widget */}
          <AIAssistantWidget />

          {/* Activity Feed */}
          <ActivityFeed activities={data.recentActivity} />
        </div>

        {/* Right Column (40%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Todo Widget */}
          <TodoWidget todos={todos} />

          {/* Quick Actions */}
          <QuickActionsWidget />
        </div>
      </div>

      {/* Integration Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Moneybird Widget */}
        <MoneybirdWidget />

        {/* Social Media Widget */}
        <SocialMediaWidget 
          initialData={widgetsData?.socialMedia}
          onRefresh={fetchData}
        />

        {/* Content Widget */}
        <ContentWidget 
          initialData={widgetsData?.content}
          onRefresh={fetchData}
        />
      </div>

      {/* Email Inbox Preview */}
      <EmailInboxWidget 
        initialData={widgetsData?.emails}
        onRefresh={fetchData}
      />
    </div>
  );
}
