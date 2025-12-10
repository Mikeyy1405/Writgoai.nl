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

export function ContentWidget() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ContentData | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/blog/stats');
      
      if (!response.ok) {
        throw new Error('Kon content data niet laden');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
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

  if (error || !data) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            📝 Content Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-zinc-400 mb-4">{error || 'Kon data niet laden'}</p>
            <Button
              onClick={fetchData}
              className="bg-[#FF6B35] hover:bg-[#FF8555]"
              size="sm"
            >
              Opnieuw proberen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            📝 Content Hub
          </span>
          <Link href="/admin/blog">
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
                {data.overview.draftPosts}
              </p>
              <p className="text-xs text-zinc-500">Concepten</p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
              <p className="text-lg font-bold text-white">
                {data.overview.scheduledPosts}
              </p>
              <p className="text-xs text-zinc-500">Gepland</p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
              <p className="text-lg font-bold text-white">
                {data.overview.publishedPosts}
              </p>
              <p className="text-xs text-zinc-500">Gepubliceerd</p>
            </div>
          </div>

          {/* Recent posts */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Recente artikelen</p>
            <div className="space-y-2">
              {data.recentPosts.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <p className="text-xs text-white truncate">{post.title}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      post.status === 'published'
                        ? 'bg-green-500/20 text-green-400'
                        : post.status === 'scheduled'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Link href="/admin/blog/editor">
              <Button className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white">
                Nieuw artikel schrijven
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
