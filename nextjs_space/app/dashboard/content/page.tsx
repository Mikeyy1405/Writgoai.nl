'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon, 
  Clock,
  Download,
  ExternalLink,
  Filter,
  RefreshCw,
  FileText,
  Video,
  Image as ImageIcon,
  CheckCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO, startOfDay, isToday, isTomorrow, isFuture, isPast } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ContentItem {
  id: string;
  title: string;
  type: 'article' | 'social' | 'video';
  platforms: string[];
  scheduledFor: string;
  status: 'scheduled' | 'generating' | 'published' | 'failed';
  preview?: string;
  mediaUrl?: string;
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

const TYPE_ICONS = {
  article: FileText,
  social: ImageIcon,
  video: Video,
};

const STATUS_CONFIG = {
  scheduled: { label: '⏱️ Gepland', color: 'bg-blue-100 text-blue-700' },
  generating: { label: '🔄 Wordt gegenereerd', color: 'bg-yellow-100 text-yellow-700' },
  published: { label: '✅ Gepubliceerd', color: 'bg-green-100 text-green-700' },
  failed: { label: '❌ Gefaald', color: 'bg-red-100 text-red-700' },
};

export default function ContentPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/distribution/queue?per_page=100');
      
      if (!response.ok) {
        throw new Error('Kon content niet ophalen');
      }

      const data = await response.json();
      
      // Transform queue items to content items
      const items: ContentItem[] = data.items.map((item: any) => ({
        id: item.id,
        title: item.content?.title || 'Untitled',
        type: item.content?.type || 'social',
        platforms: item.platforms || [],
        scheduledFor: item.scheduled_for,
        status: item.status === 'completed' ? 'published' : 
                item.status === 'failed' ? 'failed' : 
                item.status === 'processing' ? 'generating' : 'scheduled',
        preview: item.content?.preview || item.metadata?.preview,
        mediaUrl: item.metadata?.media_url,
      }));

      setContent(items);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Fout bij het laden van content');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchContent();
    setRefreshing(false);
    toast.success('Content vernieuwd');
  };

  const handleDownload = (item: ContentItem) => {
    toast('Download functionaliteit komt binnenkort', { icon: '📥' });
  };

  const handleViewLive = (item: ContentItem) => {
    toast('Live weergave komt binnenkort', { icon: '🔗' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933] mx-auto mb-4"></div>
          <p className="text-gray-500">Content laden...</p>
        </div>
      </div>
    );
  }

  // Filter content
  let filteredContent = content;
  if (filterPlatform !== 'all') {
    filteredContent = filteredContent.filter(item => 
      item.platforms.includes(filterPlatform)
    );
  }
  if (filterType !== 'all') {
    filteredContent = filteredContent.filter(item => item.type === filterType);
  }

  // Sort by scheduled date
  filteredContent = filteredContent.sort((a, b) => 
    new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
  );

  // Group by date
  const groupedContent: { [key: string]: ContentItem[] } = {};
  filteredContent.forEach(item => {
    const date = format(parseISO(item.scheduledFor), 'yyyy-MM-dd');
    if (!groupedContent[date]) {
      groupedContent[date] = [];
    }
    groupedContent[date].push(item);
  });

  const uniquePlatforms = Array.from(new Set(content.flatMap(item => item.platforms)));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📅 Content Kalender
          </h1>
          <p className="text-gray-600">
            Bekijk je geplande en gepubliceerde content. <span className="font-semibold text-[#FF9933]">{filteredContent.length} items</span> gepland.
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        {/* Platform Filter */}
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
        >
          <option value="all">Alle Platforms</option>
          {uniquePlatforms.map(platform => (
            <option key={platform} value={platform}>
              {PLATFORM_ICONS[platform] || '🌐'} {platform}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
        >
          <option value="all">Alle Types</option>
          <option value="article">📝 Artikelen</option>
          <option value="social">📱 Social Posts</option>
          <option value="video">🎥 Videos</option>
        </select>
      </div>

      {/* Content Timeline */}
      {filteredContent.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Geen content gevonden
            </h3>
            <p className="text-gray-500">
              Er is momenteel geen content gepland voor de geselecteerde filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedContent).map(([date, items]) => {
            const dateObj = parseISO(date);
            const dateLabel = isToday(dateObj) ? '🎯 VANDAAG' : 
                             isTomorrow(dateObj) ? '⏭️ MORGEN' : 
                             format(dateObj, 'EEEE d MMMM yyyy', { locale: nl });

            return (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {dateLabel}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-500">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Content Items */}
                <div className="space-y-3">
                  {items.map((item) => {
                    const TypeIcon = TYPE_ICONS[item.type];
                    const statusConfig = STATUS_CONFIG[item.status];
                    
                    return (
                      <Card key={item.id} className="border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            {/* Time */}
                            <div className="flex flex-col items-center justify-center min-w-[60px] text-center">
                              <Clock className="w-5 h-5 text-gray-400 mb-1" />
                              <div className="text-sm font-semibold text-gray-900">
                                {format(parseISO(item.scheduledFor), 'HH:mm')}
                              </div>
                            </div>

                            {/* Content Preview */}
                            <div className="flex-1 min-w-0">
                              {/* Type & Platforms */}
                              <div className="flex items-center gap-2 mb-2">
                                <TypeIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-xs font-medium text-gray-500 uppercase">
                                  {item.type}
                                </span>
                                <span className="text-gray-300">•</span>
                                <div className="flex items-center gap-1">
                                  {item.platforms.map(platform => (
                                    <span key={platform} className="text-sm">
                                      {PLATFORM_ICONS[platform] || '🌐'}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Title & Preview */}
                              <h3 className="font-semibold text-gray-900 mb-2">
                                {item.title}
                              </h3>
                              {item.preview && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                  {item.preview}
                                </p>
                              )}

                              {/* Media Preview */}
                              {item.mediaUrl && (
                                <div className="mb-3">
                                  <div className="w-full h-32 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                  </div>
                                </div>
                              )}

                              {/* Status & Actions */}
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                  {statusConfig.label}
                                </span>

                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(item)}
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  {item.status === 'published' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewLive(item)}
                                      className="text-gray-600 hover:text-gray-900"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Content wordt automatisch beheerd
              </h3>
              <p className="text-sm text-gray-700">
                Al je content wordt automatisch gegenereerd, gepland en gepubliceerd op je verbonden platforms. 
                Je hoeft niets te doen - het systeem werkt volledig autonoom. Deze kalender is alleen voor inzicht, 
                niet voor bewerken.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
