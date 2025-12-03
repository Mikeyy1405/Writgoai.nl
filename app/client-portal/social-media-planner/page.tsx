
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, 
  Sparkles, 
  Trash2, 
  Copy, 
  Send, 
  Calendar,
  RefreshCw,
  AlertCircle,
  Rocket,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Share2,
  Link as LinkIcon,
  FileText,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { useLanguage } from '@/lib/i18n/context';
import Image from 'next/image';
import { LateDevAccountManager } from '@/components/late-dev-account-manager';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  language: string;
}

interface SocialMediaPost {
  id: string;
  content: string;
  platforms: string[];
  mediaUrl: string | null;
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  createdAt: string;
}

const platformLabels: Record<string, { label: string; color: string; icon: string }> = {
  linkedin: { label: 'LinkedIn', color: 'bg-blue-600', icon: '💼' },
  facebook: { label: 'Facebook', color: 'bg-blue-500', icon: '👍' },
  instagram: { label: 'Instagram', color: 'bg-pink-500', icon: '📸' },
  twitter: { label: 'Twitter', color: 'bg-sky-500', icon: '𝕏' },
  tiktok: { label: 'TikTok', color: 'bg-black', icon: '🎵' },
  youtube: { label: 'YouTube', color: 'bg-red-600', icon: '📹' },
  threads: { label: 'Threads', color: 'bg-gray-800', icon: '🧵' },
  reddit: { label: 'Reddit', color: 'bg-orange-600', icon: '🤖' },
  pinterest: { label: 'Pinterest', color: 'bg-red-500', icon: '📌' },
  bluesky: { label: 'Bluesky', color: 'bg-sky-400', icon: '🦋' },
};

export default function SocialMediaPlannerPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t } = useLanguage();

  const [isMounted, setIsMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [postCount, setPostCount] = useState(10);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  
  // Bulk selection
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Content plan topics
  const [topics, setTopics] = useState<any[]>([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  
  // Scheduling dialog
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      loadProjects();
    }
  }, [session]);

  useEffect(() => {
    if (selectedProjectId) {
      loadPosts();
      loadTopics();
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/client/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        
        if (data.projects && data.projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Fout bij laden van projecten');
    }
  };

  const loadPosts = async () => {
    try {
      const res = await fetch(`/api/client/social-media-posts?projectId=${selectedProjectId}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setSelectedPostIds([]); // Clear selection when reloading
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  const loadTopics = async () => {
    if (!selectedProjectId) return;
    
    setTopicsLoading(true);
    try {
      const res = await fetch(`/api/client/social-media-topics?projectId=${selectedProjectId}`);
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
      }
    } catch (error) {
      console.error('Failed to load topics:', error);
      toast.error('Kon topics niet laden');
    } finally {
      setTopicsLoading(false);
    }
  };

  const generateTopics = async () => {
    if (!selectedProjectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    setIsGeneratingTopics(true);
    try {
      const res = await fetch('/api/client/social-media-topics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: selectedProjectId,
          count: 20
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.count} content topics gegenereerd! 🎯`);
        await loadTopics();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Kon topics niet genereren');
      }
    } catch (error) {
      console.error('Failed to generate topics:', error);
      toast.error('Fout bij genereren van topics');
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  const deleteTopic = async (topicId: string) => {
    try {
      const res = await fetch(`/api/client/social-media-topics?id=${topicId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Topic verwijderd');
        await loadTopics();
      } else {
        toast.error('Kon topic niet verwijderen');
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
      toast.error('Fout bij verwijderen');
    }
  };

  const generatePosts = async () => {
    if (!selectedProjectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    setIsGenerating(true);
    try {
      const currentLanguage = selectedLanguage || projects.find(p => p.id === selectedProjectId)?.language || 'NL';
      
      const res = await fetch('/api/client/social-media-posts/generate-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: selectedProjectId,
          count: postCount,
          language: currentLanguage
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`${data.posts?.length || 0} posts gegenereerd! 🎉`);
        await loadPosts();
      } else {
        throw new Error(data.error || 'Fout bij genereren van posts');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Fout bij genereren van posts');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Content gekopieerd naar klembord!');
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Weet je zeker dat je deze post wilt verwijderen?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/client/social-media-posts/${postId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Post verwijderd');
        await loadPosts();
      } else {
        throw new Error('Fout bij verwijderen');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fout bij verwijderen van post');
    } finally {
      setIsDeleting(false);
    }
  };

  const openScheduleDialog = (post: SocialMediaPost) => {
    setSelectedPost(post);
    
    // Set default to tomorrow at 10:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
    setScheduleTime('10:00');
    setShowScheduleDialog(true);
  };

  const schedulePost = async () => {
    if (!selectedPost || !scheduleDate || !scheduleTime) {
      toast.error('Vul datum en tijd in');
      return;
    }

    setIsScheduling(true);
    try {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      
      const res = await fetch('/api/client/social-media-posts/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPost.id,
          scheduledFor: scheduledDateTime.toISOString(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Post ingepland! 📅');
        setShowScheduleDialog(false);
        await loadPosts();
      } else {
        throw new Error(data.error || 'Fout bij inplannen');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error(error instanceof Error ? error.message : 'Fout bij inplannen van post');
    } finally {
      setIsScheduling(false);
    }
  };

  const publishNow = async (postId: string) => {
    if (!selectedProjectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    if (!confirm('Wil je deze post nu direct publiceren via Late.dev naar al je gekoppelde accounts?')) {
      return;
    }

    try {
      const res = await fetch('/api/client/late-dev/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: selectedProjectId,
          postId: postId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Post gepubliceerd naar al je social media accounts! 🚀');
        await loadPosts();
      } else {
        if (data.error?.includes('No active accounts')) {
          toast.error('Koppel eerst social media accounts in de "Social Accounts" tab');
        } else {
          throw new Error(data.error || 'Fout bij publiceren');
        }
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error instanceof Error ? error.message : 'Fout bij publiceren van post');
    }
  };

  const toggleSelectAll = () => {
    if (selectedPostIds.length === posts.length) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(posts.map(p => p.id));
    }
  };

  const toggleSelectPost = (postId: string) => {
    setSelectedPostIds(prev => 
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const bulkDeletePosts = async () => {
    if (selectedPostIds.length === 0) {
      toast.error('Selecteer eerst posts om te verwijderen');
      return;
    }

    if (!confirm(`Weet je zeker dat je ${selectedPostIds.length} post(s) wilt verwijderen?`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const res = await fetch('/api/client/social-media-posts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds: selectedPostIds }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`${data.deletedCount} post(s) verwijderd! 🗑️`);
        await loadPosts();
      } else {
        throw new Error(data.error || 'Fout bij verwijderen');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Fout bij verwijderen van posts');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (!isMounted || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Social Media Planner</h1>
        </div>
        <p className="text-muted-foreground">
          Genereer direct ready-to-post content voor al je social media kanalen
        </p>
      </div>

      {/* Project Selection & Generation */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Nieuwe Posts Genereren
          </CardTitle>
          <CardDescription>
            Kies een project en genereer direct posts met afbeeldingen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">Aantal Posts</Label>
              <Select value={String(postCount)} onValueChange={(val) => setPostCount(Number(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="1">1 post</SelectItem>
                  <SelectItem value="5">5 posts</SelectItem>
                  <SelectItem value="10">10 posts</SelectItem>
                  <SelectItem value="15">15 posts</SelectItem>
                  <SelectItem value="20">20 posts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Taal</Label>
              <Select 
                value={selectedLanguage || (projects.find(p => p.id === selectedProjectId)?.language || 'NL')} 
                onValueChange={setSelectedLanguage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer taal" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="NL">🇳🇱 Nederlands</SelectItem>
                  <SelectItem value="EN">🇺🇸 English</SelectItem>
                  <SelectItem value="DE">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="FR">🇫🇷 Français</SelectItem>
                  <SelectItem value="ES">🇪🇸 Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={generatePosts} 
            disabled={isGenerating || !selectedProjectId}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {postCount === 1 ? 'Post genereren...' : 'Posts genereren...'}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Genereer {postCount} {postCount === 1 ? 'Post' : 'Posts'}
              </>
            )}
          </Button>

          {selectedProject && (
            <div className="text-sm text-muted-foreground border-t pt-4">
              <p><strong>Project:</strong> {selectedProject.name}</p>
              <p><strong>Taal:</strong> {selectedProject.language?.toUpperCase() === 'EN' ? '🇺🇸 English' : '🇳🇱 Nederlands'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Plan, Posts & Accounts Tabs */}
      <Tabs defaultValue="contentplan" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="contentplan" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contentplan ({topics.length})
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Social Accounts
          </TabsTrigger>
        </TabsList>

        {/* Content Plan Tab */}
        <TabsContent value="contentplan" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    Social Media Contentplan
                  </CardTitle>
                  <CardDescription>
                    Genereer en beheer content topics voor je social media posts
                  </CardDescription>
                </div>
                <Button
                  onClick={generateTopics}
                  disabled={!selectedProjectId || isGeneratingTopics}
                  className="gap-2"
                >
                  {isGeneratingTopics ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Genereren...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Genereer Topics</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedProjectId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecteer eerst een project om content topics te bekijken</p>
                </div>
              ) : topicsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
                  <p className="text-muted-foreground">Topics laden...</p>
                </div>
              ) : topics.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium mb-2">Nog geen content topics</p>
                  <p className="text-muted-foreground mb-4">
                    Genereer een contentplan om relevante topics voor je social media te krijgen
                  </p>
                  <Button
                    onClick={generateTopics}
                    disabled={isGeneratingTopics}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Genereer 20 Topics
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      Tutorial
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      Tip
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500" />
                      Uitleg
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-orange-500" />
                      Vraag-antwoord
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-pink-500" />
                      Praktijkvoorbeeld
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  topic.category === 'tutorial' ? 'bg-blue-500' :
                                  topic.category === 'tip' ? 'bg-green-500' :
                                  topic.category === 'uitleg' ? 'bg-purple-500' :
                                  topic.category === 'vraag-antwoord' ? 'bg-orange-500' :
                                  'bg-pink-500'
                                }`}
                              />
                              <h4 className="font-medium">{topic.topic}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {topic.description}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {topic.keywords.slice(0, 4).map((keyword: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-1 bg-secondary rounded-full"
                                >
                                  {keyword}
                                </span>
                              ))}
                              {topic.usageCount > 0 && (
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                  {topic.usageCount}x gebruikt
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTopic(topic.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                          Hoe werkt het contentplan?
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Wanneer je posts genereert, gebruikt de AI automatisch topics uit dit contentplan. 
                          Zo ontstaan er relevante, gevarieerde posts die écht over jouw niche gaan! 
                          De AI selecteert automatisch topics die nog weinig gebruikt zijn.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Jouw Posts ({posts.length})
                  </CardTitle>
                  <CardDescription>
                    Klaar om te posten, plannen of kopiëren
                  </CardDescription>
                </div>
            <div className="flex items-center gap-2">
              {posts.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    <Checkbox
                      checked={selectedPostIds.length === posts.length && posts.length > 0}
                      className="mr-2"
                    />
                    Alles selecteren
                  </Button>
                  {selectedPostIds.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={bulkDeletePosts}
                      disabled={isBulkDeleting}
                    >
                      {isBulkDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verwijderen...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Verwijder ({selectedPostIds.length})
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={loadPosts}
                disabled={!selectedProjectId}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Vernieuw
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <Rocket className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Nog geen posts</h3>
              <p className="text-muted-foreground mb-4">
                Genereer je eerste batch posts om te beginnen
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <div className="grid md:grid-cols-[auto,300px,1fr] gap-4">
                    {/* Checkbox */}
                    <div className="flex items-start p-4">
                      <Checkbox
                        checked={selectedPostIds.includes(post.id)}
                        onCheckedChange={() => toggleSelectPost(post.id)}
                        className="mt-2"
                      />
                    </div>

                    {/* Image */}
                    <div className="relative bg-muted aspect-square md:aspect-auto md:h-full">
                      {post.mediaUrl ? (
                        <Image
                          src={post.mediaUrl}
                          alt="Post afbeelding"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      {/* Status & Platforms */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.status === 'scheduled' && (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Ingepland
                          </Badge>
                        )}
                        {post.status === 'published' && (
                          <Badge variant="default" className="gap-1 bg-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Gepubliceerd
                          </Badge>
                        )}
                        {post.status === 'draft' && (
                          <Badge variant="outline" className="gap-1">
                            Draft
                          </Badge>
                        )}
                        
                        <div className="flex items-center gap-1">
                          {post.platforms.map((platform) => {
                            const info = platformLabels[platform];
                            return info ? (
                              <Badge key={platform} className={`${info.color} text-white`}>
                                {info.icon} {info.label}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="whitespace-pre-wrap text-sm">{post.content}</p>
                      </div>

                      {/* Schedule Info */}
                      {post.scheduledFor && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Ingepland voor: {new Date(post.scheduledFor).toLocaleString('nl-NL')}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => publishNow(post.id)}
                          disabled={post.status === 'published'}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Post Nu
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openScheduleDialog(post)}
                          disabled={post.status === 'published'}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Inplannen
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(post.content)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Kopiëren
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deletePost(post.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Verwijderen
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="mt-6">
          {selectedProjectId && (
            <LateDevAccountManager 
              projectId={selectedProjectId}
              onAccountsChange={loadPosts}
            />
          )}
          {!selectedProjectId && (
            <Card className="p-12">
              <div className="text-center">
                <LinkIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">Geen Project Geselecteerd</h3>
                <p className="text-muted-foreground">
                  Selecteer eerst een project om social media accounts te beheren
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Inplannen</DialogTitle>
            <DialogDescription>
              Kies wanneer deze post automatisch gepubliceerd moet worden via Getlate
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Datum</Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-time">Tijd</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>

            {selectedPost && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <p className="text-sm line-clamp-3">{selectedPost.content}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowScheduleDialog(false)}
              disabled={isScheduling}
            >
              Annuleren
            </Button>
            <Button onClick={schedulePost} disabled={isScheduling}>
              {isScheduling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inplannen...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Inplannen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
