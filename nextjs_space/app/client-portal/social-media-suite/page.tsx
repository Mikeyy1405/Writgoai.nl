'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Loader2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music2,
  TrendingUp,
  Calendar,
  Star,
  Zap,
  Lightbulb,
  PenTool,
  CalendarDays,
} from 'lucide-react';
import ContentCalendar from './components/content-calendar';
import ScheduleModal from './components/schedule-modal';
import { renderMarkdown, PlatformId } from '@/lib/social-media-utils';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  isPrimary: boolean;
}

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  suggestedPlatforms: string[];
  category: 'trending' | 'seasonal' | 'evergreen' | 'engagement';
  urgency: 'high' | 'medium' | 'low';
  estimatedEngagement: number;
}

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
  { id: 'twitter', name: 'X', icon: Twitter, color: '#000000' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: '#000000' },
];

export default function SocialMediaSuitePage() {
  // Tab state
  const [activeTab, setActiveTab] = useState('ideas');

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Ideas state
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  // Post maker state
  const [topic, setTopic] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin']);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [generatingContent, setGeneratingContent] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  // Schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [postToSchedule, setPostToSchedule] = useState<{ content: string; platform: PlatformId } | null>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await fetch('/api/client/projects');
      
      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);

      // Auto-select primary project
      const primaryProject = data.projects?.find((p: Project) => p.isPrimary);
      if (primaryProject) {
        setSelectedProjectId(primaryProject.id);
      } else if (data.projects && data.projects.length > 0) {
        setSelectedProjectId(data.projects[0].id);
      }
    } catch (error: any) {
      console.error('Error loading projects:', error);
      toast.error('Kon projecten niet laden');
    } finally {
      setLoadingProjects(false);
    }
  };

  const generateIdeas = async () => {
    try {
      if (!selectedProjectId) {
        toast.error('Selecteer eerst een project');
        return;
      }

      setLoadingIdeas(true);
      toast.loading('AI genereert content ideeën...', { id: 'ideas' });

      const response = await fetch('/api/client/social/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId, count: 10 }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Fout bij genereren van ideeën');
      }

      const data = await response.json();

      if (data.success && data.ideas) {
        setIdeas(data.ideas);
        toast.success(`${data.ideas.length} content ideeën gegenereerd!`, { id: 'ideas' });
      } else {
        throw new Error('Onverwacht response formaat');
      }
    } catch (error: any) {
      console.error('Error generating ideas:', error);
      toast.error(error.message || 'Fout bij genereren van ideeën', { id: 'ideas' });
    } finally {
      setLoadingIdeas(false);
    }
  };

  const generateContent = async () => {
    if (!selectedProjectId) {
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
      setGeneratingContent(true);
      toast.loading('AI genereert content voor geselecteerde platforms...', { id: 'generate' });

      const newContent: Record<string, string> = {};

      // Generate content for all platforms concurrently
      const results = await Promise.allSettled(
        selectedPlatforms.map(async (platform) => {
          const response = await fetch('/api/client/generate-social-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic,
              platforms: [platform],
              tone: 'professional',
              includeHashtags: true,
              includeEmojis: true,
              language: 'nl',
              length: 'medium',
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Fout bij genereren');
          }

          const data = await response.json();
          
          if (data.success && data.post) {
            return { platform, post: data.post };
          } else {
            throw new Error('Onverwacht response formaat');
          }
        })
      );

      // Process results
      results.forEach((result, index) => {
        const platform = selectedPlatforms[index];
        if (result.status === 'fulfilled') {
          newContent[platform] = result.value.post;
        } else {
          console.error(`Error generating content for ${platform}:`, result.reason);
          const platformName = PLATFORMS.find((p) => p.id === platform)?.name || platform;
          newContent[platform] = `⚠️ Kon geen content genereren voor ${platformName}\n\nFout: ${result.reason.message || 'Onbekende fout'}`;
        }
      });

      setGeneratedContent(newContent);
      
      const successCount = Object.values(newContent).filter(c => !c.startsWith('⚠️')).length;
      if (successCount > 0) {
        toast.success(`${successCount} van ${selectedPlatforms.length} posts gegenereerd!`, { id: 'generate' });
      } else {
        toast.error('Geen posts konden worden gegenereerd', { id: 'generate' });
      }
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast.error(error.message || 'Fout bij genereren van content', { id: 'generate' });
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleIdeaClick = (idea: ContentIdea) => {
    setTopic(`${idea.title}\n\n${idea.description}`);
    setSelectedPlatforms(idea.suggestedPlatforms);
    toast.success('Idee ingevuld in post maker!');
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const copyToClipboard = async (platform: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedPlatform(platform);
      toast.success('Content gekopieerd naar klembord!');
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch (error) {
      toast.error('Kon content niet kopiëren');
    }
  };

  const handleSchedulePost = (platform: string, content: string) => {
    setPostToSchedule({ content, platform: platform as PlatformId });
    setScheduleModalOpen(true);
  };

  const handleScheduled = () => {
    // Refresh calendar if on that tab
    setActiveTab('calendar');
  };

  const getCategoryBadge = (category: ContentIdea['category']) => {
    const styles = {
      trending: 'bg-red-500/20 text-red-300 border-red-500/50',
      seasonal: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      evergreen: 'bg-green-500/20 text-green-300 border-green-500/50',
      engagement: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    };

    const icons = {
      trending: TrendingUp,
      seasonal: Calendar,
      evergreen: Star,
      engagement: Zap,
    };

    const Icon = icons[category];

    return (
      <Badge className={`${styles[category]} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          📱 Social Media Suite
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/50">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </h1>
        <p className="text-muted-foreground">
          Genereer content ideeën, posts en plan je social media strategie
        </p>
      </div>

      {/* Project Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label htmlFor="project-select" className="text-sm font-medium whitespace-nowrap">
              Project:
            </label>
            <select
              id="project-select"
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              disabled={loadingProjects}
              aria-label="Selecteer een project"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {loadingProjects ? (
                <option>Laden...</option>
              ) : projects.length === 0 ? (
                <option>Geen projecten beschikbaar</option>
              ) : (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.isPrimary ? '(Primary)' : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="ideas" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Ideeën</span>
            <span className="sm:hidden">💡</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            <span className="hidden sm:inline">Post Maker</span>
            <span className="sm:hidden">✏️</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Planning</span>
            <span className="sm:hidden">📅</span>
          </TabsTrigger>
        </TabsList>

        {/* Ideeën Tab */}
        <TabsContent value="ideas" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Content Ideas */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>💡 Content Ideeën</CardTitle>
                      <CardDescription>AI-gegenereerde content ideeën</CardDescription>
                    </div>
                    <Button
                      onClick={generateIdeas}
                      disabled={loadingIdeas || !selectedProjectId || loadingProjects}
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {loadingIdeas ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Genereren...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Genereer Ideeën
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ideas.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-orange-500 opacity-50" />
                      <p className="text-muted-foreground">
                        Klik op de knop hierboven om ideeën te genereren
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {ideas.map((idea) => (
                        <Card
                          key={idea.id}
                          className="cursor-pointer hover:border-orange-500/50 transition-colors"
                          onClick={() => handleIdeaClick(idea)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              {getCategoryBadge(idea.category)}
                              {idea.urgency === 'high' && (
                                <Badge className="bg-red-500/20 text-red-300">🔥 Urgent</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-white mb-1">{idea.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{idea.description}</p>
                            <div className="flex items-center gap-2">
                              {idea.suggestedPlatforms.map((platformId) => {
                                const platform = PLATFORMS.find((p) => p.id === platformId);
                                if (!platform) return null;
                                const Icon = platform.icon;
                                return (
                                  <div
                                    key={platformId}
                                    className="p-1.5 rounded bg-gray-700/50"
                                    title={platform.name}
                                  >
                                    <Icon className="w-3 h-3" style={{ color: platform.color }} />
                                  </div>
                                );
                              })}
                              <Badge variant="outline" className="ml-auto text-green-400 border-green-400 text-xs">
                                {idea.estimatedEngagement}%
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Post Maker Tab */}
        <TabsContent value="create" className="space-y-4 mt-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>✏️ Post Maker</CardTitle>
                <CardDescription>Creëer content voor je platforms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Topic Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Onderwerp</label>
                  <Textarea
                    placeholder="Voer een onderwerp in of klik op een idee..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Platform Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platforms</label>
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
                          size="sm"
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
                  disabled={generatingContent || !topic.trim() || selectedPlatforms.length === 0 || !selectedProjectId}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  size="lg"
                >
                  {generatingContent ? (
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

            {/* Generated Content Results */}
            {Object.keys(generatedContent).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>📝 Gegenereerde Posts</CardTitle>
                  <CardDescription>Gebruik de knoppen om te kopiëren of in te plannen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
                  {Object.entries(generatedContent).map(([platformId, content]) => {
                    const platform = PLATFORMS.find((p) => p.id === platformId);
                    if (!platform) return null;
                    const Icon = platform.icon;
                    const isError = content.startsWith('⚠️');

                    return (
                      <div
                        key={platformId}
                        className={`border rounded-lg p-3 ${
                          isError ? 'border-red-500/30 bg-red-500/5' : 'border-gray-700 bg-gray-800/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" style={{ color: platform.color }} />
                            <span className="font-semibold text-sm">{platform.name}</span>
                            {!isError && (
                              <Badge variant="outline" className="text-xs">
                                {content.length} tekens
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div
                          className={`rounded p-3 text-sm mb-3 ${
                            isError ? 'bg-red-900/20 text-red-200' : 'bg-gray-900/50'
                          }`}
                          dangerouslySetInnerHTML={{ 
                            __html: isError ? content : renderMarkdown(content)
                          }}
                        />
                        {!isError && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(platformId, content)}
                              className="flex-1"
                            >
                              {copiedPlatform === platformId ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Gekopieerd
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Kopiëren
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSchedulePost(platformId, content)}
                              className="flex-1 bg-orange-500 hover:bg-orange-600"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Inplannen
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="mt-6">
          <ContentCalendar projectId={selectedProjectId} />
        </TabsContent>
      </Tabs>

      {/* Schedule Modal */}
      {postToSchedule && selectedProjectId && (
        <ScheduleModal
          isOpen={scheduleModalOpen}
          onClose={() => {
            setScheduleModalOpen(false);
            setPostToSchedule(null);
          }}
          content={postToSchedule.content}
          platform={postToSchedule.platform}
          projectId={selectedProjectId}
          onScheduled={handleScheduled}
        />
      )}
    </div>
  );
}
