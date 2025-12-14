'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Settings,
  Unlink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Platform {
  platform: string;
  display_name: string;
  username?: string;
  connected: boolean;
  is_enabled: boolean;
  last_post_at?: string;
  posts_this_month?: number;
}

const PLATFORM_ICONS: { [key: string]: string } = {
  linkedin: '📘',
  instagram: '📷',
  facebook: '📙',
  twitter: '🐦',
  tiktok: '🎵',
  pinterest: '📍',
  youtube: '▶️',
  google_business: '🗺️',
};

const PLATFORM_COLORS: { [key: string]: string } = {
  linkedin: 'from-blue-500 to-blue-600',
  instagram: 'from-pink-500 to-purple-600',
  facebook: 'from-blue-600 to-blue-700',
  twitter: 'from-sky-400 to-sky-500',
  tiktok: 'from-gray-800 to-gray-900',
  pinterest: 'from-red-500 to-red-600',
  youtube: 'from-red-600 to-red-700',
  google_business: 'from-green-500 to-green-600',
};

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/distribution/platforms');
      
      if (!response.ok) {
        throw new Error('Kon platforms niet ophalen');
      }

      const data = await response.json();
      setPlatforms(data);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      toast.error('Fout bij het laden van platforms');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPlatforms();
    setRefreshing(false);
    toast.success('Platforms vernieuwd');
  };

  const handleConnect = (platform: Platform) => {
    // TODO: Implement OAuth flow via Getlate.dev
    toast('Platform verbinden komt binnenkort beschikbaar', {
      icon: '🔗',
    });
  };

  const handleDisconnect = async (platform: Platform) => {
    if (!confirm(`Weet je zeker dat je ${platform.display_name} wilt verbreken?`)) {
      return;
    }

    try {
      const response = await fetch('/api/dashboard/distribution/platforms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          platform: platform.platform,
          enabled: false 
        }),
      });

      if (!response.ok) {
        throw new Error('Kon platform niet verbreken');
      }

      toast.success(`${platform.display_name} verbroken`);
      fetchPlatforms();
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      toast.error('Fout bij het verbreken van platform');
    }
  };

  const handleViewPosts = (platform: Platform) => {
    // Navigate to content page filtered by platform
    window.location.href = `/dashboard/content?platform=${platform.platform}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933] mx-auto mb-4"></div>
          <p className="text-gray-500">Platforms laden...</p>
        </div>
      </div>
    );
  }

  const connectedPlatforms = platforms.filter(p => p.connected);
  const availablePlatforms = platforms.filter(p => !p.connected);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-700 mb-2">
            🌐 Jouw Platforms
          </h1>
          <p className="text-gray-600">
            Je hebt <span className="font-semibold text-[#FF9933]">{connectedPlatforms.length} platforms</span> verbonden. 
            Content wordt automatisch aangepast en gepost op elk platform.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="border-gray-300"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Ververs
        </Button>
      </div>

      {/* Add New Platform CTA */}
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50 hover:border-[#FF9933] hover:bg-[#FF9933]/5 transition-all cursor-pointer">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#FF9933] to-[#FFAD33] text-white mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Voeg een nieuw platform toe
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              LinkedIn, Instagram, Facebook, TikTok, Twitter/X, Pinterest, YouTube, Google My Business...
            </p>
            <Button className="bg-gradient-to-r from-[#FF9933] to-[#FFAD33] hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Verbind Platform
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connected Platforms */}
      {connectedPlatforms.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-700 mb-4">Verbonden Platforms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedPlatforms.map((platform) => {
              const icon = PLATFORM_ICONS[platform.platform] || '🌐';
              const gradient = PLATFORM_COLORS[platform.platform] || 'from-gray-500 to-gray-600';
              
              return (
                <Card key={platform.platform} className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* Platform Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl`}>
                          {icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-700 text-lg">
                            {platform.display_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {platform.username || 'Geen gebruikersnaam'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {platform.connected ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>

                    {/* Platform Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-sm font-medium text-green-700">Actief</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Deze maand</div>
                        <div className="text-sm font-bold text-gray-700">
                          {platform.posts_this_month || 0} posts
                        </div>
                      </div>
                      {platform.last_post_at && (
                        <>
                          <div className="col-span-2">
                            <div className="text-xs text-gray-500 mb-1">Laatste post</div>
                            <div className="text-sm text-gray-700">
                              {formatDistanceToNow(new Date(platform.last_post_at), { 
                                addSuffix: true, 
                                locale: nl 
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-300"
                        onClick={() => handleViewPosts(platform)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Bekijk posts
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleDisconnect(platform)}
                      >
                        <Unlink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Platforms */}
      {availablePlatforms.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-700 mb-4">Beschikbare Platforms</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availablePlatforms.map((platform) => {
              const icon = PLATFORM_ICONS[platform.platform] || '🌐';
              const gradient = PLATFORM_COLORS[platform.platform] || 'from-gray-500 to-gray-600';
              
              return (
                <button
                  key={platform.platform}
                  onClick={() => handleConnect(platform)}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-[#FF9933] hover:bg-[#FF9933]/5 transition-all text-center group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                    {icon}
                  </div>
                  <div className="font-medium text-sm text-gray-700">
                    {platform.display_name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Jij kiest, wij posten
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                In tegenstelling tot traditionele bureaus die vaste platforms opleggen, laat Writgo.nl 
                jou kiezen waar je zichtbaar wilt zijn. Verbind de platforms die bij jouw bedrijf passen, 
                en wij zorgen ervoor dat je content automatisch wordt aangepast en gepost op elk platform.
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Geen gedwongen platforms</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Kan uitbreiden wanneer je wilt</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Content aangepast per platform</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
