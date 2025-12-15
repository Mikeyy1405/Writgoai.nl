'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, Sparkles, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { LANGUAGES, type LanguageCode } from '@/lib/language-helper';

interface Project {
  id: string;
  name: string;
}

interface GenerationProgress {
  progress: number;
  message: string;
  done?: boolean;
  success?: boolean;
  error?: string;
  contentId?: string;
}

export default function SchrijvenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Form state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('NL');
  const [wordCount, setWordCount] = useState(1500);
  const [imageCount, setImageCount] = useState(3);
  const [tone, setTone] = useState('professional');
  const [keywords, setKeywords] = useState('');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeFAQ, setIncludeFAQ] = useState(false);
  const [includeYouTube, setIncludeYouTube] = useState(false);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({ progress: 0, message: '' });
  const [generatedContentId, setGeneratedContentId] = useState<string | null>(null);
  const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load projects
  useEffect(() => {
    if (status === 'authenticated') {
      loadProjects();
    }
  }, [status]);

  // Cleanup redirect timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [redirectTimeout]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/client/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const generateContent = async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    
    if (!topic.trim()) {
      toast.error('Voer een onderwerp in');
      return;
    }

    setIsGenerating(true);
    setProgress({ progress: 0, message: 'Starten...' });
    setGeneratedContentId(null);

    try {
      const response = await fetch('/api/client/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          language,
          wordCount,
          imageCount: includeImages ? imageCount : 0,
          projectId: selectedProject || undefined,
          includeImages,
          includeFAQ,
          includeYouTube,
          tone,
          keywords: keywords.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setProgress(data);

              if (data.done) {
                if (data.success && data.contentId) {
                  setGeneratedContentId(data.contentId);
                  toast.success('Content succesvol gegenereerd! 🎉');
                  
                  // Redirect naar content library na 2 seconden
                  const timeout = setTimeout(() => {
                    router.push('/client-portal/content-library');
                  }, 2000);
                  setRedirectTimeout(timeout);
                } else if (data.error) {
                  toast.error(data.error);
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      
      // Check for network/connection errors more comprehensively
      const isNetworkError = 
        error.name === 'TypeError' ||
        error.name === 'NetworkError' ||
        error.message?.toLowerCase().includes('fetch') ||
        error.message?.toLowerCase().includes('network') ||
        error.message?.toLowerCase().includes('connection') ||
        error.message?.toLowerCase().includes('timeout');
      
      if (retryCount < MAX_RETRIES && isNetworkError) {
        toast.info(`Verbinding verloren, opnieuw proberen... (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(r => setTimeout(r, 2000));
        return generateContent(retryCount + 1);
      }
      
      toast.error('Content generatie mislukt. Probeer het opnieuw.');
      setProgress({ 
        progress: 0, 
        message: 'Fout opgetreden', 
        error: error.message || 'Onbekende fout',
        done: true 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    generateContent(0);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const languageOptions = Object.values(LANGUAGES);
  const toneOptions = [
    { value: 'professional', label: 'Professioneel' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Vriendelijk' },
    { value: 'formal', label: 'Formeel' },
    { value: 'enthusiastic', label: 'Enthousiast' },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Content Schrijven
        </h1>
        <p className="text-muted-foreground mt-2">
          Genereer hoogwaardige content in 10 talen met AI
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Instellingen</CardTitle>
          <CardDescription>
            Configureer je content en laat AI het schrijven
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Selector */}
          <div className="space-y-2">
            <Label htmlFor="project">Project (optioneel)</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger id="project">
                <SelectValue placeholder="Selecteer een project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Geen project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Onderwerp *</Label>
            <Input
              id="topic"
              placeholder="Bijv: De voordelen van duurzame energie"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language">Taal</Label>
            <Select value={language} onValueChange={(value) => setLanguage(value as LanguageCode)}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.nativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Word Count */}
          <div className="space-y-2">
            <Label>Aantal woorden: {wordCount}</Label>
            <Slider
              value={[wordCount]}
              onValueChange={(value) => setWordCount(value[0])}
              min={500}
              max={5000}
              step={100}
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Minimaal 500, maximaal 5000 woorden
            </p>
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <Label htmlFor="tone">Schrijfstijl</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords">SEO Keywords (optioneel)</Label>
            <Input
              id="keywords"
              placeholder="Bijv: duurzame energie, zonnepanelen, windmolens"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Komma-gescheiden lijst van keywords
            </p>
          </div>

          {/* Image Count */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeImages"
                checked={includeImages}
                onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
                disabled={isGenerating}
              />
              <Label htmlFor="includeImages" className="cursor-pointer">
                AI-afbeeldingen toevoegen
              </Label>
            </div>
            
            {includeImages && (
              <div className="ml-6 space-y-2">
                <Label>Aantal afbeeldingen: {imageCount}</Label>
                <Slider
                  value={[imageCount]}
                  onValueChange={(value) => setImageCount(value[0])}
                  min={0}
                  max={10}
                  step={1}
                  disabled={isGenerating}
                />
              </div>
            )}
          </div>

          {/* Extra Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeFAQ"
                checked={includeFAQ}
                onCheckedChange={(checked) => setIncludeFAQ(checked as boolean)}
                disabled={isGenerating}
              />
              <Label htmlFor="includeFAQ" className="cursor-pointer">
                FAQ sectie toevoegen
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeYouTube"
                checked={includeYouTube}
                onCheckedChange={(checked) => setIncludeYouTube(checked as boolean)}
                disabled={isGenerating}
              />
              <Label htmlFor="includeYouTube" className="cursor-pointer">
                YouTube video suggesties toevoegen
              </Label>
            </div>
          </div>

          {/* Progress Display */}
          {isGenerating && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{progress.message}</span>
                <span className="text-sm text-muted-foreground">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} />
            </div>
          )}

          {/* Error Display */}
          {progress.error && !isGenerating && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
              <XCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{progress.error}</span>
            </div>
          )}

          {/* Success Display */}
          {generatedContentId && !isGenerating && (
            <div className="flex items-center gap-2 p-4 bg-green-500/10 text-green-600 rounded-lg">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">Content succesvol gegenereerd! Je wordt doorgestuurd...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            {!isGenerating && !generatedContentId && (
              <Button
                onClick={() => generateContent(0)}
                disabled={!topic.trim()}
                className="flex-1"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Content Genereren
              </Button>
            )}

            {isGenerating && (
              <Button disabled className="flex-1" size="lg">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Genereren...
              </Button>
            )}

            {progress.error && !isGenerating && (
              <Button onClick={handleRetry} className="flex-1" size="lg" variant="outline">
                <FileText className="mr-2 h-5 w-5" />
                Opnieuw Proberen
              </Button>
            )}

            {generatedContentId && (
              <Button
                onClick={() => router.push('/client-portal/content-library')}
                className="flex-1"
                size="lg"
              >
                <FileText className="mr-2 h-5 w-5" />
                Naar Content Bibliotheek
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
