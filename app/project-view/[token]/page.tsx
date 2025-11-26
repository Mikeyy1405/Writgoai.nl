
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Globe, Calendar, FileText, Eye, 
  Loader2, AlertCircle, CheckCircle2, Clock,
  TrendingUp, Users, Target, Lightbulb, Plus,
  Edit2, Trash2, Send
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface ProjectData {
  project: {
    name: string;
    websiteUrl: string;
    description?: string;
    contentStrategy?: {
      websiteAnalysis?: {
        existingTopics?: string[];
        contentGaps?: string[];
        topPerformingPages?: Array<{ title: string; url: string }>;
        categories?: string[];
        totalPages?: number;
      };
      competitorAnalysis?: {
        competitors?: Array<{
          domain: string;
          topContent?: Array<{ title: string; url: string; topic: string }>;
          strength?: string;
        }>;
        competitorGaps?: string[];
        opportunities?: string[];
      };
      trendingTopics?: {
        topics?: Array<{
          topic: string;
          searchVolume?: number;
          trend?: string;
        }>;
      };
    };
    contentStrategyDate?: string;
  };
  collaborator: {
    name?: string;
    email: string;
    role: string;
  };
  content: Array<{
    id: string;
    title: string;
    type: string;
    content: string;
    focusKeyword?: string;
    status: string;
    createdAt: string;
  }>;
  planning: Array<{
    id: string;
    title: string;
    focusKeyword: string;
    status: string;
    priority?: string;
    scheduledFor?: string;
    createdAt: string;
    hasContent?: boolean;
    publishedAt?: string;
    generatedAt?: string;
  }>;
}

export default function ProjectViewPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    focusKeyword: '',
    scheduledFor: '',
    priority: 'medium',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjectData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchProjectData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchProjectData = async () => {
    try {
      const res = await fetch(`/api/project-view?token=${token}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Er ging iets mis');
      }

      const projectData = await res.json();
      setData(projectData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddArticle = async () => {
    if (!formData.title || !formData.focusKeyword) {
      toast.error('Titel en focus keyword zijn verplicht');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/project-view?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Er ging iets mis');
      }

      toast.success('Artikel idee toegevoegd');
      setAddDialog(false);
      setFormData({
        title: '',
        focusKeyword: '',
        scheduledFor: '',
        priority: 'medium',
      });
      fetchProjectData();
    } catch (err) {
      toast.error('Kon artikel niet toevoegen');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditArticle = async () => {
    if (!selectedIdea || !formData.title || !formData.focusKeyword) {
      toast.error('Titel en focus keyword zijn verplicht');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/project-view?token=${token}&ideaId=${selectedIdea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Er ging iets mis');
      }

      toast.success('Artikel bijgewerkt');
      setEditDialog(false);
      setSelectedIdea(null);
      fetchProjectData();
    } catch (err) {
      toast.error('Kon artikel niet bijwerken');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!selectedIdea) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/project-view?token=${token}&ideaId=${selectedIdea.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Er ging iets mis');
      }

      toast.success('Artikel verwijderd');
      setDeleteDialog(false);
      setSelectedIdea(null);
      fetchProjectData();
    } catch (err) {
      toast.error('Kon artikel niet verwijderen');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (idea: any) => {
    setSelectedIdea(idea);
    setFormData({
      title: idea.title,
      focusKeyword: idea.focusKeyword,
      scheduledFor: idea.scheduledFor ? new Date(idea.scheduledFor).toISOString().split('T')[0] : '',
      priority: idea.priority || 'medium',
    });
    setEditDialog(true);
  };

  const openDeleteDialog = (idea: any) => {
    setSelectedIdea(idea);
    setDeleteDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      published: { label: 'Gepubliceerd', color: 'bg-green-500' },
      draft: { label: 'Concept', color: 'bg-gray-500' },
      scheduled: { label: 'Ingepland', color: 'bg-blue-500' },
      completed: { label: 'Voltooid', color: 'bg-green-500' },
      in_progress: { label: 'Bezig', color: 'bg-yellow-500' },
      planned: { label: 'Gepland', color: 'bg-purple-500' },
      todo: { label: 'Te doen', color: 'bg-gray-500' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-500' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;

    const priorityConfig: Record<string, { color: string }> = {
      high: { color: 'bg-red-500' },
      medium: { color: 'bg-yellow-500' },
      low: { color: 'bg-blue-500' },
    };

    const config = priorityConfig[priority] || { color: 'bg-gray-500' };
    return <Badge className={`${config.color} ml-2`}>{priority}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Project data laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <Card className="max-w-md p-8 bg-gray-900 border-red-600">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white text-center mb-2">
            Toegang geweigerd
          </h2>
          <p className="text-gray-400 text-center">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  // Calculate stats
  const ideasArticles = data.planning.filter(p => !p.hasContent && p.status === 'idea');
  const inProgressArticles = data.planning.filter(p => 
    !p.hasContent && ['generating', 'in_progress', 'queued'].includes(p.status)
  );
  const publishedArticles = data.planning.filter(p => p.hasContent);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{data.project.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                <Globe className="w-4 h-4" />
                <a
                  href={data.project.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-400"
                >
                  {data.project.websiteUrl}
                </a>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Gedeeld met</div>
              <div className="font-medium">{data.collaborator.name || data.collaborator.email}</div>
            </div>
          </div>

          {data.project.description && (
            <p className="text-gray-400 mt-3 max-w-3xl">{data.project.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-gray-900 border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-400">{data.planning.length}</div>
                <div className="text-sm text-gray-400 mt-1">Totaal Artikelen</div>
              </div>
              <Target className="w-10 h-10 text-purple-400 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gray-900 border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-400">{ideasArticles.length}</div>
                <div className="text-sm text-gray-400 mt-1">Ideeën</div>
              </div>
              <Lightbulb className="w-10 h-10 text-blue-400 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gray-900 border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-400">{inProgressArticles.length}</div>
                <div className="text-sm text-gray-400 mt-1">In Voorbereiding</div>
              </div>
              <Clock className="w-10 h-10 text-yellow-400 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gray-900 border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-400">{publishedArticles.length}</div>
                <div className="text-sm text-gray-400 mt-1">Gepubliceerd</div>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-400 opacity-50" />
            </div>
          </Card>
        </div>
        {/* Main Content Tabs */}
        <Tabs defaultValue="ideas" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-gray-900">
              <TabsTrigger value="ideas">
                <Lightbulb className="w-4 h-4 mr-2" />
                Ideeën ({ideasArticles.length})
              </TabsTrigger>
              <TabsTrigger value="progress">
                <Clock className="w-4 h-4 mr-2" />
                In Voorbereiding ({inProgressArticles.length})
              </TabsTrigger>
              <TabsTrigger value="published">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Gepubliceerd ({publishedArticles.length})
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analyse
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={() => setAddDialog(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuw Onderwerp
            </Button>
          </div>

          {/* Ideas Tab */}
          <TabsContent value="ideas" className="mt-0">
            {ideasArticles.length === 0 ? (
              <Card className="p-12 bg-gray-900 border-gray-800">
                <div className="text-center text-gray-400">
                  <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Geen ideeën</p>
                  <p className="text-sm mt-2">Klik op "Nieuw Onderwerp" om te beginnen</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {ideasArticles
                  .sort((a, b) => {
                    if (a.scheduledFor && b.scheduledFor) {
                      return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
                    }
                    if (a.scheduledFor) return -1;
                    if (b.scheduledFor) return 1;
                    return 0;
                  })
                  .map((item) => (
                    <Card key={item.id} className="p-4 sm:p-5 bg-gray-900 border-gray-800 hover:border-blue-500 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg mb-2 break-words">{item.title}</h3>
                          {item.focusKeyword && (
                            <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                              <Target className="w-4 h-4 shrink-0" />
                              <span className="truncate">Keyword: <span className="text-white">{item.focusKeyword}</span></span>
                            </div>
                          )}
                          {item.scheduledFor && (
                            <div className="text-xs sm:text-sm text-blue-400 mb-3 flex items-center gap-2 bg-blue-900/20 px-2 sm:px-3 py-1.5 rounded-lg border border-blue-800/30 w-fit max-w-full">
                              <Calendar className="w-4 h-4 shrink-0" />
                              <span className="font-medium shrink-0">Publicatiedatum:</span>
                              <span className="truncate">
                              {new Date(item.scheduledFor).toLocaleDateString('nl-NL', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(item.status)}
                            {getPriorityBadge(item.priority)}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 self-end sm:self-start">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(item)}
                            className="hover:bg-blue-600 h-9 w-9 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteDialog(item)}
                            className="hover:bg-red-600 h-9 w-9 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* In Progress Tab */}
          <TabsContent value="progress" className="mt-0">
            {inProgressArticles.length === 0 ? (
              <Card className="p-12 bg-gray-900 border-gray-800">
                <div className="text-center text-gray-400">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Geen artikelen in voorbereiding</p>
                  <p className="text-sm mt-2">Artikelen die gegenereerd worden verschijnen hier</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {inProgressArticles.map((item) => (
                  <Card key={item.id} className="p-5 bg-gray-900 border-gray-800 hover:border-yellow-500 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                          <h3 className="font-semibold text-lg">{item.title}</h3>
                        </div>
                        {item.focusKeyword && (
                          <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Keyword: <span className="text-white">{item.focusKeyword}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(item.status)}
                          {getPriorityBadge(item.priority)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Published Tab */}
          <TabsContent value="published" className="mt-0">
            {publishedArticles.length === 0 ? (
              <Card className="p-12 bg-gray-900 border-gray-800">
                <div className="text-center text-gray-400">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nog geen gepubliceerde artikelen</p>
                  <p className="text-sm mt-2">Voltooide artikelen verschijnen hier</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {publishedArticles
                  .sort((a, b) => {
                    if (a.publishedAt && b.publishedAt) {
                      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
                    }
                    return new Date(b.generatedAt || 0).getTime() - new Date(a.generatedAt || 0).getTime();
                  })
                  .map((item) => (
                    <Card key={item.id} className="p-5 bg-gray-900 border-gray-800 hover:border-green-500 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <h3 className="font-semibold text-lg">{item.title}</h3>
                          </div>
                          {item.focusKeyword && (
                            <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Keyword: <span className="text-white">{item.focusKeyword}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-green-500">Gepubliceerd</Badge>
                            {getPriorityBadge(item.priority)}
                            {(item.publishedAt || item.generatedAt) && (
                              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.publishedAt || item.generatedAt).toLocaleDateString('nl-NL', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="mt-0">
            {!data.project.contentStrategy ? (
              <Card className="p-12 bg-gray-900 border-gray-800">
                <div className="text-center text-gray-400">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nog geen content research uitgevoerd</p>
                  <p className="text-sm mt-2">Content analyse verschijnt hier na research</p>
                </div>
              </Card>
            ) : (
              <Tabs defaultValue="website" className="w-full">
                <TabsList className="bg-gray-800">
                  <TabsTrigger value="website">
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </TabsTrigger>
                  <TabsTrigger value="competitors">
                    <Users className="w-4 h-4 mr-2" />
                    Concurrenten
                  </TabsTrigger>
                  <TabsTrigger value="trending">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trending
                  </TabsTrigger>
                </TabsList>

                {/* Website Analyse Tab */}
                <TabsContent value="website" className="mt-4">
                  {data.project.contentStrategy?.websiteAnalysis ? (
                    <div className="space-y-4">
                      {data.project.contentStrategy.websiteAnalysis.totalPages && (
                        <Card className="p-4 bg-gray-900 border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">Totaal aantal pagina's</div>
                          <div className="text-2xl font-bold text-white">
                            {data.project.contentStrategy.websiteAnalysis.totalPages}
                          </div>
                        </Card>
                      )}
                      {data.project.contentStrategy.websiteAnalysis.existingTopics && 
                        data.project.contentStrategy.websiteAnalysis.existingTopics.length > 0 && (
                        <Card className="p-4 bg-gray-900 border-gray-800">
                          <h3 className="font-semibold mb-2 text-white">Bestaande onderwerpen</h3>
                          <div className="flex flex-wrap gap-2">
                            {data.project.contentStrategy.websiteAnalysis.existingTopics.map((topic, idx) => (
                              <Badge key={idx} className="bg-blue-500">{topic}</Badge>
                            ))}
                          </div>
                        </Card>
                      )}
                      {data.project.contentStrategy.websiteAnalysis.contentGaps && 
                        data.project.contentStrategy.websiteAnalysis.contentGaps.length > 0 && (
                        <Card className="p-4 bg-gray-900 border-gray-800">
                          <h3 className="font-semibold mb-2 text-white">Content gaps</h3>
                          <ul className="space-y-1 text-sm text-gray-300">
                            {data.project.contentStrategy.websiteAnalysis.contentGaps.map((gap, idx) => (
                              <li key={idx}>• {gap}</li>
                            ))}
                          </ul>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Card className="p-8 bg-gray-900 border-gray-800">
                      <div className="text-center text-gray-400">
                        <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Geen website analyse beschikbaar</p>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                {/* Concurrenten Tab */}
                <TabsContent value="competitors" className="mt-4">
                  {data.project.contentStrategy?.competitorAnalysis?.competitors && 
                    data.project.contentStrategy.competitorAnalysis.competitors.length > 0 ? (
                    <div className="space-y-4">
                      {data.project.contentStrategy.competitorAnalysis.competitors.map((competitor, idx) => (
                        <Card key={idx} className="p-4 bg-gray-900 border-gray-800">
                          <h3 className="font-semibold mb-2 text-white">{competitor.domain}</h3>
                          {competitor.strength && (
                            <div className="text-sm text-gray-400 mb-2">{competitor.strength}</div>
                          )}
                          {competitor.topContent && competitor.topContent.length > 0 && (
                            <div className="text-sm space-y-1">
                              {competitor.topContent.map((content, cidx) => (
                                <div key={cidx} className="text-gray-300">
                                  • {content.title}
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                      {data.project.contentStrategy.competitorAnalysis.opportunities && 
                        data.project.contentStrategy.competitorAnalysis.opportunities.length > 0 && (
                        <Card className="p-4 bg-gray-900 border-gray-800">
                          <h3 className="font-semibold mb-2 text-white">Kansen</h3>
                          <ul className="space-y-1 text-sm text-gray-300">
                            {data.project.contentStrategy.competitorAnalysis.opportunities.map((opp, idx) => (
                              <li key={idx}>• {opp}</li>
                            ))}
                          </ul>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Card className="p-8 bg-gray-900 border-gray-800">
                      <div className="text-center text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Geen concurrent analyse beschikbaar</p>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                {/* Trending Tab */}
                <TabsContent value="trending" className="mt-4">
                  {data.project.contentStrategy?.trendingTopics?.topics && 
                    data.project.contentStrategy.trendingTopics.topics.length > 0 ? (
                    <div className="space-y-3">
                      {data.project.contentStrategy.trendingTopics.topics.map((topic, idx) => (
                        <Card key={idx} className="p-4 bg-gray-900 border-gray-800">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-white">{topic.topic}</h3>
                            {topic.searchVolume && (
                              <Badge className="bg-orange-500">{topic.searchVolume} zoekvolume</Badge>
                            )}
                          </div>
                          {topic.trend && (
                            <div className="text-sm text-gray-400 mt-1">{topic.trend}</div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 bg-gray-900 border-gray-800">
                      <div className="text-center text-gray-400">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Geen trending topics beschikbaar</p>
                      </div>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Article Dialog */}
        <Dialog open={addDialog} onOpenChange={setAddDialog}>
          <DialogContent className="bg-gray-900 text-white border-gray-800">
            <DialogHeader>
              <DialogTitle>Nieuw Artikel Idee</DialogTitle>
              <DialogDescription>
                Voeg een nieuw onderwerp toe aan je content planning
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  placeholder="Bijv: Beste waterfitters van 2024"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyword">Focus Keyword *</Label>
                <Input
                  id="keyword"
                  placeholder="Bijv: waterfilter"
                  value={formData.focusKeyword}
                  onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledFor">Geplande Datum (optioneel)</Label>
                <Input
                  id="scheduledFor"
                  type="date"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioriteit</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="high">Hoog</SelectItem>
                    <SelectItem value="medium">Gemiddeld</SelectItem>
                    <SelectItem value="low">Laag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setAddDialog(false)}
                disabled={submitting}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleAddArticle}
                disabled={submitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Toevoegen...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Toevoegen
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Article Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="bg-gray-900 text-white border-gray-800">
            <DialogHeader>
              <DialogTitle>Artikel Bewerken</DialogTitle>
              <DialogDescription>
                Pas de details van dit artikel aan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titel *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-keyword">Focus Keyword *</Label>
                <Input
                  id="edit-keyword"
                  value={formData.focusKeyword}
                  onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-scheduledFor">Geplande Datum</Label>
                <Input
                  id="edit-scheduledFor"
                  type="date"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Prioriteit</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="high">Hoog</SelectItem>
                    <SelectItem value="medium">Gemiddeld</SelectItem>
                    <SelectItem value="low">Laag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setEditDialog(false)}
                disabled={submitting}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleEditArticle}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Opslaan
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Article Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent className="bg-gray-900 text-white border-gray-800">
            <DialogHeader>
              <DialogTitle>Artikel Verwijderen</DialogTitle>
              <DialogDescription>
                Weet je zeker dat je dit artikel wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
              </DialogDescription>
            </DialogHeader>
            {selectedIdea && (
              <div className="py-4">
                <Card className="p-4 bg-gray-800 border-gray-700">
                  <h3 className="font-medium mb-1">{selectedIdea.title}</h3>
                  <p className="text-sm text-gray-400">Keyword: {selectedIdea.focusKeyword}</p>
                </Card>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setDeleteDialog(false)}
                disabled={submitting}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleDeleteArticle}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verwijderen...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Verwijderen
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
