'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Play, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface BatchGeneratorProps {
  articleIds: string[];
  onComplete: () => void;
}

export default function BatchGenerator({ articleIds, onComplete }: BatchGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentArticle, setCurrentArticle] = useState(0);

  const handleStartBatch = async () => {
    setGenerating(true);
    setProgress(0);
    setCurrentArticle(0);

    try {
      for (let i = 0; i < articleIds.length; i++) {
        setCurrentArticle(i + 1);
        
        const response = await fetch('/api/content-hub/write-article', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articleId: articleIds[i],
            generateImages: true,
            includeFAQ: true,
            autoPublish: false,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate article ${i + 1}`);
        }

        setProgress(Math.round(((i + 1) / articleIds.length) * 100));
      }

      toast.success(`Successfully generated ${articleIds.length} articles!`);
      onComplete();
    } catch (error: any) {
      console.error('Batch generation error:', error);
      toast.error(error.message || 'Batch generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Generation</CardTitle>
        <CardDescription>
          Generate multiple articles at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Selected: {articleIds.length} articles
          </span>
          <Badge variant="secondary">{articleIds.length}</Badge>
        </div>

        {generating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing article {currentArticle} of {articleIds.length}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button 
          onClick={handleStartBatch} 
          disabled={generating || articleIds.length === 0}
          className="w-full gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start Batch Generation
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
