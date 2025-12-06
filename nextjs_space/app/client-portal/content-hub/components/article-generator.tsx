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
  metrics?: {
    wordCount?: number;
    lsiKeywords?: number;
    paaQuestions?: number;
    images?: number;
  };
}

export default function ArticleGenerator({ article, onClose, onComplete }: ArticleGeneratorProps) {
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
      message: 'AI schrijft artikel...',
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
    
    // Reset SSE parse error counter
    if (typeof window !== 'undefined') {
      (window as any).__sseParseErrors = 0;
    }

    try {
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
              const data = JSON.parse(line.slice(6));
              
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
              if (phaseIndex !== -1) {
                if (data.status === 'in-progress') {
                  phaseStartTimes[phaseIndex] = Date.now();
                  updatePhase(phaseIndex, {
                    status: 'in-progress',
                    message: data.message || phases[phaseIndex].message,
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
                    onComplete();
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
              // Only show toast if this happens repeatedly (more than 3 times)
              if (typeof window !== 'undefined') {
                const w = window as any;
                if (!w.__sseParseErrors) w.__sseParseErrors = 0;
                w.__sseParseErrors++;
                if (w.__sseParseErrors > 3) {
                  toast.error('Fout bij ontvangen van updates. Controleer de browser console.');
                }
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <Card className="w-full max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-xl line-clamp-2">{article.title}</CardTitle>
              <CardDescription className="mt-1 text-xs sm:text-sm">
                Generate complete SEO-optimized article
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              disabled={generating}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Options */}
          {!generating && progress === 0 && (
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg">
              <h3 className="font-semibold text-sm sm:text-base">Generation Options</h3>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="generate-images" className="text-sm">Generate Images</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Create featured image using AI
                  </p>
                </div>
                <Switch
                  id="generate-images"
                  checked={generateImages}
                  onCheckedChange={setGenerateImages}
                  className="flex-shrink-0"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="include-faq" className="text-sm">Include FAQ Section</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Add frequently asked questions
                  </p>
                </div>
                <Switch
                  id="include-faq"
                  checked={includeFAQ}
                  onCheckedChange={setIncludeFAQ}
                  className="flex-shrink-0"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="auto-publish" className="text-sm">Auto-publish to WordPress</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Publish immediately after generation
                  </p>
                </div>
                <Switch
                  id="auto-publish"
                  checked={autoPublish}
                  onCheckedChange={setAutoPublish}
                  className="flex-shrink-0"
                />
              </div>
            </div>
          )}

          {/* Progress */}
          {generating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium">Overall Progress</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5 sm:h-2" />
            </div>
          )}

          {/* Phases */}
          <div className="space-y-2 sm:space-y-3">
            {phases.map((phase, index) => (
              <div 
                key={index}
                className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border ${
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
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <h4 className="font-semibold text-sm sm:text-base">{phase.name}</h4>
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
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {phase.message}
                    </p>
                  )}
                  {phase.metrics && (
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                      {phase.metrics.wordCount !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          📝 {phase.metrics.wordCount} woorden
                        </Badge>
                      )}
                      {phase.metrics.lsiKeywords !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          🔍 {phase.metrics.lsiKeywords} LSI keywords
                        </Badge>
                      )}
                      {phase.metrics.paaQuestions !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          ❓ {phase.metrics.paaQuestions} FAQ vragen
                        </Badge>
                      )}
                      {phase.metrics.images !== undefined && phase.metrics.images > 0 && (
                        <Badge variant="outline" className="text-xs">
                          🖼️ {phase.metrics.images} afbeelding(en)
                        </Badge>
                      )}
                    </div>
                  )}
                  {phase.duration && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ⏱️ {phase.duration}s
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Article Info */}
          <div className="p-3 sm:p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Cluster</span>
              <Badge variant="outline" className="text-xs">{article.cluster}</Badge>
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

        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 p-4 sm:p-6">
          <Button 
            variant="outline" 
            onClick={generating ? handleCancel : onClose}
            disabled={false}
            className="w-full sm:w-auto"
          >
            {progress === 100 ? 'Sluiten' : 'Annuleren'}
          </Button>
          {progress === 0 && (
            <Button 
              onClick={handleGenerate} 
              disabled={generating}
              className="gap-2 w-full sm:w-auto"
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
