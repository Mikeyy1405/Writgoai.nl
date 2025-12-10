'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ContentData {
  overview: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    scheduledPosts: number;
  };
  recentPosts: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

interface ContentWidgetProps {
  initialData?: {
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
  onRefresh?: () => void;
}

export function ContentWidget({ initialData, onRefresh }: ContentWidgetProps) {
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [blogData, setBlogData] = useState<ContentData | null>(null);

  useEffect(() => {
    fetchBlogData();
  }, []);

  const fetchBlogData = async () => {
    try {
      const response = await fetch('/api/admin/blog/stats');
      
      if (!response.ok) {
        console.error('Could not fetch blog stats');
        return;
      }

      const result = await response.json();
      setBlogData(result);
    } catch (err) {
      console.error('Error fetching blog stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            📝 Content Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const generatedToday = initialData?.generatedToday || 0;
  const pending = initialData?.pending || (blogData?.overview.draftPosts || 0);
  const published = initialData?.published || (blogData?.overview.publishedPosts || 0);
  const recentContent = initialData?.recent || [];
  const recentBlogPosts = blogData?.recentPosts || [];

  // Combine recent content from both sources
  const allRecentItems = [
    ...recentContent.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      clientName: item.clientName,
      status: item.status,
      source: 'content' as const,
    })),
    ...recentBlogPosts.slice(0, 3).map(post => ({
      id: post.id,
      title: post.title,
      type: 'blog',
      clientName: 'Blog',
      status: post.status,
      source: 'blog' as const,
    })),
  ].slice(0, 3);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            📝 Content Hub
          </span>
          <Link href="/admin/content">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
              <p className="text-lg font-bold text-white">
                {generatedToday}
              </p>
              <p className="text-xs text-zinc-500">Vandaag</p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
              <p className="text-lg font-bold text-white">
                {pending}
              </p>
              <p className="text-xs text-zinc-500">In afwachting</p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
              <p className="text-lg font-bold text-white">
                {published}
              </p>
              <p className="text-xs text-zinc-500">Deze week</p>
            </div>
          </div>

          {/* Recent content */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Recente content</p>
            <div className="space-y-2">
              {allRecentItems.length === 0 ? (
                <div className="text-center py-4 text-zinc-500 text-sm">
                  Nog geen content
                </div>
              ) : (
                allRecentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg"
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{item.title}</p>
                        <p className="text-xs text-zinc-600 truncate">{item.clientName}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                        item.status === 'published'
                          ? 'bg-green-500/20 text-green-400'
                          : item.status === 'scheduled'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Link href="/admin/content">
              <Button className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white">
                Nieuwe content maken
              </Button>
            </Link>
            <Link href="/admin/blog">
              <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white">
                Bekijk alle content
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
