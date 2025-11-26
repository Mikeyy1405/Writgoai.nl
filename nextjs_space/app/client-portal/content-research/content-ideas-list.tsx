
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  BookOpen, TrendingUp, Clock, Tag, Target, Link2, 
  Image, Video, FileText, Calendar, Edit3, Zap, 
  CheckCircle2, AlertCircle, Play, Repeat, Plus, Trash2,
  DollarSign, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ArticleIdea {
  id: string;
  title: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  topic: string;
  contentType?: string;
  contentCategory?: string; // "commercial" or "informational"
  searchIntent?: string;
  searchVolume?: number;
  difficulty?: number;
  priority: string;
  status: string;
  targetWordCount?: number;
  contentOutline?: any;
  imageIdeas?: string[];
  videoIdeas?: string[];
  internalLinks?: any;
  trending: boolean;
  seasonal: boolean;
  competitorGap: boolean;
  aiScore?: number;
  publishedAt?: string;
  savedContent?: {
    id: string;
    publishedUrl?: string;
    publishedAt?: string;
  };
}

interface ContentIdeasListProps {
  ideas: ArticleIdea[];
  onRefresh: () => void;
  projectId?: string | null;
  language?: string;
}

export default function ContentIdeasList({ ideas, onRefresh, projectId, language = 'nl' }: ContentIdeasListProps) {
  const router = useRouter();
  const { data: session } = useSession() || {};
  
  // State voor toevoegen/verwijderen
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [isAddingIdea, setIsAddingIdea] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Bulk select state
  const [selectedIdeas, setSelectedIdeas] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Quick Generate state
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generateProgress, setGenerateProgress] = useState<{ [key: string]: { progress: number; status: string } }>({});

  // Toggle selection
  const toggleSelection = (ideaId: string) => {
    const newSelection = new Set(selectedIdeas);
    if (newSelection.has(ideaId)) {
      newSelection.delete(ideaId);
    } else {
      newSelection.add(ideaId);
    }
    setSelectedIdeas(newSelection);
  };

  // Select all
  const selectAll = () => {
    setSelectedIdeas(new Set(ideas.map(idea => idea.id)));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedIdeas(new Set());
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIdeas.size === 0) {
      toast.error('Selecteer minimaal één artikel');
      return;
    }

    if (!confirm(`Weet je zeker dat je ${selectedIdeas.size} geselecteerde artikel${selectedIdeas.size > 1 ? 'en' : ''} wilt verwijderen?`)) {
      return;
    }

    setIsBulkDeleting(true);
    const deleteToast = toast.loading(`${selectedIdeas.size} artikel${selectedIdeas.size > 1 ? 'en' : ''} verwijderen...`);

    try {
      const response = await fetch('/api/client/article-ideas/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleIds: Array.from(selectedIdeas),
          projectId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message, { id: deleteToast });
        setSelectedIdeas(new Set());
        onRefresh();
      } else {
        toast.error(data.error || 'Fout bij verwijderen', { id: deleteToast });
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Er ging iets mis bij het verwijderen', { id: deleteToast });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      idea: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      queued: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      writing: { color: 'bg-orange-100 text-orange-800', icon: Edit3 },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      published: { color: 'bg-purple-100 text-purple-800', icon: Zap },
    };
    
    const config = variants[status] || variants.idea;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status === 'idea' ? 'Nieuw' : 
         status === 'queued' ? 'Ingepland' :
         status === 'writing' ? 'In behandeling' :
         status === 'completed' ? 'Gereed' : 'Gepubliceerd'}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return (
      <Badge className={colors[priority] || colors.medium}>
        {priority === 'high' ? 'Hoog' : priority === 'low' ? 'Laag' : 'Gemiddeld'}
      </Badge>
    );
  };

  const getContentTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      guide: '📚 Gids',
      listicle: '📝 Top Lijst',
      howto: '🔧 How-to',
      review: '⭐ Review',
      comparison: '⚖️ Vergelijking',
      commercial: '💰 Commercieel',
      tutorial: '🎓 Tutorial',
      'case-study': '📊 Case Study',
      infographic: '📈 Infographic',
      interview: '🎤 Interview',
      checklist: '✅ Checklist',
      definition: '📖 Definitie',
      tools: '🛠️ Tools',
      trends: '📈 Trends',
      news: '📰 Nieuws',
      opinion: '💭 Mening',
    };
    return type ? labels[type] || type : 'Algemeen';
  };

  const handleWriteNow = (idea: ArticleIdea) => {
    // Direct naar Writgo Writer zonder keuze dialog
    const params = new URLSearchParams({
      from: 'research',
      keyword: idea.focusKeyword,
      title: idea.title,
      keywords: idea.secondaryKeywords?.join(', ') || '',
      contentType: idea.contentType || 'guide',
      priority: idea.priority || 'medium',
      searchIntent: idea.searchIntent || 'informational',
      language: language, // Voeg geselecteerde taal toe
    });

    if (idea.targetWordCount) {
      params.append('wordCount', idea.targetWordCount.toString());
    }
    
    // Ga altijd naar de unified blog-generator
    router.push(`/client-portal/content-generator?${params.toString()}`);
  };

  // Quick Generate & Publish
  const handleQuickGenerate = async (idea: ArticleIdea) => {
    if (!projectId) {
      toast.error('Selecteer eerst een project om te publiceren');
      return;
    }

    const confirmed = confirm(
      `🚀 1-Klik Genereren & Publiceren\n\n` +
      `Artikel: "${idea.title}"\n\n` +
      `Dit genereert automatisch het artikel en publiceert het direct naar WordPress.\n\n` +
      `Kosten: 50 credits\n\n` +
      `Doorgaan?`
    );

    if (!confirmed) return;

    setGeneratingId(idea.id);
    setGenerateProgress({
      ...generateProgress,
      [idea.id]: { progress: 0, status: 'Starten...' }
    });

    try {
      const response = await fetch('/api/client/quick-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          articleId: idea.id,
          projectId,
        }),
      });

      if (!response.ok) {
        throw new Error('Kon generatie niet starten');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
        }
        
        if (done) break;

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'complete') {
                setGenerateProgress({
                  ...generateProgress,
                  [idea.id]: { progress: 100, status: '✅ Voltooid!' }
                });
                
                setTimeout(() => {
                  setGeneratingId(null);
                  setGenerateProgress({});
                  toast.success(data.message);
                  onRefresh();
                }, 2000);
                
                reader.cancel();
                break;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              } else if (data.type === 'progress') {
                setGenerateProgress({
                  ...generateProgress,
                  [idea.id]: {
                    progress: data.progress,
                    status: data.status + (data.details ? ` - ${data.details}` : '')
                  }
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Quick generate error:', error);
      toast.error(error.message || 'Er is een fout opgetreden');
      setGeneratingId(null);
      setGenerateProgress({});
    }
  };



  // Voeg nieuw idee toe
  const handleAddIdea = async () => {
    if (!newIdeaTitle.trim()) {
      toast.error('Voer een titel in voor het nieuwe idee');
      return;
    }

    setIsAddingIdea(true);
    
    try {
      const response = await fetch('/api/client/article-ideas/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newIdeaTitle.trim(),
          projectId: projectId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ ' + data.message);
        setNewIdeaTitle('');
        setShowAddDialog(false);
        onRefresh(); // Refresh de lijst
      } else {
        toast.error(data.error || 'Er is een fout opgetreden');
      }
    } catch (error) {
      console.error('Error adding idea:', error);
      toast.error('Er is een fout opgetreden bij het toevoegen');
    } finally {
      setIsAddingIdea(false);
    }
  };

  // Verwijder idee
  const handleDeleteIdea = async (ideaId: string, ideaTitle: string) => {
    if (!confirm(`Weet je zeker dat je "${ideaTitle}" wilt verwijderen?`)) {
      return;
    }

    setDeletingId(ideaId);
    
    try {
      const response = await fetch(`/api/client/article-ideas/${ideaId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('🗑️ Content idee verwijderd');
        onRefresh(); // Refresh de lijst
      } else {
        toast.error(data.error || 'Er is een fout opgetreden');
      }
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast.error('Er is een fout opgetreden bij het verwijderen');
    } finally {
      setDeletingId(null);
    }
  };

  if (!ideas || ideas.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Geen content ideeën gevonden.</p>
        <p className="text-sm text-gray-500 mt-2">
          Start een nieuwe keyword research om content ideeën te genereren.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Add New Idea Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">✨ Nieuw Content Idee</DialogTitle>
            <DialogDescription className="text-base">
              Voer een titel in en de AI vult automatisch keywords, outline en andere details in.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Artikel titel
              </label>
              <input
                type="text"
                value={newIdeaTitle}
                onChange={(e) => setNewIdeaTitle(e.target.value)}
                placeholder="Bijv: De beste yogalessen in Amsterdam"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={isAddingIdea}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isAddingIdea) {
                    handleAddIdea();
                  }
                }}
              />
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 space-y-2">
                  <p><strong>De AI vult automatisch in:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Focus keyword en secondary keywords</li>
                    <li>Content type en search intent</li>
                    <li>Artikel outline met H2 koppen</li>
                    <li>SEO moeilijkheid en prioriteit</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewIdeaTitle('');
              }}
              disabled={isAddingIdea}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleAddIdea}
              disabled={isAddingIdea || !newIdeaTitle.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isAddingIdea ? (
                <>
                  <Repeat className="w-4 h-4 mr-2 animate-spin" />
                  AI vult in...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Voeg toe
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex gap-2">
            {selectedIdeas.size === 0 ? (
              <Button
                onClick={selectAll}
                variant="outline"
                size="sm"
              >
                Selecteer alles
              </Button>
            ) : (
              <>
                <Button
                  onClick={deselectAll}
                  variant="outline"
                  size="sm"
                >
                  Deselecteer alles ({selectedIdeas.size})
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                  disabled={isBulkDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Verwijder ({selectedIdeas.size})
                </Button>
              </>
            )}
          </div>
          
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Voeg nieuw idee toe
          </Button>
        </div>

      {/* Individual Ideas */}
      {ideas.map((idea) => (
        <Card key={idea.id} className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start gap-4">
              {/* Checkbox voor selectie */}
              <div className="pt-1">
                <Checkbox
                  checked={selectedIdeas.has(idea.id)}
                  onCheckedChange={() => toggleSelection(idea.id)}
                  className="w-5 h-5"
                />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <CardTitle className="text-xl">{idea.title}</CardTitle>
                  
                  {/* Content Category Badge */}
                  {idea.contentCategory === 'commercial' && (
                    <Badge className="bg-emerald-100 text-emerald-800">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Commercieel
                    </Badge>
                  )}
                  {idea.contentCategory === 'informational' && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Info className="w-3 h-3 mr-1" />
                      Informatief
                    </Badge>
                  )}
                  
                  {idea.trending && (
                    <Badge className="bg-red-100 text-red-800">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                  {idea.competitorGap && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Target className="w-3 h-3 mr-1" />
                      Kans
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">{idea.topic}</CardDescription>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(idea.status)}
                {getPriorityBadge(idea.priority)}
                
                {/* Publicatie Indicator */}
                {(idea.publishedAt || idea.savedContent?.publishedAt) && (
                  <Badge className="bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Gepubliceerd {new Date(idea.publishedAt || idea.savedContent?.publishedAt || '').toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Published URL Link */}
            {idea.savedContent?.publishedUrl && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-900">
                    Artikel gepubliceerd
                  </span>
                </div>
                <a
                  href={idea.savedContent.publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-600 hover:text-emerald-700 underline font-medium flex items-center gap-1"
                >
                  Bekijk artikel
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}

            {/* Keywords & SEO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Focus Keyword:</span>
                  <span className="text-gray-700">{idea.focusKeyword}</span>
                </div>
                
                {idea.secondaryKeywords && idea.secondaryKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {idea.secondaryKeywords.slice(0, 5).map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {idea.secondaryKeywords.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{idea.secondaryKeywords.length - 5} meer
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {idea.searchVolume !== undefined && idea.searchVolume !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Zoekvolume:</span>
                    <span className="text-gray-700">{idea.searchVolume.toLocaleString()}/maand</span>
                  </div>
                )}
                
                {idea.difficulty !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">SEO Moeilijkheid:</span>
                    <span className="text-gray-700">{idea.difficulty}/100</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content details */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>{getContentTypeLabel(idea.contentType)}</span>
              </div>
              
              {idea.targetWordCount && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>~{idea.targetWordCount} woorden</span>
                </div>
              )}
              
              {idea.imageIdeas && idea.imageIdeas.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Image className="w-4 h-4" />
                  <span>{idea.imageIdeas.length} afbeeldingen</span>
                </div>
              )}
              
              {idea.videoIdeas && idea.videoIdeas.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Video className="w-4 h-4" />
                  <span>{idea.videoIdeas.length} video's</span>
                </div>
              )}
            </div>

            {/* Progress Bar voor Quick Generate */}
            {generatingId === idea.id && generateProgress[idea.id] && (
              <div className="mt-4 p-4 bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <Repeat className="w-4 h-4 animate-spin text-orange-500" />
                    {generateProgress[idea.id].status}
                  </span>
                  <span className="text-sm text-orange-400">
                    {generateProgress[idea.id].progress}%
                  </span>
                </div>
                <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${generateProgress[idea.id].progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
              <div className="flex flex-wrap items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleQuickGenerate(idea)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                        disabled={generatingId === idea.id || !projectId || idea.status === 'published'}
                      >
                        {generatingId === idea.id ? (
                          <>
                            <Repeat className="w-4 h-4 mr-2 animate-spin" />
                            Genereren...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            1-Klik Genereer & Publiceer
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Genereer en publiceer automatisch met AI (50 credits)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleWriteNow(idea)}
                        variant="outline"
                        className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                        disabled={idea.status === 'published' || generatingId === idea.id}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Handmatig schrijven
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ga naar blog generator voor meer controle</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleDeleteIdea(idea.id, idea.title)}
                        variant="outline"
                        className="border-red-500/30 text-red-600 hover:bg-red-50"
                        disabled={deletingId === idea.id || generatingId === idea.id}
                      >
                        {deletingId === idea.id ? (
                          <Repeat className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verwijder dit content idee</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {idea.aiScore !== undefined && (
                <div className="ml-auto">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                          <Zap className="w-3 h-3 mr-1" />
                          AI Score: {idea.aiScore}/100
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>AI-berekende potentieel score op basis van SEO en markt data</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
    </>
  );
}