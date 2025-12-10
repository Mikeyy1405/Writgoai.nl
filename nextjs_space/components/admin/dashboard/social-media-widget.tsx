'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SocialMediaData {
  accounts: Array<{
    id: string;
    platform: string;
    username: string;
  }>;
  scheduledPosts: number;
  recentPosts: Array<{
    id: string;
    content: string;
    platform: string;
    scheduledFor: string;
  }>;
}

export function SocialMediaWidget() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SocialMediaData | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/client/latedev/accounts');
      
      if (!response.ok) {
        throw new Error('Kon social media data niet laden');
      }

      const result = await response.json();
      
      // Transform the data
      // Note: scheduledPosts and recentPosts will be available when Late.dev API provides them
      setData({
        accounts: result.accounts || [],
        scheduledPosts: result.scheduledPosts || 0,
        recentPosts: result.recentPosts || [],
      });
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
            📱 Social Media (Late.dev)
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
            📱 Social Media (Late.dev)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-sm text-zinc-400 mb-4">
              Verbind je social media accounts om te beginnen
            </p>
            <Link href="/admin/content">
              <Button className="bg-[#FF6B35] hover:bg-[#FF8555]" size="sm">
                Accounts verbinden
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPlatformEmoji = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('twitter') || platformLower.includes('x')) return '𝕏';
    if (platformLower.includes('facebook')) return '📘';
    if (platformLower.includes('instagram')) return '📷';
    if (platformLower.includes('linkedin')) return '💼';
    if (platformLower.includes('tiktok')) return '🎵';
    return '📱';
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            📱 Social Media (Late.dev)
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
          {/* Connected accounts */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Verbonden accounts</p>
            {data.accounts.length === 0 ? (
              <div className="text-center py-4 text-zinc-500 text-sm">
                Geen accounts verbonden
              </div>
            ) : (
              <div className="space-y-2">
                {data.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-2 bg-zinc-950 rounded-lg"
                  >
                    <span className="text-2xl">{getPlatformEmoji(account.platform)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{account.username}</p>
                      <p className="text-xs text-zinc-600">{account.platform}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-zinc-500">Gepland</span>
              </div>
              <p className="text-lg font-bold text-white">
                {data.scheduledPosts}
              </p>
              <p className="text-xs text-zinc-600">posts</p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-zinc-500">Accounts</span>
              </div>
              <p className="text-lg font-bold text-white">
                {data.accounts.length}
              </p>
              <p className="text-xs text-zinc-600">verbonden</p>
            </div>
          </div>

          {/* Quick post button */}
          <Link href="/admin/content">
            <Button className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white">
              Plan nieuwe post
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
