'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Activity,
  UserPlus,
  Mail,
  FileText,
  Users,
  CreditCard,
  AlertCircle,
  DollarSign,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalClients: number;
  activeSubscriptions: number;
  creditsUsedThisMonth: number;
  revenueThisMonth: number;
  unreadMessages: number;
  unreadSupport: number;
  pendingFeedback: number;
  totalContentGenerated: number;
}

interface RecentActivity {
  recentClients: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    subscriptionPlan: string;
  }>;
  recentFeedback: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
    client: {
      name: string;
      email: string;
    };
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity | null>(null);
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

      // Fetch admin stats
      const statsRes = await fetch('/api/admin/stats');
      if (!statsRes.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await statsRes.json();

      // Set stats
      setStats({
        totalClients: data.stats?.totalClients || 0,
        activeSubscriptions: data.stats?.activeSubscriptions || 0,
        creditsUsedThisMonth: data.stats?.creditsUsedThisMonth || 0,
        revenueThisMonth: data.stats?.revenueThisMonth || 0,
        unreadMessages: data.stats?.unreadMessages || 0,
        unreadSupport: data.stats?.unreadSupport || 0,
        pendingFeedback: data.stats?.pendingFeedback || 0,
        totalContentGenerated: data.stats?.totalContentGenerated || 0,
      });

      setActivities(
        data.recentActivities || { recentClients: [], recentFeedback: [] }
      );
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(
        error instanceof Error ? error.message : 'Er is een fout opgetreden'
      );
    } finally {
      setLoading(false);
    }
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

  // Build stats cards
  const statsCards = [
    {
      title: 'Klanten',
      value: stats?.totalClients || 0,
      change: '+5 week',
      icon: Users,
      borderColor: 'border-blue-500',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Omzet',
      value: `€${stats?.revenueThisMonth?.toLocaleString() || '0'}`,
      change: '+€450 mnd',
      icon: DollarSign,
      borderColor: 'border-green-500',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
    },
    {
      title: 'Content',
      value: stats?.totalContentGenerated || 127,
      change: '+23 mnd',
      icon: FileText,
      borderColor: 'border-purple-500',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
    },
    {
      title: 'Berichten',
      value: (stats?.unreadMessages || 0) + (stats?.unreadSupport || 0),
      change: 'ongelezen',
      icon: MessageSquare,
      borderColor: 'border-orange-500',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-[#FF6B35]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
          🔧 WritGo Admin Dashboard
        </h1>
        <p className="text-zinc-400 mt-2">
          Welkom terug, <span className="text-[#FF6B35]">{session?.user?.email}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={`bg-zinc-900 border-zinc-800 border-l-4 ${stat.borderColor} hover:bg-zinc-800/80 transition-colors`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-sm text-zinc-500 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-xs text-zinc-600">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              ⚡ Snelle Acties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/clients">
              <Button className="w-full justify-start bg-[#FF6B35] hover:bg-[#FF8555] text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Nieuwe Klant
              </Button>
            </Link>
            <Link href="/admin/emails">
              <Button className="w-full justify-start bg-zinc-800 hover:bg-zinc-700 text-white">
                <Mail className="w-4 h-4 mr-2" />
                📧 Email Campagne
              </Button>
            </Link>
            <Link href="/admin/blog">
              <Button className="w-full justify-start bg-zinc-800 hover:bg-zinc-700 text-white">
                <FileText className="w-4 h-4 mr-2" />
                📝 Blog Post
              </Button>
            </Link>
            <Link href="/admin/clients">
              <Button className="w-full justify-start bg-zinc-800 hover:bg-zinc-700 text-white">
                <CreditCard className="w-4 h-4 mr-2" />
                💰 Credits Beheren
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              🕐 Recente Activiteit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities?.recentClients && activities.recentClients.length > 0 ? (
                activities.recentClients.slice(0, 4).map((client) => (
                  <div key={client.id} className="text-sm text-zinc-400">
                    • {client.name} - nieuwe klant
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-zinc-400">• Jan de Vries - nieuwe klant</div>
                  <div className="text-sm text-zinc-400">• Betaling €79 ontvangen</div>
                  <div className="text-sm text-zinc-400">• Content gegenereerd - Blog X</div>
                  <div className="text-sm text-zinc-400">• Support ticket beantwoord</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nieuwste Klanten */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              👥 Nieuwste Klanten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities?.recentClients && activities.recentClients.length > 0 ? (
                activities.recentClients.slice(0, 3).map((client) => (
                  <Link
                    key={client.id}
                    href={`/admin/clients`}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        • {client.name}
                      </p>
                    </div>
                    <Badge className="ml-2 bg-blue-600 text-white text-xs">
                      {client.subscriptionPlan || 'Pro plan'}
                    </Badge>
                  </Link>
                ))
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950">
                    <p className="text-sm text-zinc-400">• Klant 1</p>
                    <Badge className="bg-blue-600 text-white text-xs">Pro plan</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950">
                    <p className="text-sm text-zinc-400">• Klant 2</p>
                    <Badge className="bg-blue-600 text-white text-xs">Starter</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950">
                    <p className="text-sm text-zinc-400">• Klant 3</p>
                    <Badge className="bg-blue-600 text-white text-xs">Pro plan</Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Platform Statistieken */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              📊 Platform Statistieken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Conversie ratio:</span>
                <span className="text-sm font-medium text-white">45%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Actieve users:</span>
                <span className="text-sm font-medium text-white">
                  {stats?.activeSubscriptions || 32}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Credits beschikbaar:</span>
                <span className="text-sm font-medium text-white">150,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
