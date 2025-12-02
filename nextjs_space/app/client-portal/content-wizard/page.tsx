'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Globe,
  Map,
  Rocket,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  FileText,
  ListChecks,
  Star,
  BookOpen,
  ShoppingBag,
  Calendar,
  Zap,
  Clock,
  CalendarDays,
  Play,
  Pause,
  Settings,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import toast from 'react-hot-toast';

// Types
interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  niche?: string;
  bolcomEnabled?: boolean;
  bolcomAffiliateId?: string;
  wordpressUrl?: string;
  wordpressUsername?: string;
  wordpressPassword?: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: 'pillar' | 'cluster' | 'blog' | 'listicle' | 'review' | 'comparison' | 'how-to' | 'guide';
  category: string;
  keywords: string[];
  searchIntent: string;
  selected: boolean;
  priority: 'high' | 'medium' | 'low';
  estimatedWords: number;
  productKeyword?: string; // For reviews/listicles - what product to search on Bol.com
}

interface TopicalMap {
  categories: {
    name: string;
    pillars: ContentItem[];
    clusters: ContentItem[];
    supportingContent: ContentItem[];
  }[];
  totalItems: number;
  informationalCount: number;
  listicleCount: number;
  reviewCount: number;
  howToCount: number;
}

interface ScheduleConfig {
  mode: 'bulk' | 'daily' | 'weekly' | 'custom';
  articlesPerDay?: number;
  articlesPerWeek?: number;
  publishDays?: string[];
  publishTime?: string;
  autoPublish: boolean;
  startDate?: string;
}

export default function ContentWizardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1: Website & Project
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    niche: string;
    existingPages: number;
    suggestedTopics: string[];
  } | null>(null);
  
  // Step 2: Topical Map
  const [topicalMap, setTopicalMap] = useState<TopicalMap | null>(null);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [mapProgress, setMapProgress] = useState(0);
  const [contentMix, setContentMix] = useState({
    informational: true,
    listicles: true,
    reviews: true,
    howTo: true,
    comparisons: true
  });
  const [targetArticles, setTargetArticles] = useState(100);
  
  // Step 3: Schedule & Publish
  const [schedule, setSchedule] = useState<ScheduleConfig>({
    mode: 'daily',
    articlesPerDay: 2,
    articlesPerWeek: 10,
    publishDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    publishTime: '09:00',
    autoPublish: false,
    startDate: new Date().toISOString().split('T')[0]
  });
  const [isStarting, setIsStarting] = useState(false);
  
  // Load projects on mount
  useEffect(() => {
    if (status === 'authenticated') {
      loadProjects();
    }
  }, [status]);
  
  const loadProjects = async () => {
    try {
      const response = await fetch('/api/client/projects');
      const data = await response.json();
      if (data.projects) {
        setProjects(data.projects);
        // Auto-select primary project
        const primary = data.projects.find((p: Project) => (p as any).isPrimary) || data.projects[0];
        if (primary) {
          setSelectedProject(primary);
          setWebsiteUrl(primary.websiteUrl);
        }
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };
  
  // Step 1: Scan Website
  const scanWebsite = async () => {
    if (!websiteUrl) {
      toast.error('Voer een website URL in');
      return;
    }
    
    setIsScanning(true);
    setError(null);
    
    try {
      const response = await fetch('/api/client/content-wizard/scan-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          websiteUrl,
          projectId: selectedProject?.id 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScanResult({
          niche: data.niche,
          existingPages: data.existingPages || 0,
          suggestedTopics: data.suggestedTopics || []
        });
        toast.success('Website succesvol gescand!');
      } else {
        throw new Error(data.error || 'Scan mislukt');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsScanning(false);
    }
  };
  
  // Step 2: Generate Topical Map
  const generateTopicalMap = async () => {
    if (!selectedProject && !websiteUrl) {
      toast.error('Selecteer eerst een project of voer een website URL in');
      return;
    }
    
    setIsGeneratingMap(true);
    setMapProgress(0);
    setError(null);
    
    try {
      const response = await fetch('/api/client/content-wizard/generate-topical-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject?.id,
          websiteUrl: websiteUrl || selectedProject?.websiteUrl,
          niche: scanResult?.niche || selectedProject?.niche,
          targetArticles,
          contentMix,
          existingPages: scanResult?.existingPages || 0
        })
      });
      
      if (!response.ok) throw new Error('Genereren mislukt');
      
      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.progress) {
                setMapProgress(data.progress);
              }
              
              if (data.topicalMap) {
                setTopicalMap(data.topicalMap);
                toast.success(`${data.topicalMap.totalItems} content items gegenereerd!`);
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsGeneratingMap(false);
    }
  };
  
  // Toggle content item selection
  const toggleContentItem = (categoryIndex: number, type: 'pillars' | 'clusters' | 'supportingContent', itemIndex: number) => {
    if (!topicalMap) return;
    
    const newMap = { ...topicalMap };
    newMap.categories[categoryIndex][type][itemIndex].selected = 
      !newMap.categories[categoryIndex][type][itemIndex].selected;
    setTopicalMap(newMap);
  };
  
  // Select/Deselect all
  const toggleSelectAll = (select: boolean) => {
    if (!topicalMap) return;
    
    const newMap = { ...topicalMap };
    newMap.categories.forEach(cat => {
      cat.pillars.forEach(item => item.selected = select);
      cat.clusters.forEach(item => item.selected = select);
      cat.supportingContent.forEach(item => item.selected = select);
    });
    setTopicalMap(newMap);
  };
  
  // Get selected count
  const getSelectedCount = () => {
    if (!topicalMap) return 0;
    let count = 0;
    topicalMap.categories.forEach(cat => {
      count += cat.pillars.filter(i => i.selected).length;
      count += cat.clusters.filter(i => i.selected).length;
      count += cat.supportingContent.filter(i => i.selected).length;
    });
    return count;
  };
  
  // Step 3: Start Content Generation
  const startContentGeneration = async () => {
    const selectedCount = getSelectedCount();
    if (selectedCount === 0) {
      toast.error('Selecteer minimaal 1 artikel');
      return;
    }
    
    setIsStarting(true);
    setError(null);
    
    try {
      // Collect all selected items
      const selectedItems: ContentItem[] = [];
      topicalMap?.categories.forEach(cat => {
        selectedItems.push(...cat.pillars.filter(i => i.selected));
        selectedItems.push(...cat.clusters.filter(i => i.selected));
        selectedItems.push(...cat.supportingContent.filter(i => i.selected));
      });
      
      const response = await fetch('/api/client/content-wizard/start-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject?.id,
          contentItems: selectedItems,
          schedule,
          bolcomEnabled: selectedProject?.bolcomEnabled,
          bolcomAffiliateId: selectedProject?.bolcomAffiliateId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Content generatie gestart voor ${selectedCount} artikelen!`);
        router.push('/client-portal/content-library');
      } else {
        throw new Error(data.error || 'Starten mislukt');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsStarting(false);
    }
  };
  
  // Content type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pillar': return <BookOpen className="w-4 h-4" />;
      case 'cluster': return <FileText className="w-4 h-4" />;
      case 'listicle': return <ListChecks className="w-4 h-4" />;
      case 'review': return <Star className="w-4 h-4" />;
      case 'comparison': return <ShoppingBag className="w-4 h-4" />;
      case 'how-to': return <Zap className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };
  
  // Content type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pillar': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'cluster': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'listicle': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'review': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'comparison': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'how-to': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Content Wizard
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Bouw je Complete Content Strategie
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            In 3 simpele stappen naar een volledige topical map met honderden artikelen, 
            automatisch gepubliceerd naar je WordPress website.
          </p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep >= step
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {currentStep > step ? <Check className="w-5 h-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-16 md:w-24 h-1 mx-2 rounded ${
                  currentStep > step ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-800'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        {/* Step Labels */}
        <div className="flex justify-center gap-8 md:gap-16 mb-8 text-sm">
          <div className={`text-center ${currentStep >= 1 ? 'text-white' : 'text-gray-500'}`}>
            <Globe className="w-5 h-5 mx-auto mb-1" />
            Website
          </div>
          <div className={`text-center ${currentStep >= 2 ? 'text-white' : 'text-gray-500'}`}>
            <Map className="w-5 h-5 mx-auto mb-1" />
            Topical Map
          </div>
          <div className={`text-center ${currentStep >= 3 ? 'text-white' : 'text-gray-500'}`}>
            <Rocket className="w-5 h-5 mx-auto mb-1" />
            Genereren
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Website Setup */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="bg-gray-900 border-gray-800 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Globe className="w-6 h-6 text-blue-400" />
                  Selecteer of Voer je Website in
                </h2>
                
                {/* Project Selection */}
                {projects.length > 0 && (
                  <div className="mb-6">
                    <Label className="text-gray-300 mb-2 block">Bestaand Project</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => {
                            setSelectedProject(project);
                            setWebsiteUrl(project.websiteUrl);
                            setScanResult(null);
                          }}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            selectedProject?.id === project.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                          }`}
                        >
                          <div className="font-medium text-white truncate">{project.name}</div>
                          <div className="text-sm text-gray-400 truncate">{project.websiteUrl}</div>
                          {project.niche && (
                            <Badge className="mt-2 bg-purple-500/20 text-purple-400">
                              {project.niche}
                            </Badge>
                          )}
                          {project.bolcomEnabled && (
                            <Badge className="mt-2 ml-2 bg-blue-500/20 text-blue-400">
                              Bol.com
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Website URL Input */}
                <div className="mb-6">
                  <Label className="text-gray-300 mb-2 block">Website URL</Label>
                  <div className="flex gap-3">
                    <Input
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://jouwwebsite.nl"
                      className="flex-1 bg-gray-800 border-gray-700 text-white"
                    />
                    <Button
                      onClick={scanWebsite}
                      disabled={isScanning || !websiteUrl}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {isScanning ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scannen...</>
                      ) : (
                        <><Globe className="w-4 h-4 mr-2" /> Scan Website</>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Scan Results */}
                {scanResult && (
                  <div className="bg-gray-800 rounded-lg p-4 border border-green-500/30">
                    <div className="flex items-center gap-2 text-green-400 mb-3">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Website Gescand!</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Niche:</span>
                        <div className="text-white font-medium">{scanResult.niche}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Bestaande Pagina's:</span>
                        <div className="text-white font-medium">{scanResult.existingPages}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Suggesties:</span>
                        <div className="text-white font-medium">{scanResult.suggestedTopics.length} topics</div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
              
              {/* Navigation */}
              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!websiteUrl && !selectedProject}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Volgende: Topical Map
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Topical Map */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Content Mix Configuration */}
              <Card className="bg-gray-900 border-gray-800 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Map className="w-6 h-6 text-purple-400" />
                  Content Mix Configuratie
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  {[
                    { key: 'informational', label: 'Informatief', icon: BookOpen, color: 'blue' },
                    { key: 'listicles', label: 'Beste Lijstjes', icon: ListChecks, color: 'green' },
                    { key: 'reviews', label: 'Reviews', icon: Star, color: 'yellow' },
                    { key: 'howTo', label: 'How-To', icon: Zap, color: 'cyan' },
                    { key: 'comparisons', label: 'Vergelijkingen', icon: ShoppingBag, color: 'orange' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setContentMix(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                      className={`p-4 rounded-lg border text-center transition-all ${
                        contentMix[item.key as keyof typeof contentMix]
                          ? `border-${item.color}-500 bg-${item.color}-500/10`
                          : 'border-gray-700 bg-gray-800 opacity-50'
                      }`}
                    >
                      <item.icon className={`w-6 h-6 mx-auto mb-2 ${contentMix[item.key as keyof typeof contentMix] ? `text-${item.color}-400` : 'text-gray-500'}`} />
                      <div className="text-sm font-medium">{item.label}</div>
                    </button>
                  ))}
                </div>
                
                {/* Target Articles Slider */}
                <div className="mb-6">
                  <Label className="text-gray-300 mb-2 block">
                    Aantal Artikelen: <span className="text-white font-bold">{targetArticles}</span>
                  </Label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={targetArticles}
                    onChange={(e) => setTargetArticles(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>50</span>
                    <span>100</span>
                    <span>200</span>
                    <span>300</span>
                    <span>400</span>
                    <span>500</span>
                  </div>
                </div>
                
                <Button
                  onClick={generateTopicalMap}
                  disabled={isGeneratingMap}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isGeneratingMap ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Topical Map Genereren...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Genereer Topical Map ({targetArticles} artikelen)</>
                  )}
                </Button>
                
                {/* Progress Bar */}
                {isGeneratingMap && (
                  <div className="mt-4">
                    <Progress value={mapProgress} className="h-2" />
                    <p className="text-sm text-gray-400 mt-2 text-center">
                      {mapProgress < 30 && 'Niche analyseren...'}
                      {mapProgress >= 30 && mapProgress < 60 && 'Pillar pages genereren...'}
                      {mapProgress >= 60 && mapProgress < 90 && 'Clusters en blogs toevoegen...'}
                      {mapProgress >= 90 && 'Afronden...'}
                    </p>
                  </div>
                )}
              </Card>
              
              {/* Generated Topical Map */}
              {topicalMap && (
                <Card className="bg-gray-900 border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-400" />
                      Gegenereerde Topical Map
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSelectAll(true)}
                        className="border-gray-700"
                      >
                        Selecteer Alles
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSelectAll(false)}
                        className="border-gray-700"
                      >
                        Deselecteer
                      </Button>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white">{topicalMap.totalItems}</div>
                      <div className="text-xs text-gray-400">Totaal</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-400">{topicalMap.informationalCount}</div>
                      <div className="text-xs text-gray-400">Informatief</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-400">{topicalMap.listicleCount}</div>
                      <div className="text-xs text-gray-400">Lijstjes</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-400">{topicalMap.reviewCount}</div>
                      <div className="text-xs text-gray-400">Reviews</div>
                    </div>
                    <div className="bg-cyan-500/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-cyan-400">{topicalMap.howToCount}</div>
                      <div className="text-xs text-gray-400">How-To</div>
                    </div>
                  </div>
                  
                  {/* Categories & Content Items */}
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {topicalMap.categories.map((category, catIndex) => (
                      <div key={catIndex} className="bg-gray-800 rounded-lg p-4">
                        <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          {category.name}
                          <Badge className="ml-auto bg-gray-700">
                            {category.pillars.length + category.clusters.length + category.supportingContent.length} items
                          </Badge>
                        </h4>
                        
                        {/* Pillars */}
                        {category.pillars.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-purple-400 font-medium mb-2">PILLAR PAGES</div>
                            <div className="space-y-2">
                              {category.pillars.map((item, idx) => (
                                <label
                                  key={item.id}
                                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
                                    item.selected ? 'bg-purple-500/10' : 'hover:bg-gray-700'
                                  }`}
                                >
                                  <Checkbox
                                    checked={item.selected}
                                    onCheckedChange={() => toggleContentItem(catIndex, 'pillars', idx)}
                                  />
                                  <span className="flex-1 text-sm">{item.title}</span>
                                  <Badge className={getTypeColor(item.type)}>
                                    {getTypeIcon(item.type)}
                                    <span className="ml-1">{item.type}</span>
                                  </Badge>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Clusters */}
                        {category.clusters.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-blue-400 font-medium mb-2">CLUSTER CONTENT</div>
                            <div className="space-y-2">
                              {category.clusters.map((item, idx) => (
                                <label
                                  key={item.id}
                                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
                                    item.selected ? 'bg-blue-500/10' : 'hover:bg-gray-700'
                                  }`}
                                >
                                  <Checkbox
                                    checked={item.selected}
                                    onCheckedChange={() => toggleContentItem(catIndex, 'clusters', idx)}
                                  />
                                  <span className="flex-1 text-sm">{item.title}</span>
                                  <Badge className={getTypeColor(item.type)}>
                                    {getTypeIcon(item.type)}
                                    <span className="ml-1">{item.type}</span>
                                  </Badge>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Supporting Content */}
                        {category.supportingContent.length > 0 && (
                          <div>
                            <div className="text-xs text-green-400 font-medium mb-2">SUPPORTING CONTENT</div>
                            <div className="space-y-2">
                              {category.supportingContent.map((item, idx) => (
                                <label
                                  key={item.id}
                                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
                                    item.selected ? 'bg-green-500/10' : 'hover:bg-gray-700'
                                  }`}
                                >
                                  <Checkbox
                                    checked={item.selected}
                                    onCheckedChange={() => toggleContentItem(catIndex, 'supportingContent', idx)}
                                  />
                                  <span className="flex-1 text-sm">{item.title}</span>
                                  <Badge className={getTypeColor(item.type)}>
                                    {getTypeIcon(item.type)}
                                    <span className="ml-1">{item.type}</span>
                                  </Badge>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Selected Count */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Geselecteerd voor generatie:</span>
                      <span className="text-2xl font-bold text-white">{getSelectedCount()} artikelen</span>
                    </div>
                  </div>
                </Card>
              )}
              
              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="border-gray-700"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Terug
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={!topicalMap || getSelectedCount() === 0}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Volgende: Schema & Publiceren
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Schedule & Generate */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="bg-gray-900 border-gray-800 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-green-400" />
                  Kies je Publicatie Schema
                </h2>
                
                {/* Schedule Mode */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { mode: 'bulk', label: 'Bulk', desc: 'Alles nu genereren', icon: Zap },
                    { mode: 'daily', label: 'Dagelijks', desc: 'X artikelen/dag', icon: Clock },
                    { mode: 'weekly', label: 'Wekelijks', desc: 'X artikelen/week', icon: CalendarDays },
                    { mode: 'custom', label: 'Custom', desc: 'Zelf instellen', icon: Settings }
                  ].map((item) => (
                    <button
                      key={item.mode}
                      onClick={() => setSchedule(prev => ({ ...prev, mode: item.mode as any }))}
                      className={`p-4 rounded-lg border text-center transition-all ${
                        schedule.mode === item.mode
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <item.icon className={`w-8 h-8 mx-auto mb-2 ${
                        schedule.mode === item.mode ? 'text-green-400' : 'text-gray-500'
                      }`} />
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-400">{item.desc}</div>
                    </button>
                  ))}
                </div>
                
                {/* Schedule Details */}
                {schedule.mode !== 'bulk' && (
                  <div className="bg-gray-800 rounded-lg p-4 mb-6">
                    {schedule.mode === 'daily' && (
                      <div>
                        <Label className="text-gray-300 mb-2 block">Artikelen per dag</Label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 5, 10].map((n) => (
                            <button
                              key={n}
                              onClick={() => setSchedule(prev => ({ ...prev, articlesPerDay: n }))}
                              className={`px-4 py-2 rounded-lg border ${
                                schedule.articlesPerDay === n
                                  ? 'border-green-500 bg-green-500/20 text-green-400'
                                  : 'border-gray-700 hover:border-gray-600'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {schedule.mode === 'weekly' && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-300 mb-2 block">Artikelen per week</Label>
                          <div className="flex gap-2 flex-wrap">
                            {[5, 10, 15, 20, 30].map((n) => (
                              <button
                                key={n}
                                onClick={() => setSchedule(prev => ({ ...prev, articlesPerWeek: n }))}
                                className={`px-4 py-2 rounded-lg border ${
                                  schedule.articlesPerWeek === n
                                    ? 'border-green-500 bg-green-500/20 text-green-400'
                                    : 'border-gray-700 hover:border-gray-600'
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-300 mb-2 block">Publicatie dagen</Label>
                          <div className="flex gap-2 flex-wrap">
                            {['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((day, idx) => {
                              const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                              const isSelected = schedule.publishDays?.includes(dayKeys[idx]);
                              return (
                                <button
                                  key={day}
                                  onClick={() => {
                                    const dayKey = dayKeys[idx];
                                    setSchedule(prev => ({
                                      ...prev,
                                      publishDays: isSelected
                                        ? prev.publishDays?.filter(d => d !== dayKey)
                                        : [...(prev.publishDays || []), dayKey]
                                    }));
                                  }}
                                  className={`w-10 h-10 rounded-lg border text-sm font-medium ${
                                    isSelected
                                      ? 'border-green-500 bg-green-500/20 text-green-400'
                                      : 'border-gray-700 hover:border-gray-600'
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Publish Time */}
                    <div className="mt-4">
                      <Label className="text-gray-300 mb-2 block">Publicatie tijd</Label>
                      <Input
                        type="time"
                        value={schedule.publishTime}
                        onChange={(e) => setSchedule(prev => ({ ...prev, publishTime: e.target.value }))}
                        className="w-32 bg-gray-700 border-gray-600"
                      />
                    </div>
                  </div>
                )}
                
                {/* Auto Publish Toggle */}
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-400" />
                        Automatisch Publiceren naar WordPress
                      </div>
                      <div className="text-sm text-gray-400">
                        {selectedProject?.wordpressUrl 
                          ? `Publiceren naar: ${selectedProject.wordpressUrl}`
                          : 'Configureer WordPress in je project instellingen'
                        }
                      </div>
                    </div>
                    <Checkbox
                      checked={schedule.autoPublish}
                      onCheckedChange={(checked) => setSchedule(prev => ({ ...prev, autoPublish: !!checked }))}
                      disabled={!selectedProject?.wordpressUrl}
                    />
                  </label>
                </div>
                
                {/* Bol.com Info */}
                {selectedProject?.bolcomEnabled && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <ShoppingBag className="w-5 h-5" />
                      <span className="font-medium">Bol.com Affiliate Actief</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Reviews en lijstjes worden automatisch verrijkt met Bol.com producten en partnerlinks 
                      (ID: {selectedProject.bolcomAffiliateId})
                    </p>
                  </div>
                )}
                
                {/* Summary */}
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-6 border border-green-500/30">
                  <h3 className="font-bold text-white mb-4">Samenvatting</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Artikelen</div>
                      <div className="text-xl font-bold text-white">{getSelectedCount()}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Schema</div>
                      <div className="text-xl font-bold text-white capitalize">
                        {schedule.mode === 'bulk' ? 'Direct' : schedule.mode}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Auto Publiceren</div>
                      <div className="text-xl font-bold text-white">
                        {schedule.autoPublish ? 'Ja' : 'Nee'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Geschatte tijd</div>
                      <div className="text-xl font-bold text-white">
                        {schedule.mode === 'bulk' 
                          ? `~${Math.ceil(getSelectedCount() * 2)} min`
                          : schedule.mode === 'daily'
                            ? `~${Math.ceil(getSelectedCount() / (schedule.articlesPerDay || 2))} dagen`
                            : `~${Math.ceil(getSelectedCount() / (schedule.articlesPerWeek || 10))} weken`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="border-gray-700"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Terug
                </Button>
                <Button
                  onClick={startContentGeneration}
                  disabled={isStarting || getSelectedCount() === 0}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-8"
                >
                  {isStarting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starten...</>
                  ) : (
                    <><Rocket className="w-4 h-4 mr-2" /> Start Generatie ({getSelectedCount()} artikelen)</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
