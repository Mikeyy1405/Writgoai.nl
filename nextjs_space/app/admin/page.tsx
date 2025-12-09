'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { KPICards } from '@/components/admin/dashboard/kpi-cards';
import { RevenueChart } from '@/components/admin/dashboard/revenue-chart';
import { ClientGrowthChart } from '@/components/admin/dashboard/client-growth-chart';
import { InvoiceStatusChart } from '@/components/admin/dashboard/invoice-status-chart';
import { ActivityFeed } from '@/components/admin/dashboard/activity-feed';
import { TopClients } from '@/components/admin/dashboard/top-clients';
import { TodayWidget } from '@/components/admin/dashboard/today-widget';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/dashboard-stats');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.details || `Server error: ${response.status}`
        );
      }

      const dashboardData = await response.json();
      setData(dashboardData);
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
          <p className="text-zinc-400">Dashboard laden...</p>
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

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            WritGo Admin Dashboard
          </h1>
          <p className="text-zinc-400 mt-2">
            Welkom terug! Hier is je overzicht voor vandaag.
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
          <Button className="bg-zinc-800 hover:bg-zinc-700 text-white">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards data={data.kpis} />

      {/* First Row: Revenue Chart + Today Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={data.charts.revenueByMonth} />
        </div>
        <div>
          <TodayWidget data={data.today} />
        </div>
      </div>

      {/* Second Row: Activity Feed + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={data.recentActivity} />
        <TopClients clients={data.topClients} />
      </div>

      {/* Third Row: Client Growth + Invoice Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientGrowthChart data={data.charts.clientGrowth} />
        <InvoiceStatusChart data={data.charts.invoiceStatus} />
      </div>
    </div>
  );
}
