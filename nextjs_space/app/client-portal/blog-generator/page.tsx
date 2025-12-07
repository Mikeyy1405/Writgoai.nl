'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  FileText, 
  Loader2, 
  Sparkles,
  Target,
  PenTool,
  BarChart3,
  ArrowLeft,
  ShoppingBag,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ListOrdered,
  Wand2,
  Edit3,
  Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import BlogCanvas from '@/components/blog-canvas';
import ProjectSelector, { Project } from '@/components/project-selector';
import BolcomProductSelector, { SelectedProduct } from '@/components/bolcom-product-selector';
import Link from 'next/link';

// Outline interface
interface OutlineItem {
  id: string;
  heading: string;
  subheadings: string[];
}

export default function BlogGenerator() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Form state - Basis
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [wordCount, setWordCount] = useState('1500');
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('nl');
  const [contentType, setContentType] = useState('informatief');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sitemapUrl, setSitemapUrl] = useState(''); // Voor interne links zonder project
  
  // 📍 TOPICAL MAP & WORDPRESS
  const [contentSource, setContentSource] = useState<'manual' | 'topical-map'>('manual');
  const [topicalTopicId, setTopicalTopicId] = useState<string | null>(null);
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [publishToWordPress, setPublishToWordPress] = useState(false);
  
  // 📋 OUTLINE STATE
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [showOutlineSection, setShowOutlineSection] = useState(false);
  
  // 🛒 AFFILIATE PRODUCTEN
  const [affiliatePlatform, setAffiliatePlatform] = useState<'bolcom' | 'custom' | 'none'>('none');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [customAffiliateLinks, setCustomAffiliateLinks] = useState<Array<{ name: string; url: string }>>([{ name: '', url: '' }]);
  const [linkDisplayType, setLinkDisplayType] = useState<'inline' | 'product-box' | 'cta-box' | 'button' | 'ai-mix'>('product-box');
  
  // ✨ SEO OPTIES
  const [seoOptimized, setSeoOptimized] = useState(true);
  const [includeYouTube, setIncludeYouTube] = useState(false);
  const [includeFAQ, setIncludeFAQ] = useState(false);
  const [includeDirectAnswer, setIncludeDirectAnswer] = useState(true);
  const [generateFeaturedImage, setGenerateFeaturedImage] = useState(true);
  const [includeImage, setIncludeImage] = useState(true);
  const [imageCount, setImageCount] = useState('2'); // Aantal afbeeldingen (0-5)
  const [imageStyle, setImageStyle] = useState('realistic');
  const [includeQuotes, setIncludeQuotes] = useState(true); // Blockquotes toevoegen
  const [includeTables, setIncludeTables] = useState(true); // Tabellen toevoegen
  
  // Generated content
  const [generatedArticle, setGeneratedArticle] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [seoMetadata, setSeoMetadata] = useState<any>(null);
  const [featuredImage, setFeaturedImage] = useState<string>('');
  const [socialMediaPost, setSocialMediaPost] = useState<any>(null);
  
  // Collapsible states - SEO and Products open by default for better visibility
  const [basicOpen, setBasicOpen] = useState(true);
  const [seoOpen, setSeoOpen] = useState(true);
  const [productsOpen, setProductsOpen] = useState(true);
  
  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch('/api/client/projects');
        const data = await res.json();
        if (data.projects) {
          setProjects(data.projects);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  }, []);

  // 📥 Lees URL parameters in vanuit content plan
  useEffect(() => {
    if (searchParams) {
      const from = searchParams.get('from');
      const title = searchParams.get('title');
      const keyword = searchParams.get('keyword');
      const keywordsParam = searchParams.get('keywords');
      const contentTypeParam = searchParams.get('contentType');
      const typeParam = searchParams.get('type');
      const priorityParam = searchParams.get('priority');
      const searchIntent = searchParams.get('searchIntent');
      const wordCountParam = searchParams.get('wordCount');
      const languageParam = searchParams.get('language');
      const projectParam = searchParams.get('project');
      const projectIdParam = searchParams.get('projectId');
      
      // Als er parameters zijn, vul de velden in (vanuit content research of topical mapping)
      if (from === 'research' || title || keywordsParam || projectIdParam) {
        // Vul alle velden in
        if (title) {
          setTopic(title);
          console.log('✅ Titel ingevuld:', title);
        }
        
        if (keyword || keywordsParam) {
          // Combineer focus keyword met secondary keywords
          const allKeywords = keyword && keywordsParam 
            ? `${keyword}, ${keywordsParam}` 
            : keywordsParam || keyword || '';
          setKeywords(allKeywords);
          console.log('✅ Keywords ingevuld:', allKeywords);
        }
        
        if (contentTypeParam) {
          setTone(contentTypeParam === 'commercial' ? 'commercial' : 'professional');
          console.log('✅ Tone ingesteld:', contentTypeParam);
        } else if (typeParam) {
          // Voor topical mapping: 'commercial' of 'informational'
          setTone(typeParam === 'commercial' ? 'commercial' : 'professional');
          console.log('✅ Tone ingesteld vanuit topical mapping:', typeParam);
        }
        
        if (wordCountParam) {
          setWordCount(wordCountParam);
          console.log('✅ Woordenaantal ingesteld:', wordCountParam);
        }
        
        if (languageParam) {
          setLanguage(languageParam);
          console.log('✅ Taal ingesteld:', languageParam);
        }
        
        // Project ID invullen (beide parameters ondersteunen)
        if (projectParam || projectIdParam) {
          setProjectId(projectParam || projectIdParam || '');
          console.log('✅ Project ingesteld:', projectParam || projectIdParam);
        }
        
        // Toon success toast
        const source = from === 'research' ? 'je content plan' : 'topical mapping';
        toast.success(`✅ Alle velden zijn automatisch ingevuld vanuit ${source}!`, {
          duration: 4000,
        });
      }
    }
  }, [searchParams]);

  const handleProjectChange = (value: string | null, project: Project | null) => {
    setProjectId(value);
    setSelectedProject(project);
    // Clear sitemap URL when project is selected
    if (value) {
      setSitemapUrl('');
    }
  };

  // 📝 OUTLINE FUNCTIONS
  const generateOutline = async () => {
    if (!topic.trim()) {
      toast.error('Voer eerst een onderwerp in');
      return;
    }

    setOutlineLoading(true);
    
    try {
      const response = await fetch('/api/ai/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          language,
          tone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error(`Niet genoeg credits. Je hebt ${data.available} credits, maar ${data.required} credits zijn nodig.`);
        }
        throw new Error(data.error || 'Outline generatie mislukt');
      }
      
      if (data.outline && Array.isArray(data.outline)) {
        const transformedOutline: OutlineItem[] = data.outline.map((item: any, index: number) => ({
          id: `outline-${Date.now()}-${index}`,
          heading: item.heading || item.title || '',
          subheadings: item.subheadings || item.subtopics || [],
        }));
        
        setOutline(transformedOutline);
        toast.success(`✅ Outline gegenereerd! (${data.creditsUsed} credits gebruikt)`);
      } else {
        throw new Error('Ongeldig outline formaat');
      }
    } catch (error: any) {
      console.error('Outline generatie error:', error);
      toast.error(error.message || 'Kon outline niet genereren');
    } finally {
      setOutlineLoading(false);
    }
  };

  // Add heading to outline
  const addHeading = () => {
    const newHeading: OutlineItem = {
      id: `outline-${Date.now()}`,
      heading: '',
      subheadings: [],
    };
    setOutline([...outline, newHeading]);
  };

  // Update heading
  const updateHeading = (id: string, value: string) => {
    setOutline(outline.map(item => 
      item.id === id ? { ...item, heading: value } : item
    ));
  };

  // Add subheading
  const addSubheading = (headingId: string) => {
    setOutline(outline.map(item => 
      item.id === headingId 
        ? { ...item, subheadings: [...item.subheadings, ''] }
        : item
    ));
  };

  // Update subheading
  const updateSubheading = (headingId: string, index: number, value: string) => {
    setOutline(outline.map(item => 
      item.id === headingId 
        ? { 
            ...item, 
            subheadings: item.subheadings.map((sub, i) => i === index ? value : sub)
          }
        : item
    ));
  };

  // Remove heading
  const removeHeading = (id: string) => {
    setOutline(outline.filter(item => item.id !== id));
  };

  // Remove subheading
  const removeSubheading = (headingId: string, index: number) => {
    setOutline(outline.map(item => 
      item.id === headingId 
        ? { 
            ...item, 
            subheadings: item.subheadings.filter((_, i) => i !== index)
          }
        : item
    ));
  };

  // 🖼️ FEATURED IMAGE REFRESH
  const [refreshingImage, setRefreshingImage] = useState(false);
  
  const refreshFeaturedImage = async () => {
    if (!topic.trim()) {
      toast.error('Voer eerst een onderwerp in');
      return;
    }

    setRefreshingImage(true);
    try {
      const response = await fetch('/api/ai/generate-featured-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          style: imageStyle,
        }),
      });

      if (!response.ok) {
        throw new Error('Afbeelding generatie mislukt');
      }

      const data = await response.json();
      
      if (data.imageUrl) {
        setFeaturedImage(data.imageUrl);
        toast.success('Nieuwe uitgelichte afbeelding gegenereerd!');
      } else {
        throw new Error('Geen afbeeldings-URL ontvangen');
      }
    } catch (error: any) {
      console.error('Featured image refresh error:', error);
      toast.error(error.message || 'Kon afbeelding niet vernieuwen');
    } finally {
      setRefreshingImage(false);
    }
  };

  // 🚀 GENERATE CONTENT
  const generateContent = async () => {
    if (!topic.trim()) {
      toast.error('Voer een onderwerp in');
      return;
    }

    setLoading(true);
    setProgress(0);
    setStatusMessage('🚀 Content generatie starten...');

    try {
      const response = await fetch('/api/client/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          wordCount: parseInt(wordCount),
          tone,
          language,
          articleStyle: contentType, // Dit is de nieuwe content type selector
          seoOptimized,
          includeImage,
          imageCount: parseInt(imageCount),
          imageStyle,
          projectId: projectId || undefined,
          sitemapUrl: sitemapUrl.trim() || undefined, // Website URL voor interne links
          
          // Affiliate producten
          products: affiliatePlatform === 'bolcom' 
            ? selectedProducts.map(p => ({
                name: p.title,
                url: p.affiliateUrl,
                price: p.price ? `€${p.price.toFixed(2)}` : undefined,
                rating: p.rating ? `${p.rating.toFixed(1)}/5` : undefined,
                description: p.notes || undefined,
                imageUrl: p.image || undefined,
              }))
            : affiliatePlatform === 'custom'
            ? customAffiliateLinks
                .filter(link => link.name && link.url)
                .map(link => ({
                  name: link.name,
                  url: link.url,
                }))
            : [],
          
          linkDisplayType,
          
          // SEO opties
          includeYouTube,
          includeFAQ,
          includeDirectAnswer,
          generateFeaturedImage,
          includeQuotes,
          includeTables,
          
          // Outline (optioneel)
          outline: outline.length > 0 ? outline : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Fout bij het genereren van content');
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalDataReceived = false;

      if (!reader) {
        throw new Error('Geen response stream');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
        }
        
        const lines = buffer.split('\n');
        
        if (!done) {
          buffer = lines.pop() || '';
        } else {
          buffer = '';
        }
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            
            if (data.status === 'error' || data.error) {
              throw new Error(data.error || 'Fout bij het genereren van content');
            }
            
            if (typeof data.progress === 'number') {
              setProgress(data.progress);
            }
            
            if (data.status && typeof data.status === 'string') {
              setStatusMessage(data.status);
            }
            
            if ((data.status === 'complete' || data.success === true || data.done === true) && data.content && !finalDataReceived) {
              finalDataReceived = true;
              
              console.log('[BlogGen] ✅ Generation complete!', {
                title: data.title,
                hasContent: !!data.content,
                contentLength: data.content?.length,
                done: data.done,
                contentId: data.contentId,
                redirectUrl: data.redirectUrl,
              });
              
              const title = data.title || topic;
              const content = data.content || '';
              
              if (content && content.length > 0) {
                setProgress(100);
                setStatusMessage('✅ Content gereed!');
                setLoading(false);
                
                toast.success(`Content succesvol gegenereerd! (${data.creditsUsed || 50} credits gebruikt)`);
                
                // ✅ REDIRECT TO LIBRARY INSTEAD OF SHOWING BLOGCANVAS
                if (data.contentId && data.redirectUrl) {
                  console.log('[BlogGen] Redirecting to library:', data.redirectUrl);
                  setTimeout(() => {
                    router.push(data.redirectUrl);
                  }, 1500);
                } else {
                  // Fallback: show BlogCanvas if no contentId (shouldn't happen normally)
                  console.log('[BlogGen] No contentId, showing BlogCanvas as fallback');
                  setArticleTitle(title);
                  setSeoMetadata(data.seoMetadata || null);
                  setFeaturedImage(data.featuredImage || '');
                  setSocialMediaPost(data.socialMediaPost || null);
                  setGeneratedArticle(content);
                }
                
                return;
              } else {
                throw new Error('Geen content ontvangen');
              }
            }
          } catch (e: any) {
            if (e instanceof SyntaxError) {
              continue;
            }
            throw e;
          }
        }
        
        if (done) break;
      }
    } catch (error: any) {
      console.error('Content generation error:', error);
      toast.error(error.message || 'Kon content niet genereren');
      setLoading(false);
      setProgress(0);
      setStatusMessage('');
    }
  };

  // Custom affiliate link handlers
  const addCustomLink = () => {
    setCustomAffiliateLinks([...customAffiliateLinks, { name: '', url: '' }]);
  };

  const updateCustomLink = (index: number, field: 'name' | 'url', value: string) => {
    const updated = [...customAffiliateLinks];
    updated[index][field] = value;
    setCustomAffiliateLinks(updated);
  };

  const removeCustomLink = (index: number) => {
    setCustomAffiliateLinks(customAffiliateLinks.filter((_, i) => i !== index));
  };

  // Show editor if content is generated
  if (generatedArticle && !loading) {
    return (
      <BlogCanvas
        content={generatedArticle}
        isGenerating={false}
        topic={articleTitle}
        seoMetadata={seoMetadata}
        featuredImage={featuredImage}
        socialMediaPost={socialMediaPost}
        onRefreshFeaturedImage={refreshFeaturedImage}
        refreshingImage={refreshingImage}
        projectId={projectId}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-black">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/client-portal">
            <Button variant="ghost" className="mb-4 text-gray-400 hover:text-white hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar overzicht
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-[#ff6b35] to-[#ff8c42]">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                🤖 Writgo AI Writer
              </h1>
              <p className="text-lg mt-1 text-gray-400">
                Vereenvoudigde content generator
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-[#ff6b35]/10 to-orange-800/10 border border-[#ff6b35]/30 rounded-lg">
              <Sparkles className="w-5 h-5 text-[#ff6b35] animate-pulse" />
              <div className="flex-1">
                <span className="text-sm text-orange-100 font-medium block">
                  Intelligente content detectie
                </span>
                <span className="text-xs text-gray-400 block mt-0.5">
                  Detecteert automatisch: Blog, Review, Top Lijst, How-to, Vergelijking
                </span>
              </div>
              <Badge variant="outline" className="border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10">
                Claude 4.5 Sonnet
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {progress > 0 && (
          <div className="mb-6 rounded-lg p-4 shadow-md bg-zinc-900 border border-zinc-800">
            <Progress value={progress} className="h-3 bg-zinc-700">
              <div 
                className="h-full transition-all duration-500 bg-gradient-to-r from-[#ff6b35] to-[#ff8c42]"
                style={{ width: `${progress}%` }}
              />
            </Progress>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-200">
                {statusMessage || 'Content genereren...'}
              </p>
              <Badge variant="outline" className="border-[#ff6b35] text-[#ff6b35] bg-zinc-900">
                {progress}%
              </Badge>
            </div>
          </div>
        )}

        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings2 className="w-5 h-5 text-[#ff6b35]" />
              Content Instellingen
            </CardTitle>
            <CardDescription className="text-gray-300">
              Vul de basis instellingen in en klik op genereren
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6 overflow-y-auto max-h-[calc(100vh-300px)]">
            {/* SECTIE 1: BASIS INSTELLINGEN */}
            <Collapsible open={basicOpen} onOpenChange={setBasicOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#ff6b35]" />
                    <h3 className="text-lg font-semibold text-white">Basis Instellingen</h3>
                  </div>
                  {basicOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 mt-4">
                {/* Topic */}
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-white font-semibold">
                    Onderwerp *
                  </Label>
                  <Textarea
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Bijvoorbeeld: De beste yoga oefeningen voor beginners"
                    rows={3}
                    className="border-zinc-700 focus:border-[#ff6b35] bg-zinc-900 text-white"
                  />
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <Label htmlFor="keywords" className="text-white font-semibold">
                    Keywords (optioneel)
                  </Label>
                  <Input
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="yoga, beginners, oefeningen"
                    className="border-zinc-700 focus:border-[#ff6b35] bg-zinc-900 text-white"
                  />
                </div>

                {/* Content Type - PROMINENTER GEMAAKT */}
                <div className="space-y-3 p-4 bg-gradient-to-br from-[#ff6b35]/10 to-orange-800/10 border border-[#ff6b35]/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#ff6b35]" />
                    <Label className="text-white font-bold text-base">Soort Content *</Label>
                  </div>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger className="border-[#ff6b35] bg-zinc-900 text-white h-12 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 z-[9999]">
                      <SelectItem value="informatief" className="text-white hover:bg-zinc-800 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📝</span>
                          <span className="font-medium">Informatief Artikel</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="lijstje" className="text-white hover:bg-zinc-800 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📋</span>
                          <span className="font-medium">Top Lijst / Lijstje</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="howto" className="text-white hover:bg-zinc-800 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎯</span>
                          <span className="font-medium">How-to / Tutorial</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="review-enkel" className="text-white hover:bg-zinc-800 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⭐</span>
                          <span className="font-medium">Product Review (enkel)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="beste-lijst" className="text-white hover:bg-zinc-800 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏆</span>
                          <span className="font-medium">Beste Producten Lijst + Bol.com</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="vergelijking" className="text-white hover:bg-zinc-800 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⚖️</span>
                          <span className="font-medium">Vergelijking (A vs B)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="nieuws" className="text-white hover:bg-zinc-800 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📰</span>
                          <span className="font-medium">Nieuwsartikel</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gids" className="text-white hover:bg-zinc-800 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📚</span>
                          <span className="font-medium">Uitgebreide Gids</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="mening" className="text-white hover:bg-zinc-800 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💭</span>
                          <span className="font-medium">Mening / Opinion</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="bg-zinc-900 p-3 rounded-lg">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {contentType === 'informatief' && '📝 Algemene informatie over een onderwerp - ideaal voor educatieve content'}
                      {contentType === 'lijstje' && '📋 Top 10, beste tips, checklist - perfect voor quick wins en engagement'}
                      {contentType === 'howto' && '🎯 Stap-voor-stap handleiding - praktisch en actionable voor lezers'}
                      {contentType === 'review-enkel' && '⭐ Review van één specifiek product - diepgaand met voor- en nadelen'}
                      {contentType === 'beste-lijst' && '🏆 Vergelijk meerdere producten met Bol.com affiliate links - ideaal voor conversie'}
                      {contentType === 'vergelijking' && '⚖️ Vergelijk twee of meer opties - help lezers kiezen'}
                      {contentType === 'nieuws' && '📰 Actueel nieuwsbericht of update - timely en relevant'}
                      {contentType === 'gids' && '📚 Uitgebreide gids met meerdere hoofdstukken - uitgebreide informatiebron'}
                      {contentType === 'mening' && '💭 Persoonlijke mening of standpunt - thought leadership'}
                    </p>
                  </div>
                </div>

                {/* Language + Tone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white font-semibold">Taal</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="border-zinc-700 bg-zinc-900 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 z-[9999]">
                        <SelectItem value="nl" className="text-white hover:bg-zinc-800">🇳🇱 Nederlands</SelectItem>
                        <SelectItem value="en" className="text-white hover:bg-zinc-800">🇺🇸 English</SelectItem>
                        <SelectItem value="de" className="text-white hover:bg-zinc-800">🇩🇪 Deutsch</SelectItem>
                        <SelectItem value="fr" className="text-white hover:bg-zinc-800">🇫🇷 Français</SelectItem>
                        <SelectItem value="es" className="text-white hover:bg-zinc-800">🇪🇸 Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-semibold">Toon</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="border-zinc-700 bg-zinc-900 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 z-[9999]">
                        <SelectItem value="professional" className="text-white hover:bg-zinc-800">Professioneel</SelectItem>
                        <SelectItem value="casual" className="text-white hover:bg-zinc-800">Casual</SelectItem>
                        <SelectItem value="expert" className="text-white hover:bg-zinc-800">Expert</SelectItem>
                        <SelectItem value="friendly" className="text-white hover:bg-zinc-800">Vriendelijk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Word Count */}
                <div className="space-y-2">
                  <Label htmlFor="wordCount" className="text-white font-semibold">
                    Gewenst Woordaantal
                  </Label>
                  <Input
                    id="wordCount"
                    type="number"
                    min="300"
                    max="5000"
                    step="50"
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value)}
                    placeholder="Bijvoorbeeld: 750, 1200, 1800"
                    className="border-zinc-700 focus:border-[#ff6b35] bg-zinc-900 text-white"
                  />
                  <p className="text-xs text-gray-400">
                    Voer het gewenste woordaantal in (bijv. 600, 750, 1200). Het artikel zal rond dit aantal geschreven worden.
                  </p>
                </div>

                {/* Project */}
                <div className="space-y-2">
                  <Label className="text-white font-semibold">
                    Project (optioneel)
                  </Label>
                  <ProjectSelector
                    value={projectId}
                    onChange={handleProjectChange}
                    autoSelectPrimary={false}
                    showKnowledgeBase={true}
                  />
                  <p className="text-xs text-gray-400">
                    Koppel aan een project voor tone-of-voice en interne links
                  </p>
                </div>

                {/* Sitemap URL - voor werken zonder project */}
                {!projectId && (
                  <div className="space-y-2">
                    <Label htmlFor="sitemapUrl" className="text-white font-semibold">
                      Website URL voor Interne Links (optioneel)
                    </Label>
                    <Input
                      id="sitemapUrl"
                      value={sitemapUrl}
                      onChange={(e) => setSitemapUrl(e.target.value)}
                      placeholder="https://jouwwebsite.nl"
                      className="border-zinc-700 focus:border-[#ff6b35] bg-zinc-900 text-white"
                    />
                    <p className="text-xs text-gray-400">
                      Vul een URL in om de sitemap te laden voor interne links (zonder project)
                    </p>
                  </div>
                )}

                {/* Direct Publiceren naar WordPress - NIEUW EN PROMINENT */}
                {projectId && (
                  <div className="space-y-3 p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <Globe className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <Label className="text-white font-bold text-base block">Direct Publiceren naar WordPress</Label>
                          <p className="text-xs text-gray-400 mt-1">
                            Publiceer automatisch naar je WordPress website na genereren
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={publishToWordPress}
                        onCheckedChange={setPublishToWordPress}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>
                    {publishToWordPress && (
                      <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-300">
                          Artikel wordt direct gepubliceerd na generatie
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* SECTIE 2: OUTLINE (optioneel) */}
            <Collapsible open={showOutlineSection} onOpenChange={setShowOutlineSection}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-[#ff6b35]" />
                    <h3 className="text-lg font-semibold text-white">Outline (optioneel)</h3>
                    {outline.length > 0 && (
                      <Badge variant="outline" className="border-green-500 text-green-400">
                        {outline.length} hoofdstukken
                      </Badge>
                    )}
                  </div>
                  {showOutlineSection ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Button
                    onClick={generateOutline}
                    disabled={outlineLoading || !topic.trim()}
                    className="flex-1 bg-[#ff6b35] hover:bg-[#ff8c42] text-white"
                  >
                    {outlineLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Genereren...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Genereer Outline
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={addHeading}
                    variant="outline"
                    className="border-zinc-700 text-white hover:bg-zinc-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Handmatig Toevoegen
                  </Button>
                </div>

                {/* Outline Editor */}
                {outline.length > 0 && (
                  <div className="space-y-3 p-4 bg-zinc-800/50 rounded-lg">
                    {outline.map((item, index) => (
                      <div key={item.id} className="space-y-2 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                        <div className="flex items-center gap-2">
                          <span className="text-[#ff6b35] font-semibold">H{index + 2}</span>
                          <Input
                            value={item.heading}
                            onChange={(e) => updateHeading(item.id, e.target.value)}
                            placeholder="Hoofdstuk titel..."
                            className="flex-1 border-zinc-700 bg-zinc-900 text-white"
                          />
                          <Button
                            onClick={() => addSubheading(item.id)}
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-white"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => removeHeading(item.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Subheadings */}
                        {item.subheadings.length > 0 && (
                          <div className="ml-8 space-y-2">
                            {item.subheadings.map((sub, subIndex) => (
                              <div key={subIndex} className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm">H{index + 3}</span>
                                <Input
                                  value={sub}
                                  onChange={(e) => updateSubheading(item.id, subIndex, e.target.value)}
                                  placeholder="Subheading..."
                                  className="flex-1 border-zinc-700 bg-zinc-900 text-white text-sm"
                                />
                                <Button
                                  onClick={() => removeSubheading(item.id, subIndex)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* SECTIE 3: SEO OPTIES */}
            <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#ff6b35]" />
                    <h3 className="text-lg font-semibold text-white">SEO Opties</h3>
                  </div>
                  {seoOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                    <Label className="text-white">SEO Optimalisatie</Label>
                    <Switch
                      checked={seoOptimized}
                      onCheckedChange={setSeoOptimized}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                    <Label className="text-white">FAQ Sectie</Label>
                    <Switch
                      checked={includeFAQ}
                      onCheckedChange={setIncludeFAQ}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                    <Label className="text-white">Direct Antwoord</Label>
                    <Switch
                      checked={includeDirectAnswer}
                      onCheckedChange={setIncludeDirectAnswer}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                    <Label className="text-white">YouTube Video</Label>
                    <Switch
                      checked={includeYouTube}
                      onCheckedChange={setIncludeYouTube}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                    <Label className="text-white">Blockquotes (Citaten)</Label>
                    <Switch
                      checked={includeQuotes}
                      onCheckedChange={setIncludeQuotes}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                    <Label className="text-white">Tabellen</Label>
                    <Switch
                      checked={includeTables}
                      onCheckedChange={setIncludeTables}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                    <Label className="text-white">Uitgelichte Afbeelding</Label>
                    <Switch
                      checked={generateFeaturedImage}
                      onCheckedChange={setGenerateFeaturedImage}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                    <Label className="text-white">Mid-text Afbeeldingen</Label>
                    <Switch
                      checked={includeImage}
                      onCheckedChange={setIncludeImage}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </div>

                {/* Afbeelding configuratie (alleen als includeImage enabled is) */}
                {includeImage && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-white font-semibold">🖼️ Aantal Afbeeldingen</Label>
                      <Select value={imageCount} onValueChange={setImageCount}>
                        <SelectTrigger className="border-zinc-700 bg-zinc-900 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 z-[9999]">
                          <SelectItem value="0" className="text-white hover:bg-zinc-800">Geen afbeeldingen</SelectItem>
                          <SelectItem value="1" className="text-white hover:bg-zinc-800">1 afbeelding</SelectItem>
                          <SelectItem value="2" className="text-white hover:bg-zinc-800">2 afbeeldingen ⭐</SelectItem>
                          <SelectItem value="3" className="text-white hover:bg-zinc-800">3 afbeeldingen</SelectItem>
                          <SelectItem value="4" className="text-white hover:bg-zinc-800">4 afbeeldingen</SelectItem>
                          <SelectItem value="5" className="text-white hover:bg-zinc-800">5 afbeeldingen</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400">
                        Meer afbeeldingen = hogere kosten. 2 afbeeldingen is optimaal voor SEO.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white font-semibold">🎨 Afbeelding Stijl</Label>
                      <Select value={imageStyle} onValueChange={setImageStyle}>
                        <SelectTrigger className="border-zinc-700 bg-zinc-900 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 z-[9999]">
                          <SelectItem value="realistic" className="text-white hover:bg-zinc-800">📸 Realistisch (Fotografie) ⭐</SelectItem>
                          <SelectItem value="illustration" className="text-white hover:bg-zinc-800">🎨 Illustratie</SelectItem>
                          <SelectItem value="minimalist" className="text-white hover:bg-zinc-800">✨ Minimalistisch</SelectItem>
                          <SelectItem value="modern" className="text-white hover:bg-zinc-800">🏙️ Modern</SelectItem>
                          <SelectItem value="professional" className="text-white hover:bg-zinc-800">💼 Professioneel</SelectItem>
                          <SelectItem value="creative" className="text-white hover:bg-zinc-800">🌈 Creatief</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400">
                        Stijl die past bij jouw merk en content
                      </p>
                    </div>
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* SECTIE 4: AFFILIATE PRODUCTEN - VERBETERD */}
            <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-gradient-to-br from-[#ff6b35]/10 to-orange-800/10 border border-[#ff6b35]/30 rounded-lg hover:bg-[#ff6b35]/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#ff6b35]/20 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-[#ff6b35]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Affiliate Producten & Links</h3>
                      <p className="text-xs text-gray-400">Voeg Bol.com producten of eigen affiliate links toe</p>
                    </div>
                    {selectedProducts.length > 0 && (
                      <Badge variant="outline" className="border-green-500 text-green-400 ml-2">
                        {selectedProducts.length} producten
                      </Badge>
                    )}
                  </div>
                  {productsOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 mt-4">
                {/* Info banner */}
                <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <Sparkles className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-100">
                    <p className="font-semibold mb-1">💰 Verdien met affiliate marketing</p>
                    <p className="text-blue-200/80">
                      Voeg producten toe aan je content en verdien commissie op verkopen via Bol.com of je eigen affiliate links.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-white font-bold text-base">Affiliate Platform</Label>
                  <Select value={affiliatePlatform} onValueChange={(value: any) => setAffiliatePlatform(value)}>
                    <SelectTrigger className="border-zinc-700 bg-zinc-900 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 z-[9999]">
                      <SelectItem value="none" className="text-white hover:bg-zinc-800 py-3">
                        <div className="flex items-center gap-2">
                          <span>🚫</span>
                          <span>Geen producten</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="bolcom" className="text-white hover:bg-zinc-800 py-3">
                        <div className="flex items-center gap-2">
                          <span>🛒</span>
                          <span className="font-medium">Bol.com Producten</span>
                          <Badge variant="outline" className="ml-2 text-xs">Aanbevolen</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="custom" className="text-white hover:bg-zinc-800 py-3">
                        <div className="flex items-center gap-2">
                          <span>🔗</span>
                          <span>Eigen Affiliate Links</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">
                    {affiliatePlatform === 'none' && 'Geen affiliate producten toevoegen'}
                    {affiliatePlatform === 'bolcom' && '🛒 Zoek en selecteer producten direct vanuit Bol.com catalogus'}
                    {affiliatePlatform === 'custom' && '🔗 Voeg je eigen affiliate links toe van elk platform'}
                  </p>
                </div>

                {affiliatePlatform === 'bolcom' && (
                  <div className="space-y-4">
                    <BolcomProductSelector
                      selectedProducts={selectedProducts}
                      onProductsChange={setSelectedProducts}
                      projectId={projectId || undefined}
                    />
                    
                    <div className="space-y-3 p-4 bg-zinc-800/50 rounded-lg">
                      <Label className="text-white font-bold text-base">📦 Link Weergave Stijl</Label>
                      <Select value={linkDisplayType} onValueChange={(value: any) => setLinkDisplayType(value)}>
                        <SelectTrigger className="border-zinc-700 bg-zinc-900 text-white h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 z-[9999]">
                          <SelectItem value="product-box" className="text-white hover:bg-zinc-800 py-3">
                            <div className="flex items-center gap-2">
                              <span>📦</span>
                              <span className="font-medium">Product Box</span>
                              <Badge variant="outline" className="ml-2 text-xs">Beste conversie</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="cta-box" className="text-white hover:bg-zinc-800 py-3">
                            <div className="flex items-center gap-2">
                              <span>💬</span>
                              <span>CTA Box</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="inline" className="text-white hover:bg-zinc-800 py-3">
                            <div className="flex items-center gap-2">
                              <span>🔗</span>
                              <span>Inline Links</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="button" className="text-white hover:bg-zinc-800 py-3">
                            <div className="flex items-center gap-2">
                              <span>🔘</span>
                              <span>Button</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="ai-mix" className="text-white hover:bg-zinc-800 py-3">
                            <div className="flex items-center gap-2">
                              <span>🤖</span>
                              <span>AI Mix (Automatisch)</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="bg-zinc-900 p-3 rounded text-sm text-gray-300">
                        {linkDisplayType === 'product-box' && '📦 Visuele productkaart met afbeelding, prijs en "Bekijk op Bol.com" knop - Hoogste conversie'}
                        {linkDisplayType === 'cta-box' && '💬 Opvallende call-to-action box met product info'}
                        {linkDisplayType === 'inline' && '🔗 Natuurlijke links in de tekst - minst opdringerig'}
                        {linkDisplayType === 'button' && '🔘 Duidelijke button met product naam'}
                        {linkDisplayType === 'ai-mix' && '🤖 AI kiest automatisch de beste weergave per product'}
                      </div>
                    </div>
                  </div>
                )}

                {affiliatePlatform === 'custom' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <span className="text-lg">💡</span>
                      <div className="text-sm text-yellow-100">
                        <p className="font-semibold">Tip: Gebruik je eigen affiliate links</p>
                        <p className="text-yellow-200/80 mt-1">
                          Voeg affiliate links toe van Amazon, bol.com, of andere platforms. Geef een duidelijke productnaam en je volledige affiliate URL.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {customAffiliateLinks.map((link, index) => (
                        <div key={index} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-white text-sm">Product {index + 1}</Label>
                            <Button
                              onClick={() => removeCustomLink(index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 h-8"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <Input
                            value={link.name}
                            onChange={(e) => updateCustomLink(index, 'name', e.target.value)}
                            placeholder="Bijvoorbeeld: iPhone 15 Pro Max"
                            className="border-zinc-700 bg-zinc-900 text-white"
                          />
                          <Input
                            value={link.url}
                            onChange={(e) => updateCustomLink(index, 'url', e.target.value)}
                            placeholder="https://partner-link.com/product?ref=jouwcode"
                            className="border-zinc-700 bg-zinc-900 text-white"
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={addCustomLink}
                      variant="outline"
                      className="w-full border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35]/10"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nog een Link Toevoegen
                    </Button>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* GENEREREN BUTTON */}
            <Button
              onClick={generateContent}
              disabled={loading || !topic.trim()}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] hover:from-[#ff8c42] hover:to-[#ff6b35] text-white shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Content genereren...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Genereer Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
