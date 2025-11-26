'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Network,
  TrendingUp,
  Target,
  Loader2,
  Plus,
  Eye,
  Trash2,
  Download,
  CheckCircle2,
  Circle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  BarChart3,
  FileText,
  Package,
  Pencil,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProjectSelector from '@/components/project-selector';

interface TopicalMap {
  id: string;
  mainTopic: string;
  language: string;
  totalArticles: number;
  createdAt: string;
  statistics: {
    totalTopics: number;
    completedTopics: number;
    completionPercentage: number;
    categoriesCount: number;
  };
}

interface TopicalMapDetails {
  id: string;
  mainTopic: string;
  language: string;
  totalArticles: number;
  project: {
    id: string;
    name: string;
    websiteUrl: string;
  };
  createdAt: string;
  statistics: {
    totalTopics: number;
    completedTopics: number;
    completionPercentage: number;
    authorityScore: number;
    categoriesCount: number;
  };
  categories: Array<{
    id: string;
    name: string;
    priority: string;
    articleCount: number;
    commercialRatio: number;
    completedCount: number;
    topics: Array<{
      id: string;
      title: string;
      type: string;
      keywords: string[];
      searchVolume?: number;
      difficulty?: number;
      priority: number;
      isCompleted: boolean;
      content?: {
        id: string;
        title: string;
        createdAt: string;
      };
    }>;
  }>;
}

export default function TopicalMappingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [topicalMaps, setTopicalMaps] = useState<TopicalMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<TopicalMapDetails | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state - SIMPLIFIED (AI doet alles automatisch)
  const [autoGenerate, setAutoGenerate] = useState(false);
  // Gebruiker kan het aantal topics kiezen (aanbevolen: 200-500)
  const [targetArticles, setTargetArticles] = useState(300); // Realistisch default

  // Progress tracking state
  const [progressStep, setProgressStep] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressMessages, setProgressMessages] = useState<Array<{step: string, message: string, timestamp: Date}>>([]);

  // Auto-write configuration state
  const [showAutoWriteDialog, setShowAutoWriteDialog] = useState(false);
  const [selectedTopicForWrite, setSelectedTopicForWrite] = useState<any>(null);
  const [autoWriteConfig, setAutoWriteConfig] = useState({
    includeInternalLinks: true,
    includeImages: true,
    imageCount: 3,
    includeFAQ: true,
    includeTables: true,
    includeBolLinks: true,
  });
  const [autoWriting, setAutoWriting] = useState(false);
  const [autoWriteProgress, setAutoWriteProgress] = useState('');

  // UI state for better overview
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Search Console integration state
  const [gscConnected, setGscConnected] = useState(false);
  const [checkingGSC, setCheckingGSC] = useState(false);
  const [existingPages, setExistingPages] = useState<any[]>([]);
  const [duplicateInfo, setDuplicateInfo] = useState<Map<string, any>>(new Map());

  // Helper functions for filtering
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    if (selectedMap) {
      setExpandedCategories(new Set(selectedMap.categories.map(c => c.id)));
    }
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const getFilteredTopics = (category: any) => {
    let filtered = category.topics;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((topic: any) =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.keywords.some((k: string) => k.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((topic: any) => topic.type === selectedType);
    }

    return filtered;
  };

  const getFilteredCategories = () => {
    if (!selectedMap) return [];

    let filtered = selectedMap.categories;

    // Filter by selected category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.id === selectedCategory);
    }

    // Filter by search query (show categories with matching topics)
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.topics.some((t: any) => 
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.keywords.some((k: string) => k.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );
    }

    return filtered;
  };

  // Handler voor "Schrijf Nu" knop
  const handleWriteNow = (topic: any) => {
    // Open auto-write configuration dialog
    setSelectedTopicForWrite(topic);
    setShowAutoWriteDialog(true);
  };

  const handleStartAutoWrite = async () => {
    if (!selectedTopicForWrite) return;

    setAutoWriting(true);
    setAutoWriteProgress('Artikel wordt gegenereerd...');
    
    try {
      const response = await fetch('/api/client/topical-mapping/auto-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopicForWrite.id,
          projectId: selectedProjectId,
          config: autoWriteConfig,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Fout bij automatisch schrijven');
        setAutoWriting(false);
        return;
      }

      // Process streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                toast.error(`❌ ${data.error}`);
                setAutoWriting(false);
                return;
              }
              
              if (data.step) {
                setAutoWriteProgress(data.message || data.step);
              }
              
              if (data.step === 'done' && data.success) {
                toast.success('✅ ' + (data.message || 'Artikel succesvol aangemaakt en gepubliceerd!'));
                setShowAutoWriteDialog(false);
                setAutoWriting(false);
                setAutoWriteProgress('');
                // Reload map details
                await handleViewDetails(selectedMap!.id);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error auto-writing:', error);
      toast.error('Fout bij automatisch schrijven');
      setAutoWriting(false);
      setAutoWriteProgress('');
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  // Check for GSC OAuth callback success/error
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gscStatus = params.get('gsc');
    const message = params.get('message');

    if (gscStatus === 'success') {
      toast.success('✅ Google Search Console succesvol gekoppeld!');
      setGscConnected(true);
      // Remove query params
      router.replace('/client-portal/topical-mapping', { scroll: false });
    } else if (gscStatus === 'error') {
      toast.error(`❌ Fout bij koppelen: ${message || 'Onbekende fout'}`);
      // Remove query params
      router.replace('/client-portal/topical-mapping', { scroll: false });
    }
  }, [router]);

  useEffect(() => {
    if (selectedProjectId) {
      loadTopicalMaps();
      checkGSCStatus();
    }
  }, [selectedProjectId]);

  const loadTopicalMaps = async () => {
    if (!selectedProjectId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/client/topical-mapping?projectId=${selectedProjectId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setTopicalMaps(data.topicalMaps || []);
      }
    } catch (error) {
      console.error('Error loading topical maps:', error);
      toast.error('Fout bij laden topical maps');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMap = async () => {
    if (!selectedProjectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    setGenerating(true);
    setProgressPercentage(0);
    setProgressMessages([]);
    
    try {
      const response = await fetch('/api/client/topical-mapping/generate-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          targetArticles: targetArticles, // Gebruiker kan dit aanpassen
          autoAnalyze: true,
          stream: true // Enable streaming
        })
      });

      if (!response.ok) {
        const error = await response.json();
        let errorMessage = error.error || 'Fout bij genereren map';
        
        // Vriendelijke error messages
        if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
          errorMessage = `⏰ De generatie duurde te lang. Probeer met minder topics (bijv. ${Math.floor(targetArticles * 0.6)} in plaats van ${targetArticles})`;
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('overbelast')) {
          errorMessage = '⚠️ AI is momenteel druk. Wacht 30 seconden en probeer opnieuw.';
        }
        
        toast.error(errorMessage, { duration: 6000 });
        setGenerating(false);
        return;
      }

      // Process streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';
      let newlyGeneratedMapId: string | null = null;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                toast.error(`❌ ${data.error}`);
                setGenerating(false);
                return;
              }
              
              if (data.step && data.progress !== undefined) {
                setProgressStep(data.step);
                setProgressPercentage(data.progress);
                setProgressMessage(data.message || '');
                
                // Add to messages log
                setProgressMessages(prev => [
                  ...prev,
                  {
                    step: data.step,
                    message: data.message || '',
                    timestamp: new Date()
                  }
                ]);
              }
              
              if (data.step === 'done' && data.success) {
                // Store the newly generated map ID
                if (data.topicalMap?.id) {
                  newlyGeneratedMapId = data.topicalMap.id;
                }
                
                toast.success(data.message || '✅ Topical map succesvol gegenereerd!');
                setShowCreateForm(false);
                setAutoGenerate(false);
                
                // Load maps and then auto-open the new one
                await loadTopicalMaps();
                
                // Auto-open the newly generated map
                if (newlyGeneratedMapId) {
                  await handleViewDetails(newlyGeneratedMapId);
                }
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating map:', error);
      toast.error('Fout bij genereren topical map');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewDetails = async (mapId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/client/topical-mapping/${mapId}`);
      
      if (response.ok) {
        const data = await response.json();
        setSelectedMap(data.topicalMap);
      } else {
        toast.error('Fout bij laden details');
      }
    } catch (error) {
      console.error('Error loading map details:', error);
      toast.error('Fout bij laden topical map details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    if (!confirm('Weet je zeker dat je deze topical map wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/client/topical-mapping/${mapId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Topical map verwijderd');
        setSelectedMap(null);
        await loadTopicalMaps();
      } else {
        toast.error('Fout bij verwijderen map');
      }
    } catch (error) {
      console.error('Error deleting map:', error);
      toast.error('Fout bij verwijderen topical map');
    }
  };

  // Check Google Search Console status
  const checkGSCStatus = async () => {
    if (!selectedProjectId) return false;
    
    try {
      const response = await fetch(`/api/client/google-search-console/config?projectId=${selectedProjectId}`);
      if (response.ok) {
        const data = await response.json();
        const connected = data.googleSearchConsoleEnabled && !!data.googleSearchConsoleSiteUrl;
        setGscConnected(connected);
        return connected;
      }
    } catch (error) {
      console.error('Error checking GSC status:', error);
    }
    return false;
  };

  // Connect to Google Search Console
  const connectGSC = async () => {
    if (!selectedProjectId) {
      toast.error('Selecteer eerst een project');
      return;
    }
    toast('Navigeren naar Project Settings...', { icon: 'ℹ️' });
    // Navigate to project settings
    setTimeout(() => {
      window.location.href = `/client-portal/projects/${selectedProjectId}`;
    }, 500);
  };

  // Check for duplicate content
  const checkDuplicates = async (silent = false) => {
    if (!selectedMap || !selectedMap.project?.websiteUrl) {
      if (!silent) toast.error('Geen project URL gevonden');
      return { total: 0, duplicates: 0, percentage: 0 };
    }

    if (!silent) setCheckingGSC(true);
    const loadingToast = !silent ? toast.loading('🔍 Checking voor duplicate content...') : null;

    try {
      // Check if GSC is connected
      const connected = await checkGSCStatus();
      if (!connected) {
        if (loadingToast) toast.dismiss(loadingToast);
        if (!silent) toast.error('Koppel eerst Google Search Console');
        return { total: 0, duplicates: 0, percentage: 0 };
      }

      // Prepare topics for duplicate check
      const allTopics = selectedMap.categories.flatMap(category => 
        category.topics.map(topic => ({
          title: topic.title,
          keywords: topic.keywords
        }))
      );

      // Call API to check duplicates
      const response = await fetch('/api/client/search-console/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: selectedMap.project.websiteUrl,
          topics: allTopics
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store duplicate info in state
        const duplicates = new Map();
        data.results.forEach((result: any, index: number) => {
          const topicKey = `${allTopics[index].title}`;
          duplicates.set(topicKey, result);
        });
        setDuplicateInfo(duplicates);
        
        if (loadingToast) toast.dismiss(loadingToast);
        
        const summary = data.summary || { total: allTopics.length, duplicates: 0 };
        const percentage = summary.total > 0 ? (summary.duplicates / summary.total) * 100 : 0;
        
        if (!silent) {
          if (summary.duplicates > 0) {
            toast.error(`⚠️ ${summary.duplicates} mogelijke duplicates gevonden (${percentage.toFixed(0)}%)`, {
              duration: 5000,
            });
          } else {
            toast.success('✅ Geen duplicates gevonden!');
          }
        }
        
        return { ...summary, percentage };
      } else {
        throw new Error('Failed to check duplicates');
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
      if (loadingToast) toast.dismiss(loadingToast);
      if (!silent) toast.error('Fout bij duplicate check');
      return { total: 0, duplicates: 0, percentage: 0 };
    } finally {
      if (!silent) setCheckingGSC(false);
    }
  };

  // Load existing pages from Search Console
  const loadExistingPages = async () => {
    if (!selectedMap || !selectedMap.project?.websiteUrl) {
      return;
    }

    try {
      const response = await fetch(
        `/api/client/search-console/pages?siteUrl=${encodeURIComponent(selectedMap.project.websiteUrl)}`
      );

      if (response.ok) {
        const data = await response.json();
        setExistingPages(data.pages || []);
      }
    } catch (error) {
      console.error('Error loading existing pages:', error);
    }
  };

  // Check GSC status on mount
  useEffect(() => {
    checkGSCStatus();
  }, []);

  // Load existing pages and auto-check duplicates when map is selected
  useEffect(() => {
    if (selectedMap && gscConnected) {
      loadExistingPages();
      
      // Auto-check for duplicates (silent mode)
      checkDuplicates(true).then((result) => {
        if (result.duplicates > 0) {
          // Show a persistent warning banner
          toast.error(
            `⚠️ Duplicate Content Alert: ${result.duplicates} van ${result.total} topics (${result.percentage.toFixed(0)}%) hebben mogelijk duplicates`,
            {
              duration: 10000,
              style: {
                background: '#7f1d1d',
                color: '#fecaca',
                border: '1px solid #991b1b',
              },
            }
          );
        }
      });
    }
  }, [selectedMap, gscConnected]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Network className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-white">Topical Authority Mapping</h1>
        </div>
        <p className="text-gray-400">
          Genereer complete topical maps met honderden artikel ideeën voor volledige niche dekking.
          Zoals bewezen: +4.184% organische groei door strategische topical authority.
        </p>
      </div>

      {/* Project Selector */}
      <Card className="bg-gray-800 border-gray-700 p-6 mb-6">
        <Label className="text-white mb-2 block">Selecteer Project</Label>
        <ProjectSelector
          value={selectedProjectId || ''}
          onChange={(projectId) => setSelectedProjectId(projectId || null)}
          autoSelectPrimary={true}
        />
      </Card>

      {selectedProjectId && !selectedMap && (
        <>
          {/* Create New Map Button */}
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="mb-6 bg-gradient-to-r from-orange-500 to-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Topical Map Genereren
            </Button>
          )}

          {/* Create Form - ULTRA SIMPLIFIED */}
          {showCreateForm && (
            <Card className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-orange-500/30 p-8 mb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <Network className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    🚀 AI Topical Map Generator
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Analyseert automatisch je website en niche, en genereert <strong>200 tot 1000+ unieke artikel ideeën</strong> zonder dat je keywords hoeft in te voeren. Kies zelf hoeveel topics je wilt - volledig geautomatiseerd met AI.
                  </p>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/20">
                  <div className="text-3xl mb-2">🤖</div>
                  <p className="text-white font-semibold mb-1">Gemini 3 Pro</p>
                  <p className="text-xs text-gray-400">Nieuwste AI model met superieure reasoning</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/20">
                  <div className="text-3xl mb-2">⚡</div>
                  <p className="text-white font-semibold mb-1">Volledig Automatisch</p>
                  <p className="text-xs text-gray-400">Geen keyword research nodig - AI doet alles</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/20">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-white font-semibold mb-1">1000+ Topics</p>
                  <p className="text-xs text-gray-400">Maximaal aantal artikel ideeën</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Aantal Topics Selector */}
                <div className="bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-orange-500/10 rounded-lg p-6 border-2 border-orange-500/30">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">🚀</div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h4 className="text-white font-bold text-lg mb-2">
                          Hoeveel Topics Wil Je Genereren?
                        </h4>
                        <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                          Kies het aantal unieke artikel ideeën. <span className="text-orange-400 font-semibold">Aanbevolen: 200-500 topics</span> voor optimale snelheid en kwaliteit. 
                          Voor grotere niches kun je tot 1000+ topics genereren (dit duurt 5-10 minuten).
                        </p>
                      </div>

                      {/* Topic Count Input */}
                      <div className="space-y-2">
                        <Label htmlFor="targetArticles" className="text-white text-sm font-medium">
                          Aantal Topics (aanbevolen: 200-500)
                        </Label>
                        <Input
                          id="targetArticles"
                          type="number"
                          min={50}
                          max={1500}
                          step={50}
                          value={targetArticles}
                          onChange={(e) => setTargetArticles(parseInt(e.target.value) || 300)}
                          className="bg-gray-800 border-gray-600 text-white"
                          disabled={generating}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => setTargetArticles(200)}
                            disabled={generating}
                          >
                            200 (Snel)
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => setTargetArticles(300)}
                            disabled={generating}
                          >
                            300 (Aanbevolen)
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => setTargetArticles(500)}
                            disabled={generating}
                          >
                            500 (Uitgebreid)
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => setTargetArticles(1000)}
                            disabled={generating}
                          >
                            1000+ (Maximum)
                          </Button>
                        </div>
                        <p className="text-xs text-gray-400">
                          ⏱️ Geschatte tijd: {targetArticles <= 200 ? '2-4 min' : targetArticles <= 400 ? '4-6 min' : '6-10 min'}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-gray-800/50 rounded p-2 text-center">
                          <div className="text-orange-400 font-bold">✓ Alle Sub-niches</div>
                          <div className="text-gray-400">Volledig</div>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2 text-center">
                          <div className="text-orange-400 font-bold">✓ Long-tail Keywords</div>
                          <div className="text-gray-400">Diepgaand</div>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2 text-center">
                          <div className="text-orange-400 font-bold">✓ Alle Angles</div>
                          <div className="text-gray-400">Compleet</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleGenerateMap}
                    disabled={generating || !selectedProjectId}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-6 text-lg"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        Bezig met genereren ({targetArticles} topics)...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-5 w-5 mr-3" />
                        Genereer {targetArticles} Topics
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      setShowCreateForm(false);
                      setAutoGenerate(false);
                    }}
                    variant="outline"
                    className="border-gray-600 text-gray-300 px-6"
                    disabled={generating}
                  >
                    Annuleren
                  </Button>
                </div>
              </div>

              {/* Progress Bar - Real-time Updates */}
              {generating && (
                <div className="mt-6 p-6 bg-gray-800/50 rounded-lg border border-orange-500/30 space-y-4">
                  {/* Progress Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                      Topical Map Generatie Bezig...
                    </h4>
                    <span className="text-sm font-bold text-orange-500">
                      {progressPercentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out animate-pulse"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  {/* Current Step Message */}
                  {progressMessage && (
                    <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-300 flex items-center gap-2">
                        <span className="text-orange-500">▸</span>
                        {progressMessage}
                      </p>
                    </div>
                  )}

                  {/* Progress Messages Log - Scrollable */}
                  {progressMessages.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-xs font-semibold text-gray-400 mb-2">
                        Gedetailleerde Voortgang:
                      </h5>
                      <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                        {progressMessages.map((msg, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 p-2 bg-gray-900/30 rounded text-xs"
                          >
                            <span className="text-orange-500 mt-0.5">✓</span>
                            <div className="flex-1">
                              <p className="text-gray-300">{msg.message}</p>
                              <p className="text-gray-500 text-[10px] mt-0.5">
                                {msg.timestamp.toLocaleTimeString('nl-NL')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                      <span>Status:</span>
                    </div>
                    <span className="text-gray-300 capitalize">
                      {progressStep.replace(/-/g, ' ').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 leading-relaxed">
                  ℹ️ <strong>Hoe werkt het?</strong> Het systeem analyseert automatisch je project, website URL, niche en bestaande content. Het genereert vervolgens honderden unieke artikel ideeën met perfect gebalanceerde commercial/informational mix (40/60). Geen keyword research nodig!
                </p>
              </div>
            </Card>
          )}

          {/* Topical Maps List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : topicalMaps.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700 p-12 text-center">
              <Network className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Nog geen topical maps
              </h3>
              <p className="text-gray-400 mb-6">
                Genereer je eerste topical authority map om te beginnen met strategische content planning.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topicalMaps.map((map) => (
                <Card
                  key={map.id}
                  className="bg-gray-800 border-gray-700 p-6 hover:border-orange-500 transition-colors cursor-pointer"
                  onClick={() => handleViewDetails(map.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {map.mainTopic}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {map.language} · {map.statistics.categoriesCount} categorieën
                      </p>
                    </div>
                    <Network className="h-6 w-6 text-orange-500" />
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Voortgang</span>
                      <span className="text-white font-semibold">
                        {map.statistics.completionPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                        style={{ width: `${map.statistics.completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400">Totaal Topics</p>
                      <p className="text-lg font-bold text-white">
                        {map.statistics.totalTopics}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Voltooid</p>
                      <p className="text-lg font-bold text-green-400">
                        {map.statistics.completedTopics}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-gray-700 hover:bg-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(map.id);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Bekijk Details
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Map Details View - NIEUWE OVERZICHTELIJKE UI */}
      {selectedMap && (
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Button
              onClick={() => {
                setSelectedMap(null);
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedType('all');
                setExpandedCategories(new Set());
              }}
              variant="outline"
              className="border-gray-600 text-gray-300"
            >
              ← Terug naar Overzicht
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              {/* Google Search Console Actions */}
              {!gscConnected ? (
                <Button
                  onClick={connectGSC}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                >
                  <Network className="h-4 w-4 mr-2" />
                  GSC Koppelen (via Project Settings)
                </Button>
              ) : (
                <Button
                  onClick={() => checkDuplicates(false)}
                  disabled={checkingGSC}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  {checkingGSC ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Check Duplicates
                    </>
                  )}
                </Button>
              )}
              
              <Button
                onClick={expandAll}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300"
              >
                Alles uitklappen
              </Button>
              <Button
                onClick={collapseAll}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300"
              >
                Alles inklappen
              </Button>
              <Button
                onClick={() => handleDeleteMap(selectedMap.id)}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-400 hover:bg-red-600/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Verwijderen
              </Button>
            </div>
          </div>

          {/* Overview Stats - Compacter */}
          <Card className="bg-gradient-to-br from-orange-500/10 to-pink-500/10 border-orange-500/20 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {selectedMap.mainTopic}
                </h2>
                <p className="text-gray-400">
                  {selectedMap.project.name} · {selectedMap.language} · {new Date(selectedMap.createdAt).toLocaleDateString('nl-NL')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Authority Score</p>
                <p className="text-5xl font-bold text-orange-500">
                  {selectedMap.statistics.authorityScore}
                  <span className="text-xl text-gray-400">/100</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <FileText className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-1">Totaal Topics</p>
                <p className="text-3xl font-bold text-white">
                  {selectedMap.statistics.totalTopics}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-1">Voltooid</p>
                <p className="text-3xl font-bold text-green-400">
                  {selectedMap.statistics.completedTopics}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <Package className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-1">Categorieën</p>
                <p className="text-3xl font-bold text-white">
                  {selectedMap.statistics.categoriesCount}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <BarChart3 className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-1">Voortgang</p>
                <p className="text-3xl font-bold text-purple-400">
                  {selectedMap.statistics.completionPercentage}%
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end px-2"
                  style={{ width: `${selectedMap.statistics.completionPercentage}%` }}
                >
                  <span className="text-xs font-bold text-white">
                    {selectedMap.statistics.completionPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Filters & Search */}
          <Card className="bg-gray-800 border-gray-700 p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              {/* Search */}
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Zoek topics of keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="w-full lg:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full lg:w-auto px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="all">Alle categorieën ({selectedMap.statistics.categoriesCount})</option>
                  {selectedMap.categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.topics.length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div className="w-full lg:w-auto">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full lg:w-auto px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="all">Alle types</option>
                  <option value="commercial">💰 Commercial</option>
                  <option value="informational">💡 Informational</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(searchQuery || selectedCategory !== 'all' || selectedType !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedType('all');
                  }}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300"
                >
                  Reset filters
                </Button>
              )}
            </div>

            {/* Filter Results Info */}
            {(searchQuery || selectedCategory !== 'all' || selectedType !== 'all') && (
              <div className="mt-4 text-sm text-gray-400">
                <span className="font-semibold text-white">
                  {getFilteredCategories().reduce((sum, cat) => sum + getFilteredTopics(cat).length, 0)}
                </span> topics gevonden
              </div>
            )}
          </Card>

          {/* Categories - UITKLAPBARE VERSIE MET ALLE TOPICS */}
          <div className="space-y-4">
            {getFilteredCategories().length === 0 ? (
              <Card className="bg-gray-800 border-gray-700 p-12 text-center">
                <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Geen resultaten gevonden
                </h3>
                <p className="text-gray-400">
                  Probeer andere filters of zoektermen
                </p>
              </Card>
            ) : (
              getFilteredCategories().map((category) => {
                const filteredTopics = getFilteredTopics(category);
                const isExpanded = expandedCategories.has(category.id);

                return (
                  <Card key={category.id} className="bg-gray-800 border-gray-700 overflow-hidden">
                    {/* Category Header - KLIKBAAR */}
                    <div
                      onClick={() => toggleCategory(category.id)}
                      className="p-6 cursor-pointer hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Expand/Collapse Icon */}
                          <div className="mt-1">
                            {isExpanded ? (
                              <ChevronDown className="h-6 w-6 text-orange-500" />
                            ) : (
                              <ChevronRight className="h-6 w-6 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-white mb-2">
                              {category.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <span className={`px-3 py-1 rounded-full font-semibold ${
                                category.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                category.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {category.priority === 'high' ? '🔥 Hoge prioriteit' :
                                 category.priority === 'medium' ? '⭐ Gemiddelde prioriteit' :
                                 '✓ Lage prioriteit'}
                              </span>
                              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 font-semibold">
                                💰 {Math.round(category.commercialRatio * 100)}% commercial
                              </span>
                              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 font-semibold">
                                📊 {filteredTopics.length} topics
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <p className="text-3xl font-bold text-white">
                            {category.completedCount}<span className="text-gray-400">/{category.articleCount}</span>
                          </p>
                          <p className="text-sm text-gray-400">voltooid</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${(category.completedCount / category.articleCount) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Topics List - UITKLAPBAAR met ALLE topics */}
                    {isExpanded && (
                      <div className="border-t border-gray-700 bg-gray-900/50 p-6">
                        <div className="space-y-2">
                          {filteredTopics.length === 0 ? (
                            <p className="text-center text-gray-400 py-4">
                              Geen topics gevonden met huidige filters
                            </p>
                          ) : (
                            filteredTopics.map((topic, index) => (
                              <div
                                key={topic.id}
                                className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                              >
                                {/* Nummer */}
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-400">
                                  {index + 1}
                                </div>

                                {/* Status Icon */}
                                {topic.isCompleted ? (
                                  <CheckCircle2 className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                                ) : (
                                  <Circle className="h-6 w-6 text-gray-600 mt-1 flex-shrink-0" />
                                )}

                                {/* Topic Content */}
                                <div className="flex-1 min-w-0">
                                  <p className={`font-semibold text-base mb-2 ${
                                    topic.isCompleted ? 'text-green-400 line-through' : 'text-white'
                                  }`}>
                                    {topic.title}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Type Badge */}
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      topic.type === 'commercial'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-purple-500/20 text-purple-400'
                                    }`}>
                                      {topic.type === 'commercial' ? '💰 Commercial' : '💡 Informational'}
                                    </span>

                                    {/* Priority */}
                                    <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold">
                                      Priority: {topic.priority}/10
                                    </span>

                                    {/* Search Volume */}
                                    {topic.searchVolume && (
                                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
                                        📊 Vol: {topic.searchVolume.toLocaleString()}
                                      </span>
                                    )}

                                    {/* Difficulty */}
                                    {topic.difficulty && (
                                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        topic.difficulty > 60 ? 'bg-red-500/20 text-red-400' :
                                        topic.difficulty > 30 ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-green-500/20 text-green-400'
                                      }`}>
                                        🎯 Diff: {topic.difficulty}
                                      </span>
                                    )}
                                  </div>

                                  {/* Keywords */}
                                  {topic.keywords && topic.keywords.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {topic.keywords.slice(0, 5).map((keyword, kidx) => (
                                        <span
                                          key={kidx}
                                          className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                                        >
                                          {keyword}
                                        </span>
                                      ))}
                                      {topic.keywords.length > 5 && (
                                        <span className="px-2 py-1 text-gray-400 text-xs">
                                          +{topic.keywords.length - 5} meer
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Duplicate Warning */}
                                  {(() => {
                                    const dupInfo = duplicateInfo.get(topic.title);
                                    if (dupInfo && dupInfo.isDuplicate) {
                                      return (
                                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                                          <p className="text-red-400 text-xs font-semibold mb-1">
                                            🔴 Mogelijk Duplicate Content
                                          </p>
                                          <p className="text-red-300 text-xs">
                                            Match: {(dupInfo.score * 100).toFixed(0)}% - {dupInfo.matchedUrl}
                                          </p>
                                          {dupInfo.existingTitle && (
                                            <p className="text-red-300 text-xs mt-1">
                                              Bestaand: "{dupInfo.existingTitle}"
                                            </p>
                                          )}
                                        </div>
                                      );
                                    } else if (dupInfo && !dupInfo.isDuplicate && dupInfo.score > 0.4) {
                                      return (
                                        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                          <p className="text-yellow-400 text-xs font-semibold">
                                            ⚠️  Vergelijkbare Content Gevonden
                                          </p>
                                          <p className="text-yellow-300 text-xs">
                                            Match: {(dupInfo.score * 100).toFixed(0)}% - Zorg voor unieke aanpak
                                          </p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}

                                  {/* Content Link (if completed) */}
                                  {topic.content && (
                                    <div className="mt-2 text-sm text-green-400">
                                      ✓ Content beschikbaar: {new Date(topic.content.createdAt).toLocaleDateString('nl-NL')}
                                    </div>
                                  )}

                                  {/* Schrijf Nu Button */}
                                  {!topic.isCompleted && (
                                    <div className="mt-3">
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleWriteNow(topic);
                                        }}
                                        size="sm"
                                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
                                      >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Schrijf Nu
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Category Summary */}
                        <div className="mt-6 pt-6 border-t border-gray-700">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-white">{filteredTopics.length}</p>
                              <p className="text-xs text-gray-400">Topics weergegeven</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-400">
                                {filteredTopics.filter(t => t.isCompleted).length}
                              </p>
                              <p className="text-xs text-gray-400">Voltooid</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-orange-400">
                                {filteredTopics.filter(t => t.type === 'commercial').length}
                              </p>
                              <p className="text-xs text-gray-400">Commercial</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-purple-400">
                                {filteredTopics.filter(t => t.type === 'informational').length}
                              </p>
                              <p className="text-xs text-gray-400">Informational</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Auto-Write Configuration Dialog */}
      <Dialog open={showAutoWriteDialog} onOpenChange={setShowAutoWriteDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              ⚡ Automatisch Artikel Schrijven & Publiceren
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configureer de opties en het artikel wordt volledig automatisch geschreven, opgeslagen en gepubliceerd naar WordPress.
            </DialogDescription>
          </DialogHeader>

          {selectedTopicForWrite && (
            <div className="space-y-6 py-4">
              {/* Topic Info */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">{selectedTopicForWrite.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTopicForWrite.keywords?.map((keyword: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Configuration Options */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Content Opties:</h4>

                {/* Internal Links */}
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex-1">
                    <Label htmlFor="internal-links" className="text-white font-medium cursor-pointer">
                      🔗 Interne Links
                    </Label>
                    <p className="text-xs text-gray-400 mt-1">
                      Voeg automatisch relevante interne links toe naar andere content
                    </p>
                  </div>
                  <Switch
                    id="internal-links"
                    checked={autoWriteConfig.includeInternalLinks}
                    onCheckedChange={(checked) => 
                      setAutoWriteConfig({ ...autoWriteConfig, includeInternalLinks: checked })
                    }
                  />
                </div>

                {/* Images */}
                <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="images" className="text-white font-medium cursor-pointer">
                        🖼️ Afbeeldingen
                      </Label>
                      <p className="text-xs text-gray-400 mt-1">
                        Genereer AI afbeeldingen voor het artikel
                      </p>
                    </div>
                    <Switch
                      id="images"
                      checked={autoWriteConfig.includeImages}
                      onCheckedChange={(checked) => 
                        setAutoWriteConfig({ ...autoWriteConfig, includeImages: checked })
                      }
                    />
                  </div>
                  {autoWriteConfig.includeImages && (
                    <div className="pl-6">
                      <Label htmlFor="image-count" className="text-sm text-gray-300">Aantal afbeeldingen:</Label>
                      <Input
                        id="image-count"
                        type="number"
                        min="1"
                        max="10"
                        value={autoWriteConfig.imageCount}
                        onChange={(e) => 
                          setAutoWriteConfig({ ...autoWriteConfig, imageCount: parseInt(e.target.value) || 3 })
                        }
                        className="w-24 mt-1 bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  )}
                </div>

                {/* FAQ */}
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex-1">
                    <Label htmlFor="faq" className="text-white font-medium cursor-pointer">
                      ❓ FAQ Sectie
                    </Label>
                    <p className="text-xs text-gray-400 mt-1">
                      Voeg veelgestelde vragen en antwoorden toe
                    </p>
                  </div>
                  <Switch
                    id="faq"
                    checked={autoWriteConfig.includeFAQ}
                    onCheckedChange={(checked) => 
                      setAutoWriteConfig({ ...autoWriteConfig, includeFAQ: checked })
                    }
                  />
                </div>

                {/* Tables */}
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex-1">
                    <Label htmlFor="tables" className="text-white font-medium cursor-pointer">
                      📊 Tabellen
                    </Label>
                    <p className="text-xs text-gray-400 mt-1">
                      Voeg vergelijkingstabellen en datatabellen toe waar relevant
                    </p>
                  </div>
                  <Switch
                    id="tables"
                    checked={autoWriteConfig.includeTables}
                    onCheckedChange={(checked) => 
                      setAutoWriteConfig({ ...autoWriteConfig, includeTables: checked })
                    }
                  />
                </div>

                {/* Bol Affiliate Links */}
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex-1">
                    <Label htmlFor="bol-links" className="text-white font-medium cursor-pointer">
                      🛒 Bol.com Affiliate Links
                    </Label>
                    <p className="text-xs text-gray-400 mt-1">
                      Voeg automatisch relevante producten toe met affiliate links
                    </p>
                  </div>
                  <Switch
                    id="bol-links"
                    checked={autoWriteConfig.includeBolLinks}
                    onCheckedChange={(checked) => 
                      setAutoWriteConfig({ ...autoWriteConfig, includeBolLinks: checked })
                    }
                  />
                </div>
              </div>

              {/* Progress Display */}
              {autoWriting && autoWriteProgress && (
                <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-white">Bezig met genereren...</p>
                      <p className="text-xs text-gray-400 mt-1">{autoWriteProgress}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleStartAutoWrite}
                  disabled={autoWriting}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-6"
                >
                  {autoWriting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Bezig met schrijven...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Start Automatisch Schrijven & Publiceren
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowAutoWriteDialog(false);
                    setAutoWriting(false);
                    setAutoWriteProgress('');
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                  disabled={autoWriting}
                >
                  Annuleren
                </Button>
              </div>

              {/* Info Box */}
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300 leading-relaxed">
                  ℹ️ <strong>Wat gebeurt er?</strong> Het artikel wordt volledig automatisch gegenereerd met AI, opgeslagen in je Content Bibliotheek, het topic wordt gemarkeerd als "Voltooid" in de content map, en direct gepubliceerd naar je WordPress website (indien geconfigureerd).
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
