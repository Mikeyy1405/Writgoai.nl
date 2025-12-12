
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2, Video, Music, Sparkles, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Voice {
  voice_id: string;
  name: string;
  labels?: {
    accent?: string;
    age?: string;
    gender?: string;
  };
}

export default function VideoGeneratorPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  
  // Form state
  const [script, setScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [imageStyle, setImageStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [captionTheme, setCaptionTheme] = useState('Hormozi_1');
  const [backgroundMusic, setBackgroundMusic] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  
  // AI Script Generation
  const [aiTopic, setAiTopic] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/elevenlabs/voices');
      if (response.ok) {
        const data = await response.json();
        setVoices(data.voices || []);
        if (data.voices?.length > 0) {
          setSelectedVoice(data.voices[0].voice_id);
        }
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      toast.error('Kon stemmen niet laden');
    } finally {
      setLoadingVoices(false);
    }
  };

  const generateScript = async () => {
    if (!aiTopic.trim()) {
      toast.error('Voer een onderwerp in voor het script');
      return;
    }

    setGeneratingScript(true);
    try {
      const response = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic }),
      });

      if (!response.ok) throw new Error('Failed to generate script');

      const data = await response.json();
      setScript(data.script);
      setVideoTitle(aiTopic);
      toast.success('Script gegenereerd! 🎬');
    } catch (error) {
      console.error('Error generating script:', error);
      toast.error('Fout bij het genereren van script');
    } finally {
      setGeneratingScript(false);
    }
  };

  const handleGenerate = async () => {
    if (!script.trim()) {
      toast.error('Voer een script in');
      return;
    }

    if (!selectedVoice) {
      toast.error('Selecteer een stem');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/videos/audio-to-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          voiceId: selectedVoice,
          videoTitle: videoTitle || 'AI Generated Video',
          imageStyle,
          aspectRatio,
          captionTheme,
          backgroundMusic: backgroundMusic || undefined,
          customInstructions: customInstructions || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate video');
      }

      const data = await response.json();
      toast.success('Video generatie gestart! Je ontvangt de video over 2-3 minuten. 🎉');
      
      // Reset form
      setScript('');
      setVideoTitle('');
      setAiTopic('');
      setCustomInstructions('');
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error(error instanceof Error ? error.message : 'Fout bij het genereren van video');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loadingVoices) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Video className="h-8 w-8 text-orange-600" />
          <h1 className="text-4xl font-bold text-green-600">
            AI Video Generator
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Genereer professionele video&apos;s met AI-gegenereerde voice-over en visuals
        </p>
        <Badge variant="secondary" className="text-sm">
          <Sparkles className="h-3 w-3 mr-1" />
          Powered by ElevenLabs + Vadoo AI
        </Badge>
      </div>

      <Tabs defaultValue="script" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="script">
            <Wand2 className="h-4 w-4 mr-2" />
            Script
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Music className="h-4 w-4 mr-2" />
            Video Instellingen
          </TabsTrigger>
        </TabsList>

        {/* Script Tab */}
        <TabsContent value="script" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-orange-600" />
                Script Generator
              </CardTitle>
              <CardDescription>
                Laat AI een script voor je genereren of voer je eigen script in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Script Generator */}
              <div className="space-y-3 p-4 bg-green-50 rounded-lg border">
                <Label htmlFor="ai-topic" className="text-sm font-semibold">
                  ✨ AI Script Generator
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="ai-topic"
                    placeholder="Bijv: 'De beste tips voor productiviteit in 2024'"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !generatingScript) {
                        generateScript();
                      }
                    }}
                    disabled={generatingScript}
                  />
                  <Button
                    onClick={generateScript}
                    disabled={generatingScript || !aiTopic.trim()}
                    className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                  >
                    {generatingScript ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Genereren...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Genereer Script
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Video Title */}
              <div className="space-y-2">
                <Label htmlFor="video-title">Video Titel</Label>
                <Input
                  id="video-title"
                  placeholder="Geef je video een titel"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
              </div>

              {/* Script Input */}
              <div className="space-y-2">
                <Label htmlFor="script">Video Script</Label>
                <Textarea
                  id="script"
                  placeholder="Voer hier je video script in... Dit wordt omgezet naar spraak met ElevenLabs en vervolgens naar een video met Vadoo AI."
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {script.length} karakters • Aanbevolen: 300-1000 karakters voor 30-60 seconden video
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-orange-600" />
                Audio Instellingen
              </CardTitle>
              <CardDescription>
                Kies de stem en audio-opties voor je video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voice">ElevenLabs Stem</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger id="voice">
                    <SelectValue placeholder="Selecteer een stem" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.voice_id} value={voice.voice_id}>
                        {voice.name}
                        {voice.labels && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({voice.labels.gender}, {voice.labels.accent})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Hoogwaardige AI-stemmen van ElevenLabs
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bg-music">Achtergrondmuziek (optioneel)</Label>
                <Input
                  id="bg-music"
                  placeholder="Bijv: upbeat, calm, epic"
                  value={backgroundMusic}
                  onChange={(e) => setBackgroundMusic(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-orange-600" />
                Video Instellingen
              </CardTitle>
              <CardDescription>
                Pas de visuele stijl van je video aan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image-style">Visuele Stijl</Label>
                  <Select value={imageStyle} onValueChange={setImageStyle}>
                    <SelectTrigger id="image-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cinematic">🎬 Cinematisch</SelectItem>
                      <SelectItem value="photographic">📸 Fotografisch</SelectItem>
                      <SelectItem value="digital art">🎨 Digitale Kunst</SelectItem>
                      <SelectItem value="fantasy art">✨ Fantasy</SelectItem>
                      <SelectItem value="3d model">🎭 3D Model</SelectItem>
                      <SelectItem value="neon punk">🌃 Neon Punk</SelectItem>
                      <SelectItem value="analog film">📹 Analog Film</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger id="aspect-ratio">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9:16">📱 Vertical (9:16) - TikTok, Reels</SelectItem>
                      <SelectItem value="16:9">🖥️ Horizontal (16:9) - YouTube</SelectItem>
                      <SelectItem value="1:1">⬜ Square (1:1) - Instagram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caption-theme">Ondertiteling Thema</Label>
                  <Select value={captionTheme} onValueChange={setCaptionTheme}>
                    <SelectTrigger id="caption-theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hormozi_1">Hormozi Style</SelectItem>
                      <SelectItem value="Mr_Beast">Mr Beast Style</SelectItem>
                      <SelectItem value="None">Geen Ondertiteling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-instructions">Custom AI Instructies (optioneel)</Label>
                <Textarea
                  id="custom-instructions"
                  placeholder="Bijv: 'Gebruik heldere kleuren, moderne uitstraling, focus op technologie'"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Geef extra instructies aan de AI voor karakter beschrijvingen, thema, of sfeer
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Button */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Klaar om te genereren?</h3>
              <p className="text-sm text-muted-foreground">
                Je video wordt binnen 2-3 minuten gegenereerd en naar je gestuurd
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                ElevenLabs AI Voice
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Vadoo AI Visuals
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading || !script.trim() || !selectedVoice}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 min-w-[200px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Genereren...
                </>
              ) : (
                <>
                  <Video className="h-5 w-5 mr-2" />
                  Genereer Video
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Wand2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">AI Script Generator</h4>
                <p className="text-sm text-muted-foreground">
                  Laat AI automatisch een professioneel script schrijven
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Music className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Hoogwaardige Stemmen</h4>
                <p className="text-sm text-muted-foreground">
                  Kies uit meerdere realistische AI-stemmen
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Video className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Professionele Visuals</h4>
                <p className="text-sm text-muted-foreground">
                  AI genereert automatisch passende video beelden
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
