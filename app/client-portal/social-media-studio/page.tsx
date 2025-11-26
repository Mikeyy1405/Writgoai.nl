
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Share2, 
  Loader2, 
  Sparkles,
  Instagram,
  Linkedin,
  Facebook,
  Twitter,
  Copy,
  Check,
  Hash,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Plus,
  Link as LinkIcon,
  Trash2,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  BookOpen,
  Coins,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { VIDEO_MODELS, VideoModel } from '@/lib/video-models';
import ProjectSelector, { Project } from '@/components/project-selector';

// Media styles - Vadoo AI compatible styles
const IMAGE_STYLES = [
  { id: 'None', name: 'None', icon: '⚪' },
  { id: 'cinematic', name: 'Cinematic', icon: '🎬' },
  { id: 'photographic', name: 'Photographic', icon: '📸' },
  { id: 'digital art', name: 'Digital Art', icon: '🎨' },
  { id: 'fantasy art', name: 'Fantasy Art', icon: '🧙' },
  { id: '3d model', name: '3D Model', icon: '🎲' },
  { id: 'neon punk', name: 'Neon Punk', icon: '⚡' },
  { id: 'analog film', name: 'Analog Film', icon: '📹' },
  { id: 'anime', name: 'Anime', icon: '🎌' },
  { id: 'cartoon', name: 'Cartoon', icon: '🎭' },
  { id: 'comic book', name: 'Comic Book', icon: '📚' },
  { id: 'craft clay', name: 'Craft Clay', icon: '🏺' },
  { id: 'isometric', name: 'Isometric', icon: '📐' },
  { id: 'line art', name: 'Line Art', icon: '✏️' },
  { id: 'low poly', name: 'Low Poly', icon: '🔷' },
  { id: 'origami', name: 'Origami', icon: '🦢' },
  { id: 'pixel art', name: 'Pixel Art', icon: '🎮' },
  { id: 'playground', name: 'Playground', icon: '🎪' },
  { id: 'texture', name: 'Texture', icon: '🧱' },
  { id: 'watercolor', name: 'Watercolor', icon: '🎨' },
];

const VIDEO_STYLES = [
  { id: 'None', name: 'None', icon: '⚪' },
  { id: 'cinematic', name: 'Cinematic', icon: '🎬' },
  { id: 'photographic', name: 'Photographic', icon: '📸' },
  { id: 'digital art', name: 'Digital Art', icon: '🎨' },
  { id: 'fantasy art', name: 'Fantasy Art', icon: '🧙' },
  { id: '3d model', name: '3D Model', icon: '🎲' },
  { id: 'neon punk', name: 'Neon Punk', icon: '⚡' },
  { id: 'analog film', name: 'Analog Film', icon: '📹' },
  { id: 'anime', name: 'Anime', icon: '🎌' },
  { id: 'cartoon', name: 'Cartoon', icon: '🎭' },
  { id: 'comic book', name: 'Comic Book', icon: '📚' },
  { id: 'craft clay', name: 'Craft Clay', icon: '🏺' },
  { id: 'isometric', name: 'Isometric', icon: '📐' },
  { id: 'line art', name: 'Line Art', icon: '✏️' },
  { id: 'low poly', name: 'Low Poly', icon: '🔷' },
  { id: 'origami', name: 'Origami', icon: '🦢' },
  { id: 'pixel art', name: 'Pixel Art', icon: '🎮' },
  { id: 'playground', name: 'Playground', icon: '🎪' },
  { id: 'texture', name: 'Texture', icon: '🧱' },
  { id: 'watercolor', name: 'Watercolor', icon: '🎨' },
];

const STORYTELLING_TYPES = [
  { id: 'hero-journey', name: 'Hero\'s Journey', description: 'Van uitdaging naar oplossing' },
  { id: 'problem-solution', name: 'Probleem-Oplossing', description: 'Focus op het oplossen van een probleem' },
  { id: 'before-after', name: 'Voor-Na', description: 'Transformatie laten zien' },
  { id: 'personal-story', name: 'Persoonlijk Verhaal', description: 'Delen van een persoonlijke ervaring' },
  { id: 'case-study', name: 'Case Study', description: 'Succesverhaal van een klant' },
];

interface SocialMediaAccount {
  id: string;
  platform: string;
  accountName?: string;
  accountHandle?: string;
  isActive: boolean;
  connectedAt: string;
}

interface CalendarItem {
  id: string;
  title: string;
  content: string;
  mediaType?: string;
  mediaUrl?: string;
  mediaStyle?: string;
  scheduledFor: string;
  publishedAt?: string;
  status: string;
  platforms: string[];
  isStorytelling: boolean;
  storyType?: string;
  createdAt: string;
}

// WritgoAI Brand Colors
const BRAND_COLORS = {
  black: '#000000',
  orange: '#ff6b35',
  white: '#FFFFFF',
  cardBg: '#0a0a0a',
  cardBorder: '#1a1a1a',
};

export default function SocialMediaStudio() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  
  // Form state
  const [topic, setTopic] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [length, setLength] = useState('medium');
  const [tone, setTone] = useState('professional');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  
  // Project state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Media state
  const [includeMedia, setIncludeMedia] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaStyle, setMediaStyle] = useState('None');
  const [selectedVideoModel, setSelectedVideoModel] = useState<string>('alibaba/wan2.1-t2v-turbo');
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState('');
  const [generatingMedia, setGeneratingMedia] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);
  
  // Storytelling state
  const [useStorytelling, setUseStorytelling] = useState(false);
  const [storyType, setStoryType] = useState('hero-journey');
  
  // Generated content
  const [generatedPost, setGeneratedPost] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Calendar state
  const [scheduledFor, setScheduledFor] = useState('');
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  
  // Accounts state
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState('');

  // Check authentication
  useEffect(() => {
    if (!session) {
      router.push('/client-login');
    }
  }, [session, router]);

  // Handle project selection
  const handleProjectChange = (newProjectId: string | null, project: Project | null) => {
    setProjectId(newProjectId);
    setSelectedProject(project);
    
    // Auto-fill tone if available from project
    if (project?.toneOfVoice) {
      setTone(project.toneOfVoice.toLowerCase());
    }
  };

  // Load user credits
  useEffect(() => {
    async function loadCredits() {
      try {
        const response = await fetch('/api/client/credits');
        if (response.ok) {
          const data = await response.json();
          setUserCredits(data.credits || 0);
        }
      } catch (error) {
        console.error('Error loading credits:', error);
      }
    }
    if (session) {
      loadCredits();
    }
  }, [session]);

  // Load calendar items
  useEffect(() => {
    if (activeTab === 'calendar') {
      loadCalendarItems();
    }
  }, [activeTab]);

  // Load connected accounts
  useEffect(() => {
    if (activeTab === 'accounts') {
      loadAccounts();
    }
  }, [activeTab]);

  // Load accounts on mount (to check connections)
  useEffect(() => {
    if (session) {
      loadAccounts();
    }
  }, [session]);

  // Platform icons
  const platformIcons: Record<string, any> = {
    instagram: Instagram,
    linkedin: Linkedin,
    facebook: Facebook,
    twitter: Twitter,
  };

  const platformColors: Record<string, string> = {
    instagram: 'bg-pink-600',
    linkedin: 'bg-blue-700',
    facebook: 'bg-blue-600',
    twitter: 'bg-sky-500',
  };

  // Toggle platform selection
  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  // Generate post
  const generatePost = async () => {
    if (!topic.trim()) {
      toast.error('Voer een onderwerp in');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/client/generate-social-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          platforms: selectedPlatforms,
          length,
          tone,
          includeHashtags,
          includeEmojis,
          useStorytelling,
          storyType: useStorytelling ? storyType : undefined,
          projectId: projectId || undefined,
          clientId: (session?.user as any)?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Fout bij het genereren van post');
      }

      const data = await response.json();
      setGeneratedPost(data.post);
      
      // Generate media if requested
      if (includeMedia) {
        await generateMedia(data.post);
      }
      
      toast.success('Social media post succesvol gegenereerd!');
    } catch (error) {
      console.error('Error generating post:', error);
      toast.error('Fout bij het genereren van post');
    } finally {
      setLoading(false);
    }
  };

  // Generate media
  const generateMedia = async (content?: string) => {
    const contentToUse = content || generatedPost;
    
    if (!contentToUse) {
      toast.error('Genereer eerst een post');
      return;
    }

    // Check credits for video generation
    if (mediaType === 'video') {
      const selectedModel = VIDEO_MODELS.find(m => m.id === selectedVideoModel);
      if (selectedModel && userCredits < selectedModel.costPerVideo) {
        toast.error(`Onvoldoende credits. Je hebt ${selectedModel.costPerVideo} credits nodig, maar je hebt er ${userCredits}.`);
        return;
      }
    }

    setGeneratingMedia(true);

    try {
      const response = await fetch('/api/social-media/generate-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToUse,
          mediaType,
          style: mediaType === 'image' ? mediaStyle : undefined,
          videoModel: mediaType === 'video' ? selectedVideoModel : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          toast.error(`Onvoldoende credits: ${errorData.required} nodig, ${errorData.available} beschikbaar`);
          return;
        }
        throw new Error(errorData.details || 'Fout bij het genereren van media');
      }

      const data = await response.json();
      setGeneratedMediaUrl(data.mediaUrl);
      
      // Reload credits after generation
      const creditsResponse = await fetch('/api/client/credits');
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        setUserCredits(creditsData.credits || 0);
      }
      
      if (data.creditsUsed > 0) {
        toast.success(`${mediaType === 'image' ? 'Afbeelding' : 'Video'} succesvol gegenereerd! (${data.creditsUsed} credits gebruikt)`);
      } else {
        toast.success(`${mediaType === 'image' ? 'Afbeelding' : 'Video'} succesvol gegenereerd!`);
      }
    } catch (error) {
      console.error('Error generating media:', error);
      toast.error(error instanceof Error ? error.message : 'Fout bij het genereren van media');
    } finally {
      setGeneratingMedia(false);
    }
  };

  // Save to calendar
  const saveToCalendar = async () => {
    if (!generatedPost || !scheduledFor) {
      toast.error('Post en datum zijn verplicht');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Selecteer minimaal één platform');
      return;
    }

    // Check if selected platforms are connected
    const connectedPlatforms = accounts.filter(a => a.isActive).map(a => a.platform);
    const unconnectedPlatforms = selectedPlatforms.filter(p => !connectedPlatforms.includes(p));
    
    if (unconnectedPlatforms.length > 0) {
      toast.error(`Verbind eerst je ${unconnectedPlatforms.join(', ')} account(s) in het Verbindingen tabblad voordat je posts kunt inplannen.`);
      return;
    }

    try {
      const response = await fetch('/api/social-media/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic.slice(0, 100),
          content: generatedPost,
          mediaType: includeMedia ? mediaType : undefined,
          mediaUrl: generatedMediaUrl || undefined,
          mediaStyle: includeMedia ? (mediaType === 'video' ? selectedVideoModel : mediaStyle) : undefined,
          scheduledFor,
          platforms: selectedPlatforms,
          includeHashtags,
          includeEmojis,
          tone,
          isStorytelling: useStorytelling,
          storyType: useStorytelling ? storyType : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Fout bij opslaan naar kalender');
      }

      toast.success('Opgeslagen in contentkalender!');
      setActiveTab('calendar');
      reset();
    } catch (error) {
      console.error('Error saving to calendar:', error);
      toast.error('Fout bij opslaan naar kalender');
    }
  };

  // Load calendar items
  const loadCalendarItems = async () => {
    setLoadingCalendar(true);
    try {
      const response = await fetch('/api/social-media/calendar');
      if (response.ok) {
        const data = await response.json();
        setCalendarItems(data.items);
      }
    } catch (error) {
      console.error('Error loading calendar:', error);
      toast.error('Fout bij laden van kalender');
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Load accounts
  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await fetch('/api/social-media/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Fout bij laden van accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Connect account
  const connectAccount = async (platform: string) => {
    setConnectingPlatform(platform);
    try {
      const response = await fetch('/api/social-media/connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      if (!response.ok) {
        throw new Error('Fout bij verbinden van account');
      }

      const data = await response.json();
      
      // Open invite URL in new window
      if (data.inviteUrl) {
        window.open(data.inviteUrl, '_blank', 'width=600,height=700');
        toast.success('Volg de stappen om je account te verbinden');
        
        // Reload accounts after a delay
        setTimeout(() => {
          loadAccounts();
        }, 5000);
      }
    } catch (error) {
      console.error('Error connecting account:', error);
      toast.error('Fout bij verbinden van account');
    } finally {
      setConnectingPlatform('');
    }
  };

  // Disconnect account
  const disconnectAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/social-media/accounts?id=${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Fout bij verwijderen van account');
      }

      toast.success('Account verwijderd');
      loadAccounts();
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast.error('Fout bij verwijderen van account');
    }
  };

  // Publish item
  const publishItem = async (itemId: string, publishNow: boolean = false) => {
    try {
      const response = await fetch('/api/social-media/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, publishNow }),
      });

      if (!response.ok) {
        throw new Error('Fout bij publiceren');
      }

      toast.success(publishNow ? 'Post gepubliceerd!' : 'Post ingepland!');
      loadCalendarItems();
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Fout bij publiceren');
    }
  };

  // Delete calendar item
  const deleteCalendarItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/social-media/calendar?id=${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Fout bij verwijderen');
      }

      toast.success('Item verwijderd');
      loadCalendarItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Fout bij verwijderen');
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    toast.success('Gekopieerd naar klembord!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset form
  const reset = () => {
    setTopic('');
    setGeneratedPost('');
    setGeneratedMediaUrl('');
    setScheduledFor('');
    setIncludeMedia(false);
    setUseStorytelling(false);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any; label: string }> = {
      scheduled: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Ingepland' },
      published: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Gepubliceerd' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Mislukt' },
      cancelled: { color: 'bg-[#002040] text-gray-100', icon: XCircle, label: 'Geannuleerd' },
    };

    const variant = variants[status] || variants.scheduled;
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Share2 className="w-6 h-6 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-white">Social Media Studio</h1>
          </div>
          <p className="text-gray-300">
            Creëer professionele social media posts met AI, plan ze in je kalender en publiceer automatisch
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Creëer Post
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Contentkalender
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Verbindingen
            </TabsTrigger>
          </TabsList>

          {/* Create Post Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Settings */}
              <div className="space-y-6">
                <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Post Instellingen
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Configureer je social media post
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
                        placeholder="Waar gaat je post over?"
                        rows={3}
                      />
                    </div>

                    {/* Project Selector */}
                    <div className="space-y-2">
                      <Label>Project (optioneel)</Label>
                      <ProjectSelector
                        value={projectId}
                        onChange={handleProjectChange}
                        autoSelectPrimary={false}
                        showKnowledgeBase={true}
                      />
                      {selectedProject && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          Tone of voice en brand richtlijnen worden automatisch toegepast
                        </p>
                      )}
                    </div>

                    {/* Platforms */}
                    <div className="space-y-2">
                      <Label>Platformen</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {['instagram', 'linkedin', 'facebook', 'twitter'].map((platform) => {
                          const Icon = platformIcons[platform];
                          const isSelected = selectedPlatforms.includes(platform);
                          
                          return (
                            <Button
                              key={platform}
                              type="button"
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() => togglePlatform(platform)}
                              className={isSelected ? platformColors[platform] : ''}
                            >
                              <Icon className="w-4 h-4 mr-2" />
                              {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Storytelling */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Toon Storytelling
                          </Label>
                          <p className="text-sm text-gray-300">
                            Gebruik storytelling technieken
                          </p>
                        </div>
                        <Switch
                          checked={useStorytelling}
                          onCheckedChange={setUseStorytelling}
                        />
                      </div>

                      {useStorytelling && (
                        <div className="space-y-2 pl-6">
                          <Label htmlFor="storyType">Storytelling Type</Label>
                          <Select value={storyType} onValueChange={setStoryType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STORYTELLING_TYPES.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  <div>
                                    <div className="font-medium">{type.name}</div>
                                    <div className="text-xs text-gray-300">{type.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Length */}
                    <div className="space-y-2">
                      <Label htmlFor="length">Lengte</Label>
                      <Select value={length} onValueChange={setLength}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Kort (50-100 woorden)</SelectItem>
                          <SelectItem value="medium">Medium (100-200 woorden)</SelectItem>
                          <SelectItem value="long">Lang (200+ woorden)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tone */}
                    <div className="space-y-2">
                      <Label htmlFor="tone">Toon</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professioneel</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="friendly">Vriendelijk</SelectItem>
                          <SelectItem value="inspiring">Inspirerend</SelectItem>
                          <SelectItem value="humorous">Humoristisch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Switches */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            Hashtags toevoegen
                          </Label>
                          <p className="text-sm text-gray-300">
                            Relevante hashtags voor meer bereik
                          </p>
                        </div>
                        <Switch
                          checked={includeHashtags}
                          onCheckedChange={setIncludeHashtags}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Emoji's toevoegen</Label>
                          <p className="text-sm text-gray-300">
                            Maak je post visueel aantrekkelijker
                          </p>
                        </div>
                        <Switch
                          checked={includeEmojis}
                          onCheckedChange={setIncludeEmojis}
                        />
                      </div>
                    </div>

                    {/* Generate button */}
                    <Button 
                      onClick={generatePost} 
                      disabled={loading || !topic.trim() || selectedPlatforms.length === 0}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Genereren...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Genereer Post
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Media Generation */}
                {generatedPost && (
                  <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {mediaType === 'image' ? <ImageIcon className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
                        Media Toevoegen
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        Genereer een afbeelding of video bij je post
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Credits display */}
                      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-[#ff6b35]" />
                          <span className="font-medium text-blue-900">Je credits:</span>
                        </div>
                        <Badge variant="outline" className="bg-zinc-900">
                          {userCredits} credits
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Media toevoegen</Label>
                        <Switch
                          checked={includeMedia}
                          onCheckedChange={setIncludeMedia}
                        />
                      </div>

                      {includeMedia && (
                        <>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                type="button"
                                variant={mediaType === 'image' ? 'default' : 'outline'}
                                onClick={() => setMediaType('image')}
                                className={mediaType === 'image' ? 'bg-orange-600' : ''}
                              >
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Afbeelding (Gratis)
                              </Button>
                              <Button
                                type="button"
                                variant={mediaType === 'video' ? 'default' : 'outline'}
                                onClick={() => setMediaType('video')}
                                className={mediaType === 'video' ? 'bg-orange-600' : ''}
                              >
                                <VideoIcon className="w-4 h-4 mr-2" />
                                Video
                              </Button>
                            </div>
                          </div>

                          {mediaType === 'image' ? (
                            <div className="space-y-2">
                              <Label>Stijl</Label>
                              <Select value={mediaStyle} onValueChange={setMediaStyle}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {IMAGE_STYLES.map((style) => (
                                    <SelectItem key={style.id} value={style.id}>
                                      {style.icon} {style.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label>Video Model</Label>
                              <Select value={selectedVideoModel} onValueChange={setSelectedVideoModel}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[400px]">
                                  {VIDEO_MODELS.map((model) => (
                                    <SelectItem key={model.id} value={model.id}>
                                      <div className="flex items-center justify-between w-full gap-3">
                                        <div className="flex flex-col">
                                          <span className="font-medium">{model.name}</span>
                                          <span className="text-xs text-gray-300">{model.provider}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant={model.quality === 'premium' ? 'default' : 'outline'} className="text-xs">
                                            {model.quality}
                                          </Badge>
                                          <Badge variant="outline" className="bg-zinc-900 text-green-700 text-xs">
                                            <Coins className="w-3 h-3 mr-1" />
                                            {model.costPerVideo}
                                          </Badge>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              {/* Model info */}
                              {(() => {
                                const selectedModel = VIDEO_MODELS.find(m => m.id === selectedVideoModel);
                                return selectedModel ? (
                                  <div className="p-3 bg-[#002040] rounded-lg text-sm space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-300">Kosten:</span>
                                      <Badge variant="outline" className="bg-zinc-900">
                                        <Coins className="w-3 h-3 mr-1" />
                                        {selectedModel.costPerVideo} credits
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-300">Geschatte tijd:</span>
                                      <span className="font-medium">{selectedModel.estimatedTime}s</span>
                                    </div>
                                    <div className="text-gray-300 mt-2">
                                      {selectedModel.description}
                                    </div>
                                    {userCredits < selectedModel.costPerVideo && (
                                      <div className="flex items-center gap-2 mt-2 p-2 bg-zinc-900 border border-red-200 rounded text-red-700">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span className="text-xs">
                                          Onvoldoende credits! Je hebt {selectedModel.costPerVideo} credits nodig.
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          )}

                          <Button
                            onClick={() => generateMedia()}
                            disabled={generatingMedia || (mediaType === 'video' && VIDEO_MODELS.find(m => m.id === selectedVideoModel)!.costPerVideo > userCredits)}
                            className="w-full"
                          >
                            {generatingMedia ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Genereren...
                              </>
                            ) : (
                              <>
                                {mediaType === 'image' ? <ImageIcon className="w-4 h-4 mr-2" /> : <VideoIcon className="w-4 h-4 mr-2" />}
                                Genereer {mediaType === 'image' ? 'Afbeelding (Gratis)' : `Video (${VIDEO_MODELS.find(m => m.id === selectedVideoModel)?.costPerVideo} credits)`}
                              </>
                            )}
                          </Button>

                          {generatedMediaUrl && (
                            <div className="mt-4 border rounded-lg p-4">
                              {mediaType === 'image' ? (
                                <img src={generatedMediaUrl} alt="Generated" className="w-full rounded" />
                              ) : (
                                <video src={generatedMediaUrl} controls className="w-full rounded" />
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right: Preview */}
              <div className="space-y-6">
                <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="w-5 h-5" />
                      Preview
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Zo ziet je post eruit
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {generatedPost ? (
                      <div className="space-y-4">
                        {/* Post preview */}
                        <div className="bg-zinc-900 border-2 border-zinc-800 rounded-lg p-6 min-h-[300px]">
                          {generatedMediaUrl && (
                            <div className="mb-4">
                              {mediaType === 'image' ? (
                                <img src={generatedMediaUrl} alt="Post media" className="w-full rounded-lg" />
                              ) : (
                                <video src={generatedMediaUrl} controls className="w-full rounded-lg" />
                              )}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap text-white">
                            {generatedPost}
                          </div>
                          
                          {/* Platform badges */}
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                            {selectedPlatforms.map((platform) => {
                              const Icon = platformIcons[platform];
                              return (
                                <Badge key={platform} variant="outline" className="flex items-center gap-1">
                                  <Icon className="w-3 h-3" />
                                  {platform}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button 
                              onClick={copyToClipboard}
                              className="flex-1"
                              variant="outline"
                            >
                              {copied ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Gekopieerd!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Kopieer
                                </>
                              )}
                            </Button>
                            <Button 
                              onClick={reset}
                              variant="outline"
                            >
                              Nieuwe post
                            </Button>
                          </div>

                          {/* Schedule section */}
                          <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="scheduledFor">Inplannen (optioneel)</Label>
                            <Input
                              id="scheduledFor"
                              type="datetime-local"
                              value={scheduledFor}
                              onChange={(e) => setScheduledFor(e.target.value)}
                            />
                            
                            {/* Connection warning */}
                            {(() => {
                              const connectedPlatforms = accounts.filter(a => a.isActive).map(a => a.platform);
                              const unconnectedPlatforms = selectedPlatforms.filter(p => !connectedPlatforms.includes(p));
                              
                              if (unconnectedPlatforms.length > 0) {
                                return (
                                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                      <p className="font-medium mb-1">Social media niet verbonden</p>
                                      <p>Verbind eerst je {unconnectedPlatforms.join(', ')} account(s) in het Verbindingen tabblad om posts in te kunnen plannen.</p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            
                            <Button
                              onClick={saveToCalendar}
                              className="w-full bg-orange-600 hover:bg-orange-700"
                              disabled={selectedPlatforms.some(p => !accounts.filter(a => a.isActive).map(a => a.platform).includes(p))}
                            >
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              Opslaan in Kalender
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-gray-400">
                        <Share2 className="w-12 h-12 mb-4 text-gray-300" />
                        <p>Je gegenereerde post verschijnt hier</p>
                        <p className="text-sm mt-2">Vul de instellingen in en klik op "Genereer Post"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Contentkalender</CardTitle>
                    <CardDescription className="text-gray-300">
                      Bekijk en beheer je geplande posts
                    </CardDescription>
                  </div>
                  <Button onClick={loadCalendarItems} variant="outline" size="sm">
                    <Loader2 className={`w-4 h-4 mr-2 ${loadingCalendar ? 'animate-spin' : ''}`} />
                    Ververs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCalendar ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                  </div>
                ) : calendarItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nog geen items in je kalender</p>
                    <p className="text-sm mt-2">Creëer een post en plan deze in</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {calendarItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{item.title}</h3>
                              {getStatusBadge(item.status)}
                              {item.isStorytelling && (
                                <Badge variant="outline" className="bg-zinc-900">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  Storytelling
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 line-clamp-2">{item.content}</p>
                            
                            {/* Platforms */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.platforms.map((platform) => {
                                const Icon = platformIcons[platform];
                                return Icon ? (
                                  <Badge key={platform} variant="outline" className="text-xs">
                                    <Icon className="w-3 h-3 mr-1" />
                                    {platform}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                            
                            {/* Media indicator */}
                            {item.mediaUrl && (
                              <Badge variant="outline" className="mt-2">
                                {item.mediaType === 'image' ? <ImageIcon className="w-3 h-3 mr-1" /> : <VideoIcon className="w-3 h-3 mr-1" />}
                                {item.mediaType === 'image' ? 'Afbeelding' : 'Video'}: {item.mediaStyle}
                              </Badge>
                            )}
                            
                            {/* Date */}
                            <div className="text-sm text-gray-300 mt-2">
                              <Clock className="w-4 h-4 inline mr-1" />
                              {format(new Date(item.scheduledFor), 'PPpp', { locale: nl })}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            {item.status === 'scheduled' && (
                              <Button
                                size="sm"
                                onClick={() => publishItem(item.id, true)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteCalendarItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Verbonden Accounts</CardTitle>
                    <CardDescription className="text-gray-300">
                      Beheer je social media verbindingen
                    </CardDescription>
                  </div>
                  <Button onClick={loadAccounts} variant="outline" size="sm">
                    <Loader2 className={`w-4 h-4 mr-2 ${loadingAccounts ? 'animate-spin' : ''}`} />
                    Ververs
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Connect buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['instagram', 'linkedin', 'facebook', 'twitter'].map((platform) => {
                    const Icon = platformIcons[platform];
                    const isConnected = accounts.some(a => a.platform === platform && a.isActive);
                    const isConnecting = connectingPlatform === platform;
                    
                    return (
                      <Button
                        key={platform}
                        onClick={() => connectAccount(platform)}
                        disabled={isConnecting || loadingAccounts}
                        variant={isConnected ? 'default' : 'outline'}
                        className={`h-20 flex-col gap-2 ${isConnected ? platformColors[platform] : ''}`}
                      >
                        {isConnecting ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            <Icon className="w-6 h-6" />
                            <span className="text-xs">
                              {isConnected ? 'Verbonden' : 'Verbind'}
                            </span>
                          </>
                        )}
                      </Button>
                    );
                  })}
                </div>

                {/* Connected accounts list */}
                {accounts.length > 0 && (
                  <div className="space-y-3 pt-6 border-t">
                    <h3 className="font-semibold">Verbonden Accounts</h3>
                    {accounts.map((account) => {
                      const Icon = platformIcons[account.platform];
                      
                      return (
                        <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {Icon && <Icon className="w-5 h-5" />}
                            <div>
                              <div className="font-medium">
                                {account.accountName || account.platform}
                              </div>
                              {account.accountHandle && (
                                <div className="text-sm text-gray-300">
                                  {account.accountHandle}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-zinc-900">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Actief
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => disconnectAccount(account.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Info */}
                <div className="bg-zinc-900 border border-orange-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <div className="text-[#ff6b35]">ℹ️</div>
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">Hoe werkt het?</p>
                      <ol className="list-decimal list-inside space-y-1 text-orange-800">
                        <li>Klik op een platform om je account te verbinden</li>
                        <li>Log in met je social media account</li>
                        <li>Geef toestemming voor automatisch posten</li>
                        <li>Je account wordt nu getoond in de lijst</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
