'use client';

// This page has been replaced by /client-portal/video/
// Redirecting to the new unified video generation page
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VideoGeneratorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/client-portal/video');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-white text-lg">Redirecting to new video page...</p>
      </div>
    </div>
  );
}

// OLD CODE BELOW - KEPT FOR REFERENCE
/*
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { 
  Loader2, Video, Sparkles, ArrowLeft, FileText, Film, Music, 
  Check, Search, ChevronRight, Upload, Play, Download, Wand2,
  Mic, Volume2, Plus, X, Edit, Settings, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import ProjectSelector, { Project } from '@/components/project-selector';

// Interfaces
interface VideoScript {
  title: string;
  totalDuration: number;
  segments: Array<{
    timestamp: number;
    text: string;
    duration: number;
  }>;
  fullText: string;
}

interface StockVideo {
  id: string | number;
  source: 'pixabay' | 'pexels' | 'upload';
  previewURL: string;
  videoURL: string;
  duration: number;
  tags: string[];
  user: string;
  name?: string;
}

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  genre: string;
  mood: string;
  url: string;
  source: 'library' | 'upload';
}

interface VoiceoverSegment {
  id: string;
  text: string;
  audioUrl: string;
  startTime: number;
  duration: number;
}

interface VideoEffect {
  type: 'transition' | 'filter' | 'text' | 'overlay';
  name: string;
  settings: any;
  startTime: number;
  duration: number;
}

type Step = 'script' | 'media' | 'voiceover' | 'effects' | 'timeline' | 'export';

export default function VideoStudioPage() {
  // Basic settings
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('Dutch');
  const [style, setStyle] = useState('Cinematic');
  const [duration, setDuration] = useState('30-60');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Active step
  const [activeStep, setActiveStep] = useState<Step>('script');
  
  // Script state
  const [scriptMode, setScriptMode] = useState<'ai' | 'manual'>('ai');
  const [generatedScript, setGeneratedScript] = useState<VideoScript | null>(null);
  const [scriptText, setScriptText] = useState('');
  const [generatingScript, setGeneratingScript] = useState(false);
  
  // Media state
  const [selectedVideos, setSelectedVideos] = useState<StockVideo[]>([]);
  const [brollSearchQuery, setBrollSearchQuery] = useState('');
  const [searchingBroll, setSearchingBroll] = useState(false);
  const [brollVideos, setBrollVideos] = useState<StockVideo[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  // Music state
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [loadingMusic, setLoadingMusic] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  
  // Voiceover state
  const [voiceoverMode, setVoiceoverMode] = useState<'ai' | 'upload'>('ai');
  const [voiceoverSegments, setVoiceoverSegments] = useState<VoiceoverSegment[]>([]);
  const [generatingVoiceover, setGeneratingVoiceover] = useState(false);
  const [uploadingVoiceover, setUploadingVoiceover] = useState(false);
  
  // Effects state
  const [effects, setEffects] = useState<VideoEffect[]>([]);
  const [selectedTransition, setSelectedTransition] = useState('fade');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [textOverlay, setTextOverlay] = useState('');
  
  // Timeline state
  const [timelinePosition, setTimelinePosition] = useState(0);
  
  // Calculate total duration from selected videos
  const totalDuration = selectedVideos.reduce((acc, video) => acc + (video.duration || 0), 0);

  const handleProjectChange = (newProjectId: string | null, project: Project | null) => {
    setProjectId(newProjectId);
    setSelectedProject(project);
  };

  // Script Generation
  const generateScript = async () => {
    if (!topic.trim()) {
      toast.error('Voer een onderwerp in');
      return;
    }

    setGeneratingScript(true);
    try {
      const response = await fetch('/api/client/video-studio/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, duration, language, style }),
      });

      if (!response.ok) throw new Error('Script generatie mislukt');

      const data = await response.json();
      setGeneratedScript(data.script);
      setScriptText(data.script.fullText);
      
      toast.success('Script gegenereerd!');
    } catch (error) {
      console.error('Script generation error:', error);
      toast.error('Script generatie mislukt');
    } finally {
      setGeneratingScript(false);
    }
  };

  // Video Upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Selecteer een video bestand');
      return;
    }

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload mislukt');

      const data = await response.json();
      
      const uploadedVideo: StockVideo = {
        id: Date.now().toString(),
        source: 'upload',
        previewURL: data.url,
        videoURL: data.url,
        duration: 0, // Will be calculated client-side
        tags: [],
        user: 'Uploaded',
        name: file.name,
      };

      setSelectedVideos([...selectedVideos, uploadedVideo]);
      toast.success('Video geüpload!');
    } catch (error) {
      console.error('Video upload error:', error);
      toast.error('Video upload mislukt');
    } finally {
      setUploadingVideo(false);
    }
  };

  // B-roll Search
  const searchBrollVideos = async () => {
    if (!brollSearchQuery.trim()) {
      toast.error('Voer een zoekopdracht in');
      return;
    }

    setSearchingBroll(true);
    try {
      const response = await fetch('/api/client/video-studio/search-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: brollSearchQuery, perPage: 20 }),
      });

      if (!response.ok) throw new Error('Video zoeken mislukt');

      const data = await response.json();
      setBrollVideos(data.videos || []);
      toast.success(`${data.videos.length} video's gevonden!`);
    } catch (error) {
      console.error('Video search error:', error);
      toast.error('Video zoeken mislukt');
    } finally {
      setSearchingBroll(false);
    }
  };

  const toggleVideoSelection = (video: StockVideo) => {
    const isSelected = selectedVideos.some(v => v.id === video.id);
    if (isSelected) {
      setSelectedVideos(selectedVideos.filter(v => v.id !== video.id));
    } else {
      setSelectedVideos([...selectedVideos, video]);
    }
  };

  // Music Upload
  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Selecteer een audio bestand');
      return;
    }

    setUploadingMusic(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload mislukt');

      const data = await response.json();
      
      const uploadedMusic: MusicTrack = {
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Uploaded',
        duration: 0,
        genre: 'Custom',
        mood: 'Custom',
        url: data.url,
        source: 'upload',
      };

      setSelectedMusic(uploadedMusic);
      toast.success('Muziek geüpload!');
    } catch (error) {
      console.error('Music upload error:', error);
      toast.error('Muziek upload mislukt');
    } finally {
      setUploadingMusic(false);
    }
  };

  // Load Music Library
  useEffect(() => {
    if (activeStep === 'media') {
      loadMusicLibrary();
    }
  }, [activeStep, style]);

  const loadMusicLibrary = async () => {
    setLoadingMusic(true);
    try {
      const response = await fetch(
        `/api/client/video-studio/music-library?videoStyle=${style}&videoDuration=${generatedScript?.totalDuration || 60}`
      );
      const data = await response.json();
      setMusicTracks(data.tracks || []);
    } catch (error) {
      console.error('Music loading error:', error);
    } finally {
      setLoadingMusic(false);
    }
  };

  // Voiceover Generation
  const generateVoiceover = async () => {
    if (!scriptText.trim()) {
      toast.error('Voer eerst een script in');
      return;
    }

    setGeneratingVoiceover(true);
    try {
      const response = await fetch('/api/client/video-studio/generate-voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText,
          language,
        }),
      });

      if (!response.ok) throw new Error('Voiceover generatie mislukt');

      const data = await response.json();
      
      const segment: VoiceoverSegment = {
        id: Date.now().toString(),
        text: scriptText,
        audioUrl: data.audioData,
        startTime: 0,
        duration: 0, // Will be calculated from audio
      };

      setVoiceoverSegments([segment]);
      toast.success('Voiceover gegenereerd!');
    } catch (error) {
      console.error('Voiceover generation error:', error);
      toast.error('Voiceover generatie mislukt');
    } finally {
      setGeneratingVoiceover(false);
    }
  };

  // Voiceover Upload
  const handleVoiceoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Selecteer een audio bestand');
      return;
    }

    setUploadingVoiceover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload mislukt');

      const data = await response.json();
      
      const segment: VoiceoverSegment = {
        id: Date.now().toString(),
        text: 'Uploaded voiceover',
        audioUrl: data.url,
        startTime: 0,
        duration: 0,
      };

      setVoiceoverSegments([...voiceoverSegments, segment]);
      toast.success('Voiceover geüpload!');
    } catch (error) {
      console.error('Voiceover upload error:', error);
      toast.error('Voiceover upload mislukt');
    } finally {
      setUploadingVoiceover(false);
    }
  };

  // Add Effect
  const addEffect = (type: VideoEffect['type'], name: string) => {
    const effect: VideoEffect = {
      type,
      name,
      settings: {},
      startTime: timelinePosition,
      duration: 2, // Default 2 seconds
    };
    setEffects([...effects, effect]);
    toast.success(`${name} effect toegevoegd!`);
  };

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!scriptText.trim()) {
      toast.error('Script is verplicht');
      return;
    }

    setSaving(true);
    try {
      // Bereken totale duur
      const calculatedDuration = selectedVideos.reduce((acc, video) => acc + (video.duration || 0), 0);

      const response = await fetch('/api/client/video-studio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic || 'Untitled Video',
          description: `${language} video in ${style} style`,
          scriptText,
          scriptLanguage: language,
          videoClips: selectedVideos,
          musicTrack: selectedMusic,
          voiceoverSegments,
          effects,
          totalDuration: calculatedDuration,
          projectId,
        }),
      });

      if (!response.ok) throw new Error('Opslaan mislukt');

      const data = await response.json();
      setSavedProjectId(data.videoProject.id);
      toast.success('Video project opgeslagen!');
      return data.videoProject.id;
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Opslaan mislukt');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Eerst opslaan als dat nog niet gedaan is
      let projectId = savedProjectId;
      if (!projectId) {
        toast.info('Video wordt eerst opgeslagen...');
        projectId = await handleSave();
        if (!projectId) return;
      }

      const response = await fetch('/api/client/video-studio/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoProjectId: projectId,
        }),
      });

      if (!response.ok) throw new Error('Export mislukt');

      const data = await response.json();
      
      // Download de export
      const link = document.createElement('a');
      link.href = data.exportUrl;
      link.download = `video-${(topic || 'untitled').toLowerCase().replace(/\s+/g, '-')}.json`;
      link.click();

      toast.success('Video configuratie geëxporteerd!', {
        description: 'JSON bestand met alle instellingen is gedownload.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export mislukt');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-4 md:p-8">
      <div className="container max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/client-portal">
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-[#ff6b35] to-[#ff8c42] rounded-xl shadow-lg">
              <Video className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Video Studio Pro</h1>
              <p className="text-gray-300 text-lg mt-1">Complete video editor met AI</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { key: 'script', label: 'Script', icon: FileText },
              { key: 'media', label: 'Media', icon: Film },
              { key: 'voiceover', label: 'Voiceover', icon: Mic },
              { key: 'effects', label: 'Effecten', icon: Wand2 },
              { key: 'timeline', label: 'Timeline', icon: Settings },
              { key: 'export', label: 'Export', icon: Download },
            ].map((step) => {
              const isCompleted = 
                (step.key === 'script' && scriptText) ||
                (step.key === 'media' && selectedVideos.length > 0) ||
                (step.key === 'voiceover' && voiceoverSegments.length > 0) ||
                (step.key === 'effects' && effects.length > 0);

              return (
                <button
                  key={step.key}
                  onClick={() => setActiveStep(step.key as Step)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeStep === step.key
                      ? 'bg-[#ff6b35] text-white'
                      : isCompleted
                      ? 'bg-green-600/20 text-green-400 border border-green-500'
                      : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{step.label}</span>
                  {isCompleted && activeStep !== step.key && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="grid gap-6">
          {/* Script Step */}
          {activeStep === 'script' && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5 text-[#ff6b35]" />
                  Script Maken
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Gebruik AI of schrijf je eigen script
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Script Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setScriptMode('ai')}
                    variant={scriptMode === 'ai' ? 'default' : 'outline'}
                    className={scriptMode === 'ai' ? 'bg-[#ff6b35]' : 'border-zinc-700 text-white'}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Genereren
                  </Button>
                  <Button
                    onClick={() => setScriptMode('manual')}
                    variant={scriptMode === 'manual' ? 'default' : 'outline'}
                    className={scriptMode === 'manual' ? 'bg-[#ff6b35]' : 'border-zinc-700 text-white'}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Handmatig Schrijven
                  </Button>
                </div>

                {scriptMode === 'ai' && (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="topic" className="text-white">Onderwerp *</Label>
                        <Input
                          id="topic"
                          placeholder="Bijv: Waarom AI de wereld verandert"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          className="border-zinc-700 bg-zinc-800 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Project (optioneel)</Label>
                        <ProjectSelector
                          value={projectId}
                          onChange={handleProjectChange}
                          autoSelectPrimary={false}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Taal</Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dutch">Nederlands</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Duur</Label>
                        <Select value={duration} onValueChange={setDuration}>
                          <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15-30">15-30 seconden</SelectItem>
                            <SelectItem value="30-60">30-60 seconden</SelectItem>
                            <SelectItem value="60-90">60-90 seconden</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={generateScript}
                      disabled={generatingScript || !topic.trim()}
                      className="w-full bg-[#ff6b35] hover:bg-[#ff8c42]"
                      size="lg"
                    >
                      {generatingScript ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Script wordt gegenereerd...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Genereer Script met AI
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-white">Script Tekst</Label>
                  <Textarea
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                    rows={12}
                    placeholder="Schrijf hier je script of genereer het met AI..."
                    className="border-zinc-700 bg-zinc-800 text-white font-mono"
                  />
                </div>

                {scriptText && (
                  <Button
                    onClick={() => setActiveStep('media')}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Ga verder naar Media
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Media Step */}
          {activeStep === 'media' && (
            <div className="space-y-6">
              {/* Videos */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Film className="h-5 w-5 text-[#ff6b35]" />
                    Video Clips
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Upload je eigen video's of zoek stock footage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg mb-4">
                    <p className="text-blue-300 text-sm">
                      💡 Upload je eigen video's of zoek gratis stock footage
                    </p>
                  </div>

                  {/* Upload Button */}
                  <div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                    />
                    <Button
                      onClick={() => document.getElementById('video-upload')?.click()}
                      disabled={uploadingVideo}
                      className="w-full bg-[#ff6b35] hover:bg-[#ff8c42]"
                      size="lg"
                    >
                      {uploadingVideo ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Video wordt geüpload...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Eigen Video (MP4, MOV, etc.)
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-zinc-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-zinc-900 px-2 text-gray-400">Of zoek stock video's</span>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Bijv: 'natuur', 'technologie', 'mensen'"
                      value={brollSearchQuery}
                      onChange={(e) => setBrollSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchBrollVideos()}
                      className="border-zinc-700 bg-zinc-800 text-white flex-1"
                    />
                    <Button
                      onClick={searchBrollVideos}
                      disabled={searchingBroll}
                      className="bg-[#ff6b35] hover:bg-[#ff8c42]"
                    >
                      {searchingBroll ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Zoeken
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Selected Videos */}
                  {selectedVideos.length > 0 && (
                    <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                      <p className="text-green-400 text-sm font-medium">
                        ✓ {selectedVideos.length} video clip(s) geselecteerd
                      </p>
                    </div>
                  )}

                  {/* Video Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                    {[...selectedVideos, ...brollVideos].map((video) => {
                      const isSelected = selectedVideos.some(v => v.id === video.id);
                      return (
                        <div
                          key={video.id}
                          onClick={() => toggleVideoSelection(video)}
                          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            isSelected
                              ? 'border-green-500 ring-2 ring-green-400'
                              : 'border-zinc-700 hover:border-zinc-600'
                          }`}
                        >
                          <div className="relative aspect-video bg-zinc-800">
                            <video
                              src={video.previewURL}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              onMouseEnter={(e) => e.currentTarget.play()}
                              onMouseLeave={(e) => e.currentTarget.pause()}
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                <Check className="w-6 h-6 text-green-400" />
                              </div>
                            )}
                          </div>
                          <div className="p-2 bg-zinc-900">
                            <p className="text-xs text-gray-400 truncate">
                              {video.name || video.user}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Music */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Music className="h-5 w-5 text-[#ff6b35]" />
                    Achtergrond Muziek
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Upload je eigen muziek (MP3, WAV, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <p className="text-blue-300 text-sm">
                      💡 Upload je eigen muziek om toe te voegen aan je video
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleMusicUpload}
                      className="hidden"
                      id="music-upload"
                    />
                    <Button
                      onClick={() => document.getElementById('music-upload')?.click()}
                      disabled={uploadingMusic}
                      className="w-full bg-[#ff6b35] hover:bg-[#ff8c42]"
                      size="lg"
                    >
                      {uploadingMusic ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Muziek wordt geüpload...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Selecteer Muziek Bestand
                        </>
                      )}
                    </Button>
                  </div>

                  {selectedMusic && (
                    <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{selectedMusic.title}</p>
                          <p className="text-sm text-gray-400">{selectedMusic.artist}</p>
                          {selectedMusic.source === 'upload' && (
                            <span className="text-xs text-green-400">✓ Geüpload</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-6 h-6 text-green-400" />
                          <Button
                            onClick={() => setSelectedMusic(null)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {musicTracks.length > 0 && (
                    <>
                      <div className="border-t border-zinc-800 pt-4">
                        <Label className="text-white text-sm mb-2 block">Voorbeeldtracks</Label>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {musicTracks.map((track) => {
                          const isSelected = selectedMusic?.id === track.id;
                          return (
                            <div
                              key={track.id}
                              onClick={() => setSelectedMusic(track)}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-green-500 bg-green-900/20'
                                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white text-sm font-medium">{track.title}</p>
                                  <p className="text-xs text-gray-400">{track.artist} • {track.genre}</p>
                                </div>
                                {isSelected && <Check className="w-5 h-5 text-green-400" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {selectedVideos.length > 0 && (
                    <Button
                      onClick={() => setActiveStep('voiceover')}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <ChevronRight className="mr-2 h-4 w-4" />
                      Ga verder naar Voiceover
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Voiceover Step */}
          {activeStep === 'voiceover' && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mic className="h-5 w-5 text-[#ff6b35]" />
                  Voiceover Toevoegen
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Genereer AI voiceover of upload je eigen audio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setVoiceoverMode('ai')}
                    variant={voiceoverMode === 'ai' ? 'default' : 'outline'}
                    className={voiceoverMode === 'ai' ? 'bg-[#ff6b35]' : 'border-zinc-700 text-white'}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Voiceover
                  </Button>
                  <Button
                    onClick={() => setVoiceoverMode('upload')}
                    variant={voiceoverMode === 'upload' ? 'default' : 'outline'}
                    className={voiceoverMode === 'upload' ? 'bg-[#ff6b35]' : 'border-zinc-700 text-white'}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Audio
                  </Button>
                </div>

                {voiceoverMode === 'ai' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                      <p className="text-blue-300 text-sm">
                        💡 AI voiceover wordt gegenereerd met ElevenLabs en kost ongeveer €0.30 per minuut
                      </p>
                    </div>

                    <Button
                      onClick={generateVoiceover}
                      disabled={generatingVoiceover || !scriptText}
                      className="w-full bg-[#ff6b35] hover:bg-[#ff8c42]"
                      size="lg"
                    >
                      {generatingVoiceover ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Voiceover wordt gegenereerd...
                        </>
                      ) : (
                        <>
                          <Volume2 className="mr-2 h-4 w-4" />
                          Genereer Voiceover
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {voiceoverMode === 'upload' && (
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleVoiceoverUpload}
                      className="hidden"
                      id="voiceover-upload"
                    />
                    <Button
                      onClick={() => document.getElementById('voiceover-upload')?.click()}
                      disabled={uploadingVoiceover}
                      className="w-full bg-[#ff6b35] hover:bg-[#ff8c42]"
                      size="lg"
                    >
                      {uploadingVoiceover ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload Audio Bestand
                    </Button>
                  </div>
                )}

                {/* Voiceover Segments */}
                {voiceoverSegments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-white">Audio Bestanden</Label>
                    {voiceoverSegments.map((segment) => (
                      <div key={segment.id} className="p-3 bg-zinc-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Volume2 className="w-5 h-5 text-[#ff6b35]" />
                          <div>
                            <p className="text-white text-sm">Voiceover</p>
                            <p className="text-xs text-gray-400">{segment.text.substring(0, 50)}...</p>
                          </div>
                        </div>
                        <audio src={segment.audioUrl} controls className="h-8" />
                      </div>
                    ))}
                  </div>
                )}

                {voiceoverSegments.length > 0 && (
                  <Button
                    onClick={() => setActiveStep('effects')}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Ga verder naar Effecten
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Effects Step */}
          {activeStep === 'effects' && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Wand2 className="h-5 w-5 text-[#ff6b35]" />
                  Video Effecten
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Voeg transitions, filters en text overlays toe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Transitions */}
                <div className="space-y-2">
                  <Label className="text-white">Transition Effect</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['fade', 'slide', 'zoom', 'dissolve'].map((trans) => (
                      <Button
                        key={trans}
                        onClick={() => {
                          setSelectedTransition(trans);
                          addEffect('transition', trans);
                        }}
                        variant={selectedTransition === trans ? 'default' : 'outline'}
                        className={selectedTransition === trans ? 'bg-[#ff6b35]' : 'border-zinc-700 text-white'}
                        size="sm"
                      >
                        {trans}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Filters */}
                <div className="space-y-2">
                  <Label className="text-white">Video Filter</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['none', 'vintage', 'vibrant', 'grayscale', 'sepia'].map((filter) => (
                      <Button
                        key={filter}
                        onClick={() => {
                          setSelectedFilter(filter);
                          if (filter !== 'none') addEffect('filter', filter);
                        }}
                        variant={selectedFilter === filter ? 'default' : 'outline'}
                        className={selectedFilter === filter ? 'bg-[#ff6b35]' : 'border-zinc-700 text-white'}
                        size="sm"
                      >
                        {filter}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Text Overlay */}
                <div className="space-y-2">
                  <Label htmlFor="text-overlay" className="text-white">Text Overlay (optioneel)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text-overlay"
                      placeholder="Bijv: Je bedrijfsnaam"
                      value={textOverlay}
                      onChange={(e) => setTextOverlay(e.target.value)}
                      className="border-zinc-700 bg-zinc-800 text-white flex-1"
                    />
                    <Button
                      onClick={() => textOverlay && addEffect('text', textOverlay)}
                      disabled={!textOverlay}
                      className="bg-[#ff6b35] hover:bg-[#ff8c42]"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Added Effects */}
                {effects.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-white">Toegevoegde Effecten</Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {effects.map((effect, index) => (
                        <div key={index} className="p-3 bg-zinc-800 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm capitalize">{effect.type}: {effect.name}</p>
                            <p className="text-xs text-gray-400">
                              Start: {effect.startTime}s • Duur: {effect.duration}s
                            </p>
                          </div>
                          <Button
                            onClick={() => setEffects(effects.filter((_, i) => i !== index))}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setActiveStep('timeline')}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Ga verder naar Timeline
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Timeline Step */}
          {activeStep === 'timeline' && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5 text-[#ff6b35]" />
                  Timeline Overzicht
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Bekijk je video compositie en timing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timeline Summary */}
                <div className="space-y-3">
                  {/* Duration Bar */}
                  <div className="p-4 bg-zinc-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Totale duur</span>
                      <span className="text-lg font-bold text-white">
                        {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#ff6b35] to-[#ff8c42]"
                        style={{ width: `${Math.min((totalDuration / 300) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Aanbevolen: 30-120 seconden voor social media
                    </p>
                  </div>

                  {/* Video Clips Timeline */}
                  {selectedVideos.length > 0 && (
                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Film className="w-4 h-4" />
                        Video Clips ({selectedVideos.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedVideos.map((video, index) => (
                          <div key={video.id} className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">{index + 1}.</span>
                            <span className="flex-1 text-gray-300 truncate">{video.name || `Clip ${index + 1}`}</span>
                            <span className="text-gray-500">{video.duration}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audio Timeline */}
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedMusic && (
                      <div className="p-4 bg-zinc-800 rounded-lg">
                        <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          <Music className="w-4 h-4" />
                          Muziek
                        </h4>
                        <p className="text-sm text-gray-300">{selectedMusic.title}</p>
                        <p className="text-xs text-gray-500">{selectedMusic.duration}s</p>
                      </div>
                    )}

                    {voiceoverSegments.length > 0 && (
                      <div className="p-4 bg-zinc-800 rounded-lg">
                        <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          <Mic className="w-4 h-4" />
                          Voiceover
                        </h4>
                        <p className="text-sm text-gray-300">{voiceoverSegments.length} segment(s)</p>
                      </div>
                    )}
                  </div>

                  {/* Effects Timeline */}
                  {effects.length > 0 && (
                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Wand2 className="w-4 h-4" />
                        Effecten ({effects.length})
                      </h4>
                      <div className="space-y-2">
                        {effects.map((effect, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">{index + 1}.</span>
                            <span className="flex-1 text-gray-300 capitalize">{effect.type}: {effect.name}</span>
                            <span className="text-gray-500">@{effect.startTime}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    variant="outline"
                    className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opslaan...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Project Opslaan
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setActiveStep('export')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Ga verder naar Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Step */}
          {activeStep === 'export' && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Download className="h-5 w-5 text-[#ff6b35]" />
                  Video Exporteren
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Bekijk je video configuratie en exporteer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="space-y-3">
                  <div className="p-4 bg-zinc-800 rounded-lg">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Script
                    </h4>
                    <p className="text-sm text-gray-300 line-clamp-3">{scriptText || 'Geen script'}</p>
                  </div>

                  <div className="p-4 bg-zinc-800 rounded-lg">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      <Film className="w-4 h-4" />
                      Video's
                    </h4>
                    <p className="text-sm text-gray-300">
                      {selectedVideos.length} video clip(s) • {selectedVideos.filter(v => v.source === 'upload').length} geüpload, {selectedVideos.filter(v => v.source !== 'upload').length} stock
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-800 rounded-lg">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      Muziek
                    </h4>
                    <p className="text-sm text-gray-300">
                      {selectedMusic ? `${selectedMusic.title} - ${selectedMusic.artist}` : 'Geen muziek geselecteerd'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-800 rounded-lg">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Voiceover
                    </h4>
                    <p className="text-sm text-gray-300">
                      {voiceoverSegments.length} audio segment(s)
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-800 rounded-lg">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      Effecten
                    </h4>
                    <p className="text-sm text-gray-300">
                      {effects.length} effect(en) toegevoegd
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    variant="outline"
                    className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opslaan...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Opslaan
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex-1 bg-[#ff6b35] hover:bg-[#ff8c42]"
                    size="lg"
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporteren...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Exporteer Configuratie
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-400">
                  💡 Exporteert JSON configuratie met alle video instellingen
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
*/
