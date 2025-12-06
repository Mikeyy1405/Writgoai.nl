
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  PlayCircle, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Search,
  Filter,
  Plus,
  Trash2,
  Image as ImageIcon,
  Link2,
  FileText,
  CalendarIcon,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import GSCContentOverview from '@/components/gsc-content-overview';

interface TopicalTopic {
  id: string;
  title: string;
  type: string;
  keywords: string[];
  searchVolume?: number;
  difficulty?: number;
  priority: number;
  status: string;
  isCompleted: boolean;
  customOutline?: any;
  selectedImages: string[];
  internalLinks?: any;
  scheduledFor?: string;
  notes?: string;
  // DataForSEO enriched data
  cpc?: number;
  competition?: number;
  trend?: number[];
  relatedKeywords?: string[];
  questions?: string[];
  seasonalityScore?: number;
  opportunityScore?: number;
}

interface TopicalCategory {
  id: string;
  name: string;
  description?: string;
  topics: TopicalTopic[];
}

interface TopicalMap {
  id: string;
  mainTopic: string;
  language: string;
  totalArticles: number;
  projectId: string;
  categories: TopicalCategory[];
  createdAt: string;
}

export default function TopicalContentPlanner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [maps, setMaps] = useState<TopicalMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<TopicalMap | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  const [editingTopic, setEditingTopic] = useState<TopicalTopic | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [schedulingTopics, setSchedulingTopics] = useState<TopicalTopic[]>([]);
  
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleInterval, setScheduleInterval] = useState<'none' | 'daily' | 'weekly'>('none');
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [enriching, setEnriching] = useState(false);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated') {
      loadMaps();
    }
  }, [status, router]);
  
  const loadMaps = async () => {
    try {
      const res = await fetch('/api/client/topical-mapping');
      const data = await res.json();
      if (data.success) {
        setMaps(data.maps);
        if (data.maps.length > 0 && !selectedMap) {
          setSelectedMap(data.maps[0]);
        }
      }
    } catch (error) {
      console.error('Error loading maps:', error);
      toast.error('Kon topical maps niet laden');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };
  
  const toggleTopicSelection = (topicId: string) => {
    const newSelected = new Set(selectedTopics);
    if (newSelected.has(topicId)) {
      newSelected.delete(topicId);
    } else {
      newSelected.add(topicId);
    }
    setSelectedTopics(newSelected);
  };
  
  const selectAll = () => {
    if (!selectedMap) return;
    const allTopicIds = selectedMap.categories.flatMap(cat => 
      cat.topics.filter(t => matchesFilters(t)).map(t => t.id)
    );
    setSelectedTopics(new Set(allTopicIds));
  };
  
  const deselectAll = () => {
    setSelectedTopics(new Set());
  };
  
  const matchesFilters = (topic: TopicalTopic): boolean => {
    if (searchQuery && !topic.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterStatus !== 'all' && topic.status !== filterStatus) {
      return false;
    }
    if (filterType !== 'all' && topic.type !== filterType) {
      return false;
    }
    return true;
  };
  
  const getFilteredTopics = () => {
    if (!selectedMap) return [];
    return selectedMap.categories.flatMap(cat => 
      cat.topics.filter(matchesFilters)
    );
  };
  
  const generateSelected = async () => {
    if (selectedTopics.size === 0) {
      toast.error('Selecteer eerst één of meer topics');
      return;
    }
    
    setGenerating(true);
    const topicIds = Array.from(selectedTopics);
    
    try {
      const res = await fetch('/api/client/topical-mapping/generate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicIds })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.generated} topics gegenereerd!`);
        loadMaps();
        deselectAll();
      } else {
        toast.error(data.error || 'Generatie mislukt');
      }
    } catch (error) {
      console.error('Error generating:', error);
      toast.error('Er ging iets mis bij het genereren');
    } finally {
      setGenerating(false);
    }
  };
  
  const openScheduleDialog = () => {
    if (selectedTopics.size === 0) {
      toast.error('Selecteer eerst één of meer topics');
      return;
    }
    
    const topics = selectedMap?.categories
      .flatMap(cat => cat.topics)
      .filter(t => selectedTopics.has(t.id)) || [];
    
    setSchedulingTopics(topics);
    setShowScheduleDialog(true);
  };
  
  const scheduleTopics = async () => {
    if (!scheduleDate) {
      toast.error('Selecteer een datum');
      return;
    }
    
    try {
      const res = await fetch('/api/client/topical-mapping/schedule-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicIds: Array.from(selectedTopics),
          startDate: scheduleDate,
          interval: scheduleInterval
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Topics ingepland!');
        setShowScheduleDialog(false);
        loadMaps();
        deselectAll();
      } else {
        toast.error(data.error || 'Planning mislukt');
      }
    } catch (error) {
      console.error('Error scheduling:', error);
      toast.error('Er ging iets mis bij het inplannen');
    }
  };
  
  const editTopic = (topic: TopicalTopic) => {
    setEditingTopic(topic);
    setShowEditDialog(true);
  };
  
  const saveTopic = async () => {
    if (!editingTopic) return;
    
    try {
      const res = await fetch(`/api/client/topical-mapping/topics/${editingTopic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customOutline: editingTopic.customOutline,
          selectedImages: editingTopic.selectedImages,
          internalLinks: editingTopic.internalLinks,
          notes: editingTopic.notes
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Topic opgeslagen!');
        setShowEditDialog(false);
        loadMaps();
      } else {
        toast.error(data.error || 'Opslaan mislukt');
      }
    } catch (error) {
      console.error('Error saving topic:', error);
      toast.error('Er ging iets mis bij het opslaan');
    }
  };
  
  const enrichKeywords = async (strategy: 'balanced' | 'quick_wins' | 'long_term' = 'balanced') => {
    if (!selectedMap) return;
    
    const confirmed = confirm(
      `Deze actie zal real SEO data ophalen voor ${selectedMap.totalArticles} topics.\n\n` +
      `Geschatte kosten: €${(selectedMap.totalArticles * 0.006).toFixed(2)}\n\n` +
      `Wil je doorgaan?`
    );
    
    if (!confirmed) return;
    
    setEnriching(true);
    try {
      const res = await fetch('/api/client/topical-mapping/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicalMapId: selectedMap.id,
          priorityStrategy: strategy
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Keywords verrijkt!');
        loadMaps();
      } else {
        toast.error(data.error || 'Verrijking mislukt');
      }
    } catch (error) {
      console.error('Error enriching keywords:', error);
      toast.error('Er ging iets mis bij het verrijken');
    } finally {
      setEnriching(false);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-purple-500" />;
      default:
        return <PlayCircle className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Wachtend', className: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
      scheduled: { label: 'Gepland', className: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
      generating: { label: 'Bezig', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse' },
      completed: { label: 'Voltooid', className: 'bg-green-500/20 text-green-300 border border-green-500/30' },
      failed: { label: 'Mislukt', className: 'bg-red-500/20 text-red-300 border border-red-500/30' }
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }
  
  if (maps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4">
        <Card className="p-8 text-center max-w-md bg-gray-800/50 border-gray-700">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Geen Topical Maps</h2>
          <p className="text-gray-400 mb-6">
            Maak eerst een topical map om content te kunnen plannen.
          </p>
          <Button onClick={() => router.push('/client-portal/topical-mapping')}>
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Topical Map
          </Button>
        </Card>
      </div>
    );
  }
  
  const stats = {
    total: selectedMap?.categories.flatMap(c => c.topics).length || 0,
    pending: selectedMap?.categories.flatMap(c => c.topics).filter(t => t.status === 'pending').length || 0,
    scheduled: selectedMap?.categories.flatMap(c => c.topics).filter(t => t.status === 'scheduled').length || 0,
    completed: selectedMap?.categories.flatMap(c => c.topics).filter(t => t.isCompleted).length || 0
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            Topical Content Planner
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Plan en genereer content strategisch vanuit je topical authority map
          </p>
        </div>
        
        {/* Map Selector */}
        <Card className="mb-6 p-3 sm:p-4 bg-gray-800/50 border-gray-700">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <label className="text-sm text-gray-400 sm:shrink-0">Topical Map:</label>
            <select
              value={selectedMap?.id || ''}
              onChange={(e) => setSelectedMap(maps.find(m => m.id === e.target.value) || null)}
              className="flex-1 min-w-0 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
            >
              {maps.map(map => (
                <option key={map.id} value={map.id}>
                  {map.mainTopic} ({map.totalArticles} topics)
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/client-portal/topical-mapping')}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Nieuwe Map</span>
                <span className="sm:hidden">Nieuw</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => enrichKeywords('balanced')}
                disabled={enriching || !selectedMap}
                className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs sm:text-sm"
              >
                {enriching ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                    <span className="hidden sm:inline">Verrijken...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Verrijk met Real Data</span>
                    <span className="sm:hidden">Verrijk</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
        
        {selectedMap && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <div className="text-xl sm:text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs sm:text-sm text-gray-400">Totaal Topics</div>
              </Card>
              <Card className="p-3 sm:p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
                <div className="text-xl sm:text-2xl font-bold text-white">{stats.pending}</div>
                <div className="text-xs sm:text-sm text-gray-400">Wachtend</div>
              </Card>
              <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <div className="text-xl sm:text-2xl font-bold text-white">{stats.scheduled}</div>
                <div className="text-xs sm:text-sm text-gray-400">Gepland</div>
              </Card>
              <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                <div className="text-xl sm:text-2xl font-bold text-white">{stats.completed}</div>
                <div className="text-xs sm:text-sm text-gray-400">Voltooid</div>
              </Card>
            </div>

            {/* Google Search Console Content Overview */}
            <div className="mb-8">
              <GSCContentOverview projectId={selectedMap.projectId} />
            </div>
            
            {/* Filters & Actions */}
            <Card className="mb-6 p-3 sm:p-4 bg-gray-800/50 border-gray-700">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <Input
                      placeholder="Zoek topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 sm:pl-10 bg-gray-700 border-gray-600 text-white text-sm"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm min-w-0"
                  >
                    <option value="all">Alle Status</option>
                    <option value="pending">Wachtend</option>
                    <option value="scheduled">Gepland</option>
                    <option value="generating">Genereren</option>
                    <option value="completed">Voltooid</option>
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm min-w-0"
                  >
                    <option value="all">Alle Types</option>
                    <option value="commercial">Commercial</option>
                    <option value="informational">Informational</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    disabled={getFilteredTopics().length === 0}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    Selecteer Alles
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                    disabled={selectedTopics.size === 0}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    Deselecteer
                  </Button>
                </div>
              </div>
              
              {selectedTopics.size > 0 && (
                <div className="mt-3 sm:mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <span className="text-white text-sm sm:text-base text-center sm:text-left">
                    {selectedTopics.size} topic(s) geselecteerd
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={generateSelected}
                      disabled={generating}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs sm:text-sm"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                          <span className="hidden sm:inline">Genereren...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Genereer Nu</span>
                          <span className="sm:hidden">Genereer</span>
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={openScheduleDialog}
                      className="flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Inplannen</span>
                      <span className="sm:hidden">Plan</span>
                    </Button>
                  </div>
                </div>
              )}
            </Card>
            
            {/* Categories & Topics */}
            <div className="space-y-4">
              {selectedMap.categories.map(category => {
                const visibleTopics = category.topics.filter(matchesFilters);
                if (visibleTopics.length === 0) return null;
                
                const isExpanded = expandedCategories.has(category.id);
                
                return (
                  <Card key={category.id} className="bg-gray-800/50 border-gray-700">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-gray-400">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300">
                        {visibleTopics.length} topics
                      </Badge>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2">
                        {visibleTopics.map(topic => (
                          <div
                            key={topic.id}
                            className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                              <Checkbox
                                checked={selectedTopics.has(topic.id)}
                                onCheckedChange={() => toggleTopicSelection(topic.id)}
                              />
                              
                              {getStatusIcon(topic.status)}
                              
                              <h4 className="text-white font-medium text-sm sm:text-base flex-1 sm:hidden">{topic.title}</h4>
                            </div>
                            
                            <div className="flex-1 min-w-0 w-full sm:w-auto">
                              <h4 className="hidden sm:block text-white font-medium truncate">{topic.title}</h4>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge className={
                                  topic.type === 'commercial' 
                                    ? 'bg-green-500/20 text-green-300 text-xs' 
                                    : 'bg-blue-500/20 text-blue-300 text-xs'
                                }>
                                  {topic.type === 'commercial' ? '💰 Commercial' : '💡 Informational'}
                                </Badge>
                                {getStatusBadge(topic.status)}
                                
                                {/* Opportunity Score */}
                                {topic.opportunityScore && (
                                  <Badge className={`text-xs ${
                                    topic.opportunityScore >= 70 ? 'bg-green-500/20 text-green-300' :
                                    topic.opportunityScore >= 50 ? 'bg-yellow-500/20 text-yellow-300' :
                                    'bg-red-500/20 text-red-300'
                                  }`}>
                                    🎯 {topic.opportunityScore}
                                  </Badge>
                                )}
                                
                                {/* Search Volume */}
                                {topic.searchVolume && (
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    📊 {topic.searchVolume.toLocaleString()}
                                  </span>
                                )}
                                
                                {/* Difficulty */}
                                {topic.difficulty && (
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    ⚡ {topic.difficulty}/100
                                  </span>
                                )}
                                
                                {/* CPC */}
                                {topic.cpc && topic.cpc > 0 && (
                                  <span className="text-xs text-green-400 whitespace-nowrap">
                                    💶 €{topic.cpc.toFixed(2)}
                                  </span>
                                )}
                                
                                {/* Seasonality Badge */}
                                {topic.seasonalityScore && topic.seasonalityScore > 50 && (
                                  <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                                    ❄️ Seizoensgebonden
                                  </Badge>
                                )}
                                
                                {topic.scheduledFor && (
                                  <span className="text-xs text-purple-400 whitespace-nowrap">
                                    📅 {new Date(topic.scheduledFor).toLocaleDateString('nl-NL')}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => editTopic(topic)}
                              className="self-end sm:self-center"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
      
      {/* Edit Topic Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl mx-4 bg-gray-800 border-gray-700 text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Topic Bewerken</DialogTitle>
          </DialogHeader>
          
          {editingTopic && (
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{editingTopic.title}</h3>
                <div className="flex gap-2 mb-4">
                  <Badge className={
                    editingTopic.type === 'commercial' 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-blue-500/20 text-blue-300'
                  }>
                    {editingTopic.type}
                  </Badge>
                  {getStatusBadge(editingTopic.status)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Keywords
                </label>
                <div className="flex flex-wrap gap-2">
                  {editingTopic.keywords.map((kw, i) => (
                    <Badge key={i} className="bg-gray-700 text-gray-200">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* SEO Metrics */}
              {(editingTopic.searchVolume || editingTopic.opportunityScore) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-700/30 rounded-lg">
                  {editingTopic.opportunityScore && (
                    <div>
                      <div className="text-xs text-gray-400">Opportunity Score</div>
                      <div className={`text-2xl font-bold ${
                        editingTopic.opportunityScore >= 70 ? 'text-green-400' :
                        editingTopic.opportunityScore >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {editingTopic.opportunityScore}
                      </div>
                    </div>
                  )}
                  {editingTopic.searchVolume && (
                    <div>
                      <div className="text-xs text-gray-400">Zoekvolume/mnd</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {editingTopic.searchVolume.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {editingTopic.difficulty && (
                    <div>
                      <div className="text-xs text-gray-400">Difficulty</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {editingTopic.difficulty}/100
                      </div>
                    </div>
                  )}
                  {editingTopic.cpc && editingTopic.cpc > 0 && (
                    <div>
                      <div className="text-xs text-gray-400">CPC</div>
                      <div className="text-2xl font-bold text-green-400">
                        €{editingTopic.cpc.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Related Keywords */}
              {editingTopic.relatedKeywords && editingTopic.relatedKeywords.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    🔗 Gerelateerde Keywords
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {editingTopic.relatedKeywords.slice(0, 15).map((kw, i) => (
                      <Badge key={i} className="bg-purple-500/20 text-purple-300">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Question Keywords */}
              {editingTopic.questions && editingTopic.questions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ❓ Vragen
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {editingTopic.questions.slice(0, 8).map((q, i) => (
                      <div key={i} className="text-sm text-gray-300 p-2 bg-gray-700/30 rounded">
                        {q}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Notities
                </label>
                <Textarea
                  value={editingTopic.notes || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, notes: e.target.value })}
                  placeholder="Voeg notities toe..."
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-2" />
                  Afbeeldingen
                </label>
                <p className="text-sm text-gray-400 mb-2">
                  {editingTopic.selectedImages.length > 0 
                    ? `${editingTopic.selectedImages.length} afbeelding(en) geselecteerd`
                    : 'Geen afbeeldingen geselecteerd'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast('Image selector komt binnenkort', { icon: 'ℹ️' })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Afbeeldingen Selecteren
                </Button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Link2 className="w-4 h-4 inline mr-2" />
                  Interne Links
                </label>
                <p className="text-sm text-gray-400 mb-2">
                  Configureer interne link strategie voor deze topic
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast('Link configurator komt binnenkort', { icon: 'ℹ️' })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Links Configureren
                </Button>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={saveTopic}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Opslaan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Annuleren
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-4 bg-gray-800 border-gray-700 text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Topics Inplannen</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <p className="text-gray-400 mb-4">
                Je gaat {schedulingTopics.length} topic(s) inplannen
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Startdatum
              </label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Interval
              </label>
              <select
                value={scheduleInterval}
                onChange={(e) => setScheduleInterval(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="none">Allemaal op dezelfde dag</option>
                <option value="daily">1 per dag</option>
                <option value="weekly">1 per week</option>
              </select>
            </div>
            
            {scheduleInterval !== 'none' && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-sm text-gray-300">
                  {scheduleInterval === 'daily' && `Topics worden verspreid over ${schedulingTopics.length} dagen`}
                  {scheduleInterval === 'weekly' && `Topics worden verspreid over ${schedulingTopics.length} weken`}
                </p>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={scheduleTopics}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Inplannen
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowScheduleDialog(false)}
              >
                Annuleren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
