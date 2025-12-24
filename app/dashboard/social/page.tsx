'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface Project {
  id: string;
  name: string;
  website_url: string;
  niche?: string;
  language?: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  connected: boolean;
}

interface SocialPost {
  id: string;
  content: string;
  image_url: string | null;
  image_prompt: string | null;
  post_type: string;
  platforms: { platform: string }[];
  status: string;
  scheduled_for: string | null;
  created_at: string;
}

interface ContentPillar {
  name: string;
  description: string;
  percentage: number;
  example_topics: string[];
}

interface PostTypeMix {
  type: string;
  percentage: number;
  description: string;
}

interface Strategy {
  id: string;
  niche: string;
  target_audience: string;
  brand_voice: string;
  content_pillars: ContentPillar[];
  weekly_schedule: Record<string, { post_type: string; pillar: string; best_time: string }>;
  post_types_mix: PostTypeMix[];
  hashtag_strategy: {
    branded: string[];
    niche: string[];
    trending: string[];
    community: string[];
  };
  engagement_tactics: string[];
  goals: string[];
}

interface ContentIdea {
  title: string;
  type: string;
  pillar: string;
  hook: string;
  cta: string;
}

interface ScheduledContent {
  id: string;
  project_id: string;
  title: string;
  type: string;
  pillar: string | null;
  hook: string | null;
  cta: string | null;
  scheduled_for: string;
  platforms: string[];
  auto_generate: boolean;
  status: 'scheduled' | 'generating' | 'generated' | 'published' | 'failed';
  generated_content: string | null;
  generated_image_url: string | null;
  generated_post_id: string | null;
  error_message: string | null;
  created_at: string;
}

interface DetectedInfo {
  niche: string;
  audience: string;
  voice: string;
  goals: string[];
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: 'bg-black' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black' },
  { id: 'threads', name: 'Threads', icon: '🧵', color: 'bg-gray-800' },
  { id: 'bluesky', name: 'Bluesky', icon: '🦋', color: 'bg-blue-400' },
  { id: 'pinterest', name: 'Pinterest', icon: '📌', color: 'bg-red-500' },
  { id: 'youtube', name: 'YouTube', icon: '📺', color: 'bg-red-700' },
  { id: 'reddit', name: 'Reddit', icon: '🤖', color: 'bg-orange-600' },
  // Note: Google Business, Telegram, and Mastodon are not supported by Late.dev API
];

const POST_TYPES = [
  { id: 'storytelling', name: 'Storytelling', icon: '📖', description: 'Persoonlijk verhaal met les' },
  { id: 'educational', name: 'Educatief', icon: '🎓', description: 'Tips en kennis delen' },
  { id: 'promotional', name: 'Promotioneel', icon: '🎯', description: 'Product of dienst promoten' },
  { id: 'engagement', name: 'Engagement', icon: '💬', description: 'Vraag aan je publiek' },
  { id: 'behind_the_scenes', name: 'Behind the Scenes', icon: '🎬', description: 'Kijkje achter de schermen' },
];

const DAYS_NL = {
  monday: 'Ma',
  tuesday: 'Di',
  wednesday: 'Wo',
  thursday: 'Do',
  friday: 'Vr',
  saturday: 'Za',
  sunday: 'Zo',
};

export default function SocialMediaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lateConfigured, setLateConfigured] = useState<boolean | null>(null);
  const [socialActivated, setSocialActivated] = useState<boolean>(false);
  const [activating, setActivating] = useState(false);

  // Collapsible sections state
  const [strategyExpanded, setStrategyExpanded] = useState(true);
  const [automationExpanded, setAutomationExpanded] = useState(true);
  const [postsExpanded, setPostsExpanded] = useState(true);
  const [calendarExpanded, setCalendarExpanded] = useState(true);

  // Strategy state
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [detectedInfo, setDetectedInfo] = useState<DetectedInfo | null>(null);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [strategyProgress, setStrategyProgress] = useState(0);
  const [strategyStatus, setStrategyStatus] = useState('');

  // Automation state
  const [schedule, setSchedule] = useState<any>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'twice_daily' | 'three_times_daily' | 'weekdays' | 'weekly' | 'custom'>('daily');
  const [schedulePostTimes, setSchedulePostTimes] = useState<string[]>(['09:00']);
  const [schedulePostTypes, setSchedulePostTypes] = useState<string[]>(['educational', 'storytelling', 'engagement']);
  const [scheduleAutoPublish, setScheduleAutoPublish] = useState(false);
  const [autoPopulateCalendar, setAutoPopulateCalendar] = useState(true);
  const [includeHolidays, setIncludeHolidays] = useState(true);
  const [daysAhead, setDaysAhead] = useState(14);
  const [populatingCalendar, setPopulatingCalendar] = useState(false);

  // Post generation form
  const [topic, setTopic] = useState('');
  const [postType, setPostType] = useState('storytelling');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);

  // Edit modal
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [editContent, setEditContent] = useState('');

  // Publish modal
  const [publishingPost, setPublishingPost] = useState<SocialPost | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [publishTiming, setPublishTiming] = useState<'now' | 'scheduled'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Content Calendar state
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleIdeaTitle, setScheduleIdeaTitle] = useState('');
  const [scheduleIdeaType, setScheduleIdeaType] = useState('educational');
  const [scheduleIdeaPillar, setScheduleIdeaPillar] = useState('');
  const [scheduleIdeaHook, setScheduleIdeaHook] = useState('');
  const [scheduleIdeaCta, setScheduleIdeaCta] = useState('');
  const [scheduleIdeaDate, setScheduleIdeaDate] = useState('');
  const [scheduleIdeaTime, setScheduleIdeaTime] = useState('09:00');
  const [scheduleIdeaPlatforms, setScheduleIdeaPlatforms] = useState<string[]>(['instagram']);
  const [savingScheduledContent, setSavingScheduledContent] = useState(false);
  const [editingScheduledItem, setEditingScheduledItem] = useState<ScheduledContent | null>(null);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  // Check for connected callback
  useEffect(() => {
    const connected = searchParams.get('connected');
    const projectId = searchParams.get('project');
    if (connected && projectId) {
      syncAccounts(projectId);
    }
  }, [searchParams]);

  // Load posts and strategy when project changes
  useEffect(() => {
    if (selectedProject) {
      loadPosts(selectedProject.id);
      loadStrategy(selectedProject.id);
      loadSchedule(selectedProject.id);
      loadContentCalendar(selectedProject.id);
      syncAccounts(selectedProject.id);
      checkActivation(selectedProject.id);
    }
  }, [selectedProject]);

  async function checkActivation(projectId: string) {
    try {
      const response = await fetch(`/api/social/activate?project_id=${projectId}`);
      const data = await response.json();
      setSocialActivated(data.activated);
      setLateConfigured(data.late_configured);
    } catch (error) {
      console.error('Failed to check activation:', error);
    }
  }

  async function activateSocial() {
    if (!selectedProject) return;
    
    setActivating(true);
    try {
      const response = await fetch('/api/social/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: selectedProject.id }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSocialActivated(true);
        alert('Social media geactiveerd! Je kunt nu accounts koppelen.');
      } else {
        alert(data.error || 'Activatie mislukt');
      }
    } catch (error: any) {
      alert('Fout bij activeren: ' + error.message);
    } finally {
      setActivating(false);
    }
  }

  async function loadProjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/projects/list');
      const data = await response.json();
      
      if (data.projects) {
        setProjects(data.projects);
        if (data.projects.length > 0) {
          const projectId = searchParams.get('project');
          const project = projectId 
            ? data.projects.find((p: Project) => p.id === projectId) 
            : data.projects[0];
          setSelectedProject(project || data.projects[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStrategy(projectId: string) {
    try {
      const response = await fetch(`/api/social/strategy?project_id=${projectId}`);
      const data = await response.json();
      if (data.strategy) {
        setStrategy(data.strategy);
        setContentIdeas(data.strategy.content_ideas || []);
        setDetectedInfo({
          niche: data.strategy.niche,
          audience: data.strategy.target_audience,
          voice: data.strategy.brand_voice,
          goals: data.strategy.goals || [],
        });
      } else {
        setStrategy(null);
        setContentIdeas([]);
        setDetectedInfo(null);
      }
    } catch (error) {
      console.error('Failed to load strategy:', error);
    }
  }

  async function loadSchedule(projectId: string) {
    try {
      const response = await fetch(`/api/social/schedule?project_id=${projectId}`);
      const data = await response.json();
      if (data.schedule) {
        setSchedule(data.schedule);
        setScheduleEnabled(data.schedule.enabled);
        setScheduleFrequency(data.schedule.frequency);
        setSchedulePostTimes(data.schedule.post_times || ['09:00']);
        setSchedulePostTypes(data.schedule.post_types || ['educational', 'storytelling', 'engagement']);
        setScheduleAutoPublish(data.schedule.auto_publish || false);
        setAutoPopulateCalendar(data.schedule.auto_populate_calendar ?? true);
        setIncludeHolidays(data.schedule.include_holidays ?? true);
        setDaysAhead(data.schedule.days_ahead || 14);
      } else {
        setSchedule(null);
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  }

  async function loadContentCalendar(projectId: string) {
    setLoadingCalendar(true);
    try {
      const response = await fetch(`/api/social/content-calendar?project_id=${projectId}`);
      const data = await response.json();
      if (data.items) {
        setScheduledContent(data.items);
      } else {
        setScheduledContent([]);
      }
    } catch (error) {
      console.error('Failed to load content calendar:', error);
      setScheduledContent([]);
    } finally {
      setLoadingCalendar(false);
    }
  }

  async function saveScheduledContent() {
    if (!selectedProject || !scheduleIdeaTitle.trim() || !scheduleIdeaDate) {
      alert('Vul een titel en datum in');
      return;
    }

    setSavingScheduledContent(true);
    try {
      const scheduledFor = `${scheduleIdeaDate}T${scheduleIdeaTime}:00`;

      const response = await fetch('/api/social/content-calendar', {
        method: editingScheduledItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingScheduledItem?.id,
          project_id: selectedProject.id,
          title: scheduleIdeaTitle.trim(),
          type: scheduleIdeaType,
          pillar: scheduleIdeaPillar || null,
          hook: scheduleIdeaHook || null,
          cta: scheduleIdeaCta || null,
          scheduled_for: scheduledFor,
          platforms: scheduleIdeaPlatforms,
          auto_generate: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Reload the calendar
        await loadContentCalendar(selectedProject.id);
        // Reset form
        resetScheduleForm();
        setShowScheduleModal(false);
      } else {
        alert(data.error || 'Er ging iets mis');
      }
    } catch (error) {
      console.error('Failed to save scheduled content:', error);
      alert('Er ging iets mis bij het opslaan');
    } finally {
      setSavingScheduledContent(false);
    }
  }

  async function deleteScheduledContent(id: string) {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/social/content-calendar?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadContentCalendar(selectedProject.id);
      } else {
        const data = await response.json();
        alert(data.error || 'Verwijderen mislukt');
      }
    } catch (error) {
      console.error('Failed to delete scheduled content:', error);
      alert('Er ging iets mis');
    }
  }

  function resetScheduleForm() {
    setScheduleIdeaTitle('');
    setScheduleIdeaType('educational');
    setScheduleIdeaPillar('');
    setScheduleIdeaHook('');
    setScheduleIdeaCta('');
    setScheduleIdeaDate('');
    setScheduleIdeaTime('09:00');
    setScheduleIdeaPlatforms(['instagram']);
    setEditingScheduledItem(null);
  }

  function openScheduleModal(idea?: ContentIdea) {
    if (idea) {
      setScheduleIdeaTitle(idea.title);
      setScheduleIdeaType(idea.type.toLowerCase());
      setScheduleIdeaPillar(idea.pillar);
      setScheduleIdeaHook(idea.hook);
      setScheduleIdeaCta(idea.cta);
    } else {
      resetScheduleForm();
    }
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleIdeaDate(tomorrow.toISOString().split('T')[0]);
    setShowScheduleModal(true);
  }

  function editScheduledItem(item: ScheduledContent) {
    setEditingScheduledItem(item);
    setScheduleIdeaTitle(item.title);
    setScheduleIdeaType(item.type);
    setScheduleIdeaPillar(item.pillar || '');
    setScheduleIdeaHook(item.hook || '');
    setScheduleIdeaCta(item.cta || '');
    const date = new Date(item.scheduled_for);
    setScheduleIdeaDate(date.toISOString().split('T')[0]);
    setScheduleIdeaTime(date.toTimeString().slice(0, 5));
    setScheduleIdeaPlatforms(item.platforms || ['instagram']);
    setShowScheduleModal(true);
  }

  function formatScheduledDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'scheduled':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Gepland' };
      case 'generating':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Bezig...' };
      case 'generated':
        return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Gegenereerd' };
      case 'published':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Gepubliceerd' };
      case 'failed':
        return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Mislukt' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status };
    }
  }

  async function saveSchedule() {
    if (!selectedProject) return;

    setSavingSchedule(true);
    try {
      const response = await fetch('/api/social/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          enabled: scheduleEnabled,
          frequency: scheduleFrequency,
          post_times: schedulePostTimes,
          post_types: schedulePostTypes,
          auto_publish: scheduleAutoPublish,
          auto_generate_content: true,
          use_content_ideas: true,
          target_platforms: selectedPlatforms,
          schedule_posts: !scheduleAutoPublish,
          auto_populate_calendar: autoPopulateCalendar,
          include_holidays: includeHolidays,
          days_ahead: daysAhead,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSchedule(data.schedule);
        // Reload the calendar to show newly populated items
        if (autoPopulateCalendar) {
          await loadContentCalendar(selectedProject.id);
        }
        alert('✅ Automatisering opgeslagen! De kalender wordt automatisch gevuld.');
      } else {
        alert('❌ ' + (data.error || 'Er ging iets mis'));
      }
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('❌ Er ging iets mis bij het opslaan');
    } finally {
      setSavingSchedule(false);
    }
  }

  async function manualPopulateCalendar() {
    if (!selectedProject) return;

    setPopulatingCalendar(true);
    try {
      const response = await fetch('/api/social/auto-populate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          days_ahead: daysAhead,
          include_holidays: includeHolidays,
          platforms: selectedPlatforms,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadContentCalendar(selectedProject.id);
        alert(`✅ Kalender gevuld! ${data.items_created} items toegevoegd.`);
      } else {
        alert('❌ ' + (data.error || 'Er ging iets mis'));
      }
    } catch (error) {
      console.error('Failed to populate calendar:', error);
      alert('❌ Er ging iets mis bij het vullen van de kalender');
    } finally {
      setPopulatingCalendar(false);
    }
  }

  async function generateStrategy() {
    if (!selectedProject) return;

    setGeneratingStrategy(true);
    setStrategyProgress(0);
    setStrategyStatus('Website analyseren...');

    // Simulate progress steps
    const progressSteps = [
      { progress: 10, status: 'Website content ophalen...' },
      { progress: 25, status: 'Niche en doelgroep detecteren...' },
      { progress: 40, status: 'Brand voice analyseren...' },
      { progress: 55, status: 'Content pillars genereren...' },
      { progress: 70, status: 'Weekschema opstellen...' },
      { progress: 85, status: 'Hashtags en tactieken bepalen...' },
      { progress: 95, status: 'Content ideeën genereren...' },
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setStrategyProgress(progressSteps[stepIndex].progress);
        setStrategyStatus(progressSteps[stepIndex].status);
        stepIndex++;
      }
    }, 3000);

    try {
      const response = await fetch('/api/social/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
        }),
      });

      clearInterval(progressInterval);

      const data = await response.json();
      if (data.success) {
        setStrategyProgress(100);
        setStrategyStatus('Strategie compleet!');
        setStrategy(data.strategy);
        setContentIdeas(data.content_ideas || []);
        setDetectedInfo(data.detected || null);
      } else {
        setStrategyStatus('Fout: ' + (data.error || 'Er ging iets mis'));
        alert(data.error || 'Er ging iets mis');
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Failed to generate strategy:', error);
      setStrategyStatus('Er ging iets mis bij het genereren');
      alert('Er ging iets mis bij het genereren');
    } finally {
      setGeneratingStrategy(false);
    }
  }

  async function syncAccounts(projectId: string) {
    try {
      // Call POST endpoint to ensure profile exists and is synced
      const response = await fetch('/api/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Sync accounts failed:', data);
        setLateConfigured(false);
        setAccounts([]);
        
        // Show user-friendly error
        if (data.manual_mode) {
          // Silent fail - user can still use manual mode
        } else if (data.error) {
          alert(`Fout bij verbinden met Later.dev: ${data.error}`);
        }
        return;
      }
      
      setAccounts(data.accounts || []);
      setLateConfigured(data.configured ?? true);
      
      console.log('✅ Accounts synced:', data.accounts?.length || 0, 'accounts');
      
    } catch (error) {
      console.error('Failed to sync accounts:', error);
      setLateConfigured(false);
      setAccounts([]);
    }
  }

  async function loadPosts(projectId: string) {
    try {
      const response = await fetch(`/api/social/generate-post?project_id=${projectId}`);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  }

  async function connectPlatform(platform: string) {
    if (!selectedProject) return;

    try {
      console.log(`🔗 Connecting ${platform} for project ${selectedProject.id}`);
      const response = await fetch(
        `/api/social/connect?project_id=${selectedProject.id}&platform=${platform}`
      );
      const data = await response.json();

      console.log('Connect response:', data);

      if (data.connectUrl) {
        console.log('✅ Redirecting to Getlate.dev:', data.connectUrl);
        // Use window.location.href for redirect to external auth page
        window.location.href = data.connectUrl;
      } else if (data.error) {
        console.error('❌ Connect error:', data.error);
        alert(`Fout bij verbinden: ${data.error}\n\n${data.details || ''}`);
      } else {
        console.error('❌ No connectUrl in response:', data);
        alert('Er ging iets mis: geen connectUrl ontvangen van de server');
      }
    } catch (error) {
      console.error('❌ Failed to get connect URL:', error);
      alert('Fout bij verbinden: ' + (error as Error).message);
    }
  }

  async function generatePost(ideaTopic?: string, ideaType?: string, ideaIndex?: number) {
    const topicToUse = ideaTopic || topic;
    if (!selectedProject || !topicToUse.trim()) {
      alert('Vul een topic in');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/social/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          topic: topicToUse.trim(),
          post_type: ideaType || postType,
          platforms: selectedPlatforms,
          language: selectedProject.language || 'nl',
          niche: strategy?.niche || selectedProject.niche || '',
          website_url: selectedProject.website_url,
          content_idea_index: ideaIndex,
          strategy: strategy ? {
            brand_voice: strategy.brand_voice,
            hashtags: strategy.hashtag_strategy,
          } : undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTopic('');
        loadPosts(selectedProject.id);
      } else {
        alert(data.error || 'Er ging iets mis');
      }
    } catch (error) {
      console.error('Failed to generate post:', error);
      alert('Er ging iets mis bij het genereren');
    } finally {
      setGenerating(false);
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Weet je zeker dat je deze post wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/social/publish?post_id=${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  }

  async function updatePost() {
    if (!editingPost) return;

    try {
      const response = await fetch('/api/social/publish', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: editingPost.id,
          content: editContent,
        }),
      });

      if (response.ok) {
        setPosts(posts.map(p => 
          p.id === editingPost.id ? { ...p, content: editContent } : p
        ));
        setEditingPost(null);
      }
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert('Gekopieerd naar klembord!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  async function publishPost() {
    if (!publishingPost || selectedAccounts.length === 0) {
      alert('Selecteer minimaal één account');
      return;
    }

    setPublishing(true);
    try {
      // Note: We send local time, API will handle timezone conversion to Europe/Amsterdam
      const scheduledFor = publishTiming === 'scheduled' && scheduledDate && scheduledTime
        ? `${scheduledDate}T${scheduledTime}:00`
        : undefined;

      const response = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: publishingPost.id,
          account_ids: selectedAccounts,
          scheduled_for: scheduledFor,
          publish_now: publishTiming === 'now',
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Reload posts to get updated status from server
        if (selectedProject) {
          await loadPosts(selectedProject.id);
        }
        
        alert(data.manual 
          ? 'Post is klaar! Kopieer de content om handmatig te plaatsen.' 
          : `Post ${publishTiming === 'now' ? 'gepubliceerd' : 'ingepland'}!`
        );
        
        // Close modal
        setPublishingPost(null);
        setSelectedAccounts([]);
        setPublishTiming('now');
        setScheduledDate('');
        setScheduledTime('');
      } else {
        alert(data.error || 'Er ging iets mis bij het publiceren');
      }
    } catch (error) {
      console.error('Failed to publish post:', error);
      alert('Er ging iets mis bij het publiceren');
    } finally {
      setPublishing(false);
    }
  }

  async function downloadImage(url: string, filename: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download image:', error);
      window.open(url, '_blank');
    }
  }

  function togglePlatform(platform: string) {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              📱 Social Media
            </h1>
            <p className="text-gray-400 mt-1">AI-powered strategie en content</p>
          </div>

          {/* Project selector */}
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value);
              setSelectedProject(project || null);
            }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Streamlined sections - all visible in logical flow */}
        <div className="space-y-6">

        {/* 1. Calendar Section */}
        <div className="border-t border-gray-700/50 pt-6">
          <button
            onClick={() => setCalendarExpanded(!calendarExpanded)}
            className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 hover:from-purple-500/20 hover:to-pink-500/20 transition flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div className="text-left">
                <h2 className="text-xl font-bold">Publicatiekalender</h2>
                <p className="text-gray-400 text-sm">Plan je content in en laat AI automatisch schrijven</p>
              </div>
              {scheduledContent.length > 0 && (
                <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                  {scheduledContent.filter(s => s.status === 'scheduled').length}
                </span>
              )}
            </div>
            <span className="text-2xl text-gray-400">{calendarExpanded ? '−' : '+'}</span>
          </button>

        {calendarExpanded && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    📅 Publicatiekalender
                  </h2>
                  <p className="text-gray-400 mt-1">
                    Plan je content in en laat AI automatisch schrijven en publiceren
                  </p>
                </div>
                <button
                  onClick={() => openScheduleModal()}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2"
                >
                  + Nieuw item inplannen
                </button>
              </div>
            </div>

            {/* Quick add from content ideas */}
            {contentIdeas.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  💡 Snel inplannen vanuit ideeën
                  <span className="text-sm font-normal text-gray-400">({contentIdeas.length} beschikbaar)</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {contentIdeas.slice(0, 8).map((idea, index) => (
                    <button
                      key={index}
                      onClick={() => openScheduleModal(idea)}
                      className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition flex items-center gap-2"
                    >
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                        {idea.type}
                      </span>
                      <span className="truncate max-w-[200px]">{idea.title}</span>
                      <span className="text-orange-400">+</span>
                    </button>
                  ))}
                  {contentIdeas.length > 8 && (
                    <span className="text-sm text-gray-400 flex items-center px-3">
                      +{contentIdeas.length - 8} meer...
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Calendar List */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Geplande Content</h3>
                {loadingCalendar && (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500"></div>
                )}
              </div>

              {scheduledContent.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-4">📭</p>
                  <p className="font-medium mb-2">Nog geen content ingepland</p>
                  <p className="text-sm">
                    Klik op "Nieuw item inplannen" of selecteer een idee hierboven om te beginnen
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                        <th className="pb-3 font-medium">Datum/Tijd</th>
                        <th className="pb-3 font-medium">Titel</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Platform</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {scheduledContent.map((item) => {
                        const statusBadge = getStatusBadge(item.status);
                        const isPast = new Date(item.scheduled_for) < new Date();
                        return (
                          <tr key={item.id} className={`hover:bg-gray-700/50 ${isPast && item.status === 'scheduled' ? 'opacity-60' : ''}`}>
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-mono ${isPast ? 'text-gray-500' : 'text-white'}`}>
                                  {formatScheduledDate(item.scheduled_for)}
                                </span>
                                {isPast && item.status === 'scheduled' && (
                                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                    Verlopen
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="max-w-[250px]">
                                <p className="font-medium truncate">{item.title}</p>
                                {item.hook && (
                                  <p className="text-xs text-gray-400 truncate mt-1">
                                    Hook: {item.hook}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <span className="text-sm">
                                {POST_TYPES.find(t => t.id === item.type)?.icon || '📝'}{' '}
                                {POST_TYPES.find(t => t.id === item.type)?.name || item.type}
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="flex gap-1">
                                {item.platforms?.map((p) => (
                                  <span key={p} className="text-lg" title={p}>
                                    {PLATFORMS.find(pl => pl.id === p)?.icon || '📱'}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <span className={`text-xs px-2 py-1 rounded ${statusBadge.bg} ${statusBadge.text}`}>
                                {statusBadge.label}
                              </span>
                              {item.error_message && (
                                <p className="text-xs text-red-400 mt-1 max-w-[150px] truncate" title={item.error_message}>
                                  {item.error_message}
                                </p>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {item.status === 'scheduled' && (
                                  <button
                                    onClick={() => editScheduledItem(item)}
                                    className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded transition"
                                  >
                                    Bewerken
                                  </button>
                                )}
                                {item.generated_content && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.generated_content!);
                                      alert('Gekopieerd!');
                                    }}
                                    className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded transition"
                                  >
                                    Kopiëren
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteScheduledContent(item.id)}
                                  className="text-xs bg-red-600/50 hover:bg-red-600 px-3 py-1.5 rounded transition"
                                >
                                  Verwijderen
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Info box */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">Hoe werkt de publicatiekalender?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                <div className="flex gap-3">
                  <span className="text-2xl">1️⃣</span>
                  <div>
                    <p className="font-medium text-white mb-1">Plan in</p>
                    <p>Kies een onderwerp en stel de publicatiedatum in</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">2️⃣</span>
                  <div>
                    <p className="font-medium text-white mb-1">AI schrijft</p>
                    <p>Op de geplande tijd genereert AI automatisch de content</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">3️⃣</span>
                  <div>
                    <p className="font-medium text-white mb-1">Publiceren</p>
                    <p>Content wordt automatisch gepubliceerd naar je accounts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div> {/* End Calendar Section */}

        {/* 2. Strategy Section */}
        <div className="border-t border-gray-700/50 pt-6">
          <button
            onClick={() => setStrategyExpanded(!strategyExpanded)}
            className="w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4 hover:from-blue-500/20 hover:to-purple-500/20 transition flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div className="text-left">
                <h2 className="text-xl font-bold">Strategie</h2>
                <p className="text-gray-400 text-sm">AI-gegenereerde social media strategie</p>
              </div>
            </div>
            <span className="text-2xl text-gray-400">{strategyExpanded ? '−' : '+'}</span>
          </button>

        {strategyExpanded && (
          <div className="space-y-6 mb-6">
            {/* Generate Strategy Button */}
            {!strategy && !generatingStrategy && (
              <div className="bg-gray-800 rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold mb-2">Genereer je Social Media Strategie</h2>
                <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                  AI analyseert automatisch je website en genereert een complete contentstrategie 
                  met content pillars, weekschema, hashtags en 15+ content ideeën.
                </p>
                <button
                  onClick={generateStrategy}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-8 py-4 rounded-xl transition flex items-center justify-center gap-2 mx-auto text-lg"
                >
                  🤖 Genereer Strategie met AI
                </button>
              </div>
            )}

            {/* Progress Bar during generation */}
            {generatingStrategy && (
              <div className="bg-gray-800 rounded-xl p-8">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                    <h2 className="text-xl font-semibold">Social Media Strategie Genereren</h2>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">{strategyStatus}</span>
                      <span className="text-orange-400 font-medium">{strategyProgress}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 ease-out"
                        style={{ width: `${strategyProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Steps indicator */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                    {[
                      { icon: '🌐', label: 'Website', done: strategyProgress >= 10 },
                      { icon: '🎯', label: 'Doelgroep', done: strategyProgress >= 25 },
                      { icon: '📊', label: 'Pillars', done: strategyProgress >= 55 },
                      { icon: '💡', label: 'Ideeën', done: strategyProgress >= 95 },
                    ].map((step, i) => (
                      <div 
                        key={i}
                        className={`flex items-center gap-2 p-3 rounded-lg transition ${
                          step.done 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        <span>{step.icon}</span>
                        <span className="text-sm">{step.label}</span>
                        {step.done && <span className="ml-auto">✓</span>}
                      </div>
                    ))}
                  </div>

                  <p className="text-center text-gray-500 text-sm mt-6">
                    Dit kan 20-30 seconden duren...
                  </p>
                </div>
              </div>
            )}

            {/* Strategy Display */}
            {strategy && (
              <>
                {/* Detected Info */}
                {detectedInfo && (
                  <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        🤖 AI Analyse
                      </h2>
                      <button
                        onClick={generateStrategy}
                        disabled={generatingStrategy}
                        className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition flex items-center gap-2"
                      >
                        {generatingStrategy ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            Bezig...
                          </>
                        ) : (
                          <>🔄 Opnieuw analyseren</>
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-orange-400 mb-1">Niche</div>
                        <div className="font-medium">{detectedInfo.niche}</div>
                      </div>
                      <div>
                        <div className="text-sm text-orange-400 mb-1">Doelgroep</div>
                        <div className="font-medium text-sm">{detectedInfo.audience}</div>
                      </div>
                      <div>
                        <div className="text-sm text-orange-400 mb-1">Brand Voice</div>
                        <div className="font-medium text-sm">{detectedInfo.voice}</div>
                      </div>
                      <div>
                        <div className="text-sm text-orange-400 mb-1">Doelen</div>
                        <div className="flex flex-wrap gap-1">
                          {detectedInfo.goals?.slice(0, 3).map((goal, i) => (
                            <span key={i} className="text-xs bg-gray-700 px-2 py-1 rounded">{goal}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Pillars */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">🎯 Content Pillars</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {strategy.content_pillars?.map((pillar, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{pillar.name}</h3>
                          <span className="text-orange-400 font-bold">{pillar.percentage}%</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{pillar.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {pillar.example_topics?.slice(0, 3).map((topic, i) => (
                            <span key={i} className="text-xs bg-gray-600 px-2 py-1 rounded">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Schedule */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">📅 Weekschema</h2>
                  <div className="grid grid-cols-7 gap-2">
                    {Object.entries(DAYS_NL).map(([day, dayNl]) => {
                      const schedule = strategy.weekly_schedule?.[day];
                      return (
                        <div key={day} className="bg-gray-700 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-orange-400 mb-2">{dayNl}</div>
                          {schedule ? (
                            <>
                              <div className="text-xs text-gray-400">{schedule.best_time}</div>
                              <div className="text-sm mt-1 font-medium">{schedule.post_type}</div>
                              <div className="text-xs text-gray-500 mt-1 truncate">{schedule.pillar}</div>
                            </>
                          ) : (
                            <div className="text-xs text-gray-500">Geen post</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Post Types Mix & Hashtags */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">📊 Post Types Mix</h2>
                    <div className="space-y-3">
                      {strategy.post_types_mix?.map((type, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{type.type}</span>
                            <span className="text-orange-400">{type.percentage}%</span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                              style={{ width: `${type.percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hashtag Strategy */}
                  <div className="bg-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">#️⃣ Hashtag Strategie</h2>
                    <div className="space-y-4">
                      {strategy.hashtag_strategy && Object.entries(strategy.hashtag_strategy).map(([category, tags]) => (
                        <div key={category}>
                          <h3 className="text-sm font-medium text-gray-400 mb-2 capitalize">{category}</h3>
                          <div className="flex flex-wrap gap-2">
                            {(tags as string[])?.map((tag, i) => (
                              <span
                                key={i}
                                onClick={() => copyToClipboard(tag)}
                                className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full cursor-pointer transition"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Engagement Tactics */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">💡 Engagement Tactieken</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {strategy.engagement_tactics?.map((tactic, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-3 flex items-start gap-3">
                        <span className="text-orange-400">✓</span>
                        <span className="text-sm">{tactic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content Ideas */}
                {contentIdeas.length > 0 && (
                  <div className="bg-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">💡 Content Ideeën ({contentIdeas.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {contentIdeas.map((idea, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                              {idea.type}
                            </span>
                            <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                              {idea.pillar}
                            </span>
                          </div>
                          <h3 className="font-medium mb-2">{idea.title}</h3>
                          <p className="text-sm text-gray-400 mb-2">
                            <span className="text-orange-400">Hook:</span> {idea.hook}
                          </p>
                          <p className="text-sm text-gray-400 mb-3">
                            <span className="text-orange-400">CTA:</span> {idea.cta}
                          </p>
                          <button
                            onClick={() => generatePost(idea.title, idea.type.toLowerCase(), index)}
                            disabled={generating}
                            className="w-full text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-4 py-2 rounded-lg transition"
                          >
                            {generating ? 'Bezig...' : '✨ Maak Post'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        </div> {/* End Strategy Section */}

        {/* 3. Automation Section */}
        <div className="border-t border-gray-700/50 pt-6">
          <button
            onClick={() => setAutomationExpanded(!automationExpanded)}
            className="w-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 hover:from-green-500/20 hover:to-emerald-500/20 transition flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div className="text-left">
                <h2 className="text-xl font-bold">Automatisering</h2>
                <p className="text-gray-400 text-sm">Configureer automatische post generatie</p>
              </div>
              {schedule?.enabled && (
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                  Actief
                </span>
              )}
            </div>
            <span className="text-2xl text-gray-400">{automationExpanded ? '−' : '+'}</span>
          </button>
        </div>

        {automationExpanded && (
          <div className="space-y-6 mb-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    🤖 Automatische Post Scheduling
                  </h2>
                  <p className="text-gray-400 mt-1">
                    Laat het systeem automatisch posts genereren en plannen
                  </p>
                </div>
                {schedule && (
                  <div className={`px-4 py-2 rounded-lg font-medium ${
                    schedule.enabled
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {schedule.enabled ? '✅ Actief' : '⏸️ Gepauzeerd'}
                  </div>
                )}
              </div>
            </div>

            {/* Enable/Disable */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Automatisering aan/uit</h3>
                  <p className="text-sm text-gray-400">
                    Schakel automatische post generatie in of uit
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {scheduleEnabled && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400">
                    ✅ Automatisering is ingeschakeld. Het systeem zal posts genereren volgens onderstaande schema.
                  </p>
                </div>
              )}
            </div>

            {/* Frequency Selection */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">📅 Post Frequentie</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'daily', name: 'Dagelijks', description: '1x per dag', icon: '📆' },
                  { id: 'twice_daily', name: '2x per dag', description: 'Ochtend & middag', icon: '📅📅' },
                  { id: 'three_times_daily', name: '3x per dag', description: 'Ochtend, middag & avond', icon: '📅📅📅' },
                  { id: 'weekdays', name: 'Werkdagen', description: 'Ma-Vr', icon: '💼' },
                  { id: 'weekly', name: 'Wekelijks', description: '1x per week', icon: '📖' },
                ].map(freq => (
                  <button
                    key={freq.id}
                    onClick={() => setScheduleFrequency(freq.id as any)}
                    className={`p-4 rounded-lg text-left transition ${
                      scheduleFrequency === freq.id
                        ? 'bg-orange-500/20 border-2 border-orange-500'
                        : 'bg-gray-700 border-2 border-transparent hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">{freq.icon}</div>
                    <div className="font-medium">{freq.name}</div>
                    <div className="text-sm text-gray-400">{freq.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Post Times */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">🕐 Post Tijden</h3>
              <p className="text-sm text-gray-400 mb-4">
                Kies op welke tijdstippen posts automatisch moeten worden gegenereerd/gepland
              </p>
              <div className="space-y-3">
                {schedulePostTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const newTimes = [...schedulePostTimes];
                        newTimes[index] = e.target.value;
                        setSchedulePostTimes(newTimes);
                      }}
                      className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                    {schedulePostTimes.length > 1 && (
                      <button
                        onClick={() => {
                          const newTimes = schedulePostTimes.filter((_, i) => i !== index);
                          setSchedulePostTimes(newTimes);
                        }}
                        className="text-red-400 hover:text-red-300 px-3 py-2"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
                {scheduleFrequency !== 'daily' && scheduleFrequency !== 'weekdays' && scheduleFrequency !== 'weekly' && schedulePostTimes.length < 3 && (
                  <button
                    onClick={() => setSchedulePostTimes([...schedulePostTimes, '12:00'])}
                    className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
                  >
                    + Tijd toevoegen
                  </button>
                )}
              </div>
            </div>

            {/* Post Types */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">📝 Post Types</h3>
              <p className="text-sm text-gray-400 mb-4">
                Selecteer welke type posts automatisch moeten worden gegenereerd (rotatie)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {POST_TYPES.map(type => (
                  <label
                    key={type.id}
                    className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition ${
                      schedulePostTypes.includes(type.id)
                        ? 'bg-orange-500/20 border-2 border-orange-500'
                        : 'bg-gray-700 border-2 border-transparent hover:bg-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={schedulePostTypes.includes(type.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSchedulePostTypes([...schedulePostTypes, type.id]);
                        } else {
                          setSchedulePostTypes(schedulePostTypes.filter(t => t !== type.id));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{type.icon}</span>
                        <span className="font-medium">{type.name}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Auto-populate Calendar Settings */}
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">📅 Automatisch Kalender Vullen</h3>
              <p className="text-sm text-gray-400 mb-4">
                Laat het systeem automatisch je publicatiekalender vullen op basis van je frequentie-instellingen
              </p>

              <div className="space-y-4">
                {/* Enable auto-populate */}
                <label className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPopulateCalendar}
                    onChange={(e) => setAutoPopulateCalendar(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Automatisch kalender vullen</div>
                    <div className="text-sm text-gray-400">
                      De kalender wordt automatisch gevuld volgens je frequentie-instellingen
                    </div>
                  </div>
                </label>

                {autoPopulateCalendar && (
                  <>
                    {/* Include holidays */}
                    <label className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeHolidays}
                        onChange={(e) => setIncludeHolidays(e.target.checked)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          🎉 Nederlandse feestdagen
                        </div>
                        <div className="text-sm text-gray-400">
                          Automatisch content plannen rond Koningsdag, Kerst, Pasen, etc.
                        </div>
                      </div>
                    </label>

                    {/* Days ahead selector */}
                    <div className="p-4 bg-gray-700/50 rounded-lg">
                      <div className="font-medium mb-2">Dagen vooruit plannen</div>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="7"
                          max="30"
                          value={daysAhead}
                          onChange={(e) => setDaysAhead(parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-orange-400 font-mono w-16 text-right">{daysAhead} dagen</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        De kalender wordt {daysAhead} dagen vooruit automatisch gevuld
                      </div>
                    </div>

                    {/* Manual populate button */}
                    <button
                      onClick={manualPopulateCalendar}
                      disabled={populatingCalendar}
                      className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      {populatingCalendar ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          Kalender vullen...
                        </>
                      ) : (
                        <>📅 Nu kalender vullen</>
                      )}
                    </button>
                  </>
                )}

                {autoPopulateCalendar && includeHolidays && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-400">
                      🇳🇱 AI genereert automatisch feestdag-gerelateerde content voor Nederlandse feestdagen zoals Koningsdag, Sinterklaas, Kerst en meer!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Publishing Settings */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">📤 Publishing Instellingen</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleAutoPublish}
                    onChange={(e) => setScheduleAutoPublish(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="font-medium">Direct publiceren</div>
                    <div className="text-sm text-gray-400">
                      Posts worden automatisch gepubliceerd naar verbonden accounts (anders als concept opgeslagen)
                    </div>
                  </div>
                </label>

                {scheduleAutoPublish && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-400 flex items-center gap-2">
                      ⚠️ Let op: Posts worden automatisch gepubliceerd zonder handmatige review!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Next Run Info */}
            {schedule?.next_run_at && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">⏰ Volgende Run</h3>
                <p className="text-gray-300">
                  Volgende post wordt gegenereerd op:{' '}
                  <span className="font-mono text-blue-400">
                    {new Date(schedule.next_run_at).toLocaleString('nl-NL')}
                  </span>
                </p>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={saveSchedule}
                disabled={savingSchedule || schedulePostTypes.length === 0}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition flex items-center gap-2"
              >
                {savingSchedule ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Opslaan...
                  </>
                ) : (
                  <>💾 Automatisering Opslaan</>
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">ℹ️ Hoe werkt het?</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex gap-3">
                  <span className="text-orange-400">1.</span>
                  <p>
                    Stel je gewenste frequentie en tijden in (bijv. dagelijks om 09:00)
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-orange-400">2.</span>
                  <p>
                    De kalender wordt automatisch gevuld met content items op basis van je frequentie
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-orange-400">3.</span>
                  <p>
                    🎉 Nederlandse feestdagen worden automatisch meegenomen (Koningsdag, Kerst, Pasen, etc.)
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-orange-400">4.</span>
                  <p>
                    Op de geplande tijden genereert AI automatisch de content en afbeeldingen
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-orange-400">5.</span>
                  <p>
                    Je kunt altijd handmatig items toevoegen, bewerken of verwijderen in de kalender
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div> {/* End Automation Section */}

        {/* 4. Posts Section */}
        <div className="border-t border-gray-700/50 pt-6">
          <button
            onClick={() => setPostsExpanded(!postsExpanded)}
            className="w-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-4 hover:from-orange-500/20 hover:to-red-500/20 transition flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div className="text-left">
                <h2 className="text-xl font-bold">Content Genereren</h2>
                <p className="text-gray-400 text-sm">Maak handmatig posts met AI</p>
              </div>
              {posts.length > 0 && (
                <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                  {posts.length}
                </span>
              )}
            </div>
            <span className="text-2xl text-gray-400">{postsExpanded ? '−' : '+'}</span>
          </button>

        {postsExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left column - Generate post */}
            <div className="lg:col-span-1 space-y-6">
              {/* Connected accounts */}
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    🔗 Verbonden Accounts
                    {lateConfigured === false && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                        Optioneel
                      </span>
                    )}
                  </h2>
                  {selectedProject && (
                    <button
                      onClick={() => syncAccounts(selectedProject.id)}
                      className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition"
                    >
                      🔄 Sync
                    </button>
                  )}
                </div>

                {lateConfigured === false && (
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-400">
                      💡 Late.dev auto-posting niet beschikbaar. Je kunt posts genereren, kopiëren en handmatig plaatsen.
                    </p>
                  </div>
                )}

                {lateConfigured && !socialActivated && (
                  <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <p className="text-sm text-orange-300 mb-3">
                      Activeer social media om accounts te koppelen en posts automatisch te publiceren.
                    </p>
                    <button
                      onClick={activateSocial}
                      disabled={activating}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      {activating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          Activeren...
                        </>
                      ) : (
                        <>
                          🚀 Activeer Social Media
                        </>
                      )}
                    </button>
                  </div>
                )}

                {socialActivated && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-400 flex items-center gap-2">
                      ✓ Social media geactiveerd - Klik op een platform om te koppelen
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(platform => {
                    const connected = accounts.some(a => a.platform === platform.id);
                    const canConnect = socialActivated && lateConfigured;
                    return (
                      <button
                        key={platform.id}
                        onClick={() => !connected && canConnect && connectPlatform(platform.id)}
                        disabled={!canConnect}
                        className={`flex items-center gap-2 p-3 rounded-lg transition ${
                          connected 
                            ? 'bg-green-500/20 border border-green-500/50' 
                            : canConnect
                              ? 'bg-gray-700 hover:bg-gray-600'
                              : 'bg-gray-700/50 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <span>{platform.icon}</span>
                        <span className="text-sm">{platform.name}</span>
                        {connected && <span className="text-green-400 ml-auto">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate post form */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">✨ Nieuwe Post</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Topic</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Bijv. 5 tips voor beginners"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Post Type</label>
                    <div className="grid grid-cols-1 gap-2">
                      {POST_TYPES.map(type => (
                        <button
                          key={type.id}
                          onClick={() => setPostType(type.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg transition text-left ${
                            postType === type.id
                              ? 'bg-orange-500/20 border border-orange-500/50'
                              : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                        >
                          <span className="text-xl">{type.icon}</span>
                          <div>
                            <div className="font-medium">{type.name}</div>
                            <div className="text-xs text-gray-400">{type.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Platforms</label>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORMS.map(platform => (
                        <button
                          key={platform.id}
                          onClick={() => togglePlatform(platform.id)}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition ${
                            selectedPlatforms.includes(platform.id)
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                        >
                          {platform.icon} {platform.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => generatePost()}
                    disabled={generating || !topic.trim()}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        Genereren...
                      </>
                    ) : (
                      <>✨ Genereer Post</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right column - Posts */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  📝 Posts ({posts.length})
                </h2>

                {posts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-4xl mb-4">📱</p>
                    <p>Nog geen posts gegenereerd</p>
                    <p className="text-sm mt-2">Vul een topic in en klik op "Genereer Post"</p>
                    {strategy && contentIdeas.length > 0 && (
                      <p className="text-sm mt-2 text-orange-400">
                        Of gebruik een content idee uit je strategie!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map(post => (
                      <div key={post.id} className="bg-gray-700 rounded-xl p-4">
                        <div className="flex gap-4">
                          {/* Image */}
                          {post.image_url && (
                            <div className="w-32 h-32 flex-shrink-0">
                              <img
                                src={post.image_url}
                                alt="Post image"
                                className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                                onClick={() => window.open(post.image_url!, '_blank')}
                              />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                                {POST_TYPES.find(t => t.id === post.post_type)?.name || post.post_type}
                              </span>
                              {post.platforms?.map((p: any) => (
                                <span key={p.platform} className="text-xs bg-gray-600 px-2 py-1 rounded">
                                  {PLATFORMS.find(pl => pl.id === p.platform)?.icon} {p.platform}
                                </span>
                              ))}
                              <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                                post.status === 'published' ? 'bg-green-500/20 text-green-400' :
                                post.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-gray-600 text-gray-300'
                              }`}>
                                {post.status === 'published' ? '✅ Gepubliceerd' :
                                 post.status === 'scheduled' ? '📅 Gepland' : '📝 Concept'}
                              </span>
                              {post.status === 'scheduled' && post.scheduled_for && (
                                <span className="text-xs text-gray-400">
                                  {formatDate(post.scheduled_for)}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 ml-auto">
                                {formatDate(post.created_at)}
                              </span>
                            </div>

                            <p className="text-sm text-gray-200 whitespace-pre-wrap line-clamp-4">
                              {post.content}
                            </p>

                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <button
                                onClick={() => copyToClipboard(post.content)}
                                className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded transition"
                              >
                                📋 Kopiëren
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPost(post);
                                  setEditContent(post.content);
                                }}
                                className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded transition"
                              >
                                ✏️ Bewerken
                              </button>
                              {post.image_url && (
                                <button
                                  onClick={() => downloadImage(post.image_url!, `social-post-${post.id}.png`)}
                                  className="text-xs bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded transition"
                                >
                                  ⬇️ Download Afbeelding
                                </button>
                              )}
                              {(post.status === 'draft' || post.status === 'ready') && (
                                <button
                                  onClick={() => {
                                    if (accounts.length === 0) {
                                      alert('Geen accounts verbonden. Koppel eerst een social media account.');
                                      return;
                                    }
                                    setPublishingPost(post);
                                    setSelectedAccounts([]);
                                    setPublishTiming('now');
                                    setScheduledDate('');
                                    setScheduledTime('');
                                  }}
                                  disabled={accounts.length === 0}
                                  className="text-xs bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded transition"
                                >
                                  📤 Publiceren
                                </button>
                              )}
                              <button
                                onClick={() => deletePost(post.id)}
                                className="text-xs bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded transition ml-auto"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div> {/* End Posts Section */}

      </div> {/* End of streamlined sections wrapper */}

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Post Bewerken</h3>
            
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={10}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white resize-none"
            />

            <div className="text-sm text-gray-400 mt-2">
              {editContent.length} karakters
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition"
              >
                Annuleren
              </button>
              <button
                onClick={updatePost}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {publishingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📤 Post Publiceren
            </h3>

            {/* Post Preview */}
            <div className="mb-6 bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">📋 Post Preview</h4>

              {/* Image Preview */}
              {publishingPost.image_url ? (
                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">Afbeelding:</label>
                  <img
                    src={publishingPost.image_url}
                    alt="Post preview"
                    className="w-full max-h-64 object-contain rounded-lg bg-gray-800"
                  />
                </div>
              ) : (
                <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-400 flex items-center gap-2">
                    ⚠️ Geen afbeelding - Instagram vereist media voor posts
                  </p>
                </div>
              )}

              {/* Text Preview */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Tekst:</label>
                <div className="bg-gray-800 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">
                    {publishingPost.content}
                  </p>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {publishingPost.content.length} karakters
                </div>
              </div>
            </div>

            {/* Connected accounts counter */}
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                🔗 Verbonden: {accounts.length} account{accounts.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Account selection */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-3">
                Selecteer accounts om naar te publiceren:
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {accounts.map(account => (
                  <label
                    key={account.id}
                    className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAccounts([...selectedAccounts, account.id]);
                        } else {
                          setSelectedAccounts(selectedAccounts.filter(id => id !== account.id));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span>
                      {PLATFORMS.find(p => p.id === account.platform)?.icon || '📱'}
                    </span>
                    <span className="font-medium">{account.platform}</span>
                    <span className="text-gray-400 text-sm">@{account.username}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Timing selection */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-3">
                Wanneer publiceren?
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition">
                  <input
                    type="radio"
                    name="timing"
                    checked={publishTiming === 'now'}
                    onChange={() => setPublishTiming('now')}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">📤 Direct publiceren</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition">
                  <input
                    type="radio"
                    name="timing"
                    checked={publishTiming === 'scheduled'}
                    onChange={() => setPublishTiming('scheduled')}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">📅 Inplannen</span>
                </label>
              </div>
            </div>

            {/* Date/Time picker (shown when scheduled) */}
            {publishTiming === 'scheduled' && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <label className="block text-sm text-gray-400 mb-3">
                  Selecteer datum en tijd:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Datum</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tijd</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Selected platforms preview */}
            {selectedAccounts.length > 0 && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="text-sm text-green-400 mb-2">
                  ✓ Post wordt gepubliceerd naar {selectedAccounts.length} account{selectedAccounts.length !== 1 ? 's' : ''}:
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedAccounts.map(accountId => {
                    const account = accounts.find(a => a.id === accountId);
                    if (!account) return null;
                    return (
                      <span key={accountId} className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {PLATFORMS.find(p => p.id === account.platform)?.icon} {account.platform}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setPublishingPost(null);
                  setSelectedAccounts([]);
                  setPublishTiming('now');
                  setScheduledDate('');
                  setScheduledTime('');
                }}
                disabled={publishing}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 rounded-lg transition"
              >
                Annuleren
              </button>
              <button
                onClick={publishPost}
                disabled={
                  publishing || 
                  selectedAccounts.length === 0 || 
                  (publishTiming === 'scheduled' && (!scheduledDate || !scheduledTime))
                }
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex items-center gap-2"
              >
                {publishing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Publiceren...
                  </>
                ) : (
                  <>
                    📤 Publiceren
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Content Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              📅 {editingScheduledItem ? 'Content bewerken' : 'Content inplannen'}
            </h3>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Titel / Onderwerp *
                </label>
                <input
                  type="text"
                  value={scheduleIdeaTitle}
                  onChange={(e) => setScheduleIdeaTitle(e.target.value)}
                  placeholder="Bijv. 5 tips voor beginners"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Publicatiedatum *
                  </label>
                  <input
                    type="date"
                    value={scheduleIdeaDate}
                    onChange={(e) => setScheduleIdeaDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Tijd *
                  </label>
                  <input
                    type="time"
                    value={scheduleIdeaTime}
                    onChange={(e) => setScheduleIdeaTime(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  />
                </div>
              </div>

              {/* Post Type */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Post Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {POST_TYPES.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setScheduleIdeaType(type.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg transition text-left ${
                        scheduleIdeaType === type.id
                          ? 'bg-orange-500/20 border border-orange-500/50'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <span className="text-sm">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.slice(0, 6).map(platform => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => {
                        if (scheduleIdeaPlatforms.includes(platform.id)) {
                          setScheduleIdeaPlatforms(scheduleIdeaPlatforms.filter(p => p !== platform.id));
                        } else {
                          setScheduleIdeaPlatforms([...scheduleIdeaPlatforms, platform.id]);
                        }
                      }}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition ${
                        scheduleIdeaPlatforms.includes(platform.id)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {platform.icon} {platform.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hook (optional) */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Hook (optioneel)
                </label>
                <input
                  type="text"
                  value={scheduleIdeaHook}
                  onChange={(e) => setScheduleIdeaHook(e.target.value)}
                  placeholder="Bijv. Stop met scrollen! Dit moet je weten..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                />
              </div>

              {/* CTA (optional) */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Call-to-Action (optioneel)
                </label>
                <input
                  type="text"
                  value={scheduleIdeaCta}
                  onChange={(e) => setScheduleIdeaCta(e.target.value)}
                  placeholder="Bijv. Sla dit op voor later!"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                />
              </div>

              {/* Pillar (optional) */}
              {strategy?.content_pillars && strategy.content_pillars.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Content Pillar (optioneel)
                  </label>
                  <select
                    value={scheduleIdeaPillar}
                    onChange={(e) => setScheduleIdeaPillar(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  >
                    <option value="">Geen specifieke pillar</option>
                    {strategy.content_pillars.map((pillar, i) => (
                      <option key={i} value={pillar.name}>{pillar.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  resetScheduleForm();
                }}
                disabled={savingScheduledContent}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 rounded-lg transition"
              >
                Annuleren
              </button>
              <button
                onClick={saveScheduledContent}
                disabled={savingScheduledContent || !scheduleIdeaTitle.trim() || !scheduleIdeaDate}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex items-center gap-2"
              >
                {savingScheduledContent ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Opslaan...
                  </>
                ) : (
                  <>
                    📅 {editingScheduledItem ? 'Bijwerken' : 'Inplannen'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
