
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Play, Plus, Settings, TrendingUp, Video, Youtube, Instagram, Facebook, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VideoSeries {
  id: string;
  name: string;
  description?: string;
  niche: string;
  isActive: boolean;
  videosPerWeek: number;
  autopilotEnabled: boolean;
  postToYouTube: boolean;
  postToInstagram: boolean;
  postToTikTok: boolean;
  postToFacebook: boolean;
  postToLinkedIn: boolean;
  GeneratedVideos: any[];
  _count: {
    GeneratedVideos: number;
  };
}

export default function ReelsAutomationPage() {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [videoSeries, setVideoSeries] = useState<VideoSeries[]>([]);

  useEffect(() => {
    if (session) {
      fetchVideoSeries();
    }
  }, [session]);

  const fetchVideoSeries = async () => {
    try {
      const response = await fetch('/api/video-series');
      if (response.ok) {
        const data = await response.json();
        setVideoSeries(data);
      }
    } catch (error) {
      console.error('Error fetching video series:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Video & Reels Automatisering
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Automatische faceless video's voor YouTube, Instagram, TikTok, Facebook & LinkedIn
            </p>
          </div>
          <Button
            onClick={() => router.push('/client-portal/reels/create')}
            size="lg"
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nieuwe Video Serie
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Totaal Series
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {videoSeries.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Video's Gegenereerd
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {videoSeries.reduce((acc, s) => acc + s._count.GeneratedVideos, 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Actieve Series
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {videoSeries.filter(s => s.isActive).length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Autopilot Enabled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {videoSeries.filter(s => s.autopilotEnabled).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Series List */}
        {videoSeries.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Video className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nog geen video series
              </h3>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                Start met het maken van je eerste video serie en laat AI automatisch 
                faceless video's genereren voor al je social media kanalen.
              </p>
              <Button
                onClick={() => router.push('/client-portal/reels/create')}
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              >
                <Plus className="mr-2 h-5 w-5" />
                Maak je eerste video serie
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoSeries.map((series) => (
              <Card
                key={series.id}
                className="hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-l-orange-500"
                onClick={() => router.push(`/client-portal/reels/${series.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{series.name}</CardTitle>
                    {series.isActive ? (
                      <Badge className="bg-green-500">Actief</Badge>
                    ) : (
                      <Badge variant="secondary">Inactief</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    {series.description || 'Geen beschrijving'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Niche:</span>
                    <span>{series.niche}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Play className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{series._count.GeneratedVideos} video's</span>
                    <span className="text-gray-400">•</span>
                    <span>{series.videosPerWeek} per week</span>
                  </div>

                  {series.autopilotEnabled && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className="bg-purple-500">
                        <Settings className="h-3 w-3 mr-1" />
                        Autopilot Enabled
                      </Badge>
                    </div>
                  )}

                  {/* Social Media Icons */}
                  <div className="flex gap-2 pt-2 border-t">
                    {series.postToYouTube && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600">
                        <Youtube className="h-4 w-4" />
                      </div>
                    )}
                    {series.postToInstagram && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-100 text-pink-600">
                        <Instagram className="h-4 w-4" />
                      </div>
                    )}
                    {series.postToTikTok && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white">
                        <span className="text-xs font-bold">TT</span>
                      </div>
                    )}
                    {series.postToFacebook && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                        <Facebook className="h-4 w-4" />
                      </div>
                    )}
                    {series.postToLinkedIn && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-700 text-white">
                        <Linkedin className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/client-portal/reels/${series.id}`);
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Bekijk Serie
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

