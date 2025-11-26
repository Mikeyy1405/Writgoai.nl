
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'react-hot-toast';
import { Calendar, CheckCircle2, Film, FileText, Mic, Video, Music, Download, Play, Sparkles, Trash2, Edit } from 'lucide-react';

interface VideoIdea {
  id: string;
  title: string;
  description?: string;
  hook?: string;
  keywords: string[];
  niche: string;
  duration: number;
  status: string;
  script?: string;
  voiceoverUrl?: string;
  vadooVideoUrl?: string;
  finalVideoUrl?: string;
  order: number;
}

export default function VideoWorkflowPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<VideoIdea | null>(null);
  const [voices, setVoices] = useState<any[]>([]);
  
  // Form states
  const [calendarForm, setCalendarForm] = useState({
    niche: '',
    targetAudience: '',
    videosPerWeek: 3,
    duration: 30,
  });
  
  const [scriptForm, setScriptForm] = useState({
    ideaId: '',
    title: '',
    description: '',
    hook: '',
    duration: 30,
    tone: 'engaging',
    language: 'Dutch',
  });
  
  const [voiceoverForm, setVoiceoverForm] = useState({
    ideaId: '',
    script: '',
    voiceId: 'CwhRBWXzGAHq8TQ4Fs17',
  });
  
  const [videoForm, setVideoForm] = useState({
    ideaId: '',
    prompt: '',
    style: 'realistic',
    aspectRatio: '9:16',
  });
  
  const [mergeForm, setMergeForm] = useState({
    ideaId: '',
    videoUrl: '',
    voiceoverUrl: '',
    backgroundMusicUrl: '',
    backgroundMusicVolume: 0.3,
  });
  
  const [generating, setGenerating] = useState({
    calendar: false,
    script: false,
    voiceover: false,
    video: false,
    merge: false,
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    loadData();
  }, [session, status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load video ideas
      const ideasRes = await fetch('/api/video-workflow/content-calendar');
      if (ideasRes.ok) {
        const data = await ideasRes.json();
        setIdeas(data);
      }
      
      // Load ElevenLabs voices
      const voicesRes = await fetch('/api/elevenlabs/voices');
      if (voicesRes.ok) {
        const data = await voicesRes.json();
        setVoices(data.voices || []);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCalendar = async () => {
    if (!calendarForm.niche) {
      toast.error('Vul een niche in');
      return;
    }
    
    setGenerating({ ...generating, calendar: true });
    try {
      const response = await fetch('/api/video-workflow/content-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calendarForm),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fout bij genereren');
      }
    } catch (error) {
      console.error('Error generating calendar:', error);
      toast.error('Fout bij genereren content kalender');
    } finally {
      setGenerating({ ...generating, calendar: false });
    }
  };

  const handleGenerateScript = async (idea: VideoIdea) => {
    setSelectedIdea(idea);
    setScriptForm({
      ideaId: idea.id,
      title: idea.title,
      description: idea.description || '',
      hook: idea.hook || '',
      duration: idea.duration,
      tone: 'engaging',
      language: 'Dutch',
    });
    
    setGenerating({ ...generating, script: true });
    try {
      const response = await fetch('/api/video-workflow/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: idea.id,
          title: idea.title,
          description: idea.description,
          hook: idea.hook,
          duration: idea.duration,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Script gegenereerd!');
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fout bij genereren script');
      }
    } catch (error) {
      console.error('Error generating script:', error);
      toast.error('Fout bij genereren script');
    } finally {
      setGenerating({ ...generating, script: false });
    }
  };

  const handleGenerateVoiceover = async (idea: VideoIdea) => {
    if (!idea.script) {
      toast.error('Genereer eerst een script');
      return;
    }
    
    setGenerating({ ...generating, voiceover: true });
    try {
      const response = await fetch('/api/video-workflow/generate-voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: idea.id,
          script: idea.script,
          voiceId: voiceoverForm.voiceId,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Voiceover gegenereerd!');
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fout bij genereren voiceover');
      }
    } catch (error) {
      console.error('Error generating voiceover:', error);
      toast.error('Fout bij genereren voiceover');
    } finally {
      setGenerating({ ...generating, voiceover: false });
    }
  };

  const handleGenerateVideo = async (idea: VideoIdea) => {
    setGenerating({ ...generating, video: true });
    try {
      const response = await fetch('/api/video-workflow/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: idea.id,
          prompt: idea.description || idea.title,
          title: idea.title,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Video generatie gestart!');
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fout bij genereren video');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error('Fout bij genereren video');
    } finally {
      setGenerating({ ...generating, video: false });
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!confirm('Weet je zeker dat je dit video idee wilt verwijderen?')) {
      return;
    }
    
    try {
      // Assuming you have a delete endpoint
      const response = await fetch(`/api/video-workflow/content-calendar/${ideaId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Video idee verwijderd');
        loadData();
      } else {
        toast.error('Fout bij verwijderen');
      }
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast.error('Fout bij verwijderen');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Calendar className="h-4 w-4 text-gray-400" />;
      case 'SCRIPT_READY':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'VOICEOVER_READY':
        return <Mic className="h-4 w-4 text-purple-500" />;
      case 'VIDEO_GENERATING':
      case 'VIDEO_READY':
        return <Video className="h-4 w-4 text-orange-500" />;
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Wachtend';
      case 'SCRIPT_READY':
        return 'Script klaar';
      case 'VOICEOVER_READY':
        return 'Voiceover klaar';
      case 'VIDEO_GENERATING':
        return 'Video genereren...';
      case 'VIDEO_READY':
        return 'Video klaar';
      case 'MERGING':
        return 'Samenvoegen...';
      case 'COMPLETED':
        return 'Voltooid';
      case 'FAILED':
        return 'Mislukt';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Video workflow laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Film className="h-8 w-8 text-orange-600" />
          Video Production Workflow
        </h1>
        <p className="text-muted-foreground">
          Complete video productie proces: Content kalender → Script → Voiceover → Video → Merge
        </p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Content Kalender
          </TabsTrigger>
          <TabsTrigger value="ideas">
            <Film className="h-4 w-4 mr-2" />
            Video Ideeën ({ideas.length})
          </TabsTrigger>
        </TabsList>

        {/* Content Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Genereer Content Kalender</CardTitle>
              <CardDescription>
                AI genereert automatisch video ideeën op basis van jouw niche
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="niche">Niche / Onderwerp *</Label>
                <Input
                  id="niche"
                  placeholder="Bijv. Yoga, Fitness, Travel, Business"
                  value={calendarForm.niche}
                  onChange={(e) => setCalendarForm({ ...calendarForm, niche: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="targetAudience">Doelgroep</Label>
                <Input
                  id="targetAudience"
                  placeholder="Bijv. Beginners, 25-35 jaar, Professionals"
                  value={calendarForm.targetAudience}
                  onChange={(e) => setCalendarForm({ ...calendarForm, targetAudience: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="videosPerWeek">Video's per Week</Label>
                  <Select
                    value={calendarForm.videosPerWeek.toString()}
                    onValueChange={(value) => setCalendarForm({ ...calendarForm, videosPerWeek: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 video</SelectItem>
                      <SelectItem value="3">3 video's</SelectItem>
                      <SelectItem value="5">5 video's</SelectItem>
                      <SelectItem value="7">7 video's (dagelijks)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Video Lengte (seconden)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={calendarForm.duration}
                    onChange={(e) => setCalendarForm({ ...calendarForm, duration: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>

              <Button 
                onClick={handleGenerateCalendar} 
                disabled={generating.calendar}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generating.calendar ? 'Genereren...' : 'Genereer 20 Video Ideeën'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Ideas Tab */}
        <TabsContent value="ideas" className="space-y-6">
          {ideas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Nog geen video ideeën gegenereerd
                </p>
                <Button onClick={() => document.querySelector('[value="calendar"]')?.dispatchEvent(new Event('click'))}>
                  Maak Content Kalender
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {ideas.map((idea) => (
                <Card key={idea.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(idea.status)}
                          <h3 className="font-semibold text-lg">{idea.title}</h3>
                          <Badge variant="outline">
                            {getStatusText(idea.status)}
                          </Badge>
                        </div>
                        
                        {idea.description && (
                          <p className="text-sm text-muted-foreground mb-2">{idea.description}</p>
                        )}
                        
                        {idea.hook && (
                          <p className="text-sm italic text-muted-foreground mb-2">
                            Hook: "{idea.hook}"
                          </p>
                        )}
                        
                        {idea.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {idea.keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteIdea(idea.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    {/* Progress Steps */}
                    <div className="space-y-3 mt-4">
                      {/* Step 1: Script */}
                      <div className="flex items-center gap-3">
                        <FileText className={`h-5 w-5 ${idea.script ? 'text-green-500' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">1. Script</p>
                          {idea.script ? (
                            <p className="text-xs text-muted-foreground">
                              {idea.script.substring(0, 100)}...
                            </p>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateScript(idea)}
                              disabled={generating.script}
                            >
                              {generating.script ? 'Genereren...' : 'Genereer Script'}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Step 2: Voiceover */}
                      <div className="flex items-center gap-3">
                        <Mic className={`h-5 w-5 ${idea.voiceoverUrl ? 'text-green-500' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">2. Voiceover</p>
                          {idea.voiceoverUrl ? (
                            <audio controls className="w-full max-w-md mt-1">
                              <source src={idea.voiceoverUrl} type="audio/mpeg" />
                            </audio>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateVoiceover(idea)}
                              disabled={!idea.script || generating.voiceover}
                            >
                              {generating.voiceover ? 'Genereren...' : 'Genereer Voiceover'}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Step 3: Video */}
                      <div className="flex items-center gap-3">
                        <Video className={`h-5 w-5 ${idea.vadooVideoUrl ? 'text-green-500' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">3. Video (zonder audio)</p>
                          {idea.vadooVideoUrl ? (
                            <a href={idea.vadooVideoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                              Video bekijken
                            </a>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateVideo(idea)}
                              disabled={generating.video}
                            >
                              {generating.video ? 'Genereren...' : 'Genereer Video'}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Step 4: Final Video */}
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={`h-5 w-5 ${idea.finalVideoUrl ? 'text-green-500' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">4. Finale Video</p>
                          {idea.finalVideoUrl ? (
                            <div className="flex gap-2 mt-1">
                              <a href={idea.finalVideoUrl} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline">
                                  <Play className="h-4 w-4 mr-1" />
                                  Afspelen
                                </Button>
                              </a>
                              <a href={idea.finalVideoUrl} download>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </a>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Voiceover en video worden automatisch samengevoegd
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
