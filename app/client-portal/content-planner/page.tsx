
'use client';

/**
 * 🚀 CONTENT PLANNER - Geïntegreerde Content Strategietool
 * 
 * Combineert Topical Mapping + Content Research + Automatisering
 * Van strategische planning naar geautomatiseerde executie
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Network,
  TrendingUp,
  Target,
  Loader2,
  Plus,
  Eye,
  Download,
  CheckCircle2,
  Search,
  ChevronRight,
  BarChart3,
  FileText,
  Zap,
  Calendar,
  Play,
  Settings,
  Sparkles,
  Map,
  Lightbulb,
  Rocket,
  Clock,
  Users,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProjectSelector from '@/components/project-selector';

// ==================== INTERFACES ====================

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

interface ContentIdea {
  id: string;
  title: string;
  keywords: string[];
  category: string;
  searchVolume?: number;
  difficulty?: number;
  isScheduled: boolean;
  scheduledDate?: string;
}

// ==================== MAIN COMPONENT ====================

export default function ContentPlannerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ===== State Management =====
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('topical-map');

  // Topical Map State
  const [topicalMaps, setTopicalMaps] = useState<TopicalMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<TopicalMapDetails | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [mapConfig, setMapConfig] = useState({
    mainTopic: '',
    targetArticles: 100,
    language: 'NL'
  });

  // Content Research State
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [researching, setResearching] = useState(false);
  const [researchMode, setResearchMode] = useState<'project' | 'keyword'>('project');
  const [researchKeyword, setResearchKeyword] = useState('');

  // Planning State
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);

  // ===== Authentication Check =====
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  // ===== Load Topical Maps =====
  useEffect(() => {
    if (selectedProjectId) {
      loadTopicalMaps();
    }
  }, [selectedProjectId]);

  const loadTopicalMaps = async () => {
    if (!selectedProjectId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/client/topical-mapping?projectId=${selectedProjectId}`);
      if (response.ok) {
        const data = await response.json();
        setTopicalMaps(data.topicalMaps || []);
        
        // Auto-select first map if available
        if (data.topicalMaps && data.topicalMaps.length > 0 && !selectedMap) {
          await loadMapDetails(data.topicalMaps[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading topical maps:', error);
      toast.error('Kon topical maps niet laden');
    } finally {
      setLoading(false);
    }
  };

  const loadMapDetails = async (mapId: string) => {
    try {
      const response = await fetch(`/api/client/topical-mapping/${mapId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedMap(data.topicalMap);
      }
    } catch (error) {
      console.error('Error loading map details:', error);
    }
  };

  // ===== Generate New Topical Map =====
  const handleGenerateMap = async () => {
    if (!selectedProjectId || !mapConfig.mainTopic.trim()) {
      toast.error('Vul alle velden in');
      return;
    }

    setGenerating(true);
    setGenerationProgress(0);
    setGenerationMessage('Initialiseren...');

    try {
      const response = await fetch('/api/client/topical-mapping/generate-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          mainTopic: mapConfig.mainTopic,
          targetArticles: mapConfig.targetArticles,
          language: mapConfig.language
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.progress !== undefined) {
              setGenerationProgress(data.progress);
            }
            if (data.message) {
              setGenerationMessage(data.message);
            }
            if (data.done && data.topicalMap) {
              toast.success('Topical Map succesvol gegenereerd!');
              await loadTopicalMaps();
              await loadMapDetails(data.topicalMap.id);
              setShowGenerateDialog(false);
              setMapConfig({ mainTopic: '', targetArticles: 100, language: 'NL' });
            }
            if (data.error) {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error generating map:', error);
      toast.error(error.message || 'Kon topical map niet genereren');
    } finally {
      setGenerating(false);
      setGenerationProgress(0);
      setGenerationMessage('');
    }
  };

  // ===== Content Research =====
  const handleResearch = async () => {
    if (researchMode === 'keyword' && !researchKeyword.trim()) {
      toast.error('Voer een keyword in');
      return;
    }
    if (researchMode === 'project' && !selectedProjectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    setResearching(true);
    try {
      const endpoint = researchMode === 'project' 
        ? `/api/client/content-plan/refresh?projectId=${selectedProjectId}&language=${mapConfig.language}`
        : `/api/client/content-plan/add-ideas`;

      const options = researchMode === 'keyword' ? {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords: [researchKeyword],
          projectId: selectedProjectId,
          language: mapConfig.language
        })
      } : { method: 'POST' };

      const response = await fetch(endpoint, options);
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.ideas?.length || 0} content ideeën gevonden!`);
        await loadContentIdeas();
      } else {
        throw new Error('Research failed');
      }
    } catch (error) {
      console.error('Error researching:', error);
      toast.error('Kon research niet uitvoeren');
    } finally {
      setResearching(false);
    }
  };

  const loadContentIdeas = async () => {
    if (!selectedProjectId) return;

    try {
      const response = await fetch(`/api/client/content-plan?projectId=${selectedProjectId}`);
      if (response.ok) {
        const data = await response.json();
        setContentIdeas(data.ideas || []);
      }
    } catch (error) {
      console.error('Error loading ideas:', error);
    }
  };

  // ===== Generate Content from Topic =====
  const handleGenerateFromTopic = async (topicId: string, topicTitle: string) => {
    try {
      toast.loading('Content wordt gegenereerd...', { id: 'generating' });
      
      const response = await fetch('/api/client/auto-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicTitle,
          projectId: selectedProjectId,
          topicalTopicId: topicId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Generation failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Geen response stream beschikbaar');
      }

      const decoder = new TextDecoder();
      let redirectUrl = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.message) {
                toast.loading(data.message, { id: 'generating' });
              }
              
              if (data.progress !== undefined) {
                toast.loading(`${data.message || 'Genereren...'} (${data.progress}%)`, { id: 'generating' });
              }
              
              if (data.done && data.redirectUrl) {
                redirectUrl = data.redirectUrl;
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('[ContentPlanner] Parse error:', parseError, 'Line:', line);
            }
          }
        }
      }

      toast.success('Content succesvol gegenereerd!', { id: 'generating' });
      
      if (redirectUrl) {
        setTimeout(() => router.push(redirectUrl), 500);
      } else {
        // Reload map details to show updated completion status
        if (selectedMap) {
          await loadMapDetails(selectedMap.id);
        }
      }
    } catch (error: any) {
      console.error('[ContentPlanner] Error generating content:', error);
      toast.error(error.message || 'Kon content niet genereren', { id: 'generating' });
    }
  };

  // ===== Toggle Autopilot =====
  const toggleAutopilot = async () => {
    if (!selectedProjectId) return;

    try {
      const response = await fetch(`/api/client/projects/${selectedProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autopilotEnabled: !autopilotEnabled })
      });

      if (response.ok) {
        setAutopilotEnabled(!autopilotEnabled);
        toast.success(autopilotEnabled ? 'Autopilot uitgeschakeld' : 'Autopilot ingeschakeld');
      }
    } catch (error) {
      console.error('Error toggling autopilot:', error);
      toast.error('Kon autopilot niet wijzigen');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center">
                <Rocket className="text-white" size={24} />
              </div>
              Content Planner
            </h1>
            <p className="text-gray-400 mt-2">
              Van strategische planning naar geautomatiseerde content productie
            </p>
          </div>
          <Badge variant="outline" className="text-purple-400 border-purple-400">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered
          </Badge>
        </div>

        {/* Project Selector */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="space-y-4">
            <Label className="text-white text-lg font-semibold">Selecteer Project</Label>
            <ProjectSelector
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              autoSelectPrimary={true}
            />
          </div>
        </Card>

        {selectedProjectId && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-gray-900 border border-gray-800 p-1 grid grid-cols-3 gap-1">
              <TabsTrigger
                value="topical-map"
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              >
                <Map className="w-4 h-4 mr-2" />
                Topical Map
              </TabsTrigger>
              <TabsTrigger
                value="research"
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                Content Research
              </TabsTrigger>
              <TabsTrigger
                value="planning"
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Planning & Automatisering
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: TOPICAL MAP */}
            <TabsContent value="topical-map" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Network className="text-purple-400" size={24} />
                      Strategische Content Map
                    </h2>
                    <p className="text-gray-400 mt-1">
                      Volledige topical authority structuur voor je niche
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowGenerateDialog(true)}
                    className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nieuwe Map
                  </Button>
                </div>

                {/* Topical Maps List */}
                {topicalMaps.length === 0 ? (
                  <div className="text-center py-12">
                    <Network className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">Nog geen topical maps</p>
                    <Button
                      onClick={() => setShowGenerateDialog(true)}
                      variant="outline"
                      className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                    >
                      Maak je eerste Topical Map
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {topicalMaps.map((map) => (
                      <Card
                        key={map.id}
                        className={`bg-gray-800 border-gray-700 p-4 cursor-pointer hover:border-purple-500 transition-colors ${
                          selectedMap?.id === map.id ? 'border-purple-500 bg-purple-500/10' : ''
                        }`}
                        onClick={() => loadMapDetails(map.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold mb-1">{map.mainTopic}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Badge variant="outline" className="text-xs">
                                {map.language}
                              </Badge>
                              <span>{map.totalArticles} topics</span>
                            </div>
                          </div>
                          <ChevronRight className="text-gray-500" size={20} />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Voortgang</span>
                            <span className="text-white font-medium">
                              {map.statistics.completionPercentage}%
                            </span>
                          </div>
                          <Progress value={map.statistics.completionPercentage} className="h-2" />
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>{map.statistics.completedTopics} / {map.statistics.totalTopics} voltooid</span>
                            <span>{map.statistics.categoriesCount} categorieën</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Selected Map Details */}
                {selectedMap && (
                  <div className="border-t border-gray-800 pt-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {selectedMap.mainTopic}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {selectedMap.statistics.completedTopics} voltooid
                        </Badge>
                        <Badge variant="outline" className="text-purple-400 border-purple-400">
                          {selectedMap.statistics.totalTopics} totaal
                        </Badge>
                      </div>
                    </div>

                    {/* Categories and Topics */}
                    <div className="space-y-4">
                      {selectedMap.categories.map((category) => (
                        <Card key={category.id} className="bg-gray-800 border-gray-700 p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-white font-semibold">{category.name}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                                <span>{category.articleCount} artikelen</span>
                                <span>•</span>
                                <span>{category.completedCount} voltooid</span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                category.priority === 'high'
                                  ? 'border-red-500 text-red-400'
                                  : category.priority === 'medium'
                                  ? 'border-yellow-500 text-yellow-400'
                                  : 'border-blue-500 text-blue-400'
                              }
                            >
                              {category.priority}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {category.topics.map((topic) => (
                              <div
                                key={topic.id}
                                className="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="text-white text-sm font-medium">
                                      {topic.title}
                                    </h5>
                                    <Badge
                                      variant="outline"
                                      className={
                                        topic.type === 'commercial'
                                          ? 'text-green-400 border-green-500/30 bg-green-500/10 text-xs'
                                          : 'text-purple-400 border-purple-500/30 bg-purple-500/10 text-xs'
                                      }
                                    >
                                      {topic.type === 'commercial' ? '💰' : '💡'}
                                    </Badge>
                                    {topic.isCompleted && (
                                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Voltooid
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-400">
                                    {topic.searchVolume && (
                                      <span className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        {topic.searchVolume}
                                      </span>
                                    )}
                                    {topic.difficulty && (
                                      <span className="flex items-center gap-1">
                                        <Target className="w-3 h-3" />
                                        {topic.difficulty}/100
                                      </span>
                                    )}
                                    <span>{topic.keywords.slice(0, 3).join(', ')}</span>
                                  </div>
                                </div>

                                {!topic.isCompleted ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleGenerateFromTopic(topic.id, topic.title)}
                                    className="bg-purple-500 hover:bg-purple-600 text-white"
                                  >
                                    <Zap className="w-4 h-4 mr-1" />
                                    Genereer
                                  </Button>
                                ) : topic.content ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/client-portal/content-library/${topic.content!.id}/edit`)}
                                    className="border-green-500 text-green-400 hover:bg-green-500/10"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Bekijk
                                  </Button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* TAB 2: CONTENT RESEARCH */}
            <TabsContent value="research" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800 p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                      <Lightbulb className="text-orange-400" size={24} />
                      Content Research & Ideegeneratie
                    </h2>
                    <p className="text-gray-400">
                      Vind trending topics en content opportunities met AI
                    </p>
                  </div>

                  {/* Research Mode Selection */}
                  <div className="flex items-center gap-4">
                    <Button
                      variant={researchMode === 'project' ? 'default' : 'outline'}
                      onClick={() => setResearchMode('project')}
                      className={researchMode === 'project' ? 'bg-purple-500' : ''}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Project-based
                    </Button>
                    <Button
                      variant={researchMode === 'keyword' ? 'default' : 'outline'}
                      onClick={() => setResearchMode('keyword')}
                      className={researchMode === 'keyword' ? 'bg-purple-500' : ''}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Keyword-based
                    </Button>
                  </div>

                  {/* Keyword Input (conditional) */}
                  {researchMode === 'keyword' && (
                    <div className="space-y-2">
                      <Label className="text-white">Keyword</Label>
                      <Input
                        value={researchKeyword}
                        onChange={(e) => setResearchKeyword(e.target.value)}
                        placeholder="Bijv: yoga voor beginners"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleResearch}
                    disabled={researching}
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600"
                  >
                    {researching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aan het onderzoeken...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Start Research
                      </>
                    )}
                  </Button>

                  {/* Content Ideas Display */}
                  {contentIdeas.length > 0 && (
                    <div className="border-t border-gray-800 pt-6">
                      <h3 className="text-white font-semibold mb-4">
                        {contentIdeas.length} Content Ideeën
                      </h3>
                      <div className="space-y-2">
                        {contentIdeas.map((idea) => (
                          <div
                            key={idea.id}
                            className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                          >
                            <div className="flex-1">
                              <h4 className="text-white font-medium mb-1">{idea.title}</h4>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <Badge
                                  variant="outline"
                                  className={
                                    idea.category === 'commercial'
                                      ? 'text-green-400 border-green-500/30 bg-green-500/10'
                                      : 'text-purple-400 border-purple-500/30 bg-purple-500/10'
                                  }
                                >
                                  {idea.category === 'commercial' ? '💰 Commercial' : '💡 Informational'}
                                </Badge>
                                {idea.searchVolume && (
                                  <span>{idea.searchVolume} searches/mo</span>
                                )}
                                {idea.keywords.length > 0 && (
                                  <span>{idea.keywords.slice(0, 2).join(', ')}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {idea.isScheduled && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Gepland
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                onClick={() => handleGenerateFromTopic(idea.id, idea.title)}
                                className="bg-purple-500 hover:bg-purple-600"
                              >
                                <Zap className="w-4 h-4 mr-1" />
                                Genereer
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 3: PLANNING & AUTOMATION */}
            <TabsContent value="planning" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800 p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                      <Rocket className="text-blue-400" size={24} />
                      Planning & Automatisering
                    </h2>
                    <p className="text-gray-400">
                      Automatiseer je content productie met Autopilot
                    </p>
                  </div>

                  {/* Autopilot Toggle */}
                  <Card className="bg-gray-800 border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <Zap className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">Autopilot Mode</h3>
                          <p className="text-gray-400 text-sm">
                            Automatisch content genereren volgens planning
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={autopilotEnabled}
                        onCheckedChange={toggleAutopilot}
                        className="data-[state=checked]:bg-purple-500"
                      />
                    </div>

                    {autopilotEnabled && (
                      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-purple-400 mb-2">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-semibold">Autopilot Actief</span>
                        </div>
                        <p className="text-gray-300 text-sm">
                          Content wordt automatisch gegenereerd volgens je Topical Map prioriteiten
                        </p>
                      </div>
                    )}
                  </Card>

                  {/* Statistics */}
                  {selectedMap && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gray-800 border-gray-700 p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <BarChart3 className="text-blue-400" size={20} />
                          <span className="text-gray-400 text-sm">Totaal Topics</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {selectedMap.statistics.totalTopics}
                        </p>
                      </Card>

                      <Card className="bg-gray-800 border-gray-700 p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle2 className="text-green-400" size={20} />
                          <span className="text-gray-400 text-sm">Voltooid</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {selectedMap.statistics.completedTopics}
                        </p>
                      </Card>

                      <Card className="bg-gray-800 border-gray-700 p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Target className="text-purple-400" size={20} />
                          <span className="text-gray-400 text-sm">Voortgang</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {selectedMap.statistics.completionPercentage}%
                        </p>
                      </Card>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="border-t border-gray-800 pt-6">
                    <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="justify-start h-auto py-4 border-purple-500/30 hover:bg-purple-500/10"
                        onClick={() => setActiveTab('topical-map')}
                      >
                        <div className="flex items-center gap-3">
                          <Map className="text-purple-400" size={24} />
                          <div className="text-left">
                            <p className="text-white font-medium">Bekijk Topical Map</p>
                            <p className="text-gray-400 text-sm">Zie complete content strategie</p>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start h-auto py-4 border-orange-500/30 hover:bg-orange-500/10"
                        onClick={() => setActiveTab('research')}
                      >
                        <div className="flex items-center gap-3">
                          <Search className="text-orange-400" size={24} />
                          <div className="text-left">
                            <p className="text-white font-medium">Start Research</p>
                            <p className="text-gray-400 text-sm">Vind nieuwe content ideeën</p>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Network className="text-purple-400" size={24} />
              Nieuwe Topical Map Genereren
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Creëer een complete content strategie voor je niche met AI
            </DialogDescription>
          </DialogHeader>

          {!generating ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-white">Hoofdonderwerp</Label>
                <Input
                  value={mapConfig.mainTopic}
                  onChange={(e) => setMapConfig({ ...mapConfig, mainTopic: e.target.value })}
                  placeholder="Bijv: Yoga voor beginners"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Aantal Topics</Label>
                  <Input
                    type="number"
                    value={mapConfig.targetArticles}
                    onChange={(e) => setMapConfig({ ...mapConfig, targetArticles: parseInt(e.target.value) })}
                    min="50"
                    max="500"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Taal</Label>
                  <select
                    value={mapConfig.language}
                    onChange={(e) => setMapConfig({ ...mapConfig, language: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-gray-800 border border-gray-700 text-white"
                  >
                    <option value="NL">Nederlands</option>
                    <option value="EN">Engels</option>
                    <option value="DE">Duits</option>
                    <option value="FR">Frans</option>
                    <option value="ES">Spaans</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowGenerateDialog(false)}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-400"
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleGenerateMap}
                  disabled={!mapConfig.mainTopic.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Genereer Map
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-8">
              <div className="text-center space-y-4">
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto" />
                <div>
                  <p className="text-white font-semibold text-lg">{generationMessage}</p>
                  <p className="text-gray-400 text-sm mt-1">{generationProgress}% voltooid</p>
                </div>
              </div>
              <Progress value={generationProgress} className="h-3" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
