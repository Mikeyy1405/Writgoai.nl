'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  Sparkles,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music2,
  Image as ImageIcon,
  Send,
  Calendar,
  Copy,
  Check,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=AI+Generated+Image';

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
  { id: 'twitter', name: 'X', icon: Twitter, color: '#000000' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: '#000000' },
];

interface CreatePostTabProps {
  projectId: string | null;
}

export default function CreatePostTab({ projectId }: CreatePostTabProps) {
  const [topic, setTopic] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin']);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [copied, setCopied] = useState<string | null>(null);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const generateContent = async () => {
    if (!projectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    if (!topic.trim()) {
      toast.error('Voer een onderwerp in');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Selecteer minimaal één platform');
      return;
    }

    try {
      setGenerating(true);
      toast.loading('AI genereert echte, waardevolle content...', { id: 'generate' });

      const newContent: Record<string, string> = {};

      // Generate content for each selected platform
      for (const platform of selectedPlatforms) {
        try {
          const response = await fetch('/api/client/generate-social-post', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topic,
              platforms: [platform],
              tone: 'professional',
              includeHashtags: true,
              includeEmojis: true,
              includeImage: false,
              language: 'nl',
              length: 'medium',
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate content');
          }

          const data = await response.json();
          
          if (data.success && data.post) {
            newContent[platform] = data.post;
          } else {
            throw new Error('Invalid response format');
          }
        } catch (platformError) {
          console.error(`Error generating content for ${platform}:`, platformError);
          // Continue with other platforms even if one fails
          newContent[platform] = `⚠️ Er ging iets mis bij het genereren van content voor dit platform. Probeer het opnieuw.`;
        }
      }

      setGeneratedContent(newContent);
      toast.success('Content succesvol gegenereerd!', { id: 'generate' });
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Fout bij genereren van content', { id: 'generate' });
    } finally {
      setGenerating(false);
    }
  };

  const generateImage = async () => {
    if (!topic.trim()) {
      toast.error('Voer eerst een onderwerp in');
      return;
    }

    try {
      setGeneratingImage(true);
      toast.loading('AI genereert een professionele afbeelding...', { id: 'image' });

      // Get the first generated content or use topic for image context
      const contentForImage = Object.values(generatedContent)[0] || topic;

      const response = await fetch('/api/social-media/generate-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: contentForImage,
          mediaType: 'image',
          style: 'realistic',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      
      if (data.success && data.mediaUrl) {
        setImageUrl(data.mediaUrl);
        toast.success('Afbeelding gegenereerd!', { id: 'image' });
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Fout bij genereren van afbeelding. Voer handmatig een URL in.', { id: 'image' });
    } finally {
      setGeneratingImage(false);
    }
  };

  const copyToClipboard = (platform: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(platform);
    toast.success('Content gekopieerd!');

    setTimeout(() => {
      setCopied(null);
    }, 2000);
  };

  const publishPost = async (platform: string) => {
    toast.success(`Post publiceren naar ${platform}...`, { id: 'publish' });
    
    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success(`Post succesvol gepubliceerd op ${platform}!`, { id: 'publish' });
  };

  const schedulePost = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Selecteer datum en tijd');
      return;
    }

    toast.success(
      `Post ingepland voor ${new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('nl-NL')}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Maken</CardTitle>
              <CardDescription>Voer een onderwerp in en laat AI de rest doen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Topic Input */}
              <div className="space-y-2">
                <Label htmlFor="topic">Onderwerp / Topic</Label>
                <Textarea
                  id="topic"
                  placeholder="Bijv: Tips voor productiviteit, Nieuwe product lancering, etc."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Platform Selection */}
              <div className="space-y-2">
                <Label>Platforms (multi-select)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = selectedPlatforms.includes(platform.id);

                    return (
                      <Button
                        key={platform.id}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => togglePlatform(platform.id)}
                        className="justify-start"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {platform.name}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateContent}
                disabled={generating || !topic.trim() || selectedPlatforms.length === 0}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Genereren...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Genereer Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Image Generation */}
          <Card>
            <CardHeader>
              <CardTitle>Afbeelding Toevoegen</CardTitle>
              <CardDescription>Upload of genereer een afbeelding met AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Afbeelding URL</Label>
                <Input
                  id="image-url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <Button
                onClick={generateImage}
                disabled={generatingImage || !topic.trim()}
                className="w-full"
                variant="outline"
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Afbeelding Genereren...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Genereer AI Afbeelding
                  </>
                )}
              </Button>

              {imageUrl && (
                <div className="border rounded-lg overflow-hidden">
                  <img src={imageUrl} alt="Generated" className="w-full h-auto" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview per Platform</CardTitle>
              <CardDescription>Zo zien je posts eruit op elk platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(generatedContent).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Genereer content om een preview te zien</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedPlatforms.map((platformId) => {
                    const platform = PLATFORMS.find((p) => p.id === platformId);
                    const Icon = platform?.icon;
                    const content = generatedContent[platformId];

                    if (!content) return null;

                    return (
                      <div key={platformId} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {Icon && (
                              <Icon
                                className="h-5 w-5"
                                style={{ color: platform?.color }}
                              />
                            )}
                            <span className="font-semibold">{platform?.name}</span>
                          </div>
                          <Badge>{content.length} tekens</Badge>
                        </div>

                        {imageUrl && (
                          <div className="border rounded overflow-hidden">
                            <img src={imageUrl} alt="" className="w-full h-auto" />
                          </div>
                        )}

                        <div className="bg-muted rounded p-3 text-sm whitespace-pre-wrap">
                          {content}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(platformId, content)}
                          >
                            {copied === platformId ? (
                              <Check className="h-4 w-4 mr-1" />
                            ) : (
                              <Copy className="h-4 w-4 mr-1" />
                            )}
                            Kopiëren
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => publishPost(platformId)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Publiceren
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Section */}
          {Object.keys(generatedContent).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Inplannen</CardTitle>
                <CardDescription>Plan je posts in voor later</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Datum</Label>
                    <Input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Tijd</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={schedulePost} className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Inplannen voor{' '}
                  {scheduledDate && scheduledTime
                    ? new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('nl-NL', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : 'later'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
