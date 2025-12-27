'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AVAILABLE_TEXT_MODELS, BEST_MODELS } from '@/lib/ai-client';

interface ContentIdea {
  title: string;
  category: string;
  description: string;
  keywords: string[];
  contentType?: string;
  cluster?: string;
  searchVolume?: number | null;
  competition?: string | null;
  cpc?: number | null;
}

interface ArticleJob {
  id: string;
  project_id: string;
  title: string;
  keyword: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  current_step: string;
  article_content?: string;
  featured_image?: string;
  slug?: string;
  meta_description?: string;
  social_media_post?: string; // AI-generated social media post
  error?: string;
  created_at: string;
  article_id?: string; // ID of article saved in database
}

interface Project {
  id: string;
  name: string;
  website_url: string;
  wp_url?: string;
  wp_username?: string;
  wp_password?: string; // Note: Only used for WordPress API calls, never displayed
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Constants
const WRITGO_DOMAIN = 'writgo.nl';

export default function WriterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState<ContentIdea | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [currentJob, setCurrentJob] = useState<ArticleJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<ArticleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [wordCount, setWordCount] = useState(2000);
  const [language, setLanguage] = useState('nl');
  const [selectedModel, setSelectedModel] = useState(BEST_MODELS.CONTENT);
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [searchParams]);

  useEffect(() => {
    // Auto-scroll chat
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  async function loadData() {
    setLoading(true);
    
    const projectId = searchParams.get('project');
    const articleIndex = searchParams.get('article');
    const jobId = searchParams.get('job');

    // Load project info
    if (projectId) {
      try {
        const projectResponse = await fetch(`/api/projects/list`);
        const projectData = await projectResponse.json();
        const foundProject = projectData.projects?.find((p: Project) => p.id === projectId);
        if (foundProject) {
          setProject(foundProject);
        }

        // Load recent jobs for this project
        const jobsResponse = await fetch(`/api/generate/article-background?project_id=${projectId}`);
        const jobsData = await jobsResponse.json();
        setRecentJobs(jobsData.jobs || []);
      } catch (e) {
        console.error('Failed to load project:', e);
      }
    }

    // If job ID is provided, load that job
    if (jobId) {
      await loadJob(jobId);
      setLoading(false);
      return;
    }

    // Load article from content plan
    if (projectId && articleIndex !== null) {
      try {
        const response = await fetch(`/api/content-plan/article?project_id=${projectId}&index=${articleIndex}`);
        const data = await response.json();
        
        if (data.article) {
          setIdea({
            title: data.article.title,
            category: data.article.category || '',
            description: data.article.description || '',
            keywords: data.article.keywords || [],
            contentType: data.article.contentType || 'article',
            cluster: data.article.cluster,
            searchVolume: data.article.searchVolume,
            competition: data.article.competition,
            cpc: data.article.cpc,
          });
          setLanguage(data.article.language || 'nl');
        }
      } catch (e) {
        console.error('Failed to load article from database:', e);
      }
    }

    // No localStorage fallback - everything via database
    setLoading(false);
  }

  async function loadJob(jobId: string) {
    try {
      const response = await fetch(`/api/generate/article-background?job_id=${jobId}`);
      const job = await response.json();
      
      if (job && !job.error) {
        setCurrentJob(job);
        
        // Set idea from job
        setIdea({
          title: job.title,
          category: '',
          description: job.description || '',
          keywords: [job.keyword],
          contentType: job.content_type,
        });

        // Start polling if job is still processing
        if (job.status === 'processing' || job.status === 'pending') {
          startPolling(jobId);
        }
      }
    } catch (e) {
      console.error('Failed to load job:', e);
    }
  }

  function startPolling(jobId: string) {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/generate/article-background?job_id=${jobId}`);
        const job = await response.json();
        
        if (job && !job.error) {
          setCurrentJob(job);
          
          // Stop polling if job is complete or failed
          if (job.status === 'completed' || job.status === 'failed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 2000);
  }

  async function startGeneration() {
    if (!idea || !project) {
      alert('Geen artikel of project geselecteerd');
      return;
    }

    await startBackgroundGeneration();
  }

  async function startBackgroundGeneration() {
    setStarting(true);

    try {
      const response = await fetch('/api/generate/article-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project!.id,
          title: idea!.title,
          keyword: idea!.keywords[0] || idea!.title,
          description: idea!.description,
          content_type: idea!.contentType,
          word_count: wordCount,
          language,
          website_url: project!.website_url,
          model: selectedModel, // Include selected model
        }),
      });

      const data = await response.json();

      if (data.success && data.job_id) {
        // Update URL with job ID
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('job', data.job_id);
        window.history.pushState({}, '', newUrl.toString());

        // Load the job and start polling
        await loadJob(data.job_id);
      } else {
        alert('Fout bij starten: ' + (data.error || 'Onbekende fout'));
      }
    } catch (e: any) {
      alert('Fout bij starten: ' + e.message);
    } finally {
      setStarting(false);
    }
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || !currentJob?.article_content) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      // TODO: Implement chat API for content edits when backend is ready
      // This requires a new API endpoint to process edit requests via AI
      // Currently showing placeholder response - chat is not yet functional
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: '⚠️ Let op: Chat functionaliteit is nog in ontwikkeling. Je kunt straks vragen stellen zoals: "Voeg een paragraaf toe over..." of "Wijzig de tone naar professioneel". Voor nu kun je het artikel downloaden en handmatig bewerken.',
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
        setChatLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Chat error:', error);
      setChatLoading(false);
    }
  }

  // Helper functions for publishing logic
  function isWritGoBlog(project: Project | null): boolean {
    if (!project) return false;
    return project.website_url.toLowerCase().includes(WRITGO_DOMAIN);
  }

  function isWordPressConfigured(project: Project | null): boolean {
    if (!project) return false;
    return !!(project.wp_url && project.wp_username);
  }

  async function publishToWordPress() {
    // Handle background generation mode only
    const hasContent = !!currentJob?.article_content;
    const articleIdToPublish = currentJob?.article_id;
    
    if (!hasContent || !project) {
      alert('Geen artikel of project beschikbaar');
      return;
    }

    try {
      const isWritGo = isWritGoBlog(project);
      const hasWordPress = isWordPressConfigured(project);
      
      if (isWritGo) {
        // Publish to WritGo Blog (internal)
        if (!articleIdToPublish) {
          alert('Geen artikel ID beschikbaar voor publicatie');
          return;
        }
        
        const response = await fetch(`/api/blog/posts/${articleIdToPublish}/publish`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to publish');
        }

        alert('Artikel gepubliceerd op WritGo Blog!');
        
        // Redirect to WritGo blog to see the published article
        setTimeout(() => {
          router.push('/dashboard/writgo-blog');
        }, 1000);
      } else if (hasWordPress) {
        // Publish to WordPress (client project)
        const response = await fetch('/api/wordpress/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: project.id,
            article_id: articleIdToPublish,
            title: currentJob?.title,
            content: currentJob?.article_content,
            featured_image: currentJob?.featured_image,
            slug: currentJob?.slug,
            meta_description: currentJob?.meta_description,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to publish to WordPress');
        }

        alert(`Artikel gepubliceerd op WordPress!\n\n${data.url || 'Bekijk op je website'}`);
      } else {
        alert('WordPress is niet geconfigureerd voor dit project.\n\nGa naar Projecten om WordPress credentials toe te voegen, of download het artikel als HTML.');
      }
    } catch (err: any) {
      console.error('Publish error:', err);
      alert(`Fout bij publiceren: ${err.message || 'Onbekende fout'}`);
    }
  }

  function getWordCount(html: string): number {
    const textOnly = html.replace(/<[^>]*>/g, ' ').trim();
    return textOnly ? textOnly.split(/\s+/).length : 0;
  }

  function getFileName(title: string, slug?: string): string {
    if (slug) return slug;
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 60) || 'artikel';
  }

  function copyToClipboard() {
    const content = currentJob?.article_content;
    if (content) {
      navigator.clipboard.writeText(content);
      alert('Artikel gekopieerd naar klembord!');
    }
  }

  function downloadAsHTML() {
    const content = currentJob?.article_content;
    const fileName = getFileName(idea?.title || currentJob?.title || 'artikel', currentJob?.slug);
    
    if (content) {
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  function selectJob(job: ArticleJob) {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('job', job.id);
    window.history.pushState({}, '', newUrl.toString());
    loadJob(job.id);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">✍️ Artikel Schrijver</h1>
            <p className="text-gray-400 mt-1">AI-powered content generatie op de achtergrond</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/content-plan')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Terug naar Content Plan
          </button>
        </div>

        {/* Tip Banner */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
          <p className="text-orange-400 text-sm">
            💡 <strong>Tip:</strong> Je kunt deze pagina verlaten terwijl het artikel wordt gegenereerd. 
            Kom later terug om het voltooide artikel te bekijken.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Article Info & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Article Info */}
            {idea && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">📝 Artikel</h2>
                <h3 className="text-white font-medium mb-3">{idea.title}</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="text-white">{idea.contentType || 'Artikel'}</span>
                  </div>
                  {idea.cluster && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cluster</span>
                      <span className="text-white">{idea.cluster}</span>
                    </div>
                  )}
                  {idea.searchVolume && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Zoekvolume</span>
                      <span className="text-green-400">{idea.searchVolume.toLocaleString()}/maand</span>
                    </div>
                  )}
                  {idea.competition && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Concurrentie</span>
                      <span className={`${
                        idea.competition === 'LOW' ? 'text-green-400' :
                        idea.competition === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                      }`}>{idea.competition}</span>
                    </div>
                  )}
                </div>

                {idea.keywords && idea.keywords.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {idea.keywords.map((kw, i) => (
                      <span key={i} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Generation Settings */}
            {!currentJob && idea && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">⚙️ Instellingen</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">AI Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-orange-500 focus:outline-none text-sm"
                    >
                      {AVAILABLE_TEXT_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.recommended ? '⭐ ' : ''}{model.name} - {model.developer} {model.recommended ? '(Aanbevolen)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {AVAILABLE_TEXT_MODELS.find(m => m.id === selectedModel)?.description}
                    </p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Aantal woorden</label>
                    <select
                      value={wordCount}
                      onChange={(e) => setWordCount(Number(e.target.value))}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-orange-500 focus:outline-none"
                    >
                      <option value={1000}>~1000 woorden</option>
                      <option value={1500}>~1500 woorden</option>
                      <option value={2000}>~2000 woorden</option>
                      <option value={2500}>~2500 woorden</option>
                      <option value={3000}>~3000 woorden</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Taal</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-orange-500 focus:outline-none"
                    >
                      <option value="nl">Nederlands</option>
                      <option value="en">English</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={startGeneration}
                  disabled={starting || !project}
                  className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition disabled:opacity-50"
                >
                  {starting ? '⏳ Starten...' : '🚀 Genereer Artikel'}
                </button>
              </div>
            )}

            {/* Recent Jobs */}
            {recentJobs.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">📋 Recente Artikelen</h2>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => selectJob(job)}
                      className={`p-3 rounded-lg cursor-pointer transition ${
                        currentJob?.id === job.id 
                          ? 'bg-orange-500/20 border border-orange-500' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          job.status === 'processing' ? 'bg-orange-500/20 text-orange-400' :
                          job.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-600 text-gray-400'
                        }`}>
                          {job.status === 'completed' ? '✅ Klaar' :
                           job.status === 'processing' ? `⏳ ${job.progress}%` :
                           job.status === 'failed' ? '❌ Mislukt' : '⏸️ Wachtend'}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium truncate">{job.title}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(job.created_at).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Article Content */}
          <div className="lg:col-span-2">
            {/* Background Job Processing State */}
            {currentJob && (currentJob.status === 'processing' || currentJob.status === 'pending') && (
              <div className="bg-gray-800 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">{currentJob.current_step}</h2>
                  <span className="text-orange-400 font-semibold">{currentJob.progress}%</span>
                </div>
                
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                    style={{ width: `${currentJob.progress}%` }}
                  />
                </div>

                <p className="text-gray-400 text-sm">
                  Je kunt deze pagina verlaten. Het artikel wordt op de achtergrond gegenereerd.
                </p>
              </div>
            )}

            {/* Error State */}
            {currentJob?.status === 'failed' && (
              <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-red-400 mb-2">❌ Generatie mislukt</h2>
                <p className="text-red-300">{currentJob.error || 'Er is een onbekende fout opgetreden'}</p>
                <button
                  onClick={() => {
                    setCurrentJob(null);
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('job');
                    window.history.pushState({}, '', newUrl.toString());
                  }}
                  className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Opnieuw proberen
                </button>
              </div>
            )}

            {/* Completed Background Job Article */}
            {currentJob?.status === 'completed' && currentJob.article_content && (
              <div className="bg-gray-800 rounded-xl overflow-hidden">
                {/* Article Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">{currentJob.title}</h2>
                      <p className="text-gray-400 text-sm mt-1">
                        {currentJob.article_content.split(/\s+/).length} woorden
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setViewMode(viewMode === 'preview' ? 'html' : 'preview')}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        {viewMode === 'preview' ? 'HTML' : 'Preview'}
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        📋 Kopiëren
                      </button>
                      <button
                        onClick={downloadAsHTML}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        ⬇️ Download
                      </button>
                      {project && (
                        <button
                          onClick={publishToWordPress}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                          title={isWritGoBlog(project) ? 'Publiceer naar WritGo Blog' : isWordPressConfigured(project) ? 'Publiceer naar WordPress' : 'WordPress niet geconfigureerd'}
                        >
                          {isWritGoBlog(project) ? '🚀 Publiceer WritGo' : isWordPressConfigured(project) ? '🚀 Publiceer WP' : '🚀 Publiceren'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Article Content */}
                <div className="p-6 max-h-[600px] overflow-y-auto">
                  {viewMode === 'preview' ? (
                    <div 
                      className="prose prose-lg prose-invert max-w-none
                        [&_*]:text-white
                        [&_h1]:text-white [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4
                        [&_h2]:text-white [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4
                        [&_h3]:text-white [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3
                        [&_h4]:text-white [&_h4]:text-xl [&_h4]:font-bold [&_h4]:mt-6 [&_h4]:mb-2
                        [&_p]:text-white [&_p]:text-lg [&_p]:leading-relaxed [&_p]:mb-5
                        [&_ul]:text-white [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6
                        [&_ol]:text-white [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6
                        [&_li]:text-white [&_li]:text-lg [&_li]:leading-relaxed [&_li]:mb-2
                        [&_strong]:text-white [&_strong]:font-bold
                        [&_em]:text-white
                        [&_a]:text-orange-400 [&_a]:no-underline hover:[&_a]:text-orange-300 hover:[&_a]:underline
                        [&_blockquote]:border-l-4 [&_blockquote]:border-orange-500 [&_blockquote]:bg-gray-800/50 [&_blockquote]:rounded-r-lg [&_blockquote]:py-4 [&_blockquote]:px-6 [&_blockquote]:my-8 [&_blockquote]:text-white
                        [&_code]:bg-gray-800 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-orange-400
                        [&_pre]:bg-gray-800 [&_pre]:rounded-xl [&_pre]:p-6
                        [&_img]:rounded-xl [&_img]:shadow-2xl [&_img]:my-10
                        [&_table]:w-full [&_th]:text-white [&_th]:bg-gray-800/50 [&_th]:p-3 [&_td]:text-white [&_td]:p-3 [&_td]:border-gray-700"
                      dangerouslySetInnerHTML={{ __html: currentJob.article_content }}
                    />
                  ) : (
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono bg-gray-900 p-4 rounded-lg">
                      {currentJob.article_content}
                    </pre>
                  )}
                </div>

                {/* Featured Image */}
                {currentJob.featured_image && (
                  <div className="p-6 border-t border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">🖼️ Featured Image</h3>
                    <img
                      src={currentJob.featured_image}
                      alt={currentJob.title}
                      className="max-w-md rounded-lg"
                    />
                  </div>
                )}

                {/* SEO Metadata */}
                <div className="p-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">🔍 SEO Metadata</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">SEO Titel</div>
                      <div className="text-white font-medium">{currentJob.title}</div>
                    </div>
                    {currentJob.meta_description && (
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-xs text-gray-400 mb-1">Meta Omschrijving</div>
                        <div className="text-white text-sm">{currentJob.meta_description}</div>
                      </div>
                    )}
                    {currentJob.keyword && (
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-xs text-gray-400 mb-1">Focus Keyword</div>
                        <div className="text-white font-medium">{currentJob.keyword}</div>
                      </div>
                    )}
                    {currentJob.slug && (
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-xs text-gray-400 mb-1">URL Slug</div>
                        <div className="text-white font-mono text-sm">/{currentJob.slug}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Media Post */}
                {currentJob.social_media_post && (
                  <div className="p-6 border-t border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">📱 Social Media Post</h3>
                    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg p-6">
                      <p className="text-white leading-relaxed whitespace-pre-wrap mb-4">
                        {currentJob.social_media_post}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(currentJob.social_media_post || '');
                            alert('Social media post gekopieerd!');
                          }}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          📋 Kopieer Post
                        </button>
                        <button
                          onClick={() => {
                            const postUrl = `https://getlate.dev/share?text=${encodeURIComponent(currentJob.social_media_post || '')}`;
                            window.open(postUrl, '_blank');
                          }}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm transition font-semibold"
                        >
                          🚀 Delen via Getlate
                        </button>
                      </div>
                      <p className="text-gray-400 text-xs mt-3">
                        💡 Tip: Gebruik Getlate.dev om deze post direct te delen op al je sociale media
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!currentJob && !idea && (
              <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">✍️</div>
                <h3 className="text-2xl font-bold text-white mb-2">Geen artikel geselecteerd</h3>
                <p className="text-gray-400 mb-6">
                  Selecteer een artikel uit het content plan om te beginnen met schrijven
                </p>
                <button
                  onClick={() => router.push('/dashboard/content-plan')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition"
                >
                  Naar Content Plan
                </button>
              </div>
            )}

            {/* Ready to Generate State */}
            {!currentJob && idea && (
              <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-white mb-2">Klaar om te genereren</h3>
                <p className="text-gray-400 mb-6">
                  Klik op "Genereer Artikel" om te beginnen. Je kunt de pagina verlaten terwijl het artikel wordt geschreven.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Sidebar - Only show for completed articles */}
      {chatOpen && currentJob?.article_content && (
        <div className="fixed right-0 top-0 h-full w-96 bg-gray-800 border-l border-gray-700 flex flex-col shadow-2xl z-50">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">💬 Quick Edits Chat</h3>
              <p className="text-gray-400 text-sm mt-1">
                Vraag om aanpassingen in het artikel
              </p>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">Geen berichten nog.</p>
                <p className="text-xs mt-2">
                  Probeer: "Voeg een paragraaf toe over...", "Maak het formeler", etc.
                </p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {msg.timestamp.toLocaleTimeString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:100ms]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:200ms]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="px-6 py-4 border-t border-gray-700 bg-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !chatLoading && sendChatMessage()}
                placeholder="Vraag om een aanpassing..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-orange-500 focus:outline-none text-sm"
                disabled={chatLoading}
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
