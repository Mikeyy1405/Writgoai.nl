'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, ArrowRight, Activity,
  UserPlus, Mail, FileText, Users, CreditCard,
  AlertCircle, Sparkles, Settings, Video, Share2,
  LayoutDashboard, Package, Receipt, Bot, Globe
} from 'lucide-react';
import Link from 'next/link';
import { AdminQuickStats } from '@/components/admin/admin-quick-stats';
import { FeatureStatusCard } from '@/components/admin/feature-status-card';

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
    const isAdmin = session?.user?.email === 'info@writgo.nl' || session?.user?.role === 'admin';
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

      setActivities(data.recentActivities || { recentClients: [], recentFeedback: [] });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35] mx-auto mb-4" />
          <p className="text-gray-400">Dashboard laden...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-800 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Fout bij laden</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={() => {
              hasFetchedRef.current = false;
              fetchData();
            }} className="bg-[#FF6B35] hover:bg-[#FF8555]">
              Opnieuw proberen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const features = [
    {
      title: 'Klantenbeheer',
      description: 'Toevoegen, bewerken, verwijderen',
      icon: Users,
      status: 'working' as const,
      href: '/admin/clients',
    },
    {
      title: 'Credit Management',
      description: 'Beheer credits en transacties',
      icon: CreditCard,
      status: 'working' as const,
      href: '/admin/clients',
    },
    {
      title: 'Blog Generator',
      description: 'AI-gestuurde blog content',
      icon: FileText,
      status: 'working' as const,
      href: '/admin/blog',
    },
    {
      title: 'Email Templates',
      description: 'Beheer email templates',
      icon: Mail,
      status: 'working' as const,
      href: '/admin/emails',
    },
    {
      title: 'Support Inbox',
      description: 'Klant support berichten',
      icon: Mail,
      status: 'working' as const,
      href: '/admin/emails',
    },
    {
      title: 'Feedback Systeem',
      description: 'Klant feedback beheren',
      icon: Activity,
      status: 'working' as const,
      href: '/admin/clients',
    },
    {
      title: 'Content Hub',
      description: 'Basis functies werken',
      icon: Sparkles,
      status: 'partial' as const,
      href: '/client-portal/content-hub',
    },
    {
      title: 'Social Media Suite',
      description: 'Basis functies werken',
      icon: Share2,
      status: 'partial' as const,
      href: '/client-portal/social-media-suite',
    },
    {
      title: 'Video Generator',
      description: 'Beta versie beschikbaar',
      icon: Video,
      status: 'partial' as const,
      href: '/client-portal/video-generator',
    },
    {
      title: 'Affiliate Systeem',
      description: 'Wordt ontwikkeld',
      icon: Globe,
      status: 'development' as const,
      href: '/admin/affiliate-payouts',
    },
    {
      title: 'Automatische Facturatie',
      description: 'In ontwikkeling',
      icon: Receipt,
      status: 'development' as const,
      href: '/admin/invoices',
    },
    {
      title: 'API Integraties',
      description: 'Binnenkort beschikbaar',
      icon: Settings,
      status: 'development' as const,
      href: '/admin/settings',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-[#FF6B35]" />
              WritGo Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Beheer je content agency platform</p>
            <p className="text-sm text-gray-500 mt-1">
              Ingelogd als: <span className="text-[#FF6B35]">{session?.user?.email}</span>
            </p>
          </div>
          <Link href="/client-portal">
            <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
              Naar Client Portal
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Quick Stats Overview */}
        {stats && <AdminQuickStats stats={stats} />}

        {/* Quick Actions */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#FF6B35]" />
              🚀 Snelle Acties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/admin/clients">
                <Button className="w-full justify-start bg-[#FF6B35] hover:bg-[#FF8555] text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  ➕ Nieuwe Klant Toevoegen
                </Button>
              </Link>
              <Link href="/admin/emails">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                  <Mail className="w-4 h-4 mr-2" />
                  �� Email Campagne Starten
                </Button>
              </Link>
              <Link href="/admin/blog">
                <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  📝 Blog Post Schrijven
                </Button>
              </Link>
              <Link href="/admin/clients">
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700 text-white">
                  <Users className="w-4 h-4 mr-2" />
                  👥 Klanten Beheren
                </Button>
              </Link>
              <Link href="/admin/clients">
                <Button className="w-full justify-start bg-yellow-600 hover:bg-yellow-700 text-white">
                  <CreditCard className="w-4 h-4 mr-2" />
                  💰 Credits Beheren
                </Button>
              </Link>
              <Link href="/admin/api-usage">
                <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Activity className="w-4 h-4 mr-2" />
                  📊 Statistieken Bekijken
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Feature Status Overview */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">📋 Feature Overzicht</h2>
            <p className="text-gray-400">Overzicht van alle features en hun status</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <FeatureStatusCard
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                status={feature.status}
                href={feature.href}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Clients */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                📊 Recente Klanten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities?.recentClients && activities.recentClients.length > 0 ? (
                  activities.recentClients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/admin/clients/${client.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-950 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {client.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{client.email}</p>
                      </div>
                      <Badge className="ml-2 bg-blue-600 text-white">
                        {client.subscriptionPlan || 'Free'}
                      </Badge>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Geen recente klanten</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Feedback/Support */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                💡 Recente Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities?.recentFeedback && activities.recentFeedback.length > 0 ? (
                  activities.recentFeedback.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="p-3 rounded-lg bg-gray-950 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-white">
                          {feedback.client.name}
                        </p>
                        <Badge className="bg-green-600 text-white text-xs">
                          {feedback.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {feedback.message}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(feedback.createdAt).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Geen recente feedback</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Info Footer */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>WritGo Admin Dashboard v2.0</p>
              <p>Laatste update: {new Date().toLocaleDateString('nl-NL')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
