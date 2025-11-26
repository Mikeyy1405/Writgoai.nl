
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Video, 
  Loader2, 
  Sparkles,
  Settings2,
  Mic,
  Image as ImageIcon,
  Music,
  Smartphone,
  Monitor,
  Square,
  Play,
  Download,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

// WritgoAI Brand Colors
const BRAND_COLORS = {
  black: '#000000',
  orange: '#ff6b35',
  white: '#FFFFFF',
  cardBg: '#0a0a0a',
  cardBorder: '#1a1a1a',
};

export default function VideoStudio() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Form state
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState('9:16');
  const [style, setStyle] = useState('realistic');
  const [voiceId, setVoiceId] = useState('CwhRBWXzGAHq8TQ4Fs17');
  const [imageCount, setImageCount] = useState('5');
  const [includeMusic, setIncludeMusic] = useState(true);
  const [language, setLanguage] = useState('nl');
  
  // Generated video
  const [videoData, setVideoData] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    if (!session) {
      router.push('/client-login');
    }
  }, [session, router]);

  // Generate video
  const generateVideo = async () => {
    if (!topic.trim()) {
      toast.error('Voer een onderwerp in');
      return;
    }

    setLoading(true);
    setProgress(20);

    try {
      const response = await fetch('/api/client/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          format,
          style,
          voiceId,
          imageCount: parseInt(imageCount),
          includeMusic,
          language,
          clientId: (session?.user as any)?.id
        }),
      });

      setProgress(60);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fout bij het genereren van video');
      }

      const data = await response.json();
      
      setVideoData(data);
      setProgress(100);
      toast.success('Video succesvol gegenereerd!');
    } catch (error: any) {
      console.error('Error generating video:', error);
      toast.error(error.message || 'Fout bij het genereren van video');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Reset form
  const reset = () => {
    setTopic('');
    setVideoData(null);
  };

  // If video is generated, show result
  if (videoData) {
    return (
      <div className="min-h-screen bg-[#002040] p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Video succesvol gegenereerd!
              </CardTitle>
              <CardDescription className="text-gray-400">
                Je video is klaar om te downloaden en te gebruiken
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Video preview */}
              {videoData.url && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    src={videoData.url} 
                    controls 
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Formaat</Label>
                  <p className="font-medium">{format}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Stijl</Label>
                  <p className="font-medium capitalize">{style}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Afbeeldingen</Label>
                  <p className="font-medium">{imageCount}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Muziek</Label>
                  <p className="font-medium">{includeMusic ? 'Ja' : 'Nee'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {videoData.url && (
                  <>
                    <Button asChild className="flex-1">
                      <a href={videoData.url} download target="_blank">
                        <Download className="w-4 h-4 mr-2" />
                        Download video
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={videoData.url} target="_blank">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open
                      </a>
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={reset}>
                  Nieuwe video
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#002040] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Video className="w-6 h-6 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-white">Video Studio</h1>
          </div>
          <p className="text-gray-400">
            Genereer professionele AI-video's met voiceover
          </p>
        </div>

        {/* Progress bar */}
        {progress > 0 && (
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Video instellingen
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configureer je video en laat de AI het maken
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic">Onderwerp *</Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Waar gaat je video over?"
                rows={3}
              />
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label>Formaat</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={format === '9:16' ? 'default' : 'outline'}
                  onClick={() => setFormat('9:16')}
                  className={format === '9:16' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Verticaal<br />
                  <span className="text-xs">(9:16)</span>
                </Button>
                <Button
                  type="button"
                  variant={format === '16:9' ? 'default' : 'outline'}
                  onClick={() => setFormat('16:9')}
                  className={format === '16:9' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Horizontaal<br />
                  <span className="text-xs">(16:9)</span>
                </Button>
                <Button
                  type="button"
                  variant={format === '1:1' ? 'default' : 'outline'}
                  onClick={() => setFormat('1:1')}
                  className={format === '1:1' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Vierkant<br />
                  <span className="text-xs">(1:1)</span>
                </Button>
              </div>
            </div>

            {/* Style */}
            <div className="space-y-2">
              <Label htmlFor="style" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Visuele stijl
              </Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">📸 Realistisch</SelectItem>
                  <SelectItem value="cinematic">🎬 Cinematisch</SelectItem>
                  <SelectItem value="animated">🎨 Geanimeerd</SelectItem>
                  <SelectItem value="cartoon">🎭 Cartoon</SelectItem>
                  <SelectItem value="fantasy">✨ Fantasy</SelectItem>
                  <SelectItem value="digital-art">🖼️ Digital Art</SelectItem>
                  <SelectItem value="3d">🎲 3D Render</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row: Voice + Image count */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voice" className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Voiceover
                </Label>
                <Select value={voiceId} onValueChange={setVoiceId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CwhRBWXzGAHq8TQ4Fs17">🇳🇱 Nederlands (Man)</SelectItem>
                    <SelectItem value="EXAVITQu4vr4xnSDxMaL">🇬🇧 Engels (Vrouw)</SelectItem>
                    <SelectItem value="2EiwWnXFnvU5JabPnv8n">🇺🇸 Engels (Man)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageCount" className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Aantal afbeeldingen
                </Label>
                <Select value={imageCount} onValueChange={setImageCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 afbeeldingen</SelectItem>
                    <SelectItem value="5">5 afbeeldingen (aanbevolen)</SelectItem>
                    <SelectItem value="7">7 afbeeldingen</SelectItem>
                    <SelectItem value="10">10 afbeeldingen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Taal</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Nederlands</SelectItem>
                  <SelectItem value="en">Engels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Music switch */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Achtergrondmuziek
                </Label>
                <p className="text-sm text-gray-400">
                  Voeg sfeervolle achtergrondmuziek toe
                </p>
              </div>
              <Switch
                checked={includeMusic}
                onCheckedChange={setIncludeMusic}
              />
            </div>

            {/* Generate button */}
            <Button 
              onClick={generateVideo} 
              disabled={loading || !topic.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Video genereren...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Genereer video
                </>
              )}
            </Button>

            {/* Info */}
            <div className="bg-zinc-900 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                <strong>💡 Tip:</strong> Video generatie duurt ongeveer 2-3 minuten. De AI maakt automatisch een script, genereert visuals en voegt voiceover toe.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
