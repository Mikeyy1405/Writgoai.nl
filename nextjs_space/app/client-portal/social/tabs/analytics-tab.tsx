'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BarChart3, Loader2, TrendingUp, Users, MousePointerClick, FileText } from 'lucide-react';

interface AnalyticsTabProps {
  projectId: string;
}

interface Analytics {
  overview: {
    totalPosts: number;
    publishedPosts: number;
    scheduledPosts: number;
    draftPosts: number;
    totalReach: number;
    totalEngagement: number;
    totalClicks: number;
    engagementRate: string;
  };
  byPlatform: Record<string, number>;
  topPosts: Array<{
    id: string;
    content: string;
    platform: string;
    engagement: number;
    reach: number;
  }>;
  bestPostingTimes: string[];
}

export default function AnalyticsTab({ projectId }: AnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [projectId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/social/analytics?projectId=${projectId}`);

      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast.error('Kon analytics niet laden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Kon analytics niet laden
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.publishedPosts} gepubliceerd
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bereik</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalReach.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Totaal bereik
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.engagementRate}% rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Totaal clicks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance per Platform</CardTitle>
          <CardDescription>Posts per platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analytics.byPlatform).map(([platform, count]) => (
              <div key={platform} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{platform}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500"
                      style={{
                        width: `${(count / analytics.overview.totalPosts) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
          <CardDescription>Best presterende posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topPosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                Nog geen gepubliceerde posts
              </p>
            ) : (
              analytics.topPosts.map((post) => (
                <Card key={post.id} className="p-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">{post.platform}</Badge>
                      <p className="text-sm">{post.content}</p>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold text-orange-500">{post.engagement}</div>
                      <div className="text-xs text-muted-foreground">engagement</div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Best Posting Times */}
      <Card>
        <CardHeader>
          <CardTitle>Beste Post Tijden</CardTitle>
          <CardDescription>Optimale tijden om te posten</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.bestPostingTimes.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              Nog geen data beschikbaar
            </p>
          ) : (
            <div className="flex gap-3">
              {analytics.bestPostingTimes.map((time) => (
                <Badge key={time} variant="outline" className="text-lg py-2 px-4">
                  {time}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
