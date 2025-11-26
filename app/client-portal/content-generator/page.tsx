
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Loader2,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  ShoppingCart,
  Table,
  Quote,
  List,
  CheckSquare,
  Zap,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import ProjectSelector from '@/components/project-selector';

interface GenerationOptions {
  // Basis
  title: string;
  projectId: string;
  language: string;
  wordCount: number;
  tone: string;
  
  // Content elementen (checkboxes)
  includeImages: boolean;
  includeInternalLinks: boolean;
  includeBolProducts: boolean;
  includeTables: boolean;
  includeQuotes: boolean;
  includeLists: boolean;
  includeFAQ: boolean;
  includeCheckboxes: boolean;
  
  // Extra opties
  keywords: string;
  publishToWordPress: boolean;
}

function ContentGeneratorContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [options, setOptions] = useState<GenerationOptions>({
    title: searchParams.get('title') || '',
    projectId: searchParams.get('projectId') || '',
    language: 'nl',
    wordCount: parseInt(searchParams.get('wordCount') || '1500'),
    tone: 'professioneel',
    includeImages: true,
    includeInternalLinks: true,
    includeBolProducts: false,
    includeTables: false,
    includeQuotes: true,
    includeLists: true,
    includeFAQ: true,
    includeCheckboxes: false,
    keywords: searchParams.get('keywords') || '',
    publishToWordPress: false,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [generatedContentId, setGeneratedContentId] = useState<string | null>(null);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!session) {
    router.push('/inloggen');
    return null;
  }

  const updateOption = <K extends keyof GenerationOptions>(key: K, value: GenerationOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const calculateEstimatedCredits = (): number => {
    let credits = 10; // Base
    if (options.includeImages) credits += 15;
    if (options.includeBolProducts) credits += 5;
    if (options.includeTables) credits += 3;
    if (options.wordCount > 2000) credits += 5;
    return credits;
  };

  const handleGenerate = async () => {
    if (!options.projectId || !options.title) {
      toast.error('Vul alle verplichte velden in');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressMessage('Content wordt gegenereerd...');
    setGeneratedContentId(null);

    try {
      const response = await fetch('/api/client/content-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Geen response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.progress !== undefined) {
              setProgress(data.progress);
              if (data.message) setProgressMessage(data.message);
            }
            
            if (data.contentId) {
              setGeneratedContentId(data.contentId);
              toast.success('✅ Content succesvol gegenereerd!');
              
              // Redirect naar content library
              setTimeout(() => {
                window.location.href = `/client-portal/content-library-new/${data.contentId}/edit`;
              }, 1500);
            }
            
            if (data.error) {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Generatie error:', error);
      toast.error(error.message || 'Er ging iets mis bij het genereren');
      setProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Content Generator
              </h1>
              <p className="text-gray-400 mt-1">
                Genereer content met alle opties die je nodig hebt
              </p>
            </div>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Generatie Opties</CardTitle>
            <CardDescription className="text-gray-400">
              Configureer je content met alle gewenste elementen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basis Informatie */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Basis Informatie
              </h3>
              
              <div>
                <Label className="text-white">Project *</Label>
                <ProjectSelector
                  value={options.projectId}
                  onChange={(id) => updateOption('projectId', id || '')}
                  autoSelectPrimary={true}
                />
              </div>

              <div>
                <Label className="text-white">Titel *</Label>
                <Input
                  value={options.title}
                  onChange={(e) => updateOption('title', e.target.value)}
                  placeholder="De 10 beste yoga oefeningen voor beginners"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Taal</Label>
                  <Select value={options.language} onValueChange={(value) => updateOption('language', value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="nl" className="text-white">🇳🇱 Nederlands</SelectItem>
                      <SelectItem value="en" className="text-white">🇬🇧 Engels</SelectItem>
                      <SelectItem value="de" className="text-white">🇩🇪 Duits</SelectItem>
                      <SelectItem value="fr" className="text-white">🇫🇷 Frans</SelectItem>
                      <SelectItem value="es" className="text-white">🇪🇸 Spaans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Aantal woorden</Label>
                  <Input
                    type="number"
                    value={options.wordCount}
                    onChange={(e) => updateOption('wordCount', parseInt(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white"
                    min={500}
                    max={3000}
                    step={100}
                  />
                </div>
              </div>

              <div>
                <Label className="text-white">Tone of Voice</Label>
                <Select value={options.tone} onValueChange={(value) => updateOption('tone', value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="professioneel" className="text-white">Professioneel</SelectItem>
                    <SelectItem value="vriendelijk" className="text-white">Vriendelijk</SelectItem>
                    <SelectItem value="informeel" className="text-white">Informeel</SelectItem>
                    <SelectItem value="zakelijk" className="text-white">Zakelijk</SelectItem>
                    <SelectItem value="grappig" className="text-white">Grappig</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Keywords (optioneel)</Label>
                <Input
                  value={options.keywords}
                  onChange={(e) => updateOption('keywords', e.target.value)}
                  placeholder="yoga, beginners, flexibiliteit"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Content Elementen */}
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                Content Elementen
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Afbeeldingen */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-5 h-5 text-orange-500" />
                    <div>
                      <Label htmlFor="images" className="text-white block cursor-pointer">Afbeeldingen</Label>
                      <p className="text-sm text-gray-400">AI-gegenereerde afbeeldingen</p>
                    </div>
                  </div>
                  <Switch
                    id="images"
                    checked={options.includeImages}
                    onCheckedChange={(checked) => updateOption('includeImages', checked)}
                  />
                </div>

                {/* Interne Links */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <LinkIcon className="w-5 h-5 text-orange-500" />
                    <div>
                      <Label htmlFor="links" className="text-white block cursor-pointer">Interne Links</Label>
                      <p className="text-sm text-gray-400">Automatisch relevante links</p>
                    </div>
                  </div>
                  <Switch
                    id="links"
                    checked={options.includeInternalLinks}
                    onCheckedChange={(checked) => updateOption('includeInternalLinks', checked)}
                  />
                </div>

                {/* Bol.com Producten */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-orange-500" />
                    <div>
                      <Label htmlFor="bol" className="text-white block cursor-pointer">Bol.com Producten</Label>
                      <p className="text-sm text-gray-400">Affiliate product links</p>
                    </div>
                  </div>
                  <Switch
                    id="bol"
                    checked={options.includeBolProducts}
                    onCheckedChange={(checked) => updateOption('includeBolProducts', checked)}
                  />
                </div>

                {/* Tabellen */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <Table className="w-5 h-5 text-orange-500" />
                    <div>
                      <Label htmlFor="tables" className="text-white block cursor-pointer">Tabellen</Label>
                      <p className="text-sm text-gray-400">Data overzichten</p>
                    </div>
                  </div>
                  <Switch
                    id="tables"
                    checked={options.includeTables}
                    onCheckedChange={(checked) => updateOption('includeTables', checked)}
                  />
                </div>

                {/* Quotes */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <Quote className="w-5 h-5 text-orange-500" />
                    <div>
                      <Label htmlFor="quotes" className="text-white block cursor-pointer">Quotes</Label>
                      <p className="text-sm text-gray-400">Inspirerende citaten</p>
                    </div>
                  </div>
                  <Switch
                    id="quotes"
                    checked={options.includeQuotes}
                    onCheckedChange={(checked) => updateOption('includeQuotes', checked)}
                  />
                </div>

                {/* Lijsten */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <List className="w-5 h-5 text-orange-500" />
                    <div>
                      <Label htmlFor="lists" className="text-white block cursor-pointer">Lijsten</Label>
                      <p className="text-sm text-gray-400">Genummerde & bullet lists</p>
                    </div>
                  </div>
                  <Switch
                    id="lists"
                    checked={options.includeLists}
                    onCheckedChange={(checked) => updateOption('includeLists', checked)}
                  />
                </div>

                {/* FAQ */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-orange-500" />
                    <div>
                      <Label htmlFor="faq" className="text-white block cursor-pointer">FAQ Sectie</Label>
                      <p className="text-sm text-gray-400">Veelgestelde vragen</p>
                    </div>
                  </div>
                  <Switch
                    id="faq"
                    checked={options.includeFAQ}
                    onCheckedChange={(checked) => updateOption('includeFAQ', checked)}
                  />
                </div>

                {/* Checkboxes/Steps */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-orange-500" />
                    <div>
                      <Label htmlFor="checkboxes" className="text-white block cursor-pointer">Stappen/Checklists</Label>
                      <p className="text-sm text-gray-400">Actionable steps</p>
                    </div>
                  </div>
                  <Switch
                    id="checkboxes"
                    checked={options.includeCheckboxes}
                    onCheckedChange={(checked) => updateOption('includeCheckboxes', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Publishing */}
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                  <Label htmlFor="wordpress" className="text-white block cursor-pointer">Direct publiceren naar WordPress</Label>
                  <p className="text-sm text-gray-400">Content wordt automatisch geplaatst</p>
                </div>
                <Switch
                  id="wordpress"
                  checked={options.publishToWordPress}
                  onCheckedChange={(checked) => updateOption('publishToWordPress', checked)}
                />
              </div>
            </div>

            {/* Cost Estimate */}
            <div className="p-4 bg-blue-950/30 border border-blue-900/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-300">Geschatte credits:</span>
                <Badge className="bg-blue-900/50 text-blue-300 text-lg">
                  ~{calculateEstimatedCredits()} credits
                </Badge>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !options.projectId || !options.title}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Genereren...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Genereer Content
                </>
              )}
            </Button>

            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-gray-400 text-center">{progressMessage}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ContentGeneratorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    }>
      <ContentGeneratorContent />
    </Suspense>
  );
}
