'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Bell, Sparkles, TrendingUp, ChevronRight, AlertCircle, Rocket, Map, Zap } from 'lucide-react';
import { ModernDashboardStats } from '@/components/modern-dashboard-stats';
import { DailyTips } from '@/components/dashboard/daily-tips';
import { FavoriteTools } from '@/components/dashboard/favorite-tools';
import { CreditsOverview } from '@/components/dashboard/credits-overview';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function ClientPortal() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContent: 0,
    thisMonth: 0,
    totalProjects: 0,
    creditsAvailable: 0,
    creditsUsed: 0,
  });
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [recentContent, setRecentContent] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadDashboardData();
    }
  }, [status]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load credits
      const creditsResponse = await fetch('/api/client/credits');
      const creditsData = await creditsResponse.json();
      
      // Load projects
      const projectsResponse = await fetch('/api/client/projects');
      const projectsData = await projectsResponse.json();
      
      // Load recent content
      const contentResponse = await fetch('/api/client/content-library?limit=5');
      const contentData = await contentResponse.json();
      
      // Calculate stats
      const availableCredits = (creditsData.subscriptionCredits || 0) + (creditsData.topUpCredits || 0);
      const usedCredits = creditsData.totalCreditsUsed || 0;
      
      // Calculate this month's content
      const now = new Date();
      const thisMonthContent = contentData.content?.filter((c: any) => {
        const createdDate = new Date(c.createdAt);
        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
      }).length || 0;
      
      // Check if unlimited
      setIsUnlimited(creditsData.isUnlimited || false);
      
      setStats({
        totalContent: contentData.total || 0,
        thisMonth: thisMonthContent,
        totalProjects: projectsData.projects?.length || 0,
        creditsAvailable: availableCredits,
        creditsUsed: usedCredits,
      });
      
      // Format recent content
      const formattedContent = contentData.content?.slice(0, 5).map((c: any) => ({
        id: c.id,
        title: c.title,
        language: c.language || 'NL',
        createdAt: c.createdAt,
        projectName: c.project?.name
      })) || [];
      
      setRecentContent(formattedContent);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const languageFlags: Record<string, string> = {
    'NL': '🇳🇱',
    'EN': '🇺🇸',
    'FR': '🇫🇷',
    'ES': '🇪🇸',
    'DE': '🇩🇪',
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Dashboard laden...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const firstName = session?.user?.name?.split(' ')[0] || 'daar';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Hoi, {firstName}! 👋
              </h1>
              <p className="text-gray-400">
                Welkom terug bij je AI Content Platform
              </p>
            </div>
          </div>
        </div>

        {/* Content Wizard CTA */}
        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">
                Content Wizard ✨
              </h2>
              <p className="text-gray-300 mb-4">
                Bouw je complete content strategie in 3 stappen. Genereer een volledige topical map met 100-500+ artikelen, 
                kies je content mix (informatief, reviews, lijstjes) en publiceer automatisch naar WordPress.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 text-purple-300 text-sm">
                  <Map className="w-4 h-4" />
                  <span>Topical Maps</span>
                </div>
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Bulk Generatie</span>
                </div>
                <div className="flex items-center gap-2 text-green-300 text-sm">
                  <Rocket className="w-4 h-4" />
                  <span>Auto Publiceren</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link href="/client-portal/content-wizard">
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-purple-500/25">
                  Start Wizard
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Tip */}
            <DailyTips />
            
            {/* Stats */}
            <ModernDashboardStats stats={stats} />
            
            {/* Favorite Tools */}
            <FavoriteTools recentActivity={recentContent} />
          </div>

          {/* Right Column - Credits & Quick Info */}
          <div className="space-y-6">
            {/* Credits Overview */}
            <CreditsOverview 
              creditsAvailable={stats.creditsAvailable}
              creditsUsed={stats.creditsUsed}
              isUnlimited={isUnlimited}
            />
            
            {/* Quick Stats */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-blue-400" size={20} />
                Deze Maand
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Artikelen</span>
                  <span className="text-2xl font-bold text-white">{stats.thisMonth}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Projecten</span>
                  <span className="text-2xl font-bold text-white">{stats.totalProjects}</span>
                </div>
                
                <div className="pt-4 border-t border-gray-800">
                  <Link href="/client-portal/content-library">
                    <Button className="w-full bg-blue-500 hover:bg-orange-500 text-white">
                      Bekijk Alles
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Recente Activiteit</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {recentContent.length} recente artikel{recentContent.length !== 1 ? 'en' : ''}
                </p>
              </div>
              <Link href="/client-portal/content-library">
                <Button variant="ghost" className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10">
                  Bekijk Alles
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-800">
            {recentContent.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-gray-600" />
                </div>
                <p className="text-gray-500 mb-4">Nog geen content gegenereerd</p>
                <Link href="/client-portal/content-generator">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Genereer Content
                  </Button>
                </Link>
              </div>
            ) : (
              recentContent.map((item) => (
                <Link
                  key={item.id}
                  href={`/client-portal/content-library/${item.id}/edit`}
                  className="block p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{languageFlags[item.language?.toUpperCase()] || '🌐'}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{item.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: nl })}</span>
                        {item.projectName && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                              {item.projectName}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
