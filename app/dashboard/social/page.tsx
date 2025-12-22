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

  // Tabs
  const [activeTab, setActiveTab] = useState<'posts' | 'strategy'>('strategy');

  // Strategy state
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [detectedInfo, setDetectedInfo] = useState<DetectedInfo | null>(null);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);

  // Post generation form
  const [topic, setTopic] = useState('');
  const [postType, setPostType] = useState('storytelling');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);

  // Edit modal
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [editContent, setEditContent] = useState('');

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
      syncAccounts(selectedProject.id);
    }
  }, [selectedProject]);

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
        setDetectedInfo({
          niche: data.strategy.niche,
          audience: data.strategy.target_audience,
          voice: data.strategy.brand_voice,
          goals: data.strategy.goals || [],
        });
      } else {
        setStrategy(null);
        setDetectedInfo(null);
      }
    } catch (error) {
      console.error('Failed to load strategy:', error);
    }
  }

  async function generateStrategy() {
    if (!selectedProject) return;

    setGeneratingStrategy(true);
    try {
      const response = await fetch('/api/social/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setStrategy(data.strategy);
        setContentIdeas(data.content_ideas || []);
        setDetectedInfo(data.detected || null);
      } else {
        alert(data.error || 'Er ging iets mis');
      }
    } catch (error) {
      console.error('Failed to generate strategy:', error);
      alert('Er ging iets mis bij het genereren');
    } finally {
      setGeneratingStrategy(false);
    }
  }

  async function syncAccounts(projectId: string) {
    try {
      const response = await fetch('/api/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await response.json();
      setAccounts(data.accounts || []);
      setLateConfigured(data.configured ?? null);
    } catch (error) {
      console.error('Failed to sync accounts:', error);
      setLateConfigured(false);
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
      const response = await fetch(
        `/api/social/connect?project_id=${selectedProject.id}&platform=${platform}`
      );
      const data = await response.json();

      if (data.connectUrl) {
        window.location.href = data.connectUrl;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Failed to get connect URL:', error);
    }
  }

  async function generatePost(ideaTopic?: string, ideaType?: string) {
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
        setActiveTab('posts');
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('strategy')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'strategy'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📊 Strategie
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'posts'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            ✨ Posts ({posts.length})
          </button>
        </div>

        {/* Strategy Tab */}
        {activeTab === 'strategy' && (
          <div className="space-y-6">
            {/* Generate Strategy Button */}
            {!strategy && (
              <div className="bg-gray-800 rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold mb-2">Genereer je Social Media Strategie</h2>
                <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                  AI analyseert automatisch je website en genereert een complete contentstrategie 
                  met content pillars, weekschema, hashtags en 15+ content ideeën.
                </p>
                <button
                  onClick={generateStrategy}
                  disabled={generatingStrategy}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 text-white font-semibold px-8 py-4 rounded-xl transition flex items-center justify-center gap-2 mx-auto text-lg"
                >
                  {generatingStrategy ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                      AI analyseert je website...
                    </>
                  ) : (
                    <>🤖 Genereer Strategie met AI</>
                  )}
                </button>
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
                            onClick={() => generatePost(idea.title, idea.type.toLowerCase())}
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

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Generate post */}
            <div className="lg:col-span-1 space-y-6">
              {/* Connected accounts */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  🔗 Verbonden Accounts
                  {lateConfigured === false && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                      Optioneel
                    </span>
                  )}
                </h2>

                {lateConfigured === false && (
                  <p className="text-sm text-gray-400 mb-4">
                    Later.dev API niet geconfigureerd. Je kunt posts genereren en handmatig kopiëren.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.slice(0, 6).map(platform => {
                    const connected = accounts.some(a => a.platform === platform.id);
                    return (
                      <button
                        key={platform.id}
                        onClick={() => !connected && lateConfigured && connectPlatform(platform.id)}
                        disabled={!lateConfigured}
                        className={`flex items-center gap-2 p-3 rounded-lg transition ${
                          connected 
                            ? 'bg-green-500/20 border border-green-500/50' 
                            : lateConfigured
                              ? 'bg-gray-700 hover:bg-gray-600'
                              : 'bg-gray-700/50 cursor-not-allowed'
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
                              <span className={`text-xs px-2 py-1 rounded ${
                                post.status === 'published' ? 'bg-green-500/20 text-green-400' :
                                post.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-gray-600 text-gray-300'
                              }`}>
                                {post.status === 'published' ? 'Gepubliceerd' :
                                 post.status === 'scheduled' ? 'Gepland' : 'Concept'}
                              </span>
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
      </div>

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
    </div>
  );
}
