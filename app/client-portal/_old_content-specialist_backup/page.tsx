
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  ShoppingCart,
  Zap,
  Play,
  ChevronRight,
  Map,
  Edit3,
  Network,
  Rocket,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import ProjectSelector from '@/components/project-selector';

type Step = 1 | 2 | 3 | 4 | 5;

interface TopicalTopic {
  id: string;
  title: string;
  type: string;
  keywords: string[];
  searchVolume?: number;
  categoryName?: string;
  mapMainTopic?: string;
}

interface BolProduct {
  ean: string;
  bolProductId: number;
  title: string;
  description: string;
  url: string;
  price?: number;
  regularPrice?: number;
  rating?: number;
  image?: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  affiliateLink?: string;
}

interface FormData {
  // Stap 1: Content Planning
  contentSource: 'topical-map' | 'manual';
  topicalTopicId: string | null;
  
  // Stap 2: Onderwerp
  topic: string;
  projectId: string;
  
  // Stap 3: Content Instellingen
  language: 'nl' | 'en';
  wordCount: number;
  tone: string;
  includeImages: boolean;
  includeFAQ: boolean;
  
  // Stap 4: Links & Producten
  internalLinks: boolean;
  bolProducts: boolean;
  affiliateLinks: string;
  selectedBolProducts: BolProduct[];
  
  // WordPress Publishing
  publishToWordPress: boolean;
  
  // Stap 5: Automatisch Genereren
  autoGenerate: boolean;
}

export default function ContentSpecialistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [availableTopics, setAvailableTopics] = useState<TopicalTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [showQuickGenerate, setShowQuickGenerate] = useState(false);
  
  // Generated content result
  const [generatedContent, setGeneratedContent] = useState<{
    contentId: string;
    title: string;
    content: string;
    wordpressUrl?: string;
  } | null>(null);
  
  // Debug: Log when generatedContent changes
  useEffect(() => {
    if (generatedContent) {
      console.log('[ContentSpecialist] Generated content updated:', {
        contentId: generatedContent.contentId,
        title: generatedContent.title,
        contentLength: generatedContent.content.length,
        wordpressUrl: generatedContent.wordpressUrl,
        isGenerating,
      });
    }
  }, [generatedContent, isGenerating]);
  
  // Bol.com product search state
  const [bolSearchTerm, setBolSearchTerm] = useState('');
  const [bolSearchResults, setBolSearchResults] = useState<BolProduct[]>([]);
  const [isSearchingBol, setIsSearchingBol] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    contentSource: 'topical-map',
    topicalTopicId: null,
    topic: '',
    projectId: '',
    language: 'nl',
    wordCount: 1500,
    tone: 'professioneel',
    includeImages: true,
    includeFAQ: true,
    internalLinks: true,
    bolProducts: false,
    affiliateLinks: '',
    selectedBolProducts: [],
    publishToWordPress: false,
    autoGenerate: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  // Load available topics when project changes
  useEffect(() => {
    if (formData.projectId && formData.contentSource === 'topical-map') {
      loadAvailableTopics();
    }
  }, [formData.projectId, formData.contentSource]);

  const loadAvailableTopics = async () => {
    if (!formData.projectId) return;
    
    setLoadingTopics(true);
    try {
      const response = await fetch(`/api/client/topical-mapping/topics/available?projectId=${formData.projectId}`);
      
      if (!response.ok) {
        throw new Error('Kan topics niet laden');
      }
      
      const data = await response.json();
      
      if (data.success && data.topics) {
        // Flatten grouped topics into a single array
        const allTopics: TopicalTopic[] = [];
        
        // Handle new grouped structure
        data.topics.forEach((map: any) => {
          map.categories.forEach((category: any) => {
            category.topics.forEach((topic: any) => {
              allTopics.push({
                id: topic.id,
                title: topic.title,
                type: topic.type,
                keywords: topic.keywords || [],
                searchVolume: topic.searchVolume,
                categoryName: category.categoryName,
                mapMainTopic: map.mainTopic,
              });
            });
          });
        });
        
        setAvailableTopics(allTopics);
      } else {
        setAvailableTopics([]);
      }
    } catch (error) {
      console.error('[ContentSpecialist] Error loading topics:', error);
      setAvailableTopics([]);
    } finally {
      setLoadingTopics(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // When selecting a topical topic, auto-fill the topic field
    if (field === 'topicalTopicId' && value) {
      const selectedTopic = availableTopics.find(t => t.id === value);
      if (selectedTopic) {
        setFormData(prev => ({ ...prev, topic: selectedTopic.title }));
      }
    }
    
    // When switching to manual mode, clear topical topic selection
    if (field === 'contentSource' && value === 'manual') {
      setFormData(prev => ({ ...prev, topicalTopicId: null }));
    }
  };

  const handleNext = () => {
    // Stap 1: Content Planning
    if (currentStep === 1) {
      if (!formData.projectId) {
        toast.error('Selecteer eerst een project');
        return;
      }
      if (formData.contentSource === 'topical-map' && !formData.topicalTopicId) {
        toast.error('Selecteer een onderwerp uit je Topical Map');
        return;
      }
    }
    
    // Stap 2: Onderwerp
    if (currentStep === 2) {
      if (!formData.topic.trim()) {
        toast.error('Vul een onderwerp in');
        return;
      }
    }
    
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as Step);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setProgressMessage('Content genereren gestart...');

    try {
      const response = await fetch('/api/client/auto-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: formData.topic,
          projectId: formData.projectId,
          topicalTopicId: formData.topicalTopicId,
          language: formData.language,
          wordCount: formData.wordCount,
          tone: formData.tone,
          includeImages: formData.includeImages,
          includeFAQ: formData.includeFAQ,
          internalLinks: formData.internalLinks,
          bolProducts: formData.bolProducts,
          affiliateLinks: formData.affiliateLinks ? formData.affiliateLinks.split(',').map(l => l.trim()) : [],
          publishToWordPress: formData.publishToWordPress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Content genereren mislukt');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Geen response stream beschikbaar');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              console.log('[ContentSpecialist] Received SSE data:', data);
              
              if (data.progress !== undefined) {
                setProgress(data.progress);
              }
              
              if (data.message) {
                setProgressMessage(data.message);
              }
              
              if (data.done) {
                // Store generated content and show result screen
                console.log('[ContentSpecialist] ✅ Generation complete!', {
                  contentId: data.contentId,
                  title: data.title,
                  hasContent: !!data.content,
                  contentLength: data.content?.length,
                  wordpressUrl: data.wordpressUrl,
                });
                
                // CRITICAL: Validate contentId before proceeding
                if (!data.contentId) {
                  console.error('[ContentSpecialist] ❌ No contentId received!');
                  setIsGenerating(false);
                  toast.error('Geen content ID ontvangen van de server');
                  return;
                }
                
                setProgress(100);
                setProgressMessage('✅ Content opgeslagen! Redirect in 2 seconden...');
                
                const redirectUrl = `/client-portal/content-library/${data.contentId}/edit`;
                console.log('[ContentSpecialist] 🚀 Will redirect to:', redirectUrl);
                
                toast.success('✅ Content succesvol gegenereerd! Redirecting...', {
                  duration: 2000,
                });
                
                // Use window.location for hard redirect (more reliable than router.push)
                setTimeout(() => {
                  console.log('[ContentSpecialist] 🔄 Executing redirect NOW to:', redirectUrl);
                  window.location.href = redirectUrl;
                }, 2000);
                
                // Stop processing further messages
                return;
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('[ContentSpecialist] Parse error:', parseError);
              // Don't throw here, just log - might be trailing data
            }
          }
        }
      }
    } catch (error) {
      console.error('[ContentSpecialist] Generation error:', error);
      console.error('[ContentSpecialist] Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      setIsGenerating(false);
      setProgress(0);
      setProgressMessage('');
      
      // User-friendly error messages
      let errorMsg = 'Er ging iets mis bij het genereren';
      
      if (error instanceof Error) {
        if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
          errorMsg = '⏱️ Content generatie duurde te lang. Probeer een kortere tekst of minder afbeeldingen.';
        } else if (error.message?.includes('credits') || error.message?.includes('Credits')) {
          errorMsg = '💳 Onvoldoende credits. Koop extra credits om verder te gaan.';
        } else if (error.message) {
          errorMsg = error.message;
        }
      }
      
      toast.error(errorMsg, {
        duration: 5000,
      });
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Content Planning', icon: Network },
    { number: 2, title: 'Onderwerp', icon: FileText },
    { number: 3, title: 'Instellingen', icon: Zap },
    { number: 4, title: 'Links & Producten', icon: ShoppingCart },
    { number: 5, title: 'Genereren', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg">
              <Sparkles className="text-orange-500" size={24} />
            </div>
            <h1 className="text-3xl font-bold text-white">Content Specialist</h1>
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">AI-Powered</Badge>
          </div>
          <p className="text-gray-400">Alles-in-één content generator met volledige controle</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : isCurrent
                          ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                          : 'bg-gray-800 border-gray-700 text-gray-500'
                      }`}
                    >
                      {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                    </div>
                    <span
                      className={`mt-2 text-sm ${
                        isCurrent ? 'text-orange-400 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? 'bg-orange-500' : 'bg-gray-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Card */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Stap {currentStep} van 5</CardTitle>
            <CardDescription className="text-gray-400">
              {currentStep === 1 && 'Start met je content planning'}
              {currentStep === 2 && 'Kies je onderwerp en project'}
              {currentStep === 3 && 'Configureer je content instellingen'}
              {currentStep === 4 && 'Voeg links en producten toe'}
              {currentStep === 5 && 'Genereer je content automatisch'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stap 1: Content Planning */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">Project</Label>
                  <ProjectSelector
                    value={formData.projectId}
                    onChange={(value) => updateFormData('projectId', value || '')}
                    autoSelectPrimary={true}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <Label className="text-white">Hoe wil je starten?</Label>
                  
                  {/* Option 1: Topical Map */}
                  <button
                    type="button"
                    onClick={() => updateFormData('contentSource', 'topical-map')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      formData.contentSource === 'topical-map'
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        formData.contentSource === 'topical-map'
                          ? 'bg-orange-500/20'
                          : 'bg-gray-700'
                      }`}>
                        <Map className={formData.contentSource === 'topical-map' ? 'text-orange-500' : 'text-gray-400'} size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-semibold">Uit Topical Map</h4>
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Aanbevolen</Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          Selecteer een onderwerp uit je Topical Map voor strategische content planning
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Topical Map Selection */}
                  {formData.contentSource === 'topical-map' && formData.projectId && (
                    <div className="ml-4 mt-3 space-y-2">
                      {loadingTopics ? (
                        <div className="flex items-center gap-2 text-gray-400 py-2">
                          <Loader2 className="animate-spin" size={16} />
                          <span className="text-sm">Topics laden...</span>
                        </div>
                      ) : availableTopics.length === 0 ? (
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                          <p className="text-sm text-gray-400">
                            Nog geen Topical Map beschikbaar voor dit project. 
                            <button
                              type="button"
                              onClick={() => router.push('/client-portal/content-planner')}
                              className="text-orange-400 hover:text-orange-300 ml-1 underline"
                            >
                              Maak er nu een aan
                            </button>
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor="topicalTopic" className="text-white mb-2 block text-sm">
                            Selecteer een onderwerp ({availableTopics.length} beschikbaar)
                          </Label>
                          <Select
                            value={formData.topicalTopicId || ''}
                            onValueChange={(value) => updateFormData('topicalTopicId', value)}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue placeholder="Kies een onderwerp..." />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px]">
                              {availableTopics.map((topic) => (
                                <SelectItem key={topic.id} value={topic.id} className="text-white">
                                  <div className="flex flex-col">
                                    <span>{topic.title}</span>
                                    <span className="text-xs text-gray-400">
                                      {topic.categoryName && `${topic.categoryName} • `}
                                      {topic.type === 'commercial' ? '💰 Commercieel' : '💡 Informationeel'}
                                      {topic.searchVolume && ` • ${topic.searchVolume} zoekvolume`}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Option 2: Manual */}
                  <button
                    type="button"
                    onClick={() => updateFormData('contentSource', 'manual')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      formData.contentSource === 'manual'
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        formData.contentSource === 'manual'
                          ? 'bg-orange-500/20'
                          : 'bg-gray-700'
                      }`}>
                        <Edit3 className={formData.contentSource === 'manual' ? 'text-orange-500' : 'text-gray-400'} size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Eigen Onderwerp</h4>
                        <p className="text-sm text-gray-400">
                          Ga direct verder met je eigen onderwerp zonder content planning
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Stap 2: Onderwerp */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {formData.contentSource === 'topical-map' && formData.topicalTopicId && (
                  <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Map className="text-orange-500" size={16} />
                      <span className="text-sm text-orange-400 font-medium">Geselecteerd uit Topical Map</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Je kunt het onderwerp hieronder nog aanpassen indien gewenst
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="topic" className="text-white mb-2 block">Onderwerp</Label>
                  <Textarea
                    id="topic"
                    placeholder="Bijvoorbeeld: De 10 beste yoga oefeningen voor beginners"
                    value={formData.topic}
                    onChange={(e) => updateFormData('topic', e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Stap 3: Content Instellingen */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language" className="text-white mb-2 block">Taal</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => updateFormData('language', value)}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="nl" className="text-white">🇳🇱 Nederlands</SelectItem>
                        <SelectItem value="en" className="text-white">🇬🇧 Engels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="wordCount" className="text-white mb-2 block">Aantal woorden</Label>
                    <Input
                      id="wordCount"
                      type="number"
                      value={formData.wordCount}
                      onChange={(e) => updateFormData('wordCount', parseInt(e.target.value))}
                      className="bg-gray-800 border-gray-700 text-white"
                      min={500}
                      max={3000}
                      step={100}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tone" className="text-white mb-2 block">Tone of Voice</Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(value) => updateFormData('tone', value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="professioneel" className="text-white">Professioneel</SelectItem>
                      <SelectItem value="vriendelijk" className="text-white">Vriendelijk</SelectItem>
                      <SelectItem value="informeel" className="text-white">Informeel</SelectItem>
                      <SelectItem value="zakelijk" className="text-white">Zakelijk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={18} className="text-orange-500" />
                      <Label htmlFor="includeImages" className="text-white">Afbeeldingen toevoegen</Label>
                    </div>
                    <Switch
                      id="includeImages"
                      checked={formData.includeImages}
                      onCheckedChange={(checked) => updateFormData('includeImages', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-orange-500" />
                      <Label htmlFor="includeFAQ" className="text-white">FAQ sectie toevoegen</Label>
                    </div>
                    <Switch
                      id="includeFAQ"
                      checked={formData.includeFAQ}
                      onCheckedChange={(checked) => updateFormData('includeFAQ', checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stap 4: Links & Producten */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <LinkIcon size={18} className="text-orange-500" />
                      <div>
                        <Label htmlFor="internalLinks" className="text-white block">Interne links</Label>
                        <p className="text-sm text-gray-400">Automatisch relevante interne links toevoegen</p>
                      </div>
                    </div>
                    <Switch
                      id="internalLinks"
                      checked={formData.internalLinks}
                      onCheckedChange={(checked) => updateFormData('internalLinks', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={18} className="text-orange-500" />
                      <div>
                        <Label htmlFor="bolProducts" className="text-white block">Bol.com producten</Label>
                        <p className="text-sm text-gray-400">Zoek en voeg relevante producten toe</p>
                      </div>
                    </div>
                    <Switch
                      id="bolProducts"
                      checked={formData.bolProducts}
                      onCheckedChange={(checked) => updateFormData('bolProducts', checked)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="affiliateLinks" className="text-white mb-2 block">
                    Eigen affiliate links (optioneel)
                  </Label>
                  <Textarea
                    id="affiliateLinks"
                    placeholder="Voeg je eigen affiliate links toe, gescheiden door komma's"
                    value={formData.affiliateLinks}
                    onChange={(e) => updateFormData('affiliateLinks', e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    rows={3}
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Bijvoorbeeld: https://link1.com, https://link2.com
                  </p>
                </div>
              </div>
            )}

            {/* Stap 5: Genereren */}
            {currentStep === 5 && !isGenerating && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                      <Sparkles className="text-orange-500" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">Klaar om te genereren!</h3>
                      <p className="text-gray-300 mb-4">
                        Je content wordt volledig automatisch gegenereerd met alle instellingen die je hebt gekozen.
                      </p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Check size={16} className="text-orange-500" />
                          <span>Onderwerp: {formData.topic}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Check size={16} className="text-orange-500" />
                          <span>Taal: {formData.language === 'nl' ? 'Nederlands' : 'Engels'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Check size={16} className="text-orange-500" />
                          <span>Woorden: ~{formData.wordCount}</span>
                        </div>
                        {formData.includeImages && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Check size={16} className="text-orange-500" />
                            <span>Met afbeeldingen</span>
                          </div>
                        )}
                        {formData.internalLinks && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Check size={16} className="text-orange-500" />
                            <span>Met interne links</span>
                          </div>
                        )}
                        {formData.bolProducts && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Check size={16} className="text-orange-500" />
                            <span>Met Bol.com producten</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">
                    <strong className="text-white">Credits:</strong> Deze content kost 50 credits om te genereren
                  </p>
                </div>
              </div>
            )}

            {/* Generating Progress */}
            {isGenerating && (
              <div className="space-y-4">
                <div className="text-center">
                  <Loader2 className="animate-spin text-orange-500 mx-auto mb-4" size={48} />
                  <h3 className="text-white font-semibold text-lg mb-2">Content wordt gegenereerd...</h3>
                  <p className="text-gray-400">{progressMessage}</p>
                </div>
                
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-gray-500 text-center">{progress}% voltooid</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {!isGenerating && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  Terug
                </Button>
                
                <div className="flex items-center gap-2">
                  {/* Quick Generate button only on step 1 when topic is selected */}
                  {currentStep === 1 && formData.topicalTopicId && formData.projectId && (
                    <Button
                      onClick={() => setShowQuickGenerate(true)}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      <Rocket size={18} className="mr-2" />
                      Genereer Nu
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    {currentStep === 5 ? (
                      <>
                        <Play size={18} className="mr-2" />
                        Genereer Content
                      </>
                    ) : (
                      <>
                        Volgende
                        <ChevronRight size={18} className="ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        {currentStep === 1 && !isGenerating && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="text-orange-500" size={20} />
                  <h4 className="text-white font-semibold">Snel</h4>
                </div>
                <p className="text-sm text-gray-400">Content binnen minuten gegenereerd</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="text-orange-500" size={20} />
                  <h4 className="text-white font-semibold">AI-Powered</h4>
                </div>
                <p className="text-sm text-gray-400">Geavanceerde AI voor kwaliteit</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Check className="text-orange-500" size={20} />
                  <h4 className="text-white font-semibold">Compleet</h4>
                </div>
                <p className="text-sm text-gray-400">Met links, afbeeldingen & producten</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Quick Generate Dialog */}
      <Dialog open={showQuickGenerate} onOpenChange={setShowQuickGenerate}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="text-green-500" size={24} />
              Snel Genereren
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Kies je instellingen en genereer direct content uit je Topical Map
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Selected Topic Info */}
            {formData.topicalTopicId && (
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Map className="text-orange-500" size={16} />
                  <span className="text-sm text-orange-400 font-medium">Geselecteerd onderwerp</span>
                </div>
                <p className="text-white font-semibold">{formData.topic || 'Laden...'}</p>
              </div>
            )}

            {/* Language */}
            <div>
              <Label htmlFor="quick-language" className="text-white mb-2 block">Taal</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => updateFormData('language', value)}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="nl" className="text-white">🇳🇱 Nederlands</SelectItem>
                  <SelectItem value="en" className="text-white">🇬🇧 Engels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Word Count */}
            <div>
              <Label htmlFor="quick-words" className="text-white mb-2 block">Aantal woorden</Label>
              <Input
                id="quick-words"
                type="number"
                value={formData.wordCount}
                onChange={(e) => updateFormData('wordCount', parseInt(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white"
                min={500}
                max={3000}
                step={100}
              />
            </div>

            {/* Tone */}
            <div>
              <Label htmlFor="quick-tone" className="text-white mb-2 block">Tone of Voice</Label>
              <Select
                value={formData.tone}
                onValueChange={(value) => updateFormData('tone', value)}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="professioneel" className="text-white">Professioneel</SelectItem>
                  <SelectItem value="vriendelijk" className="text-white">Vriendelijk</SelectItem>
                  <SelectItem value="informeel" className="text-white">Informeel</SelectItem>
                  <SelectItem value="zakelijk" className="text-white">Zakelijk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Options */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon size={18} className="text-orange-500" />
                  <Label htmlFor="quick-images" className="text-white">Afbeeldingen toevoegen</Label>
                </div>
                <Switch
                  id="quick-images"
                  checked={formData.includeImages}
                  onCheckedChange={(checked) => updateFormData('includeImages', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-orange-500" />
                  <Label htmlFor="quick-faq" className="text-white">FAQ sectie toevoegen</Label>
                </div>
                <Switch
                  id="quick-faq"
                  checked={formData.includeFAQ}
                  onCheckedChange={(checked) => updateFormData('includeFAQ', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon size={18} className="text-orange-500" />
                  <Label htmlFor="quick-links" className="text-white">Interne links</Label>
                </div>
                <Switch
                  id="quick-links"
                  checked={formData.internalLinks}
                  onCheckedChange={(checked) => updateFormData('internalLinks', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-orange-500" />
                  <div className="flex flex-col">
                    <Label htmlFor="quick-bol" className="text-white">Bol.com producten</Label>
                    <span className="text-xs text-gray-400">Automatisch zoeken en toevoegen</span>
                  </div>
                </div>
                <Switch
                  id="quick-bol"
                  checked={formData.bolProducts}
                  onCheckedChange={(checked) => updateFormData('bolProducts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-orange-500" />
                  <div className="flex flex-col">
                    <Label htmlFor="quick-wordpress" className="text-white">Direct naar WordPress</Label>
                    <span className="text-xs text-gray-400">Automatisch publiceren na generatie</span>
                  </div>
                </div>
                <Switch
                  id="quick-wordpress"
                  checked={formData.publishToWordPress}
                  onCheckedChange={(checked) => updateFormData('publishToWordPress', checked)}
                />
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-4 border-t border-gray-800">
              <Button
                onClick={() => {
                  setShowQuickGenerate(false);
                  handleGenerate();
                }}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Rocket size={18} className="mr-2" />
                Genereer Content Nu (50 credits)
              </Button>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Content wordt direct gegenereerd en opgeslagen in je library
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Screen - Show generated content */}
      {generatedContent && !isGenerating && (
        <Card className="mt-8 p-6 bg-gray-900 border-gray-800">
          <div className="space-y-6">
            {/* Success Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-full">
                <CheckCircle2 className="text-green-500" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{generatedContent.title}</h2>
                <p className="text-gray-400">Content succesvol gegenereerd!</p>
              </div>
            </div>

            {/* WordPress URL if published */}
            {generatedContent.wordpressUrl && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="text-green-500" size={18} />
                  <span className="text-green-400 font-medium">Gepubliceerd op WordPress</span>
                </div>
                <a
                  href={generatedContent.wordpressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline text-sm"
                >
                  {generatedContent.wordpressUrl}
                </a>
              </div>
            )}

            {/* Content Preview */}
            <div className="border border-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700">
                <h3 className="text-white font-semibold">Content Preview</h3>
              </div>
              <div 
                className="p-6 bg-white max-h-[400px] overflow-y-auto prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedContent.content }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push(`/client-portal/content-library/${generatedContent.contentId}/edit`)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <FileText size={18} className="mr-2" />
                Ga naar Bibliotheek & Bewerk
              </Button>
              
              {!generatedContent.wordpressUrl && (
                <Button
                  onClick={() => {
                    router.push(`/client-portal/content-library/${generatedContent.contentId}/edit`);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  <Globe size={18} className="mr-2" />
                  Publiceer naar WordPress
                </Button>
              )}
              
              <Button
                onClick={() => {
                  setGeneratedContent(null);
                  setProgress(0);
                  setProgressMessage('');
                  setCurrentStep(1);
                }}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Nieuwe Content
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
