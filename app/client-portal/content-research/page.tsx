
'use client';

/**
 * Unified Content Planning System
 * 
 * Combines Content Research & Autopilot in one integrated interface:
 * - Analyzes your website
 * - Analyzes competitors
 * - Finds trending topics
 * - Generates 30-50 content ideas
 * - Execute with Autopilot
 * - Schedule automated content generation
 */

import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  TrendingUp,
  Target,
  Lightbulb,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Users,
  Globe,
  Sparkles,
  Clock,
  AlertCircle,
  PenTool,
  XCircle,
  Plus,
  Zap,
  Rocket,
} from 'lucide-react';
import ContentIdeasList from './content-ideas-list';
import AutopilotSection from './autopilot-section';
import TopicalMapImport from './topical-map-import';
import { useLanguage } from '@/lib/i18n/context';
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
import toast from 'react-hot-toast';

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Content Research Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
          <Card className="bg-[#1a1a1a] border border-red-500/20 p-8 max-w-md w-full">
            <div className="text-center space-y-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="text-2xl font-bold text-white">Oeps, er ging iets mis</h2>
              <p className="text-gray-300">
                {this.state.error?.message || 'Er is een fout opgetreden bij het laden van de pagina.'}
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.reload();
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Probeer opnieuw
                </Button>
                <Link href="/client-portal">
                  <Button variant="outline" className="w-full border-orange-500/30 text-orange-500">
                    Terug naar dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  niche: string;
}

interface ContentIdea {
  id: string;
  title: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  topic: string;
  contentType: string;
  contentCategory?: string; // "commercial" or "informational"
  priority: string;
  status: string;
  aiScore: number;
  trending: boolean;
  competitorGap: boolean;
  seasonal: boolean;
  searchIntent: string;
  difficulty: number;
  contentOutline: any;
  createdAt: string;
  isScheduledForAutopilot: boolean;
  autopilotFrequency?: string;
  autopilotNextRun?: string;
  targetWordCount?: number;
  searchVolume?: number;
  imageIdeas?: string[];
  videoIdeas?: string[];
  internalLinks?: any;
}

interface ContentStrategy {
  websiteAnalysis: {
    existingTopics: string[];
    contentGaps: string[];
    topPerformingPages: Array<{ title: string; url: string }>;
    categories: string[];
    totalPages: number;
  };
  competitorAnalysis: {
    competitors: Array<{
      domain: string;
      topContent: Array<{ title: string; url: string; topic: string }>;
      strength: string;
    }>;
    competitorGaps: string[];
    opportunities: string[];
  };
  trendingTopics: {
    topics: Array<{ topic: string; relevance: number; reasoning: string }>;
    questions: string[];
    newsTopics: string[];
  };
  summary: {
    totalIdeas: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    competitorGaps: number;
    trendingTopics: number;
  };
  generatedAt: string;
}

function ContentResearchPage() {
  const { data: session, status } = useSession() || { data: null, status: 'loading' };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  // Tab management - support URL params for navigation
  const [activeTab, setActiveTab] = useState<'planning' | 'autopilot'>('planning');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [contentStrategy, setContentStrategy] = useState<ContentStrategy | null>(null);
  const [articleIdeas, setArticleIdeas] = useState<ContentIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedIdeas, setExpandedIdeas] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [manualKeyword, setManualKeyword] = useState<string>('');
  const [useManualMode, setUseManualMode] = useState<boolean>(false);
  
  // Real-time progress tracking
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressDetails, setProgressDetails] = useState<string>('');
  
  // Keyword expansion dialog
  const [showKeywordDialog, setShowKeywordDialog] = useState<boolean>(false);
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [keywordCount, setKeywordCount] = useState<string>('5');
  const [isAddingIdeas, setIsAddingIdeas] = useState<boolean>(false);
  
  // Language selection for content generation
  const [selectedLanguage, setSelectedLanguage] = useState<'NL' | 'EN' | 'DE' | 'FR' | 'ES'>('NL');

  // Read tab from URL params
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'autopilot') {
      setActiveTab('autopilot');
    } else {
      setActiveTab('planning');
    }
  }, [searchParams]);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, [session]);

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/client/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        if (data.projects?.length > 0) {
          setSelectedProject(data.projects[0]);
          // VERWIJDERD: Automatisch laden van content plan
          // loadContentPlan(data.projects[0].id);
          
          // Check if content plan exists and load it (but don't auto-refresh)
          checkExistingContentPlan(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const checkExistingContentPlan = async (projectId: string) => {
    try {
      const res = await fetch(`/api/client/content-research?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        // Only load if data exists, don't trigger new research
        if (data.hasData && data.contentStrategy) {
          setContentStrategy(data.contentStrategy);
          setArticleIdeas(data.articleIdeas || []);
        }
      }
    } catch (error) {
      console.error('Error checking content plan:', error);
    }
  };

  const loadContentPlan = async (projectId: string) => {
    try {
      const res = await fetch(`/api/client/content-research?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setContentStrategy(data.contentStrategy);
        setArticleIdeas(data.articleIdeas || []);
      }
    } catch (error) {
      console.error('Error loading content plan:', error);
    }
  };

  const startContentResearch = async () => {
    // Check if we have either a project or a manual keyword
    if (!selectedProject && !manualKeyword.trim()) {
      alert('❌ Selecteer een project of voer een keyword in');
      return;
    }

    // CRITICAL FIX: Pin the projectId before starting to prevent it changing during analysis
    const analysisProjectId = selectedProject?.id || null;
    const analysisProjectName = selectedProject?.name || 'Keyword Mode';
    
    setIsLoading(true);
    setProgressStatus('');
    setProgressPercent(0);
    setProgressDetails('');
    
    try {
      const requestBody: any = {
        language: selectedLanguage, // Always include selected language
      };
      
      if (useManualMode && manualKeyword.trim()) {
        // Manual keyword mode - no URL or project required
        requestBody.keyword = manualKeyword.trim();
        console.log('🎯 Starting keyword mode with:', manualKeyword.trim(), 'Language:', selectedLanguage);
      } else if (analysisProjectId) {
        // Project mode - tool settings are LEADING, project settings are optional
        requestBody.projectId = analysisProjectId;
        console.log('🌐 Starting project mode with:', analysisProjectName, '(ID:', analysisProjectId, ') Language:', selectedLanguage);
      }

      // Use EventSource for streaming updates with extended timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Request timeout after 10 minutes');
        controller.abort();
      }, 600000); // 10 minutes timeout (increased from 5 minutes)
      
      const response = await fetch('/api/client/content-research', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }).catch(error => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Network timeout - de analyse duurt te lang. Probeer het met een kleiner project of neem contact op met support.');
        }
        throw error;
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fout bij analyse');
      }

      // Check if streaming is supported
      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let completed = false; // Track if research completed successfully

        while (reader) {
          const { done, value } = await reader.read();
          
          if (value) {
            buffer += decoder.decode(value, { stream: true });
          }
          
          if (done) {
            // Process any remaining data in buffer before breaking
            if (buffer.trim()) {
              const lines = buffer.split('\n\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.type === 'complete') {
                      console.log('✅ Research complete (from final buffer)');
                      completed = true;
                    } else if (data.type === 'error') {
                      console.error('❌ Backend error (from final buffer):', data.error);
                      completed = true;
                    }
                  } catch (e) {
                    console.error('Error parsing final SSE data:', e);
                  }
                }
              }
            }
            break;
          }

          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'complete') {
                  // Final result received
                  console.log('✅ Research complete, reloading from database...');
                  console.log(`   Generated ${data.totalIdeas || 0} article ideas`);
                  console.log(`   Project ID used for analysis: ${analysisProjectId}`);
                  setProgressStatus('✅ Voltooid!');
                  setProgressPercent(100);
                  completed = true; // Mark as completed successfully
                  
                  // Set global flag to prevent false error alerts
                  if (typeof window !== 'undefined') {
                    (window as any).__researchCompleted = true;
                  }
                  
                  // CRITICAL FIX: Use the pinned projectId, not selectedProject which may have changed!
                  // This avoids SSE payload size limits and ensures data consistency
                  if (analysisProjectId) {
                    console.log(`🔄 Reloading project data from database for project: ${analysisProjectId}...`);
                    // Small delay to ensure database write is complete
                    setTimeout(() => {
                      loadContentPlan(analysisProjectId);
                      alert(`✅ ${data.message || 'Content ideeën gegenereerd!'}`);
                    }, 1000);
                  } else {
                    // Keyword mode: we can't reload from database
                    // Show message and clear loading state
                    alert(`✅ ${data.message || 'Content ideeën gegenereerd!'}\n\nLet op: In keyword modus worden resultaten niet opgeslagen. Selecteer een project om resultaten op te slaan.`);
                  }
                  
                  // Close reader and exit loop
                  reader.cancel();
                  break;
                } else if (data.type === 'error') {
                  // Error received from backend
                  console.error('❌ Backend error:', data.error);
                  completed = true; // Mark as completed (with error)
                  alert(`❌ ${data.message || 'Er is een fout opgetreden tijdens de research.'}\n\nDetails: ${data.error}`);
                  
                  // Close reader and exit loop
                  reader.cancel();
                  break;
                } else {
                  // Progress update
                  setProgressStatus(data.status);
                  setProgressPercent(data.progress);
                  setProgressDetails(data.details || '');
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
        
        // After stream ends, check if we completed successfully
        if (!completed) {
          console.warn('⚠️ Stream ended without completion signal');
          // Don't show error immediately - data might still be saved
          // The error handler below will check after a delay
        }
      } else {
        // Fallback to regular JSON response
        const data = await response.json();
        if (data.success) {
          // Reload from database instead of using response data - use pinned projectId!
          if (analysisProjectId) {
            console.log(`🔄 Reloading project ${analysisProjectId} after fallback response...`);
            setTimeout(() => {
              loadContentPlan(analysisProjectId);
              alert(`✅ ${data.message || 'Content ideeën gegenereerd!'}`);
            }, 1000);
          } else {
            alert(`✅ ${data.message || 'Content ideeën gegenereerd!'}\n\nLet op: In keyword modus worden resultaten niet opgeslagen.`);
          }
        } else {
          throw new Error(data.error || 'Fout bij analyse');
        }
      }
    } catch (error: any) {
      console.error('❌ Error during research:', error);
      
      // Don't show error if research already completed successfully
      // This prevents false "network error" alerts after successful completion
      if (typeof window !== 'undefined' && (window as any).__researchCompleted) {
        console.log('ℹ️  Ignoring error - research already completed successfully');
        delete (window as any).__researchCompleted;
        return;
      }
      
      // Check if it's a timeout/abort error
      if (error.name === 'AbortError') {
        console.warn('⏰ Request aborted/timeout');
        // Try to reload if we have a project - use pinned projectId!
        if (analysisProjectId) {
          console.log(`🔄 Attempting to reload project ${analysisProjectId} after timeout...`);
          setTimeout(() => {
            loadContentPlan(analysisProjectId).then(() => {
              // Only show error if reload also fails
              console.log('✅ Data loaded successfully after timeout - no error needed');
            }).catch(() => {
              alert('⏰ De analyse duurt langer dan verwacht. Ververs de pagina om te controleren of er resultaten zijn.');
            });
          }, 1500);
        } else {
          alert('⏰ De analyse duurt langer dan verwacht. Probeer het opnieuw.');
        }
      } else if (error.message?.includes('network') || error.message?.includes('Network') || error.message?.includes('fetch')) {
        console.warn('🌐 Network error detected');
        // Try to reload if we have a project - use pinned projectId!
        if (analysisProjectId) {
          console.log(`🔄 Attempting to reload project ${analysisProjectId} after network error...`);
          setTimeout(() => {
            loadContentPlan(analysisProjectId).then(() => {
              // Data loaded successfully - research was completed!
              console.log('✅ Data loaded successfully - research was completed despite network error');
              alert('✅ Content research succesvol voltooid!');
            }).catch(() => {
              // Data really not available
              alert('🌐 Network fout tijdens analyse. De research is mogelijk wel voltooid. Ververs de pagina om te controleren of er resultaten zijn.');
            });
          }, 1500);
        } else {
          alert('🌐 Network fout tijdens analyse. Controleer je internetverbinding en probeer het opnieuw.');
        }
      } else {
        alert(`❌ ${error.message || 'Fout bij analyse. Probeer het opnieuw.'}`);
      }
    } finally {
      setIsLoading(false);
      setProgressStatus('');
      setProgressPercent(0);
      setProgressDetails('');
    }
  };

  const refreshInsights = async () => {
    if (!selectedProject) return;

    setIsRefreshing(true);
    try {
      const res = await fetch('/api/client/content-research/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject.id }),
      });

      const data = await res.json();
      if (data.success) {
        loadContentPlan(selectedProject.id);
        alert(`✅ ${data.message}`);
      } else {
        alert(`❌ ${data.error || 'Geen nieuwe inzichten'}`);
      }
    } catch (error) {
      console.error('Error refreshing:', error);
      alert('❌ Fout bij refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  // NEW: Refresh content plan with fresh ideas (checks sitemap for duplicates)
  const refreshContentPlan = async () => {
    if (!selectedProject) {
      alert('❌ Selecteer eerst een project');
      return;
    }

    const confirmMessage = `🔄 Contentplan Vernieuwen\n\nDit genereert 10 nieuwe, verse content ideeën en checkt automatisch de sitemap om dubbele content te voorkomen.\n\nDoorgaan?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsRefreshing(true);
    try {
      const res = await fetch('/api/client/content-plan/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: selectedProject.id, 
          count: 10,
          language: selectedLanguage // Include selected language
        }),
      });

      const data = await res.json();
      if (data.success) {
        await loadContentPlan(selectedProject.id);
        alert(`✅ ${data.message}\n\n${data.addedCount} nieuwe ideeën toegevoegd${data.duplicatesFiltered > 0 ? `\n${data.duplicatesFiltered} duplicaten gefilterd` : ''}`);
      } else {
        alert(`❌ ${data.error || 'Kon contentplan niet vernieuwen'}`);
      }
    } catch (error) {
      console.error('Error refreshing content plan:', error);
      alert('❌ Fout bij vernieuwen contentplan');
    } finally {
      setIsRefreshing(false);
    }
  };

  // NEW: Add content ideas by keyword
  const addIdeasByKeyword = async () => {
    if (!selectedProject) {
      alert('❌ Selecteer eerst een project');
      return;
    }

    if (!keywordInput.trim()) {
      alert('❌ Voer een keyword in');
      return;
    }

    setIsAddingIdeas(true);
    try {
      const res = await fetch('/api/client/content-plan/add-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          keyword: keywordInput.trim(),
          count: parseInt(keywordCount) || 5,
          language: selectedLanguage, // Include selected language
        }),
      });

      const data = await res.json();
      if (data.success) {
        await loadContentPlan(selectedProject.id);
        setShowKeywordDialog(false);
        setKeywordInput('');
        setKeywordCount('5');
        alert(`✅ ${data.message}\n\n${data.addedCount} nieuwe ideeën toegevoegd${data.duplicatesFiltered > 0 ? `\n${data.duplicatesFiltered} duplicaten gefilterd` : ''}`);
      } else {
        alert(`❌ ${data.error || 'Kon ideeën niet toevoegen'}`);
      }
    } catch (error) {
      console.error('Error adding ideas:', error);
      alert('❌ Fout bij toevoegen ideeën');
    } finally {
      setIsAddingIdeas(false);
    }
  };

  const markAsWritten = async (ideaId: string) => {
    if (!selectedProject) {
      console.error('No project selected');
      return;
    }

    try {
      const res = await fetch(`/api/client/content-research/mark-written/${ideaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (res.ok) {
        loadContentPlan(selectedProject.id);
      }
    } catch (error) {
      console.error('Error marking as written:', error);
    }
  };

  const toggleExpandIdea = (ideaId: string) => {
    const newExpanded = new Set(expandedIdeas);
    if (newExpanded.has(ideaId)) {
      newExpanded.delete(ideaId);
    } else {
      newExpanded.add(ideaId);
    }
    setExpandedIdeas(newExpanded);
  };

  // Filter ideas
  const filteredIdeas = articleIdeas.filter(idea => {
    if (filterPriority !== 'all' && idea.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && idea.status !== filterStatus) return false;
    return true;
  });

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'low': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Laden...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (status === 'unauthenticated' || !session) {
    router.push('/inloggen');
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <p className="text-gray-300">Niet ingelogd. Doorverwijzen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-orange-500/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
                {t('contentResearch.title')}
              </h1>
              <p className="text-gray-300 mt-2 text-sm sm:text-base">
                {t('contentResearch.subtitle')}
              </p>
            </div>
            <Link href="/client-portal" className="shrink-0">
              <Button 
                variant="outline"
                className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10 w-full sm:w-auto"
              >
                {t('contentResearch.back')}
              </Button>
            </Link>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 flex gap-2 border-b border-orange-500/20">
            <button
              onClick={() => {
                setActiveTab('planning');
                router.push('/client-portal/content-research?tab=planning');
              }}
              className={`px-6 py-3 font-medium text-sm transition-all border-b-2 ${
                activeTab === 'planning'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-orange-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                <span>Ideeën Beheren</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('autopilot');
                router.push('/client-portal/content-research?tab=autopilot');
              }}
              className={`px-6 py-3 font-medium text-sm transition-all border-b-2 ${
                activeTab === 'autopilot'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-orange-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                <span>Autopilot</span>
              </div>
            </button>
          </div>

          {/* Mode Toggle & Input */}
          <div className="mt-4 sm:mt-6 space-y-4">
            {/* Mode Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pb-4 border-b border-orange-500/20">
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setUseManualMode(false)}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all ${
                    !useManualMode 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-[#0a0a0a] text-gray-400 hover:text-white border border-orange-500/30'
                  }`}
                >
                  {t('contentResearch.projectMode')}
                </button>
                <button
                  onClick={() => setUseManualMode(true)}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all ${
                    useManualMode 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-[#0a0a0a] text-gray-400 hover:text-white border border-orange-500/30'
                  }`}
                >
                  {t('contentResearch.keywordMode')}
                </button>
              </div>
              <span className="text-xs sm:text-sm text-gray-400">
                {useManualMode ? `🎯 ${t('contentResearch.keywordModeDesc')}` : `🌐 ${t('contentResearch.projectModeDesc')}`}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
              {/* Project Selector or Keyword Input */}
              {!useManualMode ? (
                <div className="flex-1 flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white mb-2">
                      Selecteer Project
                    </label>
                    <select
                      value={selectedProject?.id || ''}
                      onChange={(e) => {
                        const project = projects.find(p => p.id === e.target.value);
                        if (project) {
                          setSelectedProject(project);
                          // VERWIJDERD: Automatisch laden bij project wissel
                          // loadContentPlan(project.id);
                          
                          // Check if content plan exists and load it (but don't auto-refresh)
                          checkExistingContentPlan(project.id);
                        }
                      }}
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-orange-500/30 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id} className="bg-[#1a1a1a]">
                          {p.name} - {p.websiteUrl}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Herlaad button next to project selector */}
                  <Button
                    onClick={() => {
                      if (selectedProject) {
                        loadContentPlan(selectedProject.id);
                      }
                    }}
                    disabled={!selectedProject || isLoading}
                    variant="outline"
                    className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10 disabled:opacity-50 h-[42px] px-3"
                    title="Herlaad content voor geselecteerd project"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white mb-2">
                    Voer Keyword In
                  </label>
                  <input
                    type="text"
                    value={manualKeyword}
                    onChange={(e) => setManualKeyword(e.target.value)}
                    placeholder={t('contentResearch.keywordPlaceholder')}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-orange-500/30 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    ℹ️ In keyword mode analyseren we geen website, maar genereren content ideeën op basis van je keyword
                  </p>
                </div>
              )}

              {/* Language Selection */}
              <div className="w-full sm:w-40">
                <label className="block text-sm font-medium text-white mb-2">
                  Taal
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as 'NL' | 'EN' | 'DE' | 'FR' | 'ES')}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-orange-500/30 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="NL" className="bg-[#1a1a1a]">🇳🇱 Nederlands</option>
                  <option value="EN" className="bg-[#1a1a1a]">🇺🇸 English</option>
                  <option value="DE" className="bg-[#1a1a1a]">🇩🇪 Deutsch</option>
                  <option value="FR" className="bg-[#1a1a1a]">🇫🇷 Français</option>
                  <option value="ES" className="bg-[#1a1a1a]">🇪🇸 Español</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  onClick={startContentResearch}
                  disabled={isLoading || (!selectedProject && !manualKeyword.trim())}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      Analyseren...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Start Analyse
                    </>
                  )}
                </Button>

                {contentStrategy && !useManualMode && (
                  <>
                    <Button
                      onClick={refreshContentPlan}
                      disabled={isRefreshing}
                      variant="outline"
                      className="border-orange-500 text-orange-500 hover:bg-orange-500/10 disabled:opacity-50 w-full sm:w-auto"
                    >
                      {isRefreshing ? (
                        <>
                          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                          Vernieuwen...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Vernieuw (10 nieuwe)
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowKeywordDialog(true)}
                      disabled={isRefreshing}
                      variant="outline"
                      className="border-green-500 text-green-500 hover:bg-green-500/10 disabled:opacity-50 w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Voeg toe met Keyword
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content - Planning */}
        {activeTab === 'planning' && (
        <>
        {/* Real-time Progress Indicator */}
        {isLoading && (
          <Card className="bg-[#1a1a1a] border-orange-500/20 p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm sm:text-lg font-semibold text-white flex items-center gap-2 flex-1 min-w-0">
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-orange-500 shrink-0" />
                  <span className="truncate">{progressStatus || 'Bezig met analyseren...'}</span>
                </h3>
                <span className="text-xs sm:text-sm text-orange-500 font-medium shrink-0">{progressPercent}%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="relative w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              
              {/* Progress Details */}
              {progressDetails && (
                <p className="text-xs sm:text-sm text-gray-400 flex items-start gap-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 text-orange-500 flex-shrink-0" />
                  <span className="break-words">{progressDetails}</span>
                </p>
              )}
              
              {/* Status Steps */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
                <div className={`text-center transition-opacity duration-300 ${progressPercent >= 20 ? 'opacity-100' : 'opacity-40'}`}>
                  <Globe className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 transition-colors ${progressPercent >= 20 ? 'text-orange-500' : 'text-gray-600'}`} />
                  <p className="text-xs text-gray-400">{t('contentResearch.website')}</p>
                </div>
                <div className={`text-center transition-opacity duration-300 ${progressPercent >= 40 ? 'opacity-100' : 'opacity-40'}`}>
                  <Users className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 transition-colors ${progressPercent >= 40 ? 'text-orange-500' : 'text-gray-600'}`} />
                  <p className="text-xs text-gray-400">{t('contentResearch.competitors')}</p>
                </div>
                <div className={`text-center transition-opacity duration-300 ${progressPercent >= 60 ? 'opacity-100' : 'opacity-40'}`}>
                  <TrendingUp className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 transition-colors ${progressPercent >= 60 ? 'text-orange-500' : 'text-gray-600'}`} />
                  <p className="text-xs text-gray-400">Trends</p>
                </div>
                <div className={`text-center transition-opacity duration-300 ${progressPercent >= 80 ? 'opacity-100' : 'opacity-40'}`}>
                  <Lightbulb className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 transition-colors ${progressPercent >= 80 ? 'text-orange-500' : 'text-gray-600'}`} />
                  <p className="text-xs text-gray-400">{t('contentResearch.ideas')}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Results */}
        {!isLoading && contentStrategy && (
          <>
            {/* Topical Map Import Button */}
            {selectedProject?.id && (
              <div className="flex justify-end mb-4">
                <TopicalMapImport
                  projectId={selectedProject.id}
                  onImportComplete={async () => {
                    // Refresh ideas after import
                    if (selectedProject?.id) {
                      const response = await fetch(`/api/client/content-research?projectId=${selectedProject.id}`);
                      if (response.ok) {
                        const data = await response.json();
                        setArticleIdeas(data.articleIdeas || []);
                        toast.success('Content ideeën ververst!');
                      }
                    }
                  }}
                />
              </div>
            )}

            <Tabs defaultValue="ideas" className="space-y-4 sm:space-y-6">
            <TabsList className="bg-[#1a1a1a] border border-orange-500/20 flex-wrap h-auto gap-1 sm:gap-0">
              <TabsTrigger value="ideas" className="text-gray-300 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm flex-1 sm:flex-none">
                <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Content Ideeën ({filteredIdeas.length})</span>
                <span className="sm:hidden">Ideeën ({filteredIdeas.length})</span>
              </TabsTrigger>
              <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm flex-1 sm:flex-none">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Overzicht
              </TabsTrigger>
              <TabsTrigger value="website" className="text-gray-300 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm flex-1 sm:flex-none">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Website Analyse</span>
                <span className="sm:hidden">{t('contentResearch.website')}</span>
              </TabsTrigger>
              <TabsTrigger value="competitors" className="text-gray-300 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm flex-1 sm:flex-none">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Concurrenten
              </TabsTrigger>
              <TabsTrigger value="trending" className="text-gray-300 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm flex-1 sm:flex-none">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Trending
              </TabsTrigger>
            </TabsList>

            {/* Content Ideas Tab */}
            <TabsContent value="ideas" className="space-y-4">
              {/* Use the new ContentIdeasList component with autopilot features */}
              <ContentIdeasList 
                ideas={filteredIdeas}
                projectId={selectedProject?.id || null}
                language={selectedLanguage}
                onRefresh={async () => {
                  // Refresh the ideas list
                  if (selectedProject?.id) {
                    const response = await fetch(`/api/client/content-research?projectId=${selectedProject.id}`);
                    if (response.ok) {
                      const data = await response.json();
                      setArticleIdeas(data.articleIdeas || []);
                    }
                  }
                }}
              />
            </TabsContent>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Card className="bg-[#1a1a1a] border-orange-500/20 p-4 sm:p-6 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-orange-500 mb-2">
                    {contentStrategy.summary?.totalIdeas || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300">{t('contentResearch.totalIdeas')}</div>
                </Card>
                <Card className="bg-[#1a1a1a] border-orange-500/20 p-4 sm:p-6 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-red-500 mb-2">
                    {contentStrategy.summary?.highPriority || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300">{t('contentResearch.highPriority')}</div>
                </Card>
                <Card className="bg-[#1a1a1a] border-orange-500/20 p-4 sm:p-6 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-green-500 mb-2">
                    {contentStrategy.summary?.competitorGaps || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300">{t('contentResearch.competitorGaps')}</div>
                </Card>
              </div>

              <Card className="bg-[#1a1a1a] border-orange-500/20 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  {t('contentResearch.analysisInfo')}
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-gray-300">
                  <p className="break-words">
                    <strong className="text-white">{t('contentResearch.lastAnalysis')}:</strong>{' '}
                    {contentStrategy.generatedAt 
                      ? new Date(contentStrategy.generatedAt).toLocaleString('nl-NL')
                      : t('contentResearch.unknown')
                    }
                  </p>
                  <p><strong className="text-white">{t('contentResearch.websitePages')}:</strong> {contentStrategy.websiteAnalysis?.totalPages || 0}</p>
                  <p><strong className="text-white">{t('contentResearch.competitorsAnalyzed')}:</strong> {contentStrategy.competitorAnalysis?.competitors?.length || 0}</p>
                  <p><strong className="text-white">{t('contentResearch.trendingTopicsCount')}:</strong> {contentStrategy.trendingTopics?.topics?.length || 0}</p>
                </div>
              </Card>
            </TabsContent>

            {/* Website Analysis Tab */}
            <TabsContent value="website" className="space-y-4">
              <Card className="bg-[#1a1a1a] border-orange-500/20 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                  {t('contentResearch.existingTopics')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {contentStrategy.websiteAnalysis?.existingTopics?.map((topic, i) => (
                    <Badge key={i} variant="outline" className="border-orange-500/30 text-gray-300 text-xs break-words">{topic}</Badge>
                  ))}
                </div>
              </Card>

              <Card className="bg-[#1a1a1a] border-orange-500/20 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  {t('contentResearch.contentGaps')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {contentStrategy.websiteAnalysis?.contentGaps?.map((gap, i) => (
                    <Badge key={i} className="bg-orange-500/10 text-orange-500 text-xs break-words">{gap}</Badge>
                  ))}
                </div>
              </Card>

              {contentStrategy.websiteAnalysis?.topPerformingPages && contentStrategy.websiteAnalysis.topPerformingPages.length > 0 && (
                <Card className="bg-[#1a1a1a] border-orange-500/20 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                    {t('contentResearch.topPerformingPages')}
                  </h3>
                  <div className="space-y-2">
                    {contentStrategy.websiteAnalysis.topPerformingPages.map((page, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-[#0a0a0a] border border-orange-500/20 rounded-lg">
                        <span className="font-medium text-white text-sm break-words">{page.title}</span>
                        <a 
                          href={page.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-orange-500 hover:underline text-xs sm:text-sm shrink-0"
                        >
                          Bekijk →
                        </a>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Competitors Tab */}
            <TabsContent value="competitors" className="space-y-4">
              {contentStrategy.competitorAnalysis?.competitors?.map((comp, i) => (
                <Card key={i} className="bg-[#1a1a1a] border-orange-500/20 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white break-all">{comp.domain}</h3>
                    <Badge className={`${
                      comp.strength === 'high' ? 'bg-red-500/10 text-red-500' :
                      comp.strength === 'medium' ? 'bg-orange-500/10 text-orange-500' :
                      'bg-green-500/10 text-green-500'
                    } text-xs shrink-0`}>
                      {comp.strength} strength
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-white text-xs sm:text-sm">Top Content:</h4>
                    {comp.topContent?.map((content, j) => (
                      <div key={j} className="p-3 bg-[#0a0a0a] border border-orange-500/20 rounded-lg">
                        <div className="font-medium text-white text-sm break-words">{content.title}</div>
                        <div className="text-xs sm:text-sm text-gray-300 break-words">Topic: {content.topic}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}

              <Card className="bg-[#1a1a1a] border-orange-500/20 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  {t('contentResearch.competitorGaps')} (Wat zij NIET doen)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {contentStrategy.competitorAnalysis?.competitorGaps?.map((gap, i) => (
                    <Badge key={i} className="bg-green-500/10 text-green-500 text-xs break-words">{gap}</Badge>
                  ))}
                </div>
              </Card>

              <Card className="bg-[#1a1a1a] border-orange-500/20 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                  {t('contentResearch.opportunities')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {contentStrategy.competitorAnalysis?.opportunities?.map((opp, i) => (
                    <Badge key={i} className="bg-blue-500/10 text-blue-500 text-xs break-words">{opp}</Badge>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Trending Topics Tab */}
            <TabsContent value="trending" className="space-y-4">
              <div className="grid gap-4">
                {contentStrategy.trendingTopics?.topics?.map((topic, i) => (
                  <Card key={i} className="bg-[#1a1a1a] border-orange-500/20 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0" />
                          <h3 className="text-base sm:text-lg font-semibold text-white break-words flex-1">{topic.topic}</h3>
                          <Badge className="bg-blue-500/10 text-blue-500 text-xs shrink-0">
                            {Math.round(topic.relevance * 100)}% {t('contentResearch.relevance')}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-300 break-words">{topic.reasoning}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {contentStrategy.trendingTopics?.questions && contentStrategy.trendingTopics.questions.length > 0 && (
                <Card className="bg-[#1a1a1a] border-orange-500/20 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                    {t('contentResearch.frequentQuestions')}
                  </h3>
                  <div className="space-y-2">
                    {contentStrategy.trendingTopics.questions.map((q, i) => (
                      <div key={i} className="p-3 bg-[#0a0a0a] border border-orange-500/20 rounded-lg text-xs sm:text-sm text-gray-300 break-words">
                        {q}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
          </>
        )}

        {/* Empty State - VERWIJDERD "Welkom bij nieuwe tool" */}
        {!isLoading && !contentStrategy && (
          <Card className="bg-[#1a1a1a] border-orange-500/20 p-6 sm:p-12 text-center">
            <Search className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-orange-500 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              {t('contentResearch.startContentResearch')}
            </h3>
            <p className="text-sm sm:text-base text-gray-300 mb-6">
              {t('contentResearch.selectProjectDesc')}
            </p>
            <Button
              onClick={startContentResearch}
              disabled={!selectedProject}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 w-full sm:w-auto"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Start Analyse
            </Button>
          </Card>
        )}
        </>
        )}

        {/* Tab Content - Autopilot */}
        {activeTab === 'autopilot' && (
          <div className="mt-4 sm:mt-6">
            <AutopilotSection 
              projectId={selectedProject?.id || null}
              projectName={selectedProject?.name || ''}
              articleIdeasCount={articleIdeas.length}
              language={selectedLanguage}
            />
          </div>
        )}

        {/* Keyword Expansion Dialog */}
        <Dialog open={showKeywordDialog} onOpenChange={setShowKeywordDialog}>
          <DialogContent className="bg-[#1a1a1a] border-orange-500/20 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-500" />
                Voeg Content Ideeën Toe
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Genereer nieuwe content ideeën op basis van een specifiek keyword. De sitemap wordt automatisch gecheckt om duplicaten te voorkomen.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="keyword" className="text-white">
                  Keyword
                </Label>
                <Input
                  id="keyword"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="bijv. 'yoga voor beginners'"
                  className="bg-[#0a0a0a] border-orange-500/30 text-white placeholder-gray-500"
                  disabled={isAddingIdeas}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="count" className="text-white">
                  Aantal ideeën
                </Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="20"
                  value={keywordCount}
                  onChange={(e) => setKeywordCount(e.target.value)}
                  className="bg-[#0a0a0a] border-orange-500/30 text-white"
                  disabled={isAddingIdeas}
                />
                <p className="text-xs text-gray-400">
                  Genereer tussen 1 en 20 content ideeën
                </p>
              </div>

              {selectedProject && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300 flex items-start gap-2">
                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Content wordt toegevoegd aan: <strong>{selectedProject.name}</strong>
                    </span>
                  </p>
                </div>
              )}

              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-300 flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    De sitemap wordt automatisch gecheckt om dubbele content te voorkomen
                  </span>
                </p>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowKeywordDialog(false)}
                disabled={isAddingIdeas}
                className="border-orange-500/30 text-gray-300 hover:bg-orange-500/10"
              >
                Annuleer
              </Button>
              <Button
                onClick={addIdeasByKeyword}
                disabled={isAddingIdeas || !keywordInput.trim()}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {isAddingIdeas ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Genereren...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Voeg Toe
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Wrapper component with Error Boundary
export default function ContentResearchPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <ContentResearchPage />
    </ErrorBoundary>
  );
}
