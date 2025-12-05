'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  X, 
  Loader2, 
  CheckCircle2, 
  Search,
  PenTool,
  Image as ImageIcon,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';

interface BlogArticleGeneratorProps {
  onClose: () => void;
  onComplete: () => void;
}

interface GenerationPhase {
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  message?: string;
}

export default function BlogArticleGenerator({ onClose, onComplete }: BlogArticleGeneratorProps) {
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('AI & Content Marketing');
  const [targetWordCount, setTargetWordCount] = useState('1500');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phases, setPhases] = useState<GenerationPhase[]>([
    { name: 'SERP Analyse', status: 'pending', message: 'Top 10 Google resultaten analyseren...' },
    { name: 'Content Generatie', status: 'pending', message: 'SEO-geoptimaliseerde content schrijven...' },
    { name: 'SEO & Afbeeldingen', status: 'pending', message: 'Meta data en afbeeldingen optimaliseren...' },
    { name: 'Opslaan', status: 'pending', message: 'Content opslaan...' },
  ]);
  const [generateImages, setGenerateImages] = useState(true);
  const [includeFAQ, setIncludeFAQ] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);

  const updatePhase = (index: number, updates: Partial<GenerationPhase>) => {
    setPhases(prev => prev.map((phase, i) => 
      i === index ? { ...phase, ...updates } : phase
    ));
  };

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error('Vul een titel in');
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      // Phase 1: SERP Analysis
      updatePhase(0, { status: 'in-progress' });
      setProgress(10);

      const response = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          title,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          category,
          targetWordCount: parseInt(targetWordCount) || 1500,
          generateImages,
          includeFAQ,
          autoPublish,
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      // Stream the response for real-time updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.phase) {
                // Update current phase
                const phaseIndex = phases.findIndex(p => p.name === data.phase);
                if (phaseIndex !== -1) {
                  updatePhase(phaseIndex, { status: 'in-progress', message: data.message });
                }
              }

              if (data.progress) {
                setProgress(data.progress);
              }

              if (data.phaseComplete) {
                const phaseIndex = phases.findIndex(p => p.name === data.phaseComplete);
                if (phaseIndex !== -1) {
                  updatePhase(phaseIndex, { status: 'completed' });
                }
              }

              if (data.complete) {
                // All phases complete
                phases.forEach((_, i) => updatePhase(i, { status: 'completed' }));
                setProgress(100);
                toast.success('Artikel succesvol gegenereerd!');
                setTimeout(() => {
                  onComplete();
                }, 1500);
                return;
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (err) {
              console.error('Error parsing SSE:', err);
            }
          }
        }
      } else {
        // Fallback without streaming
        updatePhase(0, { status: 'completed' });
        setProgress(25);
        
        updatePhase(1, { status: 'in-progress' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        updatePhase(1, { status: 'completed' });
        setProgress(50);
        
        updatePhase(2, { status: 'in-progress' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        updatePhase(2, { status: 'completed' });
        setProgress(75);
        
        updatePhase(3, { status: 'in-progress' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        updatePhase(3, { status: 'completed' });
        setProgress(100);

        toast.success('Artikel succesvol gegenereerd!');
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Kon artikel niet genereren');
      
      // Mark current phase as failed
      const currentPhase = phases.findIndex(p => p.status === 'in-progress');
      if (currentPhase !== -1) {
        updatePhase(currentPhase, { status: 'failed' });
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-[#FF9933]" />
                AI Artikel Generator
              </CardTitle>
              <CardDescription>
                Genereer een SEO-geoptimaliseerd artikel voor Writgo.nl blog
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={generating}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!generating ? (
            <>
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Artikel Titel *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Bijv: Hoe AI content marketing revolutioneert in 2024"
                  disabled={generating}
                />
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label htmlFor="keywords">Focus Keywords (optioneel)</Label>
                <Input
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Bijv: AI content, content marketing, SEO"
                  disabled={generating}
                />
                <p className="text-xs text-muted-foreground">
                  Komma-gescheiden lijst van keywords
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Categorie</Label>
                <Select value={category} onValueChange={setCategory} disabled={generating}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AI & Content Marketing">AI & Content Marketing</SelectItem>
                    <SelectItem value="SEO & Ranking">SEO & Ranking</SelectItem>
                    <SelectItem value="WordPress Tips">WordPress Tips</SelectItem>
                    <SelectItem value="Automatisering">Automatisering</SelectItem>
                    <SelectItem value="Nieuws & Updates">Nieuws & Updates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Word Count */}
              <div className="space-y-2">
                <Label htmlFor="wordCount">Doel Woordenaantal</Label>
                <Select value={targetWordCount} onValueChange={setTargetWordCount} disabled={generating}>
                  <SelectTrigger id="wordCount">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1000 woorden (Kort)</SelectItem>
                    <SelectItem value="1500">1500 woorden (Gemiddeld)</SelectItem>
                    <SelectItem value="2000">2000 woorden (Lang)</SelectItem>
                    <SelectItem value="2500">2500 woorden (Uitgebreid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Options */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Afbeeldingen Genereren</Label>
                    <p className="text-xs text-muted-foreground">
                      Genereer AI afbeeldingen voor het artikel
                    </p>
                  </div>
                  <Switch
                    checked={generateImages}
                    onCheckedChange={setGenerateImages}
                    disabled={generating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>FAQ Sectie Toevoegen</Label>
                    <p className="text-xs text-muted-foreground">
                      Voeg automatisch FAQ sectie toe
                    </p>
                  </div>
                  <Switch
                    checked={includeFAQ}
                    onCheckedChange={setIncludeFAQ}
                    disabled={generating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Direct Publiceren</Label>
                    <p className="text-xs text-muted-foreground">
                      Publiceer het artikel direct na generatie
                    </p>
                  </div>
                  <Switch
                    checked={autoPublish}
                    onCheckedChange={setAutoPublish}
                    disabled={generating}
                  />
                </div>
              </div>
            </>
          ) : (
            /* Generation Progress */
            <div className="space-y-6">
              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Voortgang</span>
                  <span className="text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Phases */}
              <div className="space-y-3">
                {phases.map((phase, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="mt-0.5">
                      {phase.status === 'completed' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {phase.status === 'in-progress' && (
                        <Loader2 className="h-5 w-5 animate-spin text-[#FF9933]" />
                      )}
                      {phase.status === 'pending' && (
                        <div className="h-5 w-5 rounded-full border-2 border-muted" />
                      )}
                      {phase.status === 'failed' && (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{phase.name}</div>
                      {phase.message && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {phase.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={generating}>
            {generating ? 'Sluiten' : 'Annuleren'}
          </Button>
          {!generating && (
            <Button onClick={handleGenerate} disabled={!title.trim()}>
              <Wand2 className="h-4 w-4 mr-2" />
              Genereer Artikel
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
