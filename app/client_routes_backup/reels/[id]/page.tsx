
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play, Plus, Download, Loader2, CheckCircle, XCircle, Clock, Youtube, Instagram, Facebook, Linkedin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface VideoSeries {
  id: string;
  name: string;
  description?: string;
  niche: string;
  voice: string;
  language: string;
  duration: string;
  aspectRatio: string;
  isActive: boolean;
}

interface GeneratedVideo {
  id: string;
  videoTopic: string;
  vadooVideoId?: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED' | 'PUBLISHING' | 'PUBLISHED';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  title?: string;
  description?: string;
  postedToYouTube: boolean;
  postedToInstagram: boolean;
  postedToTikTok: boolean;
  postedToFacebook: boolean;
  postedToLinkedIn: boolean;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export default function VideoSeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [series, setSeries] = useState<VideoSeries | null>(null);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [newVideoTopic, setNewVideoTopic] = useState('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  useEffect(() => {
    fetchSeriesDetails();
    fetchVideos();
    
    // Polling for video status updates
    const interval = setInterval(() => {
      fetchVideos();
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [params.id]);

  const fetchSeriesDetails = async () => {
    try {
      const response = await fetch('/api/video-series');
      if (response.ok) {
        const allSeries = await response.json();
        const currentSeries = allSeries.find((s: VideoSeries) => s.id === params.id);
        setSeries(currentSeries || null);
      }
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await fetch(`/api/videos?seriesId=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleGenerateVideo = async () => {
    if (!newVideoTopic.trim()) {
      toast.error('Vul een onderwerp in voor de video');
      return;
    }

    setGenerating(true);
    
    try {
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesId: params.id,
          videoTopic: newVideoTopic,
        }),
      });

      if (response.ok) {
        toast.success('Video wordt gegenereerd! Dit duurt 2-3 minuten.');
        setNewVideoTopic('');
        setShowGenerateDialog(false);
        fetchVideos();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kon video niet genereren');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error('Er ging iets mis');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GENERATING':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Generating...</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Compleet</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'PUBLISHED':
        return <Badge className="bg-blue-500"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Serie niet gevonden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/client-portal/reels')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar overzicht
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                {series.name}
              </h1>
              <p className="text-gray-600 mt-2">
                {series.description || 'Geen beschrijving'}
              </p>
              <div className="flex gap-3 mt-4">
                <Badge>{series.niche}</Badge>
                <Badge variant="outline">{series.voice}</Badge>
                <Badge variant="outline">{series.language}</Badge>
                <Badge variant="outline">{series.aspectRatio}</Badge>
              </div>
            </div>
            <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Genereer Video
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe Video Genereren</DialogTitle>
                  <DialogDescription>
                    Beschrijf het onderwerp voor de video. De AI zal automatisch een script, voice-over en visuals genereren.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="videoTopic">Video Onderwerp *</Label>
                    <Input
                      id="videoTopic"
                      value={newVideoTopic}
                      onChange={(e) => setNewVideoTopic(e.target.value)}
                      placeholder="Bijv: 5 Tips voor productiviteit"
                      disabled={generating}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    💡 Tip: Wees specifiek in je onderwerp voor betere resultaten
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowGenerateDialog(false)}
                    disabled={generating}
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={handleGenerateVideo}
                    disabled={generating}
                    className="bg-gradient-to-r from-orange-600 to-orange-500"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Bezig...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Genereer Video
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Play className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nog geen video's
              </h3>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                Start met het genereren van je eerste video met AI. Geef een onderwerp op en de AI doet de rest!
              </p>
              <Button
                onClick={() => setShowGenerateDialog(true)}
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-orange-500"
              >
                <Plus className="mr-2 h-5 w-5" />
                Eerste Video Genereren
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg line-clamp-2">{video.videoTopic}</CardTitle>
                    {getStatusBadge(video.status)}
                  </div>
                  <CardDescription className="text-xs text-gray-500">
                    {new Date(video.createdAt).toLocaleString('nl-NL')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Thumbnail */}
                  {video.thumbnailUrl && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.videoTopic}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Video Info */}
                  {video.duration && (
                    <div className="text-sm text-gray-600">
                      Duur: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </div>
                  )}

                  {/* Social Media Status */}
                  {video.status === 'COMPLETED' || video.status === 'PUBLISHED' ? (
                    <div className="flex gap-2 flex-wrap">
                      {video.postedToYouTube && (
                        <Badge variant="outline" className="text-red-600">
                          <Youtube className="h-3 w-3 mr-1" />
                          YouTube
                        </Badge>
                      )}
                      {video.postedToInstagram && (
                        <Badge variant="outline" className="text-pink-600">
                          <Instagram className="h-3 w-3 mr-1" />
                          Instagram
                        </Badge>
                      )}
                      {video.postedToTikTok && (
                        <Badge variant="outline">
                          TikTok
                        </Badge>
                      )}
                      {video.postedToFacebook && (
                        <Badge variant="outline" className="text-blue-600">
                          <Facebook className="h-3 w-3 mr-1" />
                          Facebook
                        </Badge>
                      )}
                      {video.postedToLinkedIn && (
                        <Badge variant="outline" className="text-blue-700">
                          <Linkedin className="h-3 w-3 mr-1" />
                          LinkedIn
                        </Badge>
                      )}
                    </div>
                  ) : null}

                  {/* Error Message */}
                  {video.status === 'FAILED' && video.errorMessage && (
                    <p className="text-sm text-red-600">{video.errorMessage}</p>
                  )}

                  {/* Actions */}
                  {video.status === 'COMPLETED' && video.videoUrl && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => window.open(video.videoUrl, '_blank')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Video
                    </Button>
                  )}

                  {video.status === 'GENERATING' && (
                    <div className="flex items-center justify-center text-sm text-gray-500 py-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Video wordt gegenereerd...
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

