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
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import ArticleGenerator from './article-generator';
import InlineGenerationStatus from './inline-generation-status';
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
}

interface ArticleRowProps {
  article: Article;
  onUpdate?: () => void;
}

export default function ArticleRow({ article, onUpdate }: ArticleRowProps) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phases, setPhases] = useState<GenerationPhase[]>([
    { name: 'Research & Analysis', status: 'pending' },
    { name: 'Content Generation', status: 'pending' },
    { name: 'SEO & Images', status: 'pending' },
    { name: 'Publishing', status: 'pending' },
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
        return 'Published';
      case 'pending':
        return 'Pending';
      case 'writing':
        return 'Writing...';
      case 'researching':
        return 'Researching...';
      case 'publishing':
        return 'Publishing...';
      case 'failed':
        return 'Failed';
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
    
    toast.info('Generation cancelled');
    
    // Reset article status in database
    try {
      await fetch(`/api/content-hub/articles/${article.id}/cancel`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to reset article status:', error);
      toast.warning('Generation stopped, but status could not be reset');
    }
  };

  const handleGenerate = async () => {
    const controller = new AbortController();
    setAbortController(controller);
    setGenerating(true);
    setProgress(0);

    try {
      // Phase 1: Research
      updatePhase(0, { status: 'in-progress', message: 'Analyzing SERP...' });
      setProgress(10);

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
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to generate article');
      }

      const data = await response.json();

      // Mark all phases as completed
      setPhases(prev => prev.map(phase => ({ 
        ...phase, 
        status: 'completed' 
      })));
      setProgress(100);

      toast.success('Article generated successfully!');
      
      setTimeout(() => {
        onUpdate?.();
        setGenerating(false);
      }, 1000);
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
        updatePhase(currentPhaseIndex, { status: 'failed', message: error.message });
      }
    } finally {
      setAbortController(null);
      setGenerating(false);
    }
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
        throw new Error('Failed to publish');
      }

      toast.success('Article published to WordPress!');
      onUpdate?.();
    } catch (error) {
      console.error('Failed to publish:', error);
      toast.error('Failed to publish article');
    } finally {
      setPublishing(false);
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
                    onClick={() => setShowGenerator(true)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleGenerate}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Generate
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
                  Publish
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
                    View
                  </a>
                </Button>
              )}
              
              {article.status === 'published' && !article.wordpressUrl && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setShowGenerator(true)}
                >
                  <Eye className="h-4 w-4" />
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
    </>
  );
}
