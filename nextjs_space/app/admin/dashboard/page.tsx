'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Euro
} from 'lucide-react';

// Import tab components
import ClientsManagement from '@/components/admin/clients-management';
import ClientCreditsManager from '@/components/admin/client-credits-manager';
import MessagingSystem from '@/components/admin/messaging-system';
import EmailTemplates from '@/components/admin/email-templates';
import { EmailCampaignManager } from '@/components/admin/email-campaign-manager';
import SupportInbox from '@/components/admin/support-inbox';
import FeedbackSystem from '@/components/admin/feedback-system';

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
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'overview');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated') {
      // Check if user is admin
      if (session?.user?.email !== 'info@writgo.nl') {
        router.push('/client-portal');
        return;
      }
      loadStats();
    }
  }, [status, session, router]);

  async function loadStats() {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
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

  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-black to-[#FF6B35] rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">WritgoAI Admin Portal</h1>
                <p className="text-gray-400">Volledig beheer over klanten, content, berichten & meer</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href="/admin/emails" 
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                <Mail className="w-5 h-5" />
                <span className="font-semibold">Email Manager</span>
              </a>
              <a 
                href="/admin/blog" 
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                <FileText className="w-5 h-5" />
                <span className="font-semibold">Blog Management</span>
              </a>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card className="border-l-4 border-l-blue-500 bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Totaal Klanten</CardTitle>
                  <Users className="h-5 w-5 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.totalClients}</div>
                  <p className="text-xs text-gray-500 mt-1">Geregistreerde gebruikers</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-emerald-500 bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Actieve Abonnementen</CardTitle>
                  <Coins className="h-5 w-5 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.activeSubscriptions}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {((stats.activeSubscriptions / stats.totalClients) * 100).toFixed(1)}% conversie
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Omzet Deze Maand</CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">€{stats.revenueThisMonth.toFixed(2)}</div>
                  <p className="text-xs text-gray-500 mt-1">{stats.creditsUsedThisMonth} credits gebruikt</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Ongelezen Berichten</CardTitle>
                  <MessageSquare className="h-5 w-5 text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.unreadMessages + stats.unreadSupport}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.unreadMessages} chat, {stats.unreadSupport} support
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-l-4 border-l-purple-500 bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Pending Feedback</CardTitle>
                  <Star className="h-5 w-5 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.pendingFeedback}</div>
                  <p className="text-xs text-gray-500 mt-1">Wacht op beoordeling</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-cyan-500 bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Content Gegenereerd</CardTitle>
                  <FileText className="h-5 w-5 text-cyan-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.totalContentGenerated}</div>
                  <p className="text-xs text-gray-500 mt-1">Totaal aantal stukken</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-indigo-500 bg-zinc-800/50 border-zinc-700 col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Platform Statistieken</CardTitle>
                  <Activity className="h-5 w-5 text-indigo-400" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">{stats.totalClients}</div>
                      <p className="text-xs text-gray-500 mt-1">Totaal</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-400">{stats.activeSubscriptions}</div>
                      <p className="text-xs text-gray-500 mt-1">Actief</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-400">{stats.totalClients - stats.activeSubscriptions}</div>
                      <p className="text-xs text-gray-500 mt-1">Inactief</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Main Content Tabs */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-7 bg-zinc-900/50 gap-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-[#FF6B35]">
                  <Activity className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Overzicht</span>
                </TabsTrigger>
                <TabsTrigger value="clients" className="data-[state=active]:bg-[#FF6B35]">
                  <Users className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Klanten</span>
                </TabsTrigger>
                <TabsTrigger value="client-management" className="data-[state=active]:bg-[#FF6B35]">
                  <Coins className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Beheer</span>
                </TabsTrigger>
                <TabsTrigger value="messages" className="data-[state=active]:bg-[#FF6B35]">
                  <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Berichten</span>
                </TabsTrigger>
                <TabsTrigger value="support" className="data-[state=active]:bg-[#FF6B35]">
                  <Mail className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Support</span>
                </TabsTrigger>
                <TabsTrigger value="emails" className="data-[state=active]:bg-[#FF6B35]">
                  <Send className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
                <TabsTrigger value="feedback" className="data-[state=active]:bg-[#FF6B35]">
                  <Star className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Feedback</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <div className="space-y-6">
                  <Card className="bg-zinc-900/50 border-zinc-700">
                    <CardHeader>
                      <CardTitle className="text-white">Platform Overzicht</CardTitle>
                      <CardDescription className="text-gray-400">
                        Belangrijke metrics en recente activiteiten
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">📊 Performance</h3>
                          <ul className="space-y-2 text-gray-300">
                            <li>• {stats?.totalContentGenerated || 0} content items gegenereerd</li>
                            <li>• {stats?.creditsUsedThisMonth || 0} credits gebruikt deze maand</li>
                            <li>• €{stats?.revenueThisMonth.toFixed(2) || '0.00'} omzet deze maand</li>
                            <li>• {stats?.activeSubscriptions || 0} actieve betalende klanten</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">🔔 Acties Vereist</h3>
                          <ul className="space-y-2 text-gray-300">
                            {stats && stats.unreadMessages > 0 && (
                              <li>• {stats.unreadMessages} ongelezen chat berichten</li>
                            )}
                            {stats && stats.unreadSupport > 0 && (
                              <li>• {stats.unreadSupport} nieuwe support emails</li>
                            )}
                            {stats && stats.pendingFeedback > 0 && (
                              <li>• {stats.pendingFeedback} feedback items te beoordelen</li>
                            )}
                            {stats && stats.pendingPayouts > 0 && (
                              <li className="text-orange-400 font-semibold">
                                💰 {stats.pendingPayouts} affiliate uitbetalingen te betalen (€{stats.pendingPayoutAmount.toFixed(2)})
                              </li>
                            )}
                            {(!stats || (stats.unreadMessages === 0 && stats.unreadSupport === 0 && stats.pendingFeedback === 0 && stats.pendingPayouts === 0)) && (
                              <li>✅ Alles up-to-date!</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-zinc-900/50 border-zinc-700">
                      <CardHeader>
                        <CardTitle className="text-white">🚀 Snelle Acties</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <button
                          onClick={() => setActiveTab('clients')}
                          className="w-full text-left px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                        >
                          <Users className="inline h-4 w-4 mr-2" />
                          Klantenbeheer
                        </button>
                        <button
                          onClick={() => router.push('/admin/affiliate-payouts')}
                          className="w-full text-left px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors relative"
                        >
                          <Euro className="inline h-4 w-4 mr-2" />
                          Affiliate Commissies
                          {stats && stats.pendingPayouts > 0 && (
                            <span className="absolute right-3 top-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                              {stats.pendingPayouts}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setActiveTab('messages')}
                          className="w-full text-left px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                        >
                          <MessageSquare className="inline h-4 w-4 mr-2" />
                          Berichten Verzenden
                        </button>
                        <button
                          onClick={() => setActiveTab('emails')}
                          className="w-full text-left px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                        >
                          <Send className="inline h-4 w-4 mr-2" />
                          Email Campagne Starten
                        </button>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-zinc-700">
                      <CardHeader>
                        <CardTitle className="text-white">💡 Tips & Verbeteringen</CardTitle>
                      </CardHeader>
                      <CardContent className="text-gray-300 space-y-2">
                        <p>• Beantwoord feedback snel voor hogere klanttevredenheid</p>
                        <p>• Stel email campagnes in voor nieuwe klanten</p>
                        <p>• Check support emails dagelijks</p>
                        <p>• Monitor credit usage trends</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Clients Tab */}
              <TabsContent value="clients" className="mt-6">
                <ClientsManagement />
              </TabsContent>

              {/* Client Management Tab */}
              <TabsContent value="client-management" className="mt-6">
                <ClientCreditsManager />
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="mt-6">
                <MessagingSystem />
              </TabsContent>

              {/* Support Tab */}
              <TabsContent value="support" className="mt-6">
                <SupportInbox />
              </TabsContent>

              {/* Emails Tab */}
              <TabsContent value="emails" className="mt-6">
                <div className="space-y-6">
                  <EmailCampaignManager />
                </div>
              </TabsContent>

              {/* Feedback Tab */}
              <TabsContent value="feedback" className="mt-6">
                <FeedbackSystem />
              </TabsContent>
            </Tabs>
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
