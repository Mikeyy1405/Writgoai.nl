'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  Eye,
  Code,
  Send,
  FileText,
  CheckCircle
} from 'lucide-react';

interface WordPressSite {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
}

interface GeneratedContent {
  title: string;
  html: string;
  plainText: string;
  metaDescription: string;
  keywords: string[];
  headings: Array<{ level: number; text: string }>;
  wordCount: number;
  bolProducts: Array<{
    id: string;
    title: string;
    price: number;
    url: string;
  }>;
}

export default function ContentGeneratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [wordPressSites, setWordPressSites] = useState<WordPressSite[]>([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [wordCount, setWordCount] = useState('1500');
  const [includeBolProducts, setIncludeBolProducts] = useState(false);
  const [bolProductQuery, setBolProductQuery] = useState('');
  const [tone, setTone] = useState('professional');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [editedHtml, setEditedHtml] = useState('');
  const [previewMode, setPreviewMode] = useState<'html' | 'preview'>('preview');

  // Publishing state
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadWordPressSites();
    }
  }, [status, router]);

  async function loadWordPressSites() {
    try {
      const response = await fetch('/api/admin/wordpress-sites?active=true');
      if (response.ok) {
        const data = await response.json();
        setWordPressSites(data.sites || []);
      }
    } catch (error) {
      console.error('Failed to load WordPress sites:', error);
    }
  }

  async function handleGenerate() {
    if (!topic) {
      toast.error('Onderwerp is verplicht');
      return;
    }

    setGenerating(true);
    setPublished(false);

    try {
      const response = await fetch('/api/admin/content-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
          wordCount: parseInt(wordCount),
          includeBolProducts,
          bolProductQuery: includeBolProducts ? bolProductQuery : '',
          tone,
          includeHeadings: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data.content);
        setEditedHtml(data.content.html);
        toast.success('Content succesvol gegenereerd!');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Fout bij genereren content');
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
      toast.error('Fout bij genereren content');
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish() {
    if (!selectedSite) {
      toast.error('Selecteer een WordPress site');
      return;
    }

    if (!generatedContent) {
      toast.error('Geen content om te publiceren');
      return;
    }

    setPublishing(true);

    try {
      const response = await fetch('/api/admin/wordpress-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordPressSiteId: selectedSite,
          title: generatedContent.title,
          content: editedHtml,
          status: 'publish',
          keywords: generatedContent.keywords,
          metaDescription: generatedContent.metaDescription,
          focusKeyword: generatedContent.keywords[0] || topic,
          bolProducts: generatedContent.bolProducts
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Content succesvol gepubliceerd naar WordPress!');
        setPublished(true);

        // Open WordPress URL in new tab
        if (data.wordpress.url) {
          window.open(data.wordpress.url, '_blank');
        }
      } else {
        const data = await response.json();
        toast.error(data.error || 'Fout bij publiceren naar WordPress');
      }
    } catch (error) {
      console.error('Failed to publish content:', error);
      toast.error('Fout bij publiceren naar WordPress');
    } finally {
      setPublishing(false);
    }
  }

  function handleSaveDraft() {
    // Save draft to localStorage
    const draft = {
      topic,
      keywords,
      wordCount,
      includeBolProducts,
      bolProductQuery,
      tone,
      generatedContent,
      editedHtml,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('contentGeneratorDraft', JSON.stringify(draft));
    toast.success('Concept opgeslagen');
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-zinc-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/dashboard')}
          className="mb-4 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug naar Dashboard
        </Button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Content Generator</h1>
            <p className="text-gray-300">Genereer SEO-geoptimaliseerde content met AI</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Generation Form */}
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-900 to-purple-900 text-white">
              <CardTitle className="text-xl">Content Instellingen</CardTitle>
              <CardDescription className="text-gray-200">
                Configureer je content generatie
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* WordPress Site Selection */}
              <div className="space-y-2">
                <Label htmlFor="wpSite">WordPress Site</Label>
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger id="wpSite">
                    <SelectValue placeholder="Selecteer een site" />
                  </SelectTrigger>
                  <SelectContent>
                    {wordPressSites.map(site => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name} ({site.url})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {wordPressSites.length === 0 && (
                  <p className="text-xs text-yellow-500">
                    Geen actieve WordPress sites. Voeg eerst een site toe.
                  </p>
                )}
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <Label htmlFor="topic">Onderwerp / Titel *</Label>
                <Input
                  id="topic"
                  placeholder="bijv. Beleggen voor Beginners: Complete Gids 2025"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (komma gescheiden)</Label>
                <Input
                  id="keywords"
                  placeholder="beleggen, aandelen, ETF, dividenden"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>

              {/* Word Count */}
              <div className="space-y-2">
                <Label htmlFor="wordCount">Woordenaantal</Label>
                <Select value={wordCount} onValueChange={setWordCount}>
                  <SelectTrigger id="wordCount">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1000 woorden</SelectItem>
                    <SelectItem value="1500">1500 woorden</SelectItem>
                    <SelectItem value="2000">2000 woorden</SelectItem>
                    <SelectItem value="2500">2500 woorden</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <Label htmlFor="tone">Tone of Voice</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professioneel</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Vriendelijk</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bol.com Products */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="bolProducts"
                    checked={includeBolProducts}
                    onChange={(e) => setIncludeBolProducts(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700"
                  />
                  <Label htmlFor="bolProducts">Bol.com Producten Embedden</Label>
                </div>
                {includeBolProducts && (
                  <Input
                    placeholder="Zoekterm voor producten (bijv. beleggingsboeken)"
                    value={bolProductQuery}
                    onChange={(e) => setBolProductQuery(e.target.value)}
                  />
                )}
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={generating || !topic}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Content Genereren...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Genereer Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Content Info */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Informatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Woordenaantal:</span>
                  <Badge variant="outline">{generatedContent.wordCount} woorden</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Keywords:</span>
                  <Badge variant="outline">{generatedContent.keywords.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Headings:</span>
                  <Badge variant="outline">{generatedContent.headings.length}</Badge>
                </div>
                {generatedContent.bolProducts.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Bol.com Producten:</span>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      {generatedContent.bolProducts.length} producten
                    </Badge>
                  </div>
                )}
                <div className="pt-3 border-t border-zinc-800">
                  <p className="text-sm font-medium text-gray-300 mb-1">Meta Description:</p>
                  <p className="text-xs text-gray-500">{generatedContent.metaDescription}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Preview & Editor */}
        <div className="space-y-6">
          {generatedContent ? (
            <>
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Content Preview & Bewerken</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={previewMode === 'preview' ? 'default' : 'outline'}
                        onClick={() => setPreviewMode('preview')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant={previewMode === 'html' ? 'default' : 'outline'}
                        onClick={() => setPreviewMode('html')}
                      >
                        <Code className="w-4 h-4 mr-1" />
                        HTML
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {previewMode === 'preview' ? (
                    <div
                      className="prose prose-invert max-w-none bg-zinc-800 p-6 rounded-lg overflow-auto max-h-[600px]"
                      dangerouslySetInnerHTML={{ __html: editedHtml }}
                    />
                  ) : (
                    <Textarea
                      value={editedHtml}
                      onChange={(e) => setEditedHtml(e.target.value)}
                      className="font-mono text-sm bg-zinc-800 min-h-[600px]"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Concept Opslaan
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={publishing || !selectedSite || published}
                  className="flex-1 bg-[#FF6B35] hover:bg-[#FF6B35]/90"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 w-4 mr-2 animate-spin" />
                      Publiceren...
                    </>
                  ) : published ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Gepubliceerd
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Publiceer naar WordPress
                    </>
                  )}
                </Button>
              </div>

              {published && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 text-green-800">
                      <CheckCircle className="w-6 h-6" />
                      <div>
                        <p className="font-semibold">Content succesvol gepubliceerd!</p>
                        <p className="text-sm text-green-700">
                          Je content is live op WordPress
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="shadow-lg">
              <CardContent className="pt-12 pb-12 text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
                <p className="text-lg font-medium text-gray-400 mb-2">
                  Nog geen content gegenereerd
                </p>
                <p className="text-sm text-gray-500">
                  Vul het formulier in en klik op "Genereer Content" om te beginnen
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
