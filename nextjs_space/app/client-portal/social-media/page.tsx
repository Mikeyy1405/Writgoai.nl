'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Send,
  Calendar,
  Trash2,
  Eye,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Zap,
  Copy,
  Check,
  Pause,
  Play,
  CalendarClock,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  socialMediaConfig?: {
    autopilotEnabled: boolean;
    lateDevApiKey?: string;
    postsPerWeek?: number;
    scheduleDays?: string[];
    scheduleTime?: string;
  };
}

interface SocialMediaPost {
  id: string;
  platforms: string[]; // Multi-platform support
  content: string;
  mediaUrl?: string;
  linkUrl?: string;
  contentType: string;
  status: string;
  scheduledFor?: string;
  publishedAt?: string;
  creditsUsed: number;
  error?: string;
  platformStatuses?: { [key: string]: string };
  platformErrors?: { [key: string]: string };
  sourceArticle?: {
    id: string;
    title: string;
    focusKeyword: string;
  };
  createdAt: string;
}

export default function SocialMediaAutopilotPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [activeTab, setActiveTab] = useState('draft');
  
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewPost, setPreviewPost] = useState<SocialMediaPost | null>(null);
  
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [runningAutopilot, setRunningAutopilot] = useState(false);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // New post form state
  const [newPlatforms, setNewPlatforms] = useState<string[]>([]); // Multi-platform support
  const [newContentType, setNewContentType] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newScheduledFor, setNewScheduledFor] = useState('');

  // Planning/Schedule state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleType, setScheduleType] = useState<'once' | 'once-daily' | 'twice-daily' | 'weekly' | 'custom-days'>('once-daily');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [secondTimeOfDay, setSecondTimeOfDay] = useState('15:00');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [postsPerRun, setPostsPerRun] = useState('3');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin', 'facebook']);

  // Quick Planning Generator state
  const [showQuickPlanningDialog, setShowQuickPlanningDialog] = useState(false);
  const [generatingPlanning, setGeneratingPlanning] = useState(false);
  const [quickPlanningDays, setQuickPlanningDays] = useState('7');
  const [quickPlanningPlatforms, setQuickPlanningPlatforms] = useState<string[]>(['linkedin', 'facebook']);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    } else if (status === 'authenticated') {
      loadProjects();
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedProject) {
      loadPosts();
      loadSchedules();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/client/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      
      const data = await response.json();
      const projectsData = data.projects || [];
      setProjects(projectsData);
      
      if (projectsData.length > 0 && !selectedProject) {
        setSelectedProject(projectsData[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Fout bij laden van projecten');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch(`/api/client/social-media/posts?projectId=${selectedProject}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Fout bij laden van posts');
    }
  };

  const loadSchedules = async () => {
    if (!selectedProject) return;
    
    try {
      setLoadingSchedules(true);
      const response = await fetch(`/api/client/social-media/schedules?projectId=${selectedProject}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error('Fout bij laden van planning');
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!scheduleName) {
      toast.error('Vul een naam in voor de planning');
      return;
    }

    if (scheduleType === 'once' && !scheduledDate) {
      toast.error('Selecteer een datum voor eenmalige planning');
      return;
    }

    if (scheduleType === 'weekly' && !dayOfWeek) {
      toast.error('Selecteer een dag voor wekelijkse planning');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Selecteer minimaal één platform');
      return;
    }

    try {
      const scheduleData: any = {
        projectId: selectedProject,
        name: scheduleName,
        scheduleType,
        contentType: 'social-media',
        postsPerRun: parseInt(postsPerRun),
        platforms: selectedPlatforms,
        timeOfDay: scheduledTime,
      };

      if (scheduleType === 'once') {
        scheduleData.scheduledDate = scheduledDate;
      } else if (scheduleType === 'twice-daily') {
        scheduleData.secondTimeOfDay = secondTimeOfDay;
      } else if (scheduleType === 'weekly') {
        scheduleData.dayOfWeek = parseInt(dayOfWeek);
      } else if (scheduleType === 'custom-days') {
        scheduleData.daysOfWeek = daysOfWeek;
      }

      const response = await fetch('/api/client/social-media/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Planning succesvol aangemaakt!');
        setShowScheduleDialog(false);
        resetScheduleForm();
        loadSchedules();
      } else {
        toast.error(data.error || 'Fout bij aanmaken van planning');
      }
    } catch (error) {
      toast.error('Fout bij aanmaken van planning');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Weet je zeker dat je deze planning wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/client/social-media/schedules?scheduleId=${scheduleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Planning verwijderd');
        loadSchedules();
      } else {
        toast.error(data.error || 'Fout bij verwijderen van planning');
      }
    } catch (error) {
      toast.error('Fout bij verwijderen van planning');
    }
  };

  const handleToggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/client/social-media/schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, isActive: !isActive }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isActive ? 'Planning gepauzeerd' : 'Planning geactiveerd');
        loadSchedules();
      } else {
        toast.error(data.error || 'Fout bij wijzigen van planning');
      }
    } catch (error) {
      toast.error('Fout bij wijzigen van planning');
    }
  };

  const resetScheduleForm = () => {
    setScheduleName('');
    setScheduleType('once-daily');
    setScheduledDate('');
    setScheduledTime('09:00');
    setSecondTimeOfDay('15:00');
    setDayOfWeek('1');
    setDaysOfWeek([1, 3, 5]);
    setPostsPerRun('3');
    setSelectedPlatforms(['linkedin', 'facebook']);
  };

  const handleGenerateQuickPlanning = async () => {
    if (!selectedProject) {
      toast.error('Selecteer eerst een project');
      return;
    }

    if (quickPlanningPlatforms.length === 0) {
      toast.error('Selecteer minimaal één platform');
      return;
    }

    try {
      setGeneratingPlanning(true);
      
      toast.loading('Planning genereren...', { id: 'quick-planning' });

      const response = await fetch('/api/client/social-media/generate-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          numberOfDays: parseInt(quickPlanningDays),
          platforms: quickPlanningPlatforms,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message, { id: 'quick-planning' });
        setShowQuickPlanningDialog(false);
        
        // Refresh posts
        await loadPosts();
        
        // Switch to draft tab to show generated posts
        setActiveTab('draft');
      } else {
        toast.error(data.error || 'Fout bij genereren van planning', { id: 'quick-planning' });
      }
    } catch (error) {
      console.error('Error generating quick planning:', error);
      toast.error('Fout bij genereren van planning', { id: 'quick-planning' });
    } finally {
      setGeneratingPlanning(false);
    }
  };

  const getScheduleDescription = (schedule: any) => {
    const platforms = schedule.platforms?.join(', ') || 'Geen platforms';
    
    switch (schedule.scheduleType) {
      case 'once':
        return `Eenmalig op ${new Date(schedule.scheduledDate).toLocaleDateString('nl-NL')} om ${schedule.timeOfDay} - ${platforms}`;
      case 'once-daily':
        return `Dagelijks om ${schedule.timeOfDay} - ${schedule.postsPerRun} posts - ${platforms}`;
      case 'twice-daily':
        return `2x per dag (${schedule.timeOfDay} en ${schedule.secondTimeOfDay}) - ${schedule.postsPerRun} posts - ${platforms}`;
      case 'weekly':
        const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
        return `Wekelijks op ${days[schedule.dayOfWeek]} om ${schedule.timeOfDay} - ${schedule.postsPerRun} posts - ${platforms}`;
      case 'custom-days':
        const selectedDays = schedule.daysOfWeek?.map((d: number) => days[d]).join(', ') || 'Geen dagen';
        return `Op ${selectedDays} om ${schedule.timeOfDay} - ${schedule.postsPerRun} posts - ${platforms}`;
      default:
        return `${schedule.scheduleType} - ${platforms}`;
    }
  };

  const handleCopyPost = async (post: SocialMediaPost) => {
    try {
      await navigator.clipboard.writeText(post.content);
      setCopiedPostId(post.id);
      toast.success('Post gekopieerd naar klembord!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedPostId(null);
      }, 2000);
    } catch (error) {
      toast.error('Fout bij kopiëren');
    }
  };

  const handleRunAutopilot = async () => {
    const project = projects.find(p => p.id === selectedProject);
    if (!project?.socialMediaConfig?.autopilotEnabled) {
      toast.error('Social Media Autopilot is niet ingeschakeld voor dit project');
      return;
    }

    try {
      setRunningAutopilot(true);
      const response = await fetch('/api/client/social-media/autopilot-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject }),
      });

      const data = await response.json();

      if (data.success) {
        const hasAccounts = project.socialMediaConfig?.lateDevApiKey;
        if (hasAccounts) {
          toast.success(`${data.generated} post(s) gegenereerd en ingepland!`);
        } else {
          toast.success(`${data.generated} post(s) gegenereerd! Je kunt de tekst nu kopiëren en handmatig naar je social media kanalen plakken.`);
        }
        loadPosts();
      } else {
        toast.error(data.error || 'Fout bij uitvoeren van autopilot');
      }
    } catch (error) {
      toast.error('Fout bij uitvoeren van autopilot');
    } finally {
      setRunningAutopilot(false);
    }
  };

  const handleGeneratePost = async () => {
    if (newPlatforms.length === 0 || !newContentType) {
      toast.error('Selecteer eerst minimaal één platform en een content type');
      return;
    }

    try {
      setGenerating(true);
      
      // Generate content using first selected platform
      const generateResponse = await fetch('/api/client/social-media/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          platform: newPlatforms[0], // Use first platform for generation
          contentType: newContentType,
          sourceData: {
            topic: 'Algemene tips en tricks',
          },
        }),
      });

      const generateData = await generateResponse.json();

      if (!generateData.success) {
        toast.error(generateData.error || 'Fout bij genereren van post');
        return;
      }

      setNewContent(generateData.post.content);
      toast.success('Post succesvol gegenereerd!');
    } catch (error) {
      toast.error('Fout bij genereren van post');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreatePost = async () => {
    if (newPlatforms.length === 0 || !newContent || !newContentType) {
      toast.error('Vul alle verplichte velden in (minimaal 1 platform)');
      return;
    }

    try {
      const response = await fetch('/api/client/social-media/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          platforms: newPlatforms, // Multi-platform array
          content: newContent,
          linkUrl: newLinkUrl || undefined,
          contentType: newContentType,
          scheduledFor: newScheduledFor || undefined,
          status: 'draft',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Post opgeslagen voor ${newPlatforms.length} platform(s)!`);
        setShowNewPostDialog(false);
        resetNewPostForm();
        loadPosts();
      } else {
        toast.error(data.error || 'Fout bij opslaan van post');
      }
    } catch (error) {
      toast.error('Fout bij opslaan van post');
    }
  };

  const handlePublishPost = async (postId: string) => {
    try {
      setPublishing(postId);
      const response = await fetch('/api/client/social-media/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Post gepubliceerd! ${data.creditsUsed} credits gebruikt.`);
        loadPosts();
      } else {
        toast.error(data.error || 'Fout bij publiceren van post');
      }
    } catch (error) {
      toast.error('Fout bij publiceren van post');
    } finally {
      setPublishing(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Weet je zeker dat je deze post wilt verwijderen?')) {
      return;
    }

    try {
      setDeleting(postId);
      const response = await fetch(`/api/client/social-media/posts?postId=${postId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Post verwijderd');
        loadPosts();
      } else {
        toast.error(data.error || 'Fout bij verwijderen van post');
      }
    } catch (error) {
      toast.error('Fout bij verwijderen van post');
    } finally {
      setDeleting(null);
    }
  };

  const resetNewPostForm = () => {
    setNewPlatforms([]);
    setNewContentType('');
    setNewContent('');
    setNewLinkUrl('');
    setNewScheduledFor('');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return <Linkedin className="h-5 w-5" />;
      case 'facebook':
        return <Facebook className="h-5 w-5" />;
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Concept</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-600"><Clock className="h-3 w-3 mr-1" /> Ingepland</Badge>;
      case 'published':
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Gepubliceerd</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Mislukt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredPosts = posts.filter(post => post.status === activeTab);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Social Media Autopilot</h1>
            <p className="text-gray-400 mt-1">
              Automatisch social media posts genereren en publiceren
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-64 bg-gray-800 border-gray-700">
                <SelectValue placeholder="Selecteer project" />
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
        </div>

        {/* Info Box */}
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Copy className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-300 mb-1">💡 Handmatige workflow beschikbaar</h3>
                <p className="text-sm text-gray-300">
                  Je kunt social media content genereren <strong>zonder social media accounts te koppelen</strong>. 
                  De posts worden als concept opgeslagen en je kunt de tekst eenvoudig kopiëren met de <Copy className="inline h-3 w-3" /> knop 
                  en handmatig plakken naar je social media kanalen. Perfect voor extra controle voordat je post!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Button
                onClick={handleRunAutopilot}
                disabled={runningAutopilot || !selectedProject}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                {runningAutopilot ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Autopilot Actief...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Autopilot Uitvoeren
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowNewPostDialog(true)}
                disabled={!selectedProject}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe Post
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="planning">📅 Planning</TabsTrigger>
            <TabsTrigger value="draft">Concepten ({posts.filter(p => p.status === 'draft').length})</TabsTrigger>
            <TabsTrigger value="scheduled">Ingepland ({posts.filter(p => p.status === 'scheduled').length})</TabsTrigger>
            <TabsTrigger value="published">Gepubliceerd ({posts.filter(p => p.status === 'published').length})</TabsTrigger>
            <TabsTrigger value="failed">Mislukt ({posts.filter(p => p.status === 'failed').length})</TabsTrigger>
          </TabsList>

          {/* Planning Tab */}
          <TabsContent value="planning" className="space-y-4 mt-6">
            {/* Quick Planning Generator */}
            <Card className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-orange-400" />
                      <CardTitle className="text-orange-100">Snel Planning Genereren</CardTitle>
                    </div>
                    <CardDescription className="text-orange-200/80">
                      Genereer automatisch een volledige week social media posts met 1 druk op de knop
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowQuickPlanningDialog(true)}
                    disabled={!selectedProject}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium px-6"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Genereer Planning
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-800/30 rounded-lg p-4 border border-orange-500/20">
                  <h4 className="font-medium text-sm mb-2 text-orange-100">Hoe werkt het?</h4>
                  <ul className="text-sm text-orange-200/70 space-y-1">
                    <li>✓ Kies het aantal dagen (standaard 7 dagen)</li>
                    <li>✓ Selecteer de platforms (LinkedIn, Facebook, etc.)</li>
                    <li>✓ Klik op "Genereren" en het systeem maakt automatisch posts aan</li>
                    <li>✓ De posts worden als concepten opgeslagen die je kunt bewerken</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Management */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Terugkerende Planning</CardTitle>
                    <CardDescription>
                      Stel terugkerende schema's in voor automatische post generatie
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowScheduleDialog(true)}
                    disabled={!selectedProject}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nieuwe Planning
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingSchedules ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : schedules.length > 0 ? (
                  <div className="space-y-3">
                    {schedules.map((schedule) => (
                      <div 
                        key={schedule.id} 
                        className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{schedule.name}</h3>
                            {schedule.isActive ? (
                              <Badge className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Actief
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Pause className="h-3 w-3 mr-1" />
                                Gepauzeerd
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{getScheduleDescription(schedule)}</p>
                          {schedule.lastRunAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Laatste run: {new Date(schedule.lastRunAt).toLocaleString('nl-NL')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleSchedule(schedule.id, schedule.isActive)}
                          >
                            {schedule.isActive ? (
                              <>
                                <Pause className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-700/30 mb-4">
                      <CalendarClock className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Geen Planningen</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-4">
                      Maak een nieuwe planning aan om automatisch posts te genereren
                    </p>
                    <Button
                      onClick={() => setShowScheduleDialog(true)}
                      disabled={!selectedProject}
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Maak Eerste Planning
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Scheduled Posts */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Komende Posts</CardTitle>
                <CardDescription>
                  Automatisch ingeplande posts op basis van je schema's
                </CardDescription>
              </CardHeader>
              <CardContent>
                {posts.filter(p => p.status === 'scheduled').length > 0 ? (
                  <div className="space-y-2">
                    {posts
                      .filter(p => p.status === 'scheduled')
                      .sort((a, b) => new Date(a.scheduledFor || 0).getTime() - new Date(b.scheduledFor || 0).getTime())
                      .slice(0, 10)
                      .map(post => (
                        <div key={post.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex gap-1">
                              {(post.platforms || []).map(platform => (
                                <div key={platform} className="text-gray-400">
                                  {getPlatformIcon(platform)}
                                </div>
                              ))}
                            </div>
                            <span className="text-sm text-gray-300 line-clamp-1 flex-1">{post.content.substring(0, 80)}...</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 ml-4">
                            <Clock className="h-3 w-3" />
                            {new Date(post.scheduledFor || '').toLocaleDateString('nl-NL', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">
                    Geen posts ingepland. Maak een planning aan of gebruik "Autopilot Uitvoeren".
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Info Box */}
            <Card className="bg-blue-900/20 border-blue-500/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-300 mb-1">💡 Planning Tips</h3>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>Maak meerdere schema's voor verschillende platforms en tijden</li>
                      <li>Dagelijkse posts werken goed voor LinkedIn en Facebook</li>
                      <li>2-3 posts per week is optimaal voor Instagram</li>
                      <li>Posts worden automatisch gegenereerd op basis van je laatste blog content</li>
                      <li>Je kunt planningen pauzeren zonder ze te verwijderen</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {filteredPosts.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-400">Geen posts gevonden</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {(post.platforms || []).map((platform) => (
                              <div key={platform} className="flex items-center gap-1 bg-gray-700/50 px-2 py-1 rounded">
                                {getPlatformIcon(platform)}
                                <span className="text-xs capitalize">{platform}</span>
                              </div>
                            ))}
                          </div>
                          <CardDescription className="text-xs">{post.contentType.replace('_', ' ')}</CardDescription>
                        </div>
                        {getStatusBadge(post.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-300 line-clamp-3">{post.content}</p>
                      
                      {post.linkUrl && (
                        <div className="flex items-center gap-2 text-xs text-blue-400">
                          <span className="truncate">{post.linkUrl}</span>
                        </div>
                      )}

                      {post.scheduledFor && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.scheduledFor).toLocaleString('nl-NL')}
                        </div>
                      )}

                      {post.error && (
                        <p className="text-xs text-red-400">{post.error}</p>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-gray-700">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPreviewPost(post);
                            setShowPreviewDialog(true);
                          }}
                          title="Bekijken"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyPost(post)}
                          className={copiedPostId === post.id ? 'border-green-500 bg-green-500/10' : ''}
                          title="Kopieer naar klembord"
                        >
                          {copiedPostId === post.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {post.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handlePublishPost(post.id)}
                            disabled={publishing === post.id}
                            className="flex-1"
                          >
                            {publishing === post.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Publiceer
                              </>
                            )}
                          </Button>
                        )}

                        {post.status !== 'published' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePost(post.id)}
                            disabled={deleting === post.id}
                          >
                            {deleting === post.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* New Post Dialog */}
        <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nieuwe Social Media Post</DialogTitle>
              <DialogDescription>
                Genereer of schrijf handmatig een nieuwe post
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Platforms (selecteer één of meerdere)</Label>
                <div className="flex flex-wrap gap-2 mt-2 p-3 bg-gray-800 border border-gray-700 rounded-md">
                  {['linkedin', 'facebook', 'instagram', 'twitter', 'youtube'].map((platform) => (
                    <Badge
                      key={platform}
                      variant={newPlatforms.includes(platform) ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => {
                        setNewPlatforms(prev =>
                          prev.includes(platform)
                            ? prev.filter(p => p !== platform)
                            : [...prev, platform]
                        );
                      }}
                    >
                      {platform}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Post wordt naar alle geselecteerde platforms gepubliceerd
                </p>
              </div>

              <div>
                <Label>Content Type</Label>
                <Select value={newContentType} onValueChange={setNewContentType}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Selecteer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog_promo">Blog Promotie</SelectItem>
                    <SelectItem value="product_highlight">Product Highlight</SelectItem>
                    <SelectItem value="tips">Tips & Tricks</SelectItem>
                    <SelectItem value="quotes">Quote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Post Content</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGeneratePost}
                    disabled={generating || newPlatforms.length === 0 || !newContentType}
                  >
                    {generating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    AI Genereren
                  </Button>
                </div>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Post content..."
                  rows={6}
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div>
                <Label>Link URL (optioneel)</Label>
                <Input
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div>
                <Label>Inplannen (optioneel)</Label>
                <Input
                  type="datetime-local"
                  value={newScheduledFor}
                  onChange={(e) => setNewScheduledFor(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                <Button variant="outline" onClick={() => setShowNewPostDialog(false)}>
                  Annuleren
                </Button>
                <Button onClick={handleCreatePost} disabled={newPlatforms.length === 0 || !newContent || !newContentType}>
                  Post Opslaan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Post Preview</DialogTitle>
            </DialogHeader>

            {previewPost && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(previewPost.platforms || []).map((platform) => (
                      <div key={platform} className="flex items-center gap-1 bg-gray-700/50 px-2 py-1 rounded">
                        {getPlatformIcon(platform)}
                        <span className="text-sm capitalize">{platform}</span>
                      </div>
                    ))}
                  </div>
                  {getStatusBadge(previewPost.status)}
                </div>
                <p className="text-sm text-gray-400">{previewPost.contentType.replace('_', ' ')}</p>

                <div className="bg-gray-800 p-4 rounded-lg relative">
                  <p className="whitespace-pre-wrap">{previewPost.content}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyPost(previewPost)}
                    className={`absolute top-2 right-2 ${copiedPostId === previewPost.id ? 'border-green-500 bg-green-500/10' : ''}`}
                    title="Kopieer naar klembord"
                  >
                    {copiedPostId === previewPost.id ? (
                      <>
                        <Check className="h-4 w-4 mr-1 text-green-500" />
                        Gekopieerd
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Kopieer
                      </>
                    )}
                  </Button>
                </div>

                {previewPost.linkUrl && (
                  <div>
                    <Label className="text-xs text-gray-400">Link</Label>
                    <p className="text-sm text-blue-400 break-all">{previewPost.linkUrl}</p>
                  </div>
                )}

                {previewPost.scheduledFor && (
                  <div>
                    <Label className="text-xs text-gray-400">Ingepland voor</Label>
                    <p className="text-sm">{new Date(previewPost.scheduledFor).toLocaleString('nl-NL')}</p>
                  </div>
                )}

                {previewPost.publishedAt && (
                  <div>
                    <Label className="text-xs text-gray-400">Gepubliceerd op</Label>
                    <p className="text-sm">{new Date(previewPost.publishedAt).toLocaleString('nl-NL')}</p>
                  </div>
                )}

                {previewPost.creditsUsed > 0 && (
                  <div>
                    <Label className="text-xs text-gray-400">Credits Gebruikt</Label>
                    <p className="text-sm">{previewPost.creditsUsed} credits</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Quick Planning Generator Dialog */}
        <Dialog open={showQuickPlanningDialog} onOpenChange={setShowQuickPlanningDialog}>
          <DialogContent className="max-w-lg bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-400" />
                <DialogTitle>Snel Planning Genereren</DialogTitle>
              </div>
              <DialogDescription className="text-gray-400">
                Genereer automatisch social media posts op basis van je gepubliceerde content
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Number of Days */}
              <div>
                <Label>Aantal Dagen</Label>
                <Select value={quickPlanningDays} onValueChange={setQuickPlanningDays}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dagen</SelectItem>
                    <SelectItem value="5">5 dagen</SelectItem>
                    <SelectItem value="7">7 dagen (1 week)</SelectItem>
                    <SelectItem value="14">14 dagen (2 weken)</SelectItem>
                    <SelectItem value="30">30 dagen (1 maand)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">
                  Er wordt 1 post per dag per platform gegenereerd
                </p>
              </div>

              {/* Platforms */}
              <div>
                <Label className="mb-2 block">Selecteer Platforms</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                    { value: 'facebook', label: 'Facebook', icon: Facebook },
                    { value: 'instagram', label: 'Instagram', icon: Instagram },
                    { value: 'twitter', label: 'Twitter', icon: Twitter },
                  ].map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <label
                        key={platform.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          quickPlanningPlatforms.includes(platform.value)
                            ? 'bg-orange-600/20 border-orange-500'
                            : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={quickPlanningPlatforms.includes(platform.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQuickPlanningPlatforms([...quickPlanningPlatforms, platform.value]);
                            } else {
                              setQuickPlanningPlatforms(quickPlanningPlatforms.filter((p) => p !== platform.value));
                            }
                          }}
                          className="hidden"
                        />
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{platform.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-300 mb-2">ℹ️ Wat gebeurt er?</h4>
                <ul className="text-xs text-blue-200/70 space-y-1">
                  <li>• Het systeem haalt automatisch je gepubliceerde content op</li>
                  <li>• Voor elk platform wordt een unieke post gegenereerd</li>
                  <li>• Posts worden opgeslagen als <strong>concepten</strong></li>
                  <li>• Je kunt de posts bewerken voordat je ze publiceert</li>
                  <li>• Optimale tijden worden automatisch ingesteld</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowQuickPlanningDialog(false)}
                disabled={generatingPlanning}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleGenerateQuickPlanning}
                disabled={generatingPlanning || quickPlanningPlatforms.length === 0}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                {generatingPlanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bezig met genereren...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Genereer Planning
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nieuwe Planning Aanmaken</DialogTitle>
              <DialogDescription className="text-gray-400">
                Stel een terugkerend schema in voor automatische post generatie
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Name */}
              <div>
                <Label>Naam van Planning</Label>
                <Input
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  placeholder="bijv. Dagelijkse LinkedIn Posts"
                  className="bg-gray-700 border-gray-600"
                />
              </div>

              {/* Schedule Type */}
              <div>
                <Label>Schema Type</Label>
                <Select value={scheduleType} onValueChange={(value: any) => setScheduleType(value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Eenmalig</SelectItem>
                    <SelectItem value="once-daily">1x per dag</SelectItem>
                    <SelectItem value="twice-daily">2x per dag</SelectItem>
                    <SelectItem value="weekly">Wekelijks</SelectItem>
                    <SelectItem value="custom-days">Specifieke dagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date (for once) */}
              {scheduleType === 'once' && (
                <div>
                  <Label>Datum</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              )}

              {/* Time */}
              <div>
                <Label>Tijdstip</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="bg-gray-700 border-gray-600"
                />
              </div>

              {/* Second Time (for twice-daily) */}
              {scheduleType === 'twice-daily' && (
                <div>
                  <Label>Tweede Tijdstip</Label>
                  <Input
                    type="time"
                    value={secondTimeOfDay}
                    onChange={(e) => setSecondTimeOfDay(e.target.value)}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              )}

              {/* Day of Week (for weekly) */}
              {scheduleType === 'weekly' && (
                <div>
                  <Label>Dag van de Week</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Maandag</SelectItem>
                      <SelectItem value="2">Dinsdag</SelectItem>
                      <SelectItem value="3">Woensdag</SelectItem>
                      <SelectItem value="4">Donderdag</SelectItem>
                      <SelectItem value="5">Vrijdag</SelectItem>
                      <SelectItem value="6">Zaterdag</SelectItem>
                      <SelectItem value="0">Zondag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Days of Week (for custom-days) */}
              {scheduleType === 'custom-days' && (
                <div>
                  <Label className="mb-2 block">Selecteer Dagen</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 1, label: 'Maandag' },
                      { value: 2, label: 'Dinsdag' },
                      { value: 3, label: 'Woensdag' },
                      { value: 4, label: 'Donderdag' },
                      { value: 5, label: 'Vrijdag' },
                      { value: 6, label: 'Zaterdag' },
                      { value: 0, label: 'Zondag' },
                    ].map((day) => (
                      <label key={day.value} className="flex items-center gap-2 p-2 bg-gray-700/30 rounded cursor-pointer hover:bg-gray-700/50">
                        <input
                          type="checkbox"
                          checked={daysOfWeek.includes(day.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDaysOfWeek([...daysOfWeek, day.value]);
                            } else {
                              setDaysOfWeek(daysOfWeek.filter((d) => d !== day.value));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts Per Run */}
              <div>
                <Label>Aantal Posts per Keer</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={postsPerRun}
                  onChange={(e) => setPostsPerRun(e.target.value)}
                  className="bg-gray-700 border-gray-600"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Aantal posts dat gegenereerd wordt bij elke run
                </p>
              </div>

              {/* Platforms */}
              <div>
                <Label className="mb-2 block">Platforms</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="h-4 w-4" /> },
                    { value: 'facebook', label: 'Facebook', icon: <Facebook className="h-4 w-4" /> },
                    { value: 'instagram', label: 'Instagram', icon: <Instagram className="h-4 w-4" /> },
                    { value: 'twitter', label: 'Twitter', icon: <Twitter className="h-4 w-4" /> },
                    { value: 'youtube', label: 'YouTube', icon: <Youtube className="h-4 w-4" /> },
                  ].map((platform) => (
                    <label key={platform.value} className="flex items-center gap-2 p-3 bg-gray-700/30 rounded cursor-pointer hover:bg-gray-700/50">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlatforms([...selectedPlatforms, platform.value]);
                          } else {
                            setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform.value));
                          }
                        }}
                        className="rounded"
                      />
                      {platform.icon}
                      <span className="text-sm">{platform.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-gray-300">
                  💡 <strong>Tip:</strong> Posts worden automatisch gegenereerd op basis van je laatste blog content. 
                  De AI kiest de beste content om te promoten op social media.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowScheduleDialog(false);
                  resetScheduleForm();
                }}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleCreateSchedule}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Planning Aanmaken
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
