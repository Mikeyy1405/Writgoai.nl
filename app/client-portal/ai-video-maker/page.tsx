
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Video, Sparkles, Download, Play, CheckCircle2, Clock, ImageIcon, Music, Mic, FileText, TrendingUp, Library } from 'lucide-react';
import { toast } from 'sonner';
import ProjectSelector from '@/components/project-selector';

interface VideoPackage {
  id: string;
  script: {
    title: string;
    text: string;
    language: string;
    duration: number;
  };
  media: {
    aiVideos: Array<{ url: string; duration: number; prompt: string }>;
    stockVideos: Array<{ url: string; duration: number; title: string }>;
  };
  audio: {
    voiceover?: { url: string; duration: number };
    music?: { url: string; title: string; duration: number };
  };
  seo: {
    youtube: {
      title: string;
      description: string;
      tags: string[];
      timestamps: Array<{ time: string; label: string }>;
    };
    tiktok: {
      caption: string;
      hashtags: string[];
      bestPostTime: string;
    };
    instagram: {
      caption: string;
      hashtags: string[];
    };
  };
  downloadUrl?: string;
  totalDuration: number;
}

type GenerationStep = 'idle' | 'script' | 'images' | 'motion' | 'stock' | 'voiceover' | 'music' | 'seo' | 'compose' | 'save' | 'complete';

export default function AIVideoMakerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [videoIdea, setVideoIdea] = useState('');
  const [targetPlatform, setTargetPlatform] = useState<'youtube' | 'tiktok' | 'instagram'>('youtube');
  const [videoDuration, setVideoDuration] = useState<'30' | '60' | '90'>('60');
  const [language, setLanguage] = useState<'nl' | 'en'>('nl');
  const [selectedProject, setSelectedProject] = useState<string>('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<GenerationStep>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // Package state
  const [videoPackage, setVideoPackage] = useState<VideoPackage | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/client-login');
    return null;
  }

  const handleGenerate = async () => {
    if (!videoIdea.trim()) {
      toast.error('Voer een video idee in');
      return;
    }

    setIsGenerating(true);
    setCurrentStep('script');
    setProgress(0);
    setVideoPackage(null);

    try {
      // Call the workflow orchestrator API
      const response = await fetch('/api/client/ai-video-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: videoIdea,
          platform: targetPlatform,
          duration: parseInt(videoDuration),
          language,
          projectId: selectedProject || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generatie mislukt');
      }

      // Stream progress updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.step) setCurrentStep(data.step);
                if (data.progress) setProgress(data.progress);
                if (data.message) setStatusMessage(data.message);

                if (data.complete && data.package) {
                  setVideoPackage(data.package);
                  setCurrentStep('complete');
                  setProgress(100);
                  toast.success('Video package compleet! 🎉');
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Er ging iets mis tijdens het genereren');
      setCurrentStep('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMP4 = () => {
    if (!videoPackage?.downloadUrl) return;

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = videoPackage.downloadUrl;
    link.download = `${videoPackage.script.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Download gestart! 🎉');
  };

  const getStepIcon = (step: GenerationStep) => {
    const icons = {
      idle: Video,
      script: FileText,
      images: ImageIcon,
      motion: Sparkles,
      stock: Video,
      voiceover: Mic,
      music: Music,
      seo: TrendingUp,
      compose: Video,
      save: Download,
      complete: CheckCircle2,
    };
    return icons[step] || Video;
  };

  const StepIcon = getStepIcon(currentStep);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
          AI Video Maker Pro
        </h1>
        <p className="text-gray-400">
          Genereer complete MP4 video's met Runway ML motion, voiceover, muziek en SEO content - direct downloadbaar!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-500" />
              Video Configuratie
            </CardTitle>
            <CardDescription>Wat voor video wil je maken?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="idea">Video Idee *</Label>
              <Textarea
                id="idea"
                placeholder="Bijv: Maak een video over gezonde smoothie recepten voor de zomer"
                value={videoIdea}
                onChange={(e) => setVideoIdea(e.target.value)}
                rows={4}
                className="mt-2"
                disabled={isGenerating}
              />
            </div>

            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={targetPlatform} onValueChange={(v: any) => setTargetPlatform(v)} disabled={isGenerating}>
                <SelectTrigger id="platform" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube Shorts</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram Reels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Video Lengte</Label>
              <Select value={videoDuration} onValueChange={(v: any) => setVideoDuration(v)} disabled={isGenerating}>
                <SelectTrigger id="duration" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconden</SelectItem>
                  <SelectItem value="60">60 seconden (aanbevolen)</SelectItem>
                  <SelectItem value="90">90 seconden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Taal</Label>
              <Select value={language} onValueChange={(v: any) => setLanguage(v)} disabled={isGenerating}>
                <SelectTrigger id="language" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Nederlands</SelectItem>
                  <SelectItem value="en">Engels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Project (optioneel)</Label>
              <ProjectSelector
                value={selectedProject}
                onChange={(projectId) => setSelectedProject(projectId || '')}
                className="mt-2"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !videoIdea.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Genereren...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Genereer Video Package
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Section */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StepIcon className="h-5 w-5 text-purple-500" />
              {currentStep === 'idle' ? 'Klaar om te beginnen' : 'Generatie Voortgang'}
            </CardTitle>
            <CardDescription>
              {currentStep === 'idle' ? 'Vul je video idee in en klik op genereren' : statusMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Voortgang</span>
                <span className="text-blue-400 font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3 pt-4">
              {[
                { id: 'script', label: 'Script schrijven', icon: FileText },
                { id: 'images', label: 'AI beelden genereren', icon: ImageIcon },
                { id: 'motion', label: 'Motion toevoegen (Runway ML)', icon: Sparkles },
                { id: 'stock', label: 'Stock video\'s zoeken', icon: Video },
                { id: 'voiceover', label: 'Voiceover genereren', icon: Mic },
                { id: 'music', label: 'Muziek selecteren', icon: Music },
                { id: 'seo', label: 'SEO content schrijven', icon: TrendingUp },
                { id: 'compose', label: 'Complete video samenstellen', icon: Video },
                { id: 'save', label: 'Opslaan in Content Library', icon: Download },
              ].map((step, index) => {
                const StepItemIcon = step.icon;
                const isActive = currentStep === step.id;
                const isComplete = progress > (index * 11.1); // 9 steps = ~11.1% per step

                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isComplete
                          ? 'bg-green-500/20 text-green-500'
                          : isActive
                          ? 'bg-blue-500/20 text-blue-500 animate-pulse'
                          : 'bg-gray-800 text-gray-600'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <StepItemIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        isComplete ? 'text-green-400' : isActive ? 'text-blue-400 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {videoPackage && (
        <Card className="mt-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Video Package Compleet!
            </CardTitle>
            <CardDescription>Alle assets zijn gegenereerd en klaar voor gebruik</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-gray-400">Video Clips</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {(videoPackage.media.aiVideos?.length || 0) + (videoPackage.media.stockVideos?.length || 0)}
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-gray-400">Totale Duur</span>
                </div>
                <p className="text-2xl font-bold text-white">{videoPackage.totalDuration}s</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-400">SEO Pakket</span>
                </div>
                <p className="text-2xl font-bold text-white">Compleet</p>
              </div>
            </div>

            {/* Script Preview */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Script: {videoPackage.script.title}
              </h4>
              <p className="text-sm text-gray-400 line-clamp-3">{videoPackage.script.text}</p>
            </div>

            {/* SEO Preview */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                SEO Content
              </h4>
              <div className="space-y-2">
                {targetPlatform === 'youtube' && videoPackage.seo.youtube && (
                  <>
                    <div>
                      <span className="text-xs text-gray-500">YouTube Titel:</span>
                      <p className="text-sm text-gray-300">{videoPackage.seo.youtube.title}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Tags:</span>
                      <p className="text-sm text-gray-400">{videoPackage.seo.youtube.tags.join(', ')}</p>
                    </div>
                  </>
                )}
                {targetPlatform === 'tiktok' && videoPackage.seo.tiktok && (
                  <>
                    <div>
                      <span className="text-xs text-gray-500">TikTok Caption:</span>
                      <p className="text-sm text-gray-300">{videoPackage.seo.tiktok.caption}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Hashtags:</span>
                      <p className="text-sm text-gray-400">{videoPackage.seo.tiktok.hashtags.join(' ')}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => router.push('/client-portal/content-library')}
                size="lg"
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Library className="mr-2 h-5 w-5" />
                Bekijk in Content Library
              </Button>

              {videoPackage.downloadUrl && (
                <Button
                  onClick={handleDownloadMP4}
                  size="lg"
                  variant="outline"
                  className="border-green-500/50 hover:bg-green-500/10"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Hoofdclip
                </Button>
              )}

              <Button onClick={() => setShowPreview(!showPreview)} size="lg" variant="outline">
                <Play className="mr-2 h-5 w-5" />
                {showPreview ? 'Verberg' : 'Toon'} Details
              </Button>
            </div>

            {/* Save Info */}
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-400">Video Opgeslagen in Content Library!</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Je video is succesvol opgeslagen met alle Runway ML clips, voiceover, muziek en SEO content. Bekijk het in de Content Library!
                  </p>
                </div>
              </div>
            </div>

            {/* Video Preview */}
            {videoPackage.downloadUrl && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Video Preview (Hoofdclip)
                </h4>
                <video
                  src={videoPackage.downloadUrl}
                  controls
                  className="w-full rounded-lg"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            )}

            {/* Detailed Preview */}
            {showPreview && (
              <div className="space-y-4 pt-4 border-t border-gray-800">
                <h4 className="font-semibold text-lg">Package Inhoud:</h4>

                {/* Video Clips */}
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Video Clips ({(videoPackage.media.aiVideos?.length || 0) + (videoPackage.media.stockVideos?.length || 0)}x)</h5>
                  <ul className="space-y-1 text-sm text-gray-500">
                    {videoPackage.media.aiVideos?.map((v, i) => (
                      <li key={i}>✓ AI Motion Clip {i + 1} ({v.duration}s) - {v.prompt}</li>
                    ))}
                    {videoPackage.media.stockVideos?.map((v, i) => (
                      <li key={i}>✓ Stock Video {i + 1} ({v.duration}s) - {v.title}</li>
                    ))}
                  </ul>
                </div>

                {/* Audio */}
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Audio Bestanden</h5>
                  <ul className="space-y-1 text-sm text-gray-500">
                    {videoPackage.audio.voiceover && <li>✓ Voiceover ({videoPackage.audio.voiceover.duration}s)</li>}
                    {videoPackage.audio.music && <li>✓ Muziek: {videoPackage.audio.music.title}</li>}
                  </ul>
                </div>

                {/* SEO Files */}
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">SEO Content Bestanden</h5>
                  <ul className="space-y-1 text-sm text-gray-500">
                    <li>✓ YouTube SEO (titel, beschrijving, 20 tags, timestamps)</li>
                    <li>✓ TikTok SEO (caption, 15 hashtags, beste post tijd)</li>
                    <li>✓ Instagram SEO (caption, hashtags)</li>
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Extra Bestanden</h5>
                  <ul className="space-y-1 text-sm text-gray-500">
                    <li>✓ Script.txt (met timings)</li>
                    <li>✓ Timeline.json (edit instructies)</li>
                    <li>✓ CapCut-Guide.pdf (montage instructies)</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      {!isGenerating && !videoPackage && (
        <Card className="mt-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Hoe werkt het?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-300">
            <p>1. ⚡ Vul je video idee in en kies platform en instellingen</p>
            <p>2. 🎬 AI genereert automatisch script, beelden, voiceover en muziek</p>
            <p>3. 🎨 Runway ML maakt complete video's met motion en animaties</p>
            <p>4. 🎵 Audio mixing: voiceover + achtergrondmuziek worden perfect gemixed</p>
            <p>5. 🎞️ FFmpeg stelt alles samen tot één complete, uploadklare MP4 video</p>
            <p>6. 📝 Complete SEO content wordt geschreven voor YouTube/TikTok/Instagram</p>
            <p>7. 💾 Video wordt automatisch opgeslagen in Content Library</p>
            <p>8. 📥 Download de complete video - klaar om te uploaden!</p>
            <p className="pt-2 text-green-400 font-medium">
              ⏱️ Totale tijd: ~7-10 minuten van idee tot complete, uploadklare video!
            </p>
            <p className="text-purple-400 text-xs">
              💡 Inclusief Runway ML video generatie, ElevenLabs voiceover, royalty-free muziek, audio mixing en SEO content
            </p>
            <p className="text-yellow-400 text-xs">
              ⚠️ Als FFmpeg niet beschikbaar is, wordt de hoofdclip met metadata geleverd
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
