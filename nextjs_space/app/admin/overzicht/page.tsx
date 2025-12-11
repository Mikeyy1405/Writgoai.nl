'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  FileText, 
  Video, 
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  ExternalLink,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import Link from 'next/link';

interface PlatformStatus {
  platform: string;
  display_name: string;
  username: string;
  status: 'active' | 'warning' | 'error';
  lastPost?: string;
  nextPost?: string;
}

interface SystemStatus {
  overall: 'active' | 'warning' | 'error';
  message: string;
  nextArticle?: string;
  nextSocialPost?: string;
  nextVideo?: string;
}

interface Stats {
  today: {
    posts: number;
    articles: number;
    videos: number;
    views: number;
  };
  thisWeek: {
    posts: number;
    articles: number;
    videos: number;
    views: number;
  };
  thisMonth: {
    posts: number;
    articles: number;
    videos: number;
    platforms: number;
  };
}

interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
  platform?: string;
}

export default function OverzichtPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    overall: 'active',
    message: 'Alle systemen operationeel',
  });
  const [stats, setStats] = useState<Stats>({
    today: { posts: 0, articles: 0, videos: 0, views: 0 },
    thisWeek: { posts: 0, articles: 0, videos: 0, views: 0 },
    thisMonth: { posts: 0, articles: 0, videos: 0, platforms: 0 },
  });
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch platforms
      const platformsRes = await fetch('/api/admin/distribution/platforms');
      if (platformsRes.ok) {
        const platformsData = await platformsRes.json();
        setPlatforms(
          platformsData
            .filter((p: any) => p.is_enabled)
            .map((p: any) => ({
              platform: p.platform,
              display_name: p.display_name,
              username: p.username || 'Niet verbonden',
              status: p.connected ? 'active' : 'warning',
            }))
        );
      }

      // Fetch queue for stats
      const queueRes = await fetch('/api/admin/distribution/queue?per_page=100');
      if (queueRes.ok) {
        const queueData = await queueRes.json();
        
        // Calculate stats
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayItems = queueData.items.filter((item: any) => 
          new Date(item.scheduled_for) >= todayStart
        );
        const weekItems = queueData.items.filter((item: any) => 
          new Date(item.scheduled_for) >= weekStart
        );
        const monthItems = queueData.items.filter((item: any) => 
          new Date(item.scheduled_for) >= monthStart
        );

        setStats({
          today: {
            posts: todayItems.length,
            articles: 0,
            videos: 0,
            views: 0,
          },
          thisWeek: {
            posts: weekItems.length,
            articles: 0,
            videos: 0,
            views: 3200,
          },
          thisMonth: {
            posts: monthItems.length,
            articles: 2,
            videos: 8,
            platforms: platforms.length,
          },
        });

        // Find next scheduled items
        const upcoming = queueData.items
          .filter((item: any) => new Date(item.scheduled_for) > now)
          .sort((a: any, b: any) => 
            new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
          );

        if (upcoming.length > 0) {
          setSystemStatus({
            overall: 'active',
            message: 'Systeem actief en draait automatisch',
            nextSocialPost: upcoming[0]?.scheduled_for,
          });
        }

        // Create activity feed
        const activity = queueData.items
          .slice(0, 10)
          .map((item: any) => ({
            type: 'post',
            description: `${item.content?.title || 'Content'} gepubliceerd`,
            timestamp: item.scheduled_for || item.created_at,
            platform: item.platforms?.[0] || 'Social Media',
          }));
        
        setRecentActivity(activity);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className=\"flex items-center justify-center min-h-[400px]\">
        <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933] mx-auto mb-4\"></div>
          <p className=\"text-gray-500\">Dashboard laden...</p>
        </div>
      </div>
    );
  }

  const statusColor = systemStatus.overall === 'active' ? 'green' : 
                      systemStatus.overall === 'warning' ? 'yellow' : 'red';

  return (
    <div className=\"space-y-6 max-w-7xl mx-auto\">
      {/* Welcome Section */}
      <div>
        <h1 className=\"text-3xl font-bold text-gray-900 mb-2\">
          👋 Welkom terug, {session?.user?.name || 'Gebruiker'}!
        </h1>
        <p className=\"text-gray-600\">
          Je GROEI pakket is actief en draait automatisch.
        </p>
      </div>

      {/* System Status */}
      <Card className=\"border-${statusColor}-200 bg-${statusColor}-50\">
        <CardContent className=\"p-6\">
          <div className=\"flex items-start gap-4\">
            <div className={`w-3 h-3 rounded-full bg-${statusColor}-500 mt-1 animate-pulse`} />
            <div className=\"flex-1\">
              <h3 className=\"font-semibold text-gray-900 mb-2\">
                {systemStatus.overall === 'active' ? '🟢 SYSTEEM STATUS: ACTIEF' : 
                 systemStatus.overall === 'warning' ? '🟠 SYSTEEM STATUS: WAARSCHUWING' :
                 '🔴 SYSTEEM STATUS: FOUT'}
              </h3>
              <p className=\"text-gray-700 text-sm mb-4\">{systemStatus.message}</p>
              
              {systemStatus.nextSocialPost && (
                <div className=\"space-y-1 text-sm\">
                  <div className=\"flex items-center gap-2 text-gray-600\">
                    <Calendar className=\"w-4 h-4\" />
                    <span>Volgende social post: {formatDistanceToNow(new Date(systemStatus.nextSocialPost), { addSuffix: true, locale: nl })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
        {/* This Month */}
        <Card>
          <CardHeader className=\"pb-3\">
            <CardTitle className=\"text-sm font-medium text-gray-500\">DEZE MAAND</CardTitle>
          </CardHeader>
          <CardContent className=\"space-y-2\">
            <div className=\"text-2xl font-bold text-gray-900\">{stats.thisMonth.posts} posts</div>
            <div className=\"space-y-1 text-sm text-gray-600\">
              <div>{stats.thisMonth.articles} artikelen</div>
              <div>{stats.thisMonth.videos} videos</div>
              <div className=\"font-medium text-[#FF9933]\">{stats.thisMonth.platforms} platforms actief</div>
            </div>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card>
          <CardHeader className=\"pb-3\">
            <CardTitle className=\"text-sm font-medium text-gray-500\">DEZE WEEK</CardTitle>
          </CardHeader>
          <CardContent className=\"space-y-2\">
            <div className=\"text-2xl font-bold text-gray-900\">{stats.thisWeek.posts} posts</div>
            <div className=\"space-y-1 text-sm text-gray-600\">
              <div>{stats.thisWeek.articles} artikelen</div>
              <div>{stats.thisWeek.videos} videos</div>
              <div className=\"flex items-center gap-1 text-[#FF9933] font-medium\">
                <TrendingUp className=\"w-4 h-4\" />
                {stats.thisWeek.views.toLocaleString()} views
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today */}
        <Card>
          <CardHeader className=\"pb-3\">
            <CardTitle className=\"text-sm font-medium text-gray-500\">VANDAAG</CardTitle>
          </CardHeader>
          <CardContent className=\"space-y-2\">
            <div className=\"text-2xl font-bold text-gray-900\">{stats.today.posts} posts</div>
            <div className=\"space-y-1 text-sm text-gray-600\">
              <div>{stats.today.articles} artikelen</div>
              <div>{stats.today.videos} videos</div>
              <div className=\"text-green-600 font-medium\">Actief</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Platforms */}
      <Card>
        <CardHeader className=\"flex flex-row items-center justify-between\">
          <CardTitle className=\"text-lg\">🎯 Je Verbonden Platforms</CardTitle>
          <Button asChild variant=\"outline\" size=\"sm\">
            <Link href=\"/admin/platforms\">
              <Plus className=\"w-4 h-4 mr-2\" />
              Voeg platform toe
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {platforms.length === 0 ? (
            <div className=\"text-center py-8 text-gray-500\">
              <p>Nog geen platforms verbonden.</p>
              <Button asChild className=\"mt-4\" variant=\"outline\">
                <Link href=\"/admin/platforms\">Verbind je eerste platform</Link>
              </Button>
            </div>
          ) : (
            <div className=\"space-y-3\">
              {platforms.map((platform) => (
                <div
                  key={platform.platform}
                  className=\"flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-[#FF9933]/50 hover:bg-gray-50 transition-all\"
                >
                  <div className=\"flex items-center gap-3\">
                    <div className=\"w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF9933]/20 to-[#FFAD33]/20 flex items-center justify-center\">
                      <span className=\"text-xl\">{platform.display_name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className=\"font-medium text-gray-900\">{platform.display_name}</div>
                      <div className=\"text-sm text-gray-500\">{platform.username}</div>
                    </div>
                  </div>
                  <div className=\"flex items-center gap-2\">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      platform.status === 'active' ? 'bg-green-100 text-green-700' :
                      platform.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {platform.status === 'active' ? '✅ Actief' :
                       platform.status === 'warning' ? '⚠️ Waarschuwing' :
                       '❌ Error'}
                    </span>
                    <Button asChild variant=\"ghost\" size=\"sm\">
                      <Link href=\"/admin/platforms\">
                        <ExternalLink className=\"w-4 h-4\" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className=\"flex flex-row items-center justify-between\">
          <CardTitle className=\"text-lg flex items-center gap-2\">
            <Activity className=\"w-5 h-5\" />
            Recente Activiteit
          </CardTitle>
          <Button asChild variant=\"ghost\" size=\"sm\">
            <Link href=\"/admin/content\">
              Bekijk alle content
              <ExternalLink className=\"w-4 h-4 ml-2\" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className=\"text-center py-8 text-gray-500\">
              Nog geen recente activiteit.
            </div>
          ) : (
            <div className=\"space-y-3\">
              {recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className=\"flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors\">
                  <CheckCircle2 className=\"w-5 h-5 text-green-500 mt-0.5\" />
                  <div className=\"flex-1 min-w-0\">
                    <p className=\"text-sm text-gray-900\">{activity.description}</p>
                    <p className=\"text-xs text-gray-500 mt-1\">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: nl })}
                      {activity.platform && ` • ${activity.platform}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
