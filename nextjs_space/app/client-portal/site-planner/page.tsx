'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  FileText,
  Layout,
  Trash2,
  Edit2,
  X,
  ChevronRight,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import ProjectSelector from '@/components/project-selector';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  keywords?: string[];
  url?: string;
  type?: string;
  clusters?: ContentItem[];
  blogs?: ContentItem[];
}

interface PlanData {
  homepage?: ContentItem;
  pillars?: ContentItem[];
  existingTopics?: string[];
  existingTopicsCount?: number;
}

interface SavedPlan {
  id: string;
  name: string;
  keywords: string[];
  targetAudience?: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export default function SitePlannerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Form state
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  // Plan state
  const [currentPlan, setCurrentPlan] = useState<PlanData | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [isExistingPlan, setIsExistingPlan] = useState(false);
  
  // Edit state
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editKeywords, setEditKeywords] = useState<string[]>([]);
  const [editUrl, setEditUrl] = useState('');
  
  // Add item state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemType, setNewItemType] = useState<'pillar' | 'cluster' | 'blog'>('pillar');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemKeywords, setNewItemKeywords] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemParentId, setNewItemParentId] = useState<string | null>(null);
  
  // Sidebar state
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set());
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  
  // Existing topics state
  const [showExistingTopics, setShowExistingTopics] = useState(false);

  // Fetch project name when project changes
  useEffect(() => {
    if (projectId) {
      fetch(`/api/client/projects/${projectId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.project) {
            setProjectName(data.project.name);
            console.log('✅ [Site Planner] Project name loaded:', data.project.name);
          }
        })
        .catch((error) => {
          console.error('❌ [Site Planner] Failed to load project name:', error);
          setProjectName('');
        });
    } else {
      setProjectName('');
    }
  }, [projectId]);

  // Load existing plan when project changes (without auto-generating)
  useEffect(() => {
    console.log('🔄 [Site Planner] Project ID changed:', projectId);
    if (projectId) {
      console.log('✅ [Site Planner] Checking for existing plan:', projectId);
      loadExistingPlan();
    } else {
      console.log('❌ [Site Planner] No project selected, clearing plan');
      setCurrentPlan(null);
      setCurrentPlanId(null);
      setPlanName('');
      setIsExistingPlan(false);
    }
  }, [projectId]);

  // Load existing plan only (don't generate if not found)
  const loadExistingPlan = async () => {
    if (!projectId) {
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setProgressMessage('Controleren op bestaand plan...');

    try {
      const response = await fetch('/api/client/site-planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          onlyLoadExisting: true,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.plan) {
        console.log('✅ [Site Planner] Existing plan loaded');
        setCurrentPlan(data.plan);
        setCurrentPlanId(data.planId || null);
        setPlanName(data.planName || data.plan.siteName || '');
        setIsExistingPlan(true);
        setProgress(100);
        setProgressMessage('Plan geladen!');
      } else if (data.noPlan) {
        console.log('ℹ️ [Site Planner] No existing plan found');
        setCurrentPlan(null);
        setCurrentPlanId(null);
        setPlanName('');
        setIsExistingPlan(false);
        setProgress(0);
        setProgressMessage('');
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('❌ [Site Planner] Load existing plan error:', error);
      toast.error(error.message || 'Er ging iets mis bij het laden');
      setCurrentPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrGeneratePlan = async (forceRegenerate = false) => {
    if (!projectId) {
      return;
    }

    // Clear previous plan immediately when switching
    if (!forceRegenerate) {
      setCurrentPlan(null);
      setCurrentPlanId(null);
      setPlanName('');
    }

    setIsLoading(true);
    setIsGenerating(true);
    setProgress(0);
    setProgressMessage(forceRegenerate ? 'Plan wordt opnieuw gegenereerd...' : 'Nieuw plan wordt gegenereerd...');

    try {
      const response = await fetch('/api/client/site-planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          forceRegenerate,
        }),
      });

      // Check if it's a streaming response
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/event-stream')) {
        // Streaming response for new generation
        console.log('📡 [Site Planner] Starting stream processing...');
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Geen response stream');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('✅ [Site Planner] Stream completed');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              
              if (data.progress !== undefined) {
                console.log(`📊 Progress: ${data.progress}% - ${data.message || ''}`);
                setProgress(data.progress);
                if (data.message) setProgressMessage(data.message);
              }
              
              if (data.plan) {
                console.log('✅ [Site Planner] Plan received');
                setCurrentPlan(data.plan);
                setCurrentPlanId(data.planId || null);
                setPlanName(data.plan.siteName || '');
                setIsExistingPlan(false);
                toast.success('✅ Content plan succesvol gegenereerd!');
              }
              
              if (data.error) {
                console.error('❌ [Site Planner] Error from stream:', data.error);
                throw new Error(data.error);
              }
            }
          }
        }
      } else {
        // Direct response for existing plan
        const data = await response.json();
        
        if (data.success && data.plan) {
          console.log('✅ [Site Planner] Existing plan loaded');
          setCurrentPlan(data.plan);
          setCurrentPlanId(data.planId || null);
          setPlanName(data.planName || data.plan.siteName || '');
          setIsExistingPlan(data.isExisting || false);
          setProgress(100);
          setProgressMessage('Plan geladen!');
          toast.success('✅ Plan geladen!');
        } else if (data.error) {
          throw new Error(data.error);
        }
      }
    } catch (error: any) {
      console.error('❌ [Site Planner] Load/Generate error:', error);
      toast.error(error.message || 'Er ging iets mis');
      setProgress(0);
      setProgressMessage('');
      setCurrentPlan(null);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      console.log('🏁 [Site Planner] Load/Generate completed');
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Weet je zeker dat je het plan opnieuw wilt genereren? De huidige wijzigingen gaan verloren.')) {
      return;
    }
    await loadOrGeneratePlan(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;

    if (!projectId) {
      toast.error('Geen project geselecteerd');
      return;
    }

    try {
      const response = await fetch('/api/client/site-planner/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, itemId }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentPlan(data.plan);
        toast.success('✅ Item verwijderd!');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Delete item error:', error);
      toast.error(error.message || 'Fout bij verwijderen');
    }
  };

  const handleAddItem = async () => {
    if (!projectId) {
      toast.error('Geen project geselecteerd');
      return;
    }

    if (!newItemTitle || !newItemDescription) {
      toast.error('Vul alle verplichte velden in');
      return;
    }

    try {
      const response = await fetch('/api/client/site-planner/add-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          type: newItemType,
          parentId: newItemParentId,
          item: {
            title: newItemTitle,
            description: newItemDescription,
            keywords: newItemKeywords.split(',').map((k) => k.trim()).filter(Boolean),
            url: newItemUrl,
            priority: 'medium',
            estimatedWords: 1500,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentPlan(data.plan);
        toast.success('✅ Item toegevoegd!');
        
        // Reset form
        setShowAddItemModal(false);
        setNewItemTitle('');
        setNewItemDescription('');
        setNewItemKeywords('');
        setNewItemUrl('');
        setNewItemParentId(null);
        setNewItemType('pillar');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Add item error:', error);
      toast.error(error.message || 'Fout bij toevoegen');
    }
  };

  const handleEditItem = (item: ContentItem) => {
    setEditingItem(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditKeywords(item.keywords || []);
    setEditUrl(item.url || '');
  };

  const handleSaveEdit = async () => {
    if (!projectId || !editingItem) return;

    try {
      const response = await fetch('/api/client/site-planner/update-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          itemId: editingItem,
          title: editTitle,
          description: editDescription,
          keywords: editKeywords,
          url: editUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentPlan(data.plan);
        toast.success('✅ Item bijgewerkt!');
        setEditingItem(null);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Fout bij bijwerken');
    }
  };

  const handleStartContent = (item: ContentItem) => {
    // Navigate to Content Generator with pre-filled data
    const params = new URLSearchParams({
      title: item.title,
      description: item.description,
      keywords: item.keywords?.join(', ') || '',
      projectId: projectId,
    });
    router.push(`/client-portal/content-generator?${params.toString()}`);
  };

  const togglePillar = (pillarId: string) => {
    const newSet = new Set(expandedPillars);
    if (newSet.has(pillarId)) {
      newSet.delete(pillarId);
    } else {
      newSet.add(pillarId);
    }
    setExpandedPillars(newSet);
  };

  const toggleCluster = (clusterId: string) => {
    const newSet = new Set(expandedClusters);
    if (newSet.has(clusterId)) {
      newSet.delete(clusterId);
    } else {
      newSet.add(clusterId);
    }
    setExpandedClusters(newSet);
  };

  const renderContentItem = (item: ContentItem, type: string, level: number = 0) => {
    const isEditing = editingItem === item.id;
    const indent = level * 16;

    return (
      <div key={item.id} style={{ marginLeft: `${indent}px` }} className="mb-2">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-3">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-gray-900 border-gray-700"
                  placeholder="Titel"
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="bg-gray-900 border-gray-700"
                  placeholder="Beschrijving"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Opslaan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingItem(null)}
                    className="border-gray-600"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Annuleer
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {(type === 'pillar' || type === 'cluster') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-6 w-6"
                          onClick={() =>
                            type === 'pillar' ? togglePillar(item.id) : toggleCluster(item.id)
                          }
                        >
                          {(type === 'pillar' ? expandedPillars : expandedClusters).has(item.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      <h4 className="font-semibold text-white text-sm truncate">{item.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
                    {item.url && (
                      <p className="text-xs text-orange-400 mt-1 truncate">/{item.url}</p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleStartContent(item)}
                      className="bg-orange-600 hover:bg-orange-700 h-7 px-2 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditItem(item)}
                      className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteItem(item.id)}
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Render child items */}
                {type === 'pillar' && expandedPillars.has(item.id) && item.clusters && (
                  <div className="mt-2 space-y-2">
                    {item.clusters.map((cluster) => renderContentItem(cluster, 'cluster', level + 1))}
                  </div>
                )}

                {type === 'cluster' && expandedClusters.has(item.id) && item.blogs && (
                  <div className="mt-2 space-y-2">
                    {item.blogs.map((blog) => renderContentItem(blog, 'blog', level + 1))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!session) {
    router.push('/client/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto py-4 px-2 sm:py-6 sm:px-4 max-w-7xl">
        <div className="space-y-4 lg:space-y-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-green-600 rounded-xl">
                  <Layout className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-500">
                    {projectName || 'Site Planner'}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    {projectName 
                      ? (currentPlan ? `Contentplan voor ${projectName}` : `Klaar om plan te genereren voor ${projectName}`)
                      : 'Selecteer een project om te beginnen'}
                  </p>
                </div>
              </div>
              {currentPlan && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAddItemModal(true)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Item Toevoegen
                  </Button>
                  <Button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    size="sm"
                    variant="outline"
                    className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Regenereer
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Project Selector */}
          {!isGenerating && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-base sm:text-lg text-white">Selecteer Project</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Kies een project om het contentplan te laden of een nieuw plan te genereren
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="project" className="text-xs sm:text-sm text-white">
                    Project *
                  </Label>
                  <ProjectSelector
                    value={projectId}
                    onChange={(id) => setProjectId(id || '')}
                    className="h-8 sm:h-9"
                  />
                </div>
                {projectId && !currentPlan && !isLoading && !isGenerating && (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                      <div className="space-y-2">
                        <p className="text-xs text-green-400 font-medium">
                          ✨ Klaar om een nieuw contentplan te genereren
                        </p>
                        <p className="text-xs text-green-300/80">
                          Het systeem scant eerst je bestaande sitemap om te zien welke onderwerpen al bestaan. 
                          Daarna worden <strong>alleen nieuwe, unieke onderwerpen</strong> gegenereerd die nog niet op je website staan.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => loadOrGeneratePlan(false)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-10"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Genereer Nieuw Plan (alleen nieuwe onderwerpen)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

            {/* Progress */}
            {isGenerating && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-orange-500" />
                      <div className="flex-1">
                        <p className="text-sm sm:text-base text-white font-medium">
                          {progressMessage}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400">{progress}%</p>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Existing Topics Section */}
            {currentPlan && currentPlan.existingTopics && currentPlan.existingTopics.length > 0 && (
              <Card className="bg-yellow-900/20 border-yellow-700/30">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-yellow-300 mb-1">
                          📚 {currentPlan.existingTopicsCount || currentPlan.existingTopics.length} Bestaande Onderwerpen Gevonden
                        </h4>
                        <p className="text-xs text-yellow-200/80 leading-relaxed mb-2">
                          Deze onderwerpen staan al op je website en zijn <strong>uitgesloten</strong> van het nieuwe plan. Het plan bevat alleen nieuwe, unieke onderwerpen.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowExistingTopics(!showExistingTopics)}
                          className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20 h-7 text-xs"
                        >
                          {showExistingTopics ? 'Verberg bestaande onderwerpen' : 'Toon bestaande onderwerpen'}
                          {showExistingTopics ? (
                            <ChevronDown className="w-3 h-3 ml-1" />
                          ) : (
                            <ChevronRight className="w-3 h-3 ml-1" />
                          )}
                        </Button>
                        
                        {showExistingTopics && (
                          <div className="mt-3 max-h-64 overflow-y-auto bg-gray-900/50 rounded-lg p-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {currentPlan.existingTopics.map((topic, index) => (
                                <div 
                                  key={index} 
                                  className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded truncate"
                                  title={topic}
                                >
                                  {index + 1}. {topic}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Banner */}
            {currentPlan && (
              <Card className="bg-blue-900/20 border-blue-700/30">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-300 mb-1">
                        📋 Dit is een contentplan met NIEUWE onderwerpen
                      </h4>
                      <p className="text-xs text-blue-200/80 leading-relaxed">
                        Alle items hieronder zijn <strong>nieuw</strong> en staan nog niet op je website. Klik op de <strong>"Start"</strong> knop bij elk item om de volledige content te genereren en naar WordPress te publiceren.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Plan */}
            {currentPlan && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {planName || 'Content Plan'}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                      {(() => {
                        let count = currentPlan.homepage ? 1 : 0;
                        count += currentPlan.pillars?.length || 0;
                        currentPlan.pillars?.forEach((pillar: any) => {
                          count += pillar.clusters?.length || 0;
                          pillar.clusters?.forEach((cluster: any) => {
                            count += cluster.blogs?.length || 0;
                          });
                        });
                        const existingCount = currentPlan.existingTopicsCount || 0;
                        return `${count} nieuwe content items${existingCount > 0 ? ` · ${existingCount} bestaande uitgesloten` : ''} · Klik "Start" om te genereren`;
                      })()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-green-500 text-green-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Automatisch opgeslagen
                    </Badge>
                    <Button
                      onClick={() => {
                        setProjectId('');
                        setCurrentPlan(null);
                        setCurrentPlanId(null);
                      }}
                      variant="outline"
                      className="border-gray-700 h-8 sm:h-9 text-xs sm:text-sm"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Sluiten
                    </Button>
                  </div>
                </div>

                {/* Homepage */}
                {currentPlan.homepage && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-orange-500 mb-2">
                      Homepage
                    </h3>
                    {renderContentItem(currentPlan.homepage, 'homepage')}
                  </div>
                )}

                {/* Pillars */}
                {currentPlan.pillars && currentPlan.pillars.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-orange-500 mb-2">
                      Pillar Pages & Content Clusters
                    </h3>
                    <div className="space-y-2">
                      {currentPlan.pillars.map((pillar) => renderContentItem(pillar, 'pillar'))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Add Item Modal */}
          {showAddItemModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="bg-gray-800 border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Nieuw Item Toevoegen</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddItemModal(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Type *</Label>
                    <select
                      value={newItemType}
                      onChange={(e) => setNewItemType(e.target.value as any)}
                      className="w-full bg-gray-900 border-gray-700 text-white rounded-md px-3 h-9"
                    >
                      <option value="pillar">Pillar Page</option>
                      <option value="cluster">Cluster Content</option>
                      <option value="blog">Blog Post</option>
                    </select>
                  </div>

                  {(newItemType === 'cluster' || newItemType === 'blog') && (
                    <div className="space-y-2">
                      <Label className="text-white">
                        Parent {newItemType === 'cluster' ? 'Pillar' : 'Cluster'} *
                      </Label>
                      <select
                        value={newItemParentId || ''}
                        onChange={(e) => setNewItemParentId(e.target.value || null)}
                        className="w-full bg-gray-900 border-gray-700 text-white rounded-md px-3 h-9"
                      >
                        <option value="">Selecteer...</option>
                        {newItemType === 'cluster' && currentPlan?.pillars?.map(pillar => (
                          <option key={pillar.id} value={pillar.id}>{pillar.title}</option>
                        ))}
                        {newItemType === 'blog' && currentPlan?.pillars?.map(pillar =>
                          pillar.clusters?.map(cluster => (
                            <option key={cluster.id} value={cluster.id}>{cluster.title}</option>
                          ))
                        )}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-white">Titel *</Label>
                    <Input
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      placeholder="Bijv: Complete Yoga Gids voor Beginners"
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">URL Slug *</Label>
                    <Input
                      value={newItemUrl}
                      onChange={(e) => setNewItemUrl(e.target.value)}
                      placeholder="Bijv: yoga-beginners"
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Beschrijving *</Label>
                    <Textarea
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      placeholder="Korte beschrijving van het content item"
                      rows={3}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Keywords (komma gescheiden)</Label>
                    <Input
                      value={newItemKeywords}
                      onChange={(e) => setNewItemKeywords(e.target.value)}
                      placeholder="yoga beginners, yoga oefeningen, yoga thuis"
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddItemModal(false)}
                      className="border-gray-600 text-gray-300"
                    >
                      Annuleren
                    </Button>
                    <Button
                      onClick={handleAddItem}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Toevoegen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
