'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  X, 
  Loader2, 
  CheckCircle2, 
  Clock,
  Search,
  PenTool,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

interface Article {
  id: string;
  title: string;
  cluster: string;
  keywords: string[];
}

interface ArticleGeneratorProps {
  article: Article;
  onClose: () => void;
  onComplete: () => void;
}

interface GenerationPhase {
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  message?: string;
  duration?: number;
}

export default function ArticleGenerator({ article, onClose, onComplete }: ArticleGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phases, setPhases] = useState<GenerationPhase[]>([
    { name: 'Research & Analysis', status: 'pending' },
    { name: 'Content Generation', status: 'pending' },
    { name: 'SEO & Images', status: 'pending' },
    { name: 'Publishing', status: 'pending' },
  ]);
  const [generateImages, setGenerateImages] = useState(true);
  const [includeFAQ, setIncludeFAQ] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

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
    
    // Reset artikel status in database
    try {
      await fetch(`/api/content-hub/articles/${article.id}/cancel`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to reset article status:', error);
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
          generateImages,
          includeFAQ,
          autoPublish,
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
        onComplete();
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

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{article.title}</CardTitle>
              <CardDescription className="mt-1">
                Generate complete SEO-optimized article
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              disabled={generating}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Options */}
          {!generating && progress === 0 && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold">Generation Options</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="generate-images">Generate Images</Label>
                  <p className="text-sm text-muted-foreground">
                    Create featured image using AI
                  </p>
                </div>
                <Switch
                  id="generate-images"
                  checked={generateImages}
                  onCheckedChange={setGenerateImages}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="include-faq">Include FAQ Section</Label>
                  <p className="text-sm text-muted-foreground">
                    Add frequently asked questions
                  </p>
                </div>
                <Switch
                  id="include-faq"
                  checked={includeFAQ}
                  onCheckedChange={setIncludeFAQ}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-publish">Auto-publish to WordPress</Label>
                  <p className="text-sm text-muted-foreground">
                    Publish immediately after generation
                  </p>
                </div>
                <Switch
                  id="auto-publish"
                  checked={autoPublish}
                  onCheckedChange={setAutoPublish}
                />
              </div>
            </div>
          )}

          {/* Progress */}
          {generating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Progress</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Phases */}
          <div className="space-y-3">
            {phases.map((phase, index) => (
              <div 
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  phase.status === 'in-progress' ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' :
                  phase.status === 'completed' ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' :
                  phase.status === 'failed' ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' :
                  'bg-card'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getPhaseIcon(phase.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{phase.name}</h4>
                    {phase.status !== 'pending' && (
                      <Badge 
                        variant={
                          phase.status === 'completed' ? 'default' :
                          phase.status === 'in-progress' ? 'secondary' :
                          'destructive'
                        }
                        className="text-xs"
                      >
                        {phase.status}
                      </Badge>
                    )}
                  </div>
                  {phase.message && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {phase.message}
                    </p>
                  )}
                  {phase.duration && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {phase.duration}s
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Article Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cluster</span>
              <Badge variant="outline">{article.cluster}</Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {article.keywords.map((keyword, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={generating ? handleCancel : onClose}
            disabled={false}
          >
            {progress === 100 ? 'Sluiten' : 'Annuleren'}
          </Button>
          {progress === 0 && (
            <Button 
              onClick={handleGenerate} 
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Genereren...
                </>
              ) : (
                <>
                  <PenTool className="h-4 w-4" />
                  Start Generatie
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
