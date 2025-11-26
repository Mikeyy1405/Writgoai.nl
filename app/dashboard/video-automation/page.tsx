
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { Calendar, CheckCircle2, Clock, Film, Play, Settings, Sparkles, Trash2, Zap } from 'lucide-react';

interface VideoStrategy {
  id: string;
  niche: string;
  targetAudience?: string;
  videosPerWeek: number;
  preferredPostTime: string;
  language: string;
  voice: string;
  captionTheme: string;
  aspectRatio: string;
  autopilotEnabled: boolean;
  publishingDays: string[];
  totalGenerated: number;
  totalPublished: number;
  lastGeneratedAt?: string;
}

interface ScheduledVideo {
  id: string;
  topic: string;
  description?: string;
  status: string;
  scheduledFor?: string;
  generatedAt?: string;
  publishedAt?: string;
  errorMessage?: string;
}

export default function VideoAutomationPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [strategy, setStrategy] = useState<VideoStrategy | null>(null);
  const [scheduledVideos, setScheduledVideos] = useState<ScheduledVideo[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    niche: '',
    targetAudience: '',
    videosPerWeek: 3,
    preferredPostTime: '09:00',
    language: 'Dutch',
    voice: 'CwhRBWXzGAHq8TQ4Fs17', // Roger - Dutch voice
    captionTheme: 'Hormozi_1',
    aspectRatio: '9:16',
    autopilotEnabled: false,
    publishingDays: ['monday', 'wednesday', 'friday']
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    loadStrategy();
  }, [session, status, router]);

  const loadStrategy = async () => {
    try {
      const response = await fetch('/api/video-automation/strategy');
      if (response.ok) {
        const data = await response.json();
        if (data.strategy) {
          setStrategy(data.strategy);
          setFormData({
            niche: data.strategy.niche || '',
            targetAudience: data.strategy.targetAudience || '',
            videosPerWeek: data.strategy.videosPerWeek || 3,
            preferredPostTime: data.strategy.preferredPostTime || '09:00',
            language: data.strategy.language || 'Dutch',
            voice: data.strategy.voice || 'Freya',
            captionTheme: data.strategy.captionTheme || 'Hormozi_1',
            aspectRatio: data.strategy.aspectRatio || '9:16',
            autopilotEnabled: data.strategy.autopilotEnabled || false,
            publishingDays: data.strategy.publishingDays || ['monday', 'wednesday', 'friday']
          });
        }
      }
      loadScheduledVideos();
    } catch (error) {
      console.error('Error loading strategy:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledVideos = async () => {
    try {
      const response = await fetch('/api/video-automation/scheduled');
      if (response.ok) {
        const data = await response.json();
        setScheduledVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error loading scheduled videos:', error);
    }
  };

  const handleSaveStrategy = async () => {
    if (!formData.niche.trim()) {
      toast.error('Vul een niche/onderwerp in');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/video-automation/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setStrategy(data.strategy);
        toast.success('Video strategie opgeslagen!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fout bij opslaan');
      }
    } catch (error) {
      console.error('Error saving strategy:', error);
      toast.error('Fout bij opslaan strategie');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateTopics = async (count: number = 10) => {
    if (!strategy?.id) {
      toast.error('Sla eerst je strategie op');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/video-automation/generate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId: strategy.id, count })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.topics.length} video onderwerpen gegenereerd!`);
        loadScheduledVideos();
        loadStrategy();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fout bij genereren onderwerpen');
      }
    } catch (error) {
      console.error('Error generating topics:', error);
      toast.error('Fout bij genereren onderwerpen');
    } finally {
      setGenerating(false);
    }
  };

  const handleStartVideo = async (videoId: string) => {
    try {
      const response = await fetch('/api/video-automation/start-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      });

      if (response.ok) {
        toast.success('Video generatie gestart!');
        loadScheduledVideos();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fout bij starten video');
      }
    } catch (error) {
      console.error('Error starting video:', error);
      toast.error('Fout bij starten video');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Video automation laden...</p>
        </div>
      </div>
    );
  }

  const pendingVideos = scheduledVideos.filter(v => v.status === 'PENDING');
  const scheduledCount = scheduledVideos.filter(v => v.status === 'SCHEDULED');
  const generatingVideos = scheduledVideos.filter(v => v.status === 'GENERATING');
  const completedVideos = scheduledVideos.filter(v => v.status === 'COMPLETED');

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Film className="h-8 w-8 text-orange-600" />
          Video Automation
        </h1>
        <p className="text-muted-foreground">
          Automatische video planning en generatie op basis van jouw niche
        </p>
      </div>

      {/* Stats Overview */}
      {strategy && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wachtend</p>
                  <p className="text-2xl font-bold">{pendingVideos.length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingepland</p>
                  <p className="text-2xl font-bold">{scheduledCount.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Genereren</p>
                  <p className="text-2xl font-bold">{generatingVideos.length}</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Voltooid</p>
                  <p className="text-2xl font-bold">{completedVideos.length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="strategy" className="space-y-6">
        <TabsList>
          <TabsTrigger value="strategy">
            <Settings className="h-4 w-4 mr-2" />
            Strategie
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="h-4 w-4 mr-2" />
            Geplande Video's
          </TabsTrigger>
        </TabsList>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Strategie</CardTitle>
              <CardDescription>
                Stel je automatische video planning in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="niche">Niche / Onderwerp *</Label>
                  <Input
                    id="niche"
                    placeholder="Bijv. Yoga, Fitness, Koken, Travel, etc."
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    De AI genereert automatisch video onderwerpen binnen deze niche
                  </p>
                </div>

                <div>
                  <Label htmlFor="targetAudience">Doelgroep (optioneel)</Label>
                  <Input
                    id="targetAudience"
                    placeholder="Bijv. Beginners, Professionals, 30-45 jaar, etc."
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="videosPerWeek">Video's per Week</Label>
                    <Select
                      value={formData.videosPerWeek.toString()}
                      onValueChange={(value) => setFormData({ ...formData, videosPerWeek: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 video</SelectItem>
                        <SelectItem value="2">2 video's</SelectItem>
                        <SelectItem value="3">3 video's</SelectItem>
                        <SelectItem value="5">5 video's</SelectItem>
                        <SelectItem value="7">7 video's (dagelijks)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="preferredPostTime">Post Tijd</Label>
                    <Input
                      id="preferredPostTime"
                      type="time"
                      value={formData.preferredPostTime}
                      onChange={(e) => setFormData({ ...formData, preferredPostTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">Taal</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => setFormData({ ...formData, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dutch">Nederlands</SelectItem>
                        <SelectItem value="English">Engels</SelectItem>
                        <SelectItem value="German">Duits</SelectItem>
                        <SelectItem value="French">Frans</SelectItem>
                        <SelectItem value="Spanish">Spaans</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="voice">Voice</Label>
                    <Select
                      value={formData.voice}
                      onValueChange={(value) => setFormData({ ...formData, voice: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CwhRBWXzGAHq8TQ4Fs17">Roger (man, Nederlands) ⭐</SelectItem>
                        <SelectItem value="EXAVITQu4vr4xnSDxMaL">Sarah (vrouw, warm)</SelectItem>
                        <SelectItem value="IKne3meq5aSn9XLyUdCD">Charlie (man, Australisch)</SelectItem>
                        <SelectItem value="JBFqnCBsd6RMkjVDRZzb">George (man, Brits)</SelectItem>
                        <SelectItem value="FGY2WhTYpPnrIDTdsKH5">Laura (vrouw, energiek)</SelectItem>
                        <SelectItem value="2EiwWnXFnvU5JabPnv8n">Clyde (man, karakter)</SelectItem>
                        <SelectItem value="SAz9YHcvj6GT2YYXdXww">River (neutraal, relaxed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="captionTheme">Caption Theme</Label>
                    <Select
                      value={formData.captionTheme}
                      onValueChange={(value) => setFormData({ ...formData, captionTheme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hormozi_1">Hormozi 1</SelectItem>
                        <SelectItem value="Hormozi_2">Hormozi 2</SelectItem>
                        <SelectItem value="Classic">Classic</SelectItem>
                        <SelectItem value="Modern">Modern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                    <Select
                      value={formData.aspectRatio}
                      onValueChange={(value) => setFormData({ ...formData, aspectRatio: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:16">9:16 (Reels/TikTok)</SelectItem>
                        <SelectItem value="16:9">16:9 (YouTube)</SelectItem>
                        <SelectItem value="1:1">1:1 (Instagram)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Autopilot Modus</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatisch video's genereren volgens planning
                    </p>
                  </div>
                  <Switch
                    checked={formData.autopilotEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, autopilotEnabled: checked })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveStrategy} disabled={saving} className="flex-1">
                  {saving ? 'Opslaan...' : 'Strategie Opslaan'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {strategy && (
            <Card>
              <CardHeader>
                <CardTitle>AI Topic Generator</CardTitle>
                <CardDescription>
                  Laat de AI automatisch video onderwerpen genereren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleGenerateTopics(5)}
                    disabled={generating}
                    className="flex-1"
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generating ? 'Genereren...' : 'Genereer 5 Topics'}
                  </Button>
                  <Button
                    onClick={() => handleGenerateTopics(10)}
                    disabled={generating}
                    className="flex-1"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generating ? 'Genereren...' : 'Genereer 10 Topics'}
                  </Button>
                </div>

                {strategy.totalGenerated > 0 && (
                  <div className="text-center text-sm text-muted-foreground pt-2">
                    Totaal {strategy.totalGenerated} onderwerpen gegenereerd
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Scheduled Videos Tab */}
        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Geplande Video's</CardTitle>
              <CardDescription>
                Overzicht van alle geplande en gegenereerde video's
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledVideos.length === 0 ? (
                <div className="text-center py-12">
                  <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nog geen video's gepland
                  </p>
                  <Button onClick={() => handleGenerateTopics(5)} disabled={!strategy}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Genereer Topics
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledVideos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{video.topic}</h4>
                          <Badge
                            variant={
                              video.status === 'COMPLETED'
                                ? 'default'
                                : video.status === 'GENERATING'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {video.status === 'PENDING' && 'Wachtend'}
                            {video.status === 'SCHEDULED' && 'Ingepland'}
                            {video.status === 'GENERATING' && 'Genereren...'}
                            {video.status === 'COMPLETED' && 'Voltooid'}
                            {video.status === 'FAILED' && 'Mislukt'}
                          </Badge>
                        </div>
                        {video.description && (
                          <p className="text-sm text-muted-foreground">{video.description}</p>
                        )}
                        {video.scheduledFor && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Gepland voor: {new Date(video.scheduledFor).toLocaleString('nl-NL')}
                          </p>
                        )}
                        {video.errorMessage && (
                          <p className="text-xs text-red-500 mt-1">{video.errorMessage}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {video.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => handleStartVideo(video.id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {video.status === 'COMPLETED' && (
                          <Button size="sm" variant="outline">
                            Bekijk
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
