
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Youtube, Instagram, Facebook, Linkedin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';

interface VadooOptions {
  topics: string[];
  captionThemes: string[];
  imageThemes: string[];
  backgroundMusic: string[];
  languages: string[];
  durations: string[];
  aspectRatios: string[];
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: {
    accent?: string;
    age?: string;
    gender?: string;
    use_case?: string;
  };
}

export default function CreateVideoSeriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [vadooOptions, setVadooOptions] = useState<VadooOptions | null>(null);
  const [elevenLabsVoices, setElevenLabsVoices] = useState<ElevenLabsVoice[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    niche: '',
    voice: 'pNInz6obpgDQGcFmaJgB',
    voiceName: 'Adam',
    captionTheme: 'Hormozi_1',
    imageStyle: 'no-style',
    language: 'English',
    duration: '30-60',
    aspectRatio: '9:16',
    backgroundMusic: 'no-music',
    backgroundMusicVolume: 50,
    includeVoiceover: true,
    useAI: true,
    customInstructions: '',
    autopilotEnabled: false,
    publishingDays: [] as string[],
    publishingTime: '09:00',
    videosPerWeek: 3,
    postToYouTube: false,
    postToInstagram: false,
    postToTikTok: false,
    postToFacebook: false,
    postToLinkedIn: false,
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      // Fetch Vadoo options (topics, themes, etc.)
      const vadooResponse = await fetch('/api/vadoo/options');
      if (vadooResponse.ok) {
        const vadooData = await vadooResponse.json();
        setVadooOptions(vadooData);
      }

      // Fetch ElevenLabs voices
      const voicesResponse = await fetch('/api/elevenlabs/voices');
      if (voicesResponse.ok) {
        const voicesData = await voicesResponse.json();
        setElevenLabsVoices(voicesData.voices || []);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
      toast.error('Kon opties niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.niche) {
      toast.error('Vul alle verplichte velden in');
      return;
    }

    setCreating(true);
    
    try {
      const response = await fetch('/api/video-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const series = await response.json();
        toast.success('Video serie succesvol aangemaakt!');
        router.push(`/client-portal/reels/${series.id}`);
      } else {
        toast.error('Kon video serie niet aanmaken');
      }
    } catch (error) {
      console.error('Error creating video series:', error);
      toast.error('Er ging iets mis');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Nieuwe Video Serie
          </h1>
          <p className="text-gray-600 mt-2">
            Configureer je AI-gestuurde video automatisering
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basis Informatie</CardTitle>
              <CardDescription>
                Geef je video serie een naam en beschrijving
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Serie Naam *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Bijv: Business Tips"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Korte beschrijving van deze video serie"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="niche">Niche / Onderwerp *</Label>
                <Select
                  value={formData.niche}
                  onValueChange={(value) => setFormData({ ...formData, niche: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kies een niche" />
                  </SelectTrigger>
                  <SelectContent>
                    {vadooOptions?.topics?.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                    <SelectItem value="Custom">Custom (eigen onderwerpen)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Video Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Video Instellingen</CardTitle>
              <CardDescription>
                Pas de stijl en kwaliteit van je video's aan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="voice">Voice (ElevenLabs)</Label>
                  <Select
                    value={formData.voice}
                    onValueChange={(value) => {
                      const selectedVoice = elevenLabsVoices.find(v => v.voice_id === value);
                      setFormData({ 
                        ...formData, 
                        voice: value,
                        voiceName: selectedVoice?.name || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kies een stem" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {elevenLabsVoices?.length > 0 ? (
                        elevenLabsVoices.map((voice) => (
                          <SelectItem key={voice.voice_id} value={voice.voice_id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{voice.name}</span>
                              {voice.labels && (
                                <span className="text-xs text-gray-500">
                                  {[
                                    voice.labels.accent,
                                    voice.labels.gender,
                                    voice.labels.age,
                                  ].filter(Boolean).join(' • ')}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="pNInz6obpgDQGcFmaJgB">Adam (American • male)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Premium AI voices voor professionele content
                  </p>
                </div>

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
                      {vadooOptions?.languages?.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duur</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => setFormData({ ...formData, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vadooOptions?.durations?.map((dur) => (
                        <SelectItem key={dur} value={dur}>
                          {dur} seconden
                        </SelectItem>
                      ))}
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
                      {vadooOptions?.aspectRatios?.map((ratio) => (
                        <SelectItem key={ratio} value={ratio}>
                          {ratio} {ratio === '9:16' ? '(TikTok/Instagram)' : ratio === '16:9' ? '(YouTube)' : '(Square)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="captionTheme">Caption Thema</Label>
                  <Select
                    value={formData.captionTheme}
                    onValueChange={(value) => setFormData({ ...formData, captionTheme: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vadooOptions?.captionThemes?.map((theme) => (
                        <SelectItem key={theme} value={theme}>
                          {theme}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="imageStyle">Image Stijl</Label>
                  <Select
                    value={formData.imageStyle}
                    onValueChange={(value) => setFormData({ ...formData, imageStyle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Geen specifieke stijl" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-style">Geen specifieke stijl</SelectItem>
                      {vadooOptions?.imageThemes?.map((style) => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeVoiceover"
                    checked={formData.includeVoiceover}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, includeVoiceover: checked })
                    }
                  />
                  <Label htmlFor="includeVoiceover">AI Voiceover</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="useAI"
                    checked={formData.useAI}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, useAI: checked })
                    }
                  />
                  <Label htmlFor="useAI">AI Script Enhancement</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Platforms</CardTitle>
              <CardDescription>
                Selecteer waar je video's automatisch gepost moeten worden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Switch
                    id="postToYouTube"
                    checked={formData.postToYouTube}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, postToYouTube: checked })
                    }
                  />
                  <Youtube className="h-5 w-5 text-red-600" />
                  <Label htmlFor="postToYouTube" className="cursor-pointer">YouTube</Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Switch
                    id="postToInstagram"
                    checked={formData.postToInstagram}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, postToInstagram: checked })
                    }
                  />
                  <Instagram className="h-5 w-5 text-pink-600" />
                  <Label htmlFor="postToInstagram" className="cursor-pointer">Instagram</Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Switch
                    id="postToTikTok"
                    checked={formData.postToTikTok}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, postToTikTok: checked })
                    }
                  />
                  <div className="h-5 w-5 rounded bg-gray-900 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">TT</span>
                  </div>
                  <Label htmlFor="postToTikTok" className="cursor-pointer">TikTok</Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Switch
                    id="postToFacebook"
                    checked={formData.postToFacebook}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, postToFacebook: checked })
                    }
                  />
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <Label htmlFor="postToFacebook" className="cursor-pointer">Facebook</Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Switch
                    id="postToLinkedIn"
                    checked={formData.postToLinkedIn}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, postToLinkedIn: checked })
                    }
                  />
                  <Linkedin className="h-5 w-5 text-blue-700" />
                  <Label htmlFor="postToLinkedIn" className="cursor-pointer">LinkedIn</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Autopilot Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Automatische Planning</CardTitle>
              <CardDescription>
                Configureer automatische video generatie en publicatie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="autopilotEnabled"
                  checked={formData.autopilotEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, autopilotEnabled: checked })
                  }
                />
                <Label htmlFor="autopilotEnabled">Autopilot Inschakelen</Label>
              </div>

              {formData.autopilotEnabled && (
                <div className="space-y-4 pl-6 border-l-2 border-orange-200">
                  <div>
                    <Label htmlFor="videosPerWeek">Video's per week</Label>
                    <Input
                      id="videosPerWeek"
                      type="number"
                      min="1"
                      max="14"
                      value={formData.videosPerWeek}
                      onChange={(e) =>
                        setFormData({ ...formData, videosPerWeek: parseInt(e.target.value) || 3 })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="publishingTime">Publicatie tijd</Label>
                    <Input
                      id="publishingTime"
                      type="time"
                      value={formData.publishingTime}
                      onChange={(e) =>
                        setFormData({ ...formData, publishingTime: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={creating}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig met aanmaken...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Video Serie Aanmaken
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

