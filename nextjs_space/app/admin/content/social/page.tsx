'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Globe, Loader2, Eye, Send, Facebook, Instagram, Twitter, Linkedin, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface GeneratedPost {
  platform: string;
  content: string;
  hashtags: string[];
  characterCount: number;
  maxCharacters: number;
}

interface ContentItem {
  id: string;
  title: string;
  content: string;
  type: string;
}

const platformConfig = {
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    maxChars: 63206,
    color: 'bg-blue-600',
    description: 'Longer posts with engagement focus'
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    maxChars: 2200,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Visual-focused with hashtags'
  },
  twitter: {
    name: 'X (Twitter)',
    icon: Twitter,
    maxChars: 280,
    color: 'bg-black',
    description: 'Short, punchy messages'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    maxChars: 3000,
    color: 'bg-blue-700',
    description: 'Professional tone'
  }
};

export default function SocialMediaPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram', 'twitter', 'linkedin']);
  const [tone, setTone] = useState<string>('professional');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [previewPost, setPreviewPost] = useState<GeneratedPost | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/content');
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || []);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setIsLoadingContent(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const generatePosts = async () => {
    if (!selectedContent && !customPrompt) {
      toast.error('Please select content or enter a custom prompt');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    setIsLoading(true);
    try {
      const contentItem = content.find(c => c.id === selectedContent);
      
      const response = await fetch('/api/admin/content/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceContent: contentItem?.content || customPrompt,
          sourceTitle: contentItem?.title || 'Custom Content',
          platforms: selectedPlatforms,
          tone,
          customInstructions: customPrompt && selectedContent ? customPrompt : undefined
        })
      });

      if (!response.ok) throw new Error('Failed to generate posts');

      const data = await response.json();
      setGeneratedPosts(data.posts);
      toast.success('Social media posts generated!');
    } catch (error) {
      console.error('Error generating posts:', error);
      toast.error('Failed to generate posts');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const shareToSocial = (platform: string, content: string) => {
    const encodedContent = encodeURIComponent(content);
    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?quote=${encodedContent}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedContent}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodedContent}`;
        break;
      default:
        toast.info('Please copy and paste manually for this platform');
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Media Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate platform-optimized social media posts from your content
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Content Source
            </CardTitle>
            <CardDescription>
              Select existing content or enter custom text
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Existing Content</Label>
              <Select value={selectedContent} onValueChange={setSelectedContent}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingContent ? "Loading..." : "Choose content to transform"} />
                </SelectTrigger>
                <SelectContent>
                  {content.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title} ({item.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Prompt / Additional Instructions</Label>
              <Textarea
                placeholder="Enter your content or additional instructions for the AI..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                  <SelectItem value="inspirational">Inspirational</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(platformConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = selectedPlatforms.includes(key);
                  return (
                    <Button
                      key={key}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => togglePlatform(key)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {config.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={generatePosts}
              disabled={isLoading || (!selectedContent && !customPrompt)}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Posts
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Generated Posts
            </CardTitle>
            <CardDescription>
              Platform-optimized content ready to share
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedPosts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Generated posts will appear here</p>
              </div>
            ) : (
              <Tabs defaultValue={generatedPosts[0]?.platform}>
                <TabsList className="w-full flex-wrap h-auto">
                  {generatedPosts.map((post) => {
                    const config = platformConfig[post.platform as keyof typeof platformConfig];
                    const Icon = config?.icon;
                    return (
                      <TabsTrigger key={post.platform} value={post.platform} className="gap-2">
                        {Icon && <Icon className="h-4 w-4" />}
                        {config?.name}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {generatedPosts.map((post) => {
                  const config = platformConfig[post.platform as keyof typeof platformConfig];
                  return (
                    <TabsContent key={post.platform} value={post.platform} className="space-y-4">
                      <div className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">
                            {post.characterCount} / {post.maxCharacters} characters
                          </Badge>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setPreviewPost(post)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Preview: {config?.name}</DialogTitle>
                                  <DialogDescription>
                                    How your post will appear
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="rounded-lg border p-4 bg-muted/50">
                                  <p className="whitespace-pre-wrap">{post.content}</p>
                                  {post.hashtags.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1">
                                      {post.hashtags.map((tag, i) => (
                                        <span key={i} className="text-blue-500 text-sm">
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(
                                post.content + (post.hashtags.length > 0 ? '\n\n' + post.hashtags.map(t => `#${t}`).join(' ') : '')
                              )}
                            >
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => shareToSocial(post.platform, post.content)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Share
                            </Button>
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{post.content}</p>
                        {post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2 border-t">
                            {post.hashtags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
