'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  DollarSign,
  Info,
  Upload,
  ExternalLink,
  RefreshCw,
  Pencil,
  Trash2,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import ArticleGenerator from './article-generator';
import RewriteModal from './rewrite-modal';
import EditArticleModal from './edit-article-modal';
import DeleteConfirmationModal from './delete-confirmation-modal';
import { isInProgress } from '@/lib/content-hub/article-utils';
import InlineGenerationStatus from '@/components/content-hub/inline-generation-status';
import { GenerationPhase } from '@/lib/content-hub/generation-types';

interface Article {
  id: string;
  title: string;
  cluster: string;
  keywords: string[];
  status: string;
  priority: number;
  searchVolume: number | null;
  difficulty: number | null;
  searchIntent: string | null;
  wordpressUrl: string | null;
  publishedAt: string | null;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

interface ArticleRowProps {
  article: Article;
  onUpdate?: () => void;
}

// Constants for SSE parsing
const MAX_PARSE_ERRORS = 3; // Maximum parse errors before showing toast
const SSE_DATA_PREFIX_LENGTH = 6; // Length of 'data: ' prefix in SSE messages

export default function ArticleRow({ article, onUpdate }: ArticleRowProps) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phases, setPhases] = useState<GenerationPhase[]>([
    { 
      name: 'SERP Analyse', 
      status: 'pending',
      message: 'Top 10 Google resultaten analyseren...',
    },
    { 
      name: 'Content Generatie', 
      status: 'pending',
      message: 'SEO-geoptimaliseerde content schrijven...',
    },
    { 
      name: 'SEO & Afbeeldingen', 
      status: 'pending',
      message: 'Meta data en afbeeldingen optimaliseren...',
    },
    { 
      name: 'Publicatie', 
      status: 'pending',
      message: 'Content opslaan...',
    },
  ]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const getStatusIcon = () => {
    switch (article.status) {
      case 'published':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'writing':
      case 'researching':
      case 'publishing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (article.status) {
      case 'published':
        return 'Gepubliceerd';
      case 'pending':
        return 'Wachtend';
      case 'writing':
        return 'Schrijven...';
      case 'researching':
        return 'Onderzoeken...';
      case 'publishing':
        return 'Publiceren...';
      case 'failed':
        return 'Mislukt';
      default:
        return article.status;
    }
  };

  const getIntentBadge = () => {
    const intent = article.searchIntent || 'informational';
    const colors = {
      commercial: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      transactional: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      informational: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    
    return (
      <Badge variant="outline" className={colors[intent as keyof typeof colors] || colors.informational}>
        {intent}
      </Badge>
    );
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const response = await fetch('/api/content-hub/publish-wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId: article.id,
          status: 'publish',
        }),
      });

      if (!response.ok) {
        throw new Error('Publiceren mislukt');
      }

      toast.success('Artikel gepubliceerd naar WordPress!');
      onUpdate?.();
    } catch (error) {
      console.error('Failed to publish:', error);
      toast.error('Kon artikel niet publiceren');
    } finally {
      setPublishing(false);
    }
  };

  const handleRewrite = () => {
    setShowRewriteModal(true);
  };

  const updatePhase = (index: number, updates: Partial<GenerationPhase>) => {
    setPhases(prev => prev.map((phase, i) => 
      i === index ? { ...phase, ...updates } : phase
    ));
  };

  const handleCancel = async () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    
    setGenerating(false);
    setProgress(0);
    setPhases(prev => prev.map(phase => ({ 
      ...phase, 
      status: phase.status === 'in-progress' ? 'pending' : phase.status 
    })));
    
    toast.info('Generatie geannuleerd');
    
    // Reset article status in database
    try {
      await fetch(`/api/content-hub/articles/${article.id}/cancel`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to reset article status:', error);
      toast.warning('Generatie gestopt, maar status kon niet worden gereset');
    }
  };

  const handleGenerate = async () => {
    const controller = new AbortController();
    setAbortController(controller);
    setGenerating(true);
    setProgress(0);

    const startTime = Date.now();
    const phaseStartTimes: { [key: number]: number } = {};
    let parseErrorCount = 0; // Track parse errors locally

    try {
      const response = await fetch('/api/content-hub/write-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId: article.id,
          generateImages: true,
          includeFAQ: true,
          autoPublish: false,
          streamUpdates: true, // Enable SSE streaming
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate article');
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) {
        throw new Error('Kan geen real-time updates ontvangen. Probeer het opnieuw.');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
        }
        
        if (done) break;

        // Process complete SSE messages
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(SSE_DATA_PREFIX_LENGTH));
              
              // Reset error count on successful parse
              parseErrorCount = 0;
              
              // Map backend steps to frontend phases
              let phaseIndex = -1;
              if (data.step === 'serp-analysis') {
                phaseIndex = 0;
              } else if (data.step === 'content-generation') {
                phaseIndex = 1;
              } else if (data.step === 'seo-optimization') {
                phaseIndex = 2;
              } else if (data.step === 'saving' || data.step === 'publishing') {
                phaseIndex = 3;
              }

              // Update progress
              if (data.progress !== undefined) {
                setProgress(data.progress);
              }

              // Update phase
              if (phaseIndex !== -1 && phaseIndex < phases.length) {
                if (data.status === 'in-progress') {
                  phaseStartTimes[phaseIndex] = Date.now();
                  updatePhase(phaseIndex, {
                    status: 'in-progress',
                    message: data.message || phases[phaseIndex]?.message,
                  });
                } else if (data.status === 'completed') {
                  const duration = phaseStartTimes[phaseIndex] 
                    ? Math.floor((Date.now() - phaseStartTimes[phaseIndex]) / 1000)
                    : undefined;
                  
                  updatePhase(phaseIndex, {
                    status: 'completed',
                    message: data.message || '✅ Voltooid',
                    duration,
                    metrics: data.metrics,
                  });
                } else if (data.status === 'failed') {
                  const duration = phaseStartTimes[phaseIndex]
                    ? Math.floor((Date.now() - phaseStartTimes[phaseIndex]) / 1000)
                    : undefined;
                  
                  updatePhase(phaseIndex, {
                    status: 'failed',
                    message: data.message || data.error || 'Fout opgetreden',
                    duration,
                  });
                }
              }

              // Handle completion
              if (data.step === 'complete') {
                if (data.status === 'success') {
                  setProgress(100);
                  const totalDuration = Math.floor((Date.now() - startTime) / 1000);
                  toast.success(`Artikel succesvol gegenereerd in ${totalDuration}s!`);
                  
                  setTimeout(() => {
                    onUpdate?.();
                    setGenerating(false);
                  }, 1500);
                } else if (data.status === 'error') {
                  throw new Error(data.error || 'Het voltooien van het artikel is mislukt');
                }
                break;
              }

              // Handle error
              if (data.step === 'error') {
                throw new Error(data.error || data.message || 'Het genereren van het artikel is mislukt');
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
              // Only show toast if this happens repeatedly
              parseErrorCount++;
              if (parseErrorCount > MAX_PARSE_ERRORS) {
                toast.error('Fout bij ontvangen van updates. Controleer de browser console.');
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }
      
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate article');
      
      // Mark current phase as failed
      const currentPhaseIndex = phases.findIndex(p => p.status === 'in-progress');
      if (currentPhaseIndex !== -1) {
        const duration = phaseStartTimes[currentPhaseIndex]
          ? Math.floor((Date.now() - phaseStartTimes[currentPhaseIndex]) / 1000)
          : undefined;
        
        updatePhase(currentPhaseIndex, { 
          status: 'failed', 
          message: error.message || 'Er is een fout opgetreden',
          duration,
        });
      }
    } finally {
      setAbortController(null);
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/content-hub/articles/${article.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verwijderen mislukt');
      }

      toast.success('Artikel succesvol verwijderd');
      setShowDeleteModal(false);
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to delete:', error);
      toast.error(error.message || 'Kon artikel niet verwijderen');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {getStatusIcon()}
            </div>

            {/* Article Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1 truncate">{article.title}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {article.searchVolume !== null && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{article.searchVolume.toLocaleString()}</span>
                  </div>
                )}
                {article.difficulty !== null && (
                  <div className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    <span>Diff: {article.difficulty}</span>
                  </div>
                )}
                {getIntentBadge()}
                {article.searchIntent === 'commercial' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <DollarSign className="h-3 w-3" />
                    <span>€€€</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {article.keywords.slice(0, 3).map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {article.keywords.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{article.keywords.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0">
              <Badge 
                variant={article.status === 'published' ? 'default' : 'secondary'}
                className={
                  article.status === 'published' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : article.status === 'failed'
                    ? 'bg-red-500 hover:bg-red-600'
                    : ''
                }
              >
                {getStatusText()}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex gap-2">
              {article.status === 'pending' && !generating && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowEditModal(true)}
                    className="gap-2"
                    title="Bewerk artikel"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowGenerator(true)}
                    className="gap-2"
                    title="Generatie instellingen"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleGenerate}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Genereer
                  </Button>
                </>
              )}
              
              {article.status === 'published' && !article.wordpressUrl && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handlePublish}
                  disabled={publishing}
                  className="gap-2"
                >
                  {publishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Publiceer
                </Button>
              )}
              
              {article.wordpressUrl && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  asChild
                  className="gap-2"
                >
                  <a href={article.wordpressUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Bekijk
                  </a>
                </Button>
              )}
              
              {article.status === 'published' && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleRewrite}
                  className="gap-2"
                  title="Herschrijf dit artikel"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              
              {article.status === 'published' && !article.wordpressUrl && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setShowGenerator(true)}
                  title="Bekijk artikel"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}

              {/* Delete button - available for all statuses except in-progress */}
              {!isInProgress(article.status) && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setShowDeleteModal(true)}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  title="Verwijder artikel"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Inline Generation Status */}
          {generating && (
            <InlineGenerationStatus
              progress={progress}
              phases={phases}
              onCancel={handleCancel}
              generating={generating}
            />
          )}
        </CardContent>
      </Card>

      {/* Article Generator Modal - For Settings Only */}
      {showGenerator && (
        <ArticleGenerator
          article={article}
          onClose={() => setShowGenerator(false)}
          onComplete={() => {
            setShowGenerator(false);
            onUpdate?.();
          }}
        />
      )}

      {/* Rewrite Modal */}
      {showRewriteModal && (
        <RewriteModal
          article={article}
          onClose={() => setShowRewriteModal(false)}
          onComplete={() => {
            setShowRewriteModal(false);
            onUpdate?.();
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditArticleModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            onUpdate?.();
          }}
          article={article}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        articleTitle={article.title}
        isDeleting={isDeleting}
      />
    </>
  );
}