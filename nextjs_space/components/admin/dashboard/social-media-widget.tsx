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
    platforms: string[];
    scheduledFor: string;
  }>;
}

interface SocialMediaWidgetProps {
  initialData?: {
    scheduledPosts: number;
    recentPosts: Array<any>;
  };
  onRefresh?: () => void;
}

export function SocialMediaWidget({ initialData, onRefresh }: SocialMediaWidgetProps) {
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [accountsData, setAccountsData] = useState<Array<any>>([]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/client/latedev/accounts');
      
      if (!response.ok) {
        console.error('Could not fetch accounts');
        setAccountsData([]);
        return;
      }

      const result = await response.json();
      setAccountsData(result.accounts || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setAccountsData([]);
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

  const scheduledPosts = initialData?.scheduledPosts || 0;
  const accounts = accountsData;

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
          <Link href="/admin/distribution">
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
            {accounts.length === 0 ? (
              <div className="text-center py-4 text-zinc-500 text-sm">
                Geen accounts verbonden
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.slice(0, 3).map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-2 bg-zinc-950 rounded-lg"
                  >
                    <span className="text-2xl">{getPlatformEmoji(account.platform)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{account.username}</p>
                      <p className="text-xs text-zinc-600">{account.platform}</p>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full" title="Verbonden" />
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
                {scheduledPosts}
              </p>
              <p className="text-xs text-zinc-600">posts</p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-zinc-500">Accounts</span>
              </div>
              <p className="text-lg font-bold text-white">
                {accounts.length}
              </p>
              <p className="text-xs text-zinc-600">verbonden</p>
            </div>
          </div>

          {/* Quick post button */}
          <Link href="/admin/distribution">
            <Button className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white">
              Plan nieuwe post
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
