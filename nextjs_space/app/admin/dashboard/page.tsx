'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users,
  MessageSquare,
  Mail,
  FileText,
  Send,
  TrendingUp,
  Coins,
  Activity,
  Loader2,
  Star,
  Euro,
  Settings,
  BarChart3,
  Calendar,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import GettingStarted from '@/components/admin/GettingStarted';

interface AdminStats {
  totalClients: number;
  activeSubscriptions: number;
  pendingFeedback: number;
  unreadMessages: number;
  unreadSupport: number;
  totalContentGenerated: number;
  creditsUsedThisMonth: number;
  revenueThisMonth: number;
  pendingPayouts: number;
  pendingPayoutAmount: number;
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated') {
      // Check if user is admin
      if (session?.user?.email !== 'info@writgo.nl') {
        router.push('/');
        return;
      }
      loadStats();
    }
  }, [status, session, router]);

  const getDefaultStats = (): AdminStats => ({
    totalClients: 0,
    activeSubscriptions: 0,
    pendingFeedback: 0,
    unreadMessages: 0,
    unreadSupport: 0,
    totalContentGenerated: 0,
    creditsUsedThisMonth: 0,
    revenueThisMonth: 0,
    pendingPayouts: 0,
    pendingPayoutAmount: 0,
  });

  async function loadStats() {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        console.error('Stats API returned error:', response.status);
        setStats(getDefaultStats());
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats(getDefaultStats());
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  const firstName = session?.user?.name?.split(' ')[0] || 'Admin';
  const hasAlerts = (stats?.unreadMessages || 0) + (stats?.unreadSupport || 0) + (stats?.pendingFeedback || 0) + (stats?.pendingPayouts || 0) > 0;

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Mobile-First Container with proper padding */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Section - Mobile Optimized */}
        <div className="bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-orange-500/20 border border-orange-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-500 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                WritGo Admin Portal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Hoi, {firstName}! 👋
            </h1>
            <p className="text-gray-300 text-base sm:text-lg">
              Welkom op je admin dashboard. Beheer klanten, content en meer.
            </p>
          </div>
        </div>

        {/* Alert Banner - Only show if there are alerts */}
        {hasAlerts && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-orange-300 mb-1">Je aandacht nodig</p>
              <div className="text-sm text-gray-300 space-y-1">
                {(stats?.unreadMessages || 0) > 0 && (
                  <p>• {stats?.unreadMessages} nieuwe berichten</p>
                )}
                {(stats?.unreadSupport || 0) > 0 && (
                  <p>• {stats?.unreadSupport} support tickets</p>
                )}
                {(stats?.pendingFeedback || 0) > 0 && (
                  <p>• {stats?.pendingFeedback} feedback te beoordelen</p>
                )}
                {(stats?.pendingPayouts || 0) > 0 && (
                  <p>• {stats?.pendingPayouts} uitbetalingen (€{stats?.pendingPayoutAmount.toFixed(2)})</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Getting Started Guide - Only show for new users */}
        <GettingStarted 
          clientCount={stats?.totalClients || 0}
          hasActiveClients={(stats?.activeSubscriptions || 0) > 0}
        />

        {/* Quick Actions - Large Touch Targets */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 px-2">Snelle Acties</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Email Manager */}
            <a 
              href="/admin/email/inbox"
              className="group relative bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 hover:border-blue-400/50 rounded-xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[80px] flex items-center gap-4"
            >
              <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                <Mail className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-lg mb-1">Email Manager</h3>
                <p className="text-sm text-gray-400">Beheer je emails</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
            </a>

            {/* Blog Manager */}
            <a 
              href="/admin/blog"
              className="group relative bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 hover:border-orange-400/50 rounded-xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[80px] flex items-center gap-4"
            >
              <div className="p-3 bg-orange-500/20 rounded-xl group-hover:bg-orange-500/30 transition-colors">
                <FileText className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-lg mb-1">Blog Manager</h3>
                <p className="text-sm text-gray-400">Schrijf blogs</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-orange-400 transition-colors" />
            </a>

            {/* Klanten Beheer */}
            <a 
              href="/admin/clients"
              className="group relative bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 hover:border-purple-400/50 rounded-xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[80px] flex items-center gap-4"
            >
              <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-lg mb-1">Klanten</h3>
                <p className="text-sm text-gray-400">{stats?.totalClients || 0} klanten</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
            </a>

            {/* Social Media */}
            <a 
              href="/admin/distribution"
              className="group relative bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 hover:border-green-400/50 rounded-xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[80px] flex items-center gap-4"
            >
              <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                <Send className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-lg mb-1">Social Media</h3>
                <p className="text-sm text-gray-400">Content distributie</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-green-400 transition-colors" />
            </a>

            {/* Berichten */}
            <a 
              href="/admin/dashboard?tab=messages"
              className="group relative bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[80px] flex items-center gap-4"
            >
              <div className="p-3 bg-cyan-500/20 rounded-xl group-hover:bg-cyan-500/30 transition-colors">
                <MessageSquare className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-lg mb-1 flex items-center gap-2">
                  Berichten
                  {((stats?.unreadMessages || 0) + (stats?.unreadSupport || 0) > 0) && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {(stats?.unreadMessages || 0) + (stats?.unreadSupport || 0)}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-400">Communicatie</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
            </a>

            {/* Instellingen */}
            <a 
              href="/admin/settings"
              className="group relative bg-gradient-to-br from-gray-500/20 to-gray-600/10 border border-gray-500/30 hover:border-gray-400/50 rounded-xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[80px] flex items-center gap-4"
            >
              <div className="p-3 bg-gray-500/20 rounded-xl group-hover:bg-gray-500/30 transition-colors">
                <Settings className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-lg mb-1">Instellingen</h3>
                <p className="text-sm text-gray-400">Configuratie</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-gray-300 transition-colors" />
            </a>

          </div>
        </div>

        {/* Stats Overview - Mobile Optimized */}
        {stats && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 px-2">Platform Statistieken</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Totaal Klanten */}
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Totaal Klanten
                    </CardTitle>
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white mb-2">
                    {stats.totalClients}
                  </div>
                  <p className="text-xs text-gray-500">
                    Geregistreerde gebruikers
                  </p>
                </CardContent>
              </Card>

              {/* Actieve Abonnementen */}
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 border-l-4 border-l-emerald-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Actieve Abonnementen
                    </CardTitle>
                    <Coins className="h-5 w-5 text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white mb-2">
                    {stats.activeSubscriptions}
                  </div>
                  <p className="text-xs text-gray-500">
                    {stats.totalClients > 0 ? ((stats.activeSubscriptions / stats.totalClients) * 100).toFixed(1) : 0}% conversie
                  </p>
                </CardContent>
              </Card>

              {/* Omzet Deze Maand */}
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Omzet Deze Maand
                    </CardTitle>
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white mb-2">
                    €{stats.revenueThisMonth.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {stats.creditsUsedThisMonth} credits gebruikt
                  </p>
                </CardContent>
              </Card>

              {/* Content Gegenereerd */}
              <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 border-l-4 border-l-cyan-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Content Gegenereerd
                    </CardTitle>
                    <FileText className="h-5 w-5 text-cyan-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white mb-2">
                    {stats.totalContentGenerated}
                  </div>
                  <p className="text-xs text-gray-500">
                    Totaal aantal stukken
                  </p>
                </CardContent>
              </Card>

            </div>
          </div>
        )}

        {/* Recent Activity / Quick Links Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Performance Card */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Performance
              </CardTitle>
              <CardDescription className="text-gray-400">
                Platform statistieken en trends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-zinc-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-gray-300">Content items</span>
                </div>
                <span className="text-white font-semibold">{stats?.totalContentGenerated || 0}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-zinc-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-gray-300">Credits gebruikt</span>
                </div>
                <span className="text-white font-semibold">{stats?.creditsUsedThisMonth || 0}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Euro className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-gray-300">Maand omzet</span>
                </div>
                <span className="text-white font-semibold">€{stats?.revenueThisMonth.toFixed(2) || '0.00'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Status / Alerts Card */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-400" />
                Status
              </CardTitle>
              <CardDescription className="text-gray-400">
                Acties en meldingen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats && stats.unreadMessages > 0 && (
                <div className="flex items-center gap-3 py-3 border-b border-zinc-700/50">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  <span className="text-gray-300 flex-1">{stats.unreadMessages} ongelezen chat berichten</span>
                </div>
              )}
              {stats && stats.unreadSupport > 0 && (
                <div className="flex items-center gap-3 py-3 border-b border-zinc-700/50">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  <span className="text-gray-300 flex-1">{stats.unreadSupport} nieuwe support emails</span>
                </div>
              )}
              {stats && stats.pendingFeedback > 0 && (
                <div className="flex items-center gap-3 py-3 border-b border-zinc-700/50">
                  <Star className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-300 flex-1">{stats.pendingFeedback} feedback items te beoordelen</span>
                </div>
              )}
              {stats && stats.pendingPayouts > 0 && (
                <div className="flex items-center gap-3 py-3 border-b border-zinc-700/50">
                  <Euro className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300 flex-1">{stats.pendingPayouts} uitbetalingen te betalen (€{stats.pendingPayoutAmount.toFixed(2)})</span>
                </div>
              )}
              {(!stats || (stats.unreadMessages === 0 && stats.unreadSupport === 0 && stats.pendingFeedback === 0 && stats.pendingPayouts === 0)) && (
                <div className="flex items-center gap-3 py-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">✅ Alles up-to-date!</span>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Additional Quick Links - Full Width on Mobile */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Meer Beheeropties</CardTitle>
            <CardDescription className="text-gray-400">
              Andere belangrijke secties en tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              
              <a 
                href="/admin/statistieken"
                className="flex items-center gap-3 p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-lg transition-colors group"
              >
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300 group-hover:text-white transition-colors">Analytics</span>
              </a>

              <a 
                href="/admin/platforms"
                className="flex items-center gap-3 p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-lg transition-colors group"
              >
                <Send className="w-5 h-5 text-green-400" />
                <span className="text-gray-300 group-hover:text-white transition-colors">Platforms</span>
              </a>

              <a 
                href="/admin/managed-projects"
                className="flex items-center gap-3 p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-lg transition-colors group"
              >
                <FileText className="w-5 h-5 text-purple-400" />
                <span className="text-gray-300 group-hover:text-white transition-colors">Projecten</span>
              </a>

              <a 
                href="/admin/invoices"
                className="flex items-center gap-3 p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-lg transition-colors group"
              >
                <Euro className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-300 group-hover:text-white transition-colors">Facturen</span>
              </a>

              <a 
                href="/admin/affiliate-payouts"
                className="flex items-center gap-3 p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-lg transition-colors group relative"
              >
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300 group-hover:text-white transition-colors">Affiliate Commissies</span>
                {stats && stats.pendingPayouts > 0 && (
                  <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {stats.pendingPayouts}
                  </span>
                )}
              </a>

              <a 
                href="/admin/writgo"
                className="flex items-center gap-3 p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-lg transition-colors group"
              >
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <span className="text-gray-300 group-hover:text-white transition-colors">Writgo Marketing</span>
              </a>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default function UnifiedAdminDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}