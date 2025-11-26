
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Newspaper, 
  Search, 
  Loader2, 
  ExternalLink, 
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import BlogCanvas from '@/components/blog-canvas';

interface NewsSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string;
  selected: boolean;
}

// WritgoAI Brand Colors
const BRAND_COLORS = {
  black: '#000000',
  orange: '#ff6b35',
  white: '#FFFFFF',
  cardBg: '#0a0a0a',
  cardBorder: '#1a1a1a',
};

export default function NewsArticleGenerator() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Step 1: Topic input
  const [topic, setTopic] = useState('');
  
  // Step 2: Sources
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [searchingSource, setSearchingSources] = useState(false);
  
  // Step 3: Article generation
  const [generatedArticle, setGeneratedArticle] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [generating, setGenerating] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!session) {
      router.push('/client-login');
    }
  }, [session, router]);

  // Step 1: Search for sources
  const searchSources = async () => {
    if (!topic.trim()) {
      toast.error('Voer een onderwerp in');
      return;
    }

    setSearchingSources(true);
    setProgress(20);

    try {
      const response = await fetch('/api/client/search-news-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic,
          clientId: (session?.user as any)?.id
        }),
      });

      setProgress(60);

      if (!response.ok) {
        throw new Error('Fout bij het zoeken van bronnen');
      }

      const data = await response.json();
      
      // Map sources to NewsSource format
      const mappedSources: NewsSource[] = data.sources.map((source: any, index: number) => ({
        id: `source-${index}`,
        title: source.title,
        url: source.url,
        snippet: source.snippet || source.description || '',
        source: source.source || new URL(source.url).hostname,
        publishedDate: source.date,
        selected: false,
      }));

      setSources(mappedSources);
      setProgress(100);
      setStep(2);
      toast.success(`${mappedSources.length} bronnen gevonden!`);
    } catch (error) {
      console.error('Error searching sources:', error);
      toast.error('Fout bij het zoeken van bronnen');
    } finally {
      setSearchingSources(false);
      setProgress(0);
    }
  };

  // Toggle source selection
  const toggleSource = (sourceId: string) => {
    setSources(sources.map(s => 
      s.id === sourceId ? { ...s, selected: !s.selected } : s
    ));
  };

  // Generate article from selected sources
  const generateArticle = async () => {
    const selectedSources = sources.filter(s => s.selected);
    
    if (selectedSources.length === 0) {
      toast.error('Selecteer minimaal 1 bron');
      return;
    }

    setGenerating(true);
    setProgress(20);
    setStep(3);

    try {
      const response = await fetch('/api/client/generate-news-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          sources: selectedSources,
          clientId: (session?.user as any)?.id
        }),
      });

      setProgress(60);

      if (!response.ok) {
        throw new Error('Fout bij het genereren van artikel');
      }

      const data = await response.json();
      
      setArticleTitle(data.title || topic);
      setGeneratedArticle(data.article);
      setProgress(100);
      toast.success('Nieuwsartikel succesvol gegenereerd!');
    } catch (error) {
      console.error('Error generating article:', error);
      toast.error('Fout bij het genereren van artikel');
      setStep(2);
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  // Reset to start
  const reset = () => {
    setStep(1);
    setTopic('');
    setSources([]);
    setGeneratedArticle('');
    setArticleTitle('');
  };

  // Render canvas if article is generated
  if (generatedArticle) {
    return (
      <BlogCanvas
        content={generatedArticle}
        isGenerating={false}
        topic={articleTitle}
        projectId={null}
        onSave={(content) => {
          // Handle save
          toast.success('Nieuwsartikel opgeslagen!');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#002040] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Newspaper className="w-6 h-6 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-white">Nieuwsartikel Generator</h1>
          </div>
          <p className="text-gray-400">
            Genereer een nieuwsartikel op basis van actuele bronnen
          </p>
        </div>

        {/* Progress bar */}
        {progress > 0 && (
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-zinc-700'}`}>
              {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
            </div>
            <span className="font-medium">Onderwerp</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-orange-600 text-white' : 'bg-zinc-700'}`}>
              {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
            </div>
            <span className="font-medium">Bronnen</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-orange-600 text-white' : 'bg-zinc-700'}`}>
              {step > 3 ? <CheckCircle2 className="w-5 h-5" /> : '3'}
            </div>
            <span className="font-medium">Artikel</span>
          </div>
        </div>

        {/* Step 1: Topic Input */}
        {step === 1 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Stap 1: Voer onderwerp in
              </CardTitle>
              <CardDescription className="text-gray-400">
                Waar wil je een nieuwsartikel over schrijven?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="topic">Onderwerp</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Bijv: Nieuwe AI ontwikkelingen in 2025"
                  className="mt-2"
                  onKeyDown={(e) => e.key === 'Enter' && searchSources()}
                />
              </div>

              <Button 
                onClick={searchSources} 
                disabled={searchingSource || !topic.trim()}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                {searchingSource ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Bronnen zoeken...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Zoek actuele bronnen
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Sources */}
        {step === 2 && (
          <div className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Stap 2: Selecteer bronnen
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Gevonden: {sources.length} bronnen • Geselecteerd: {sources.filter(s => s.selected).length}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Sources list */}
            <div className="space-y-3">
              {sources.map((source) => (
                <Card 
                  key={source.id} 
                  className={`cursor-pointer transition-all ${source.selected ? 'ring-2 ring-orange-600 bg-zinc-900' : 'hover:shadow-md'}`}
                  onClick={() => toggleSource(source.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Checkbox 
                        checked={source.selected}
                        onCheckedChange={() => toggleSource(source.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-semibold text-white flex-1">
                            {source.title}
                          </h3>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{source.snippet}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Badge variant="secondary">{source.source}</Badge>
                          {source.publishedDate && <span>{source.publishedDate}</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Terug
              </Button>
              <Button 
                onClick={generateArticle}
                disabled={sources.filter(s => s.selected).length === 0}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Genereer artikel ({sources.filter(s => s.selected).length} bronnen)
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generating (loading state) */}
        {step === 3 && generating && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
                <h3 className="text-xl font-semibold">Artikel wordt gegenereerd...</h3>
                <p className="text-gray-400 text-center">
                  De AI analyseert de geselecteerde bronnen en schrijft een nieuwsartikel
                </p>
                {progress > 0 && (
                  <div className="w-full max-w-xs">
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
