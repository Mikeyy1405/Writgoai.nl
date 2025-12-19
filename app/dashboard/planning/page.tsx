'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
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
  Download,
  Copy,
  Filter,
  Layout,
  ChevronRight,
  ChevronDown,
  Search,
  TrendingUp,
  Target,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import ProjectSelector from '@/components/project-selector';

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
  productKeyword?: string;
}

interface Category {
  name: string;
  pillars: ContentItem[];
  clusters: ContentItem[];
  supportingContent: ContentItem[];
}

interface TopicalMap {
  categories: Category[];
  totalItems: number;
  informationalCount: number;
  listicleCount: number;
  reviewCount: number;
  howToCount: number;
  duplicatesRemoved?: number;
}

export default function PlanningPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [projectId, setProjectId] = useState<string>('');
  const [niche, setNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [language, setLanguage] = useState<'NL' | 'EN'>('NL');
  const [targetArticles, setTargetArticles] = useState(400);

  // Content mix state
  const [contentMix, setContentMix] = useState({
    informational: true,
    listicles: true,
    reviews: true,
    howTo: true,
    comparisons: true,
  });

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  // Topical map state
  const [topicalMap, setTopicalMap] = useState<TopicalMap | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filter state
  const [searchFilter, setSearchFilter] = useState('');
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Credits state
  const [credits, setCredits] = useState<number>(0);
  const [isUnlimited, setIsUnlimited] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCredits();
    }
  }, [status]);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/client/credits');
      const data = await res.json();
      setCredits((data.subscriptionCredits || 0) + (data.topUpCredits || 0));
      setIsUnlimited(data.isUnlimited || false);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  // Cost estimation: ~1 credit per 10 topics generated due to AI processing overhead
  // This is a rough estimate; actual cost depends on API response size and complexity
  const estimatedCost = Math.ceil(targetArticles / 10);

  const handleGenerate = async () => {
    if (!projectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    if (!niche) {
      toast.error('Vul het hoofdonderwerp/niche in');
      return;
    }

    if (!isUnlimited && credits < estimatedCost) {
      toast.error(`Onvoldoende credits. Je hebt ${estimatedCost} credits nodig.`);
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressMessage('Voorbereiden...');

    try {
      const response = await fetch('/api/client/content-wizard/generate-topical-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          niche,
          targetAudience,
          targetArticles,
          contentMix,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Generatie mislukt');
      }

      // Handle streaming response
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
            try {
              const data = JSON.parse(line.slice(6));

              if (data.progress !== undefined) {
                setProgress(data.progress);
                if (data.message) setProgressMessage(data.message);
              }

              if (data.topicalMap) {
                setTopicalMap(data.topicalMap);
                toast.success(
                  `✅ Topical map gegenereerd met ${data.topicalMap.totalItems} onderwerpen!`
                );
                // Expand all categories by default
                const categoryNames = new Set(
                  data.topicalMap.categories.map((cat: Category) => cat.name)
                );
                setExpandedCategories(categoryNames);
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e: any) {
              console.error('Parse error:', e);
              // Don't show toast for every parse error as streaming may have incomplete JSON chunks
              // Only critical errors are thrown and handled by the outer catch
            }
          }
        }
      }

      // Refresh credits
      await fetchCredits();
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Er ging iets mis');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(categoryName)) {
      newSet.delete(categoryName);
    } else {
      newSet.add(categoryName);
    }
    setExpandedCategories(newSet);
  };

  const exportToCSV = () => {
    if (!topicalMap) return;

    const rows = [
      ['Category', 'Type', 'Title', 'Keywords', 'Search Intent', 'Priority', 'Estimated Words', 'Product Keyword']
    ];

    topicalMap.categories.forEach((category) => {
      [...category.pillars, ...category.clusters, ...category.supportingContent].forEach((item) => {
        if (item.selected) {
          rows.push([
            category.name,
            item.type,
            item.title,
            item.keywords.join('; '),
            item.searchIntent,
            item.priority,
            item.estimatedWords.toString(),
            item.productKeyword || ''
          ]);
        }
      });
    });

    const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topical-map-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('CSV gedownload!');
  };

  const exportToJSON = () => {
    if (!topicalMap) return;

    const json = JSON.stringify(topicalMap, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topical-map-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('JSON gedownload!');
  };

  const copyToClipboard = () => {
    if (!topicalMap) return;

    let markdown = `# Topical Map\n\n`;
    markdown += `Totaal: ${topicalMap.totalItems} onderwerpen\n\n`;

    topicalMap.categories.forEach((category) => {
      markdown += `## ${category.name}\n\n`;
      
      if (category.pillars.length > 0) {
        markdown += `### Pillar Pages\n\n`;
        category.pillars.forEach((item) => {
          if (item.selected) {
            markdown += `- **${item.title}** (${item.keywords.join(', ')})\n`;
          }
        });
        markdown += `\n`;
      }

      if (category.clusters.length > 0) {
        markdown += `### Cluster Content\n\n`;
        category.clusters.forEach((item) => {
          if (item.selected) {
            markdown += `- ${item.title} [${item.type}] (${item.keywords.join(', ')})\n`;
          }
        });
        markdown += `\n`;
      }

      if (category.supportingContent.length > 0) {
        markdown += `### Supporting Content\n\n`;
        category.supportingContent.forEach((item) => {
          if (item.selected) {
            markdown += `- ${item.title} (${item.keywords.join(', ')})\n`;
          }
        });
        markdown += `\n`;
      }
    });

    navigator.clipboard.writeText(markdown);
    toast.success('Markdown gekopieerd naar clipboard!');
  };

  const getFilteredItems = (items: ContentItem[]) => {
    return items.filter((item) => {
      if (!item.selected) return false;
      if (searchFilter && !item.title.toLowerCase().includes(searchFilter.toLowerCase())) {
        return false;
      }
      if (intentFilter !== 'all' && item.searchIntent !== intentFilter) {
        return false;
      }
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
        return false;
      }
      return true;
    });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0a0a0a] to-gray-900">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#ff6b35] to-orange-600 rounded-xl shadow-lg">
                <Layout className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#ff6b35] to-orange-500 bg-clip-text text-transparent">
                  Topical Map Generator
                </h1>
                <p className="text-gray-400 mt-1">
                  Genereer 400-500 SEO-geoptimaliseerde onderwerpen voor je content strategie
                </p>
              </div>
            </div>

            {!isUnlimited && (
              <Badge variant="outline" className="border-[#ff6b35] text-[#ff6b35] px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                {credits} credits
              </Badge>
            )}
          </div>

          {/* Configuration Card */}
          {!topicalMap && (
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#ff6b35]" />
                  Configuratie
                </CardTitle>
                <CardDescription>
                  Stel je topical map parameters in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Selector */}
                <div className="space-y-2">
                  <Label className="text-white">Project *</Label>
                  <ProjectSelector
                    value={projectId}
                    onChange={(id) => setProjectId(id || '')}
                  />
                </div>

                {/* Main Topic */}
                <div className="space-y-2">
                  <Label className="text-white">Hoofdonderwerp / Niche *</Label>
                  <Input
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Bijv: Yoga voor beginners, Elektrische auto's, Gezonde recepten"
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <Label className="text-white">Doelgroep beschrijving</Label>
                  <Textarea
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Beschrijf je doelgroep (optioneel)"
                    className="bg-gray-900 border-gray-700 text-white"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Language */}
                  <div className="space-y-2">
                    <Label className="text-white">Taal</Label>
                    <Select value={language} onValueChange={(val: 'NL' | 'EN') => setLanguage(val)}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NL">Nederlands</SelectItem>
                        <SelectItem value="EN">Engels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Articles */}
                  <div className="space-y-2">
                    <Label className="text-white">
                      Aantal onderwerpen: {targetArticles}
                    </Label>
                    <Slider
                      value={[targetArticles]}
                      onValueChange={(vals) => setTargetArticles(vals[0])}
                      min={400}
                      max={500}
                      step={10}
                      className="py-2"
                    />
                  </div>
                </div>

                {/* Content Mix */}
                <div className="space-y-3">
                  <Label className="text-white">Content Mix</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(contentMix).map(([key, value]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 cursor-pointer bg-gray-900/50 p-3 rounded-lg border border-gray-700 hover:border-[#ff6b35] transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            setContentMix({ ...contentMix, [key]: e.target.checked })
                          }
                          className="w-4 h-4 accent-[#ff6b35]"
                        />
                        <span className="text-sm text-gray-300 capitalize">
                          {key === 'howTo' ? 'How-To Guides' : key}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cost Estimate */}
                {!isUnlimited && (
                  <div className="p-4 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-lg">
                    <p className="text-sm text-[#ff6b35] font-medium">
                      💰 Geschatte kosten: ~{estimatedCost} credits
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Deze grote generatie vereist meer credits vanwege de omvang
                    </p>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !projectId || !niche}
                  className="w-full bg-gradient-to-r from-[#ff6b35] to-orange-600 hover:from-orange-600 hover:to-[#ff6b35] text-white h-12 text-lg font-semibold"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Genereer Topical Map
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          {isGenerating && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[#ff6b35]" />
                    <div className="flex-1">
                      <p className="text-base text-white font-medium">{progressMessage}</p>
                      <p className="text-sm text-gray-400">{progress}%</p>
                    </div>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {topicalMap && (
            <>
              {/* Stats & Actions */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#ff6b35]" />
                        <div>
                          <p className="text-2xl font-bold text-white">{topicalMap.totalItems}</p>
                          <p className="text-xs text-gray-400">Totaal onderwerpen</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold text-white">
                            {topicalMap.categories.length}
                          </p>
                          <p className="text-xs text-gray-400">Categorieën</p>
                        </div>
                      </div>
                      {topicalMap.duplicatesRemoved && topicalMap.duplicatesRemoved > 0 && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                          <div>
                            <p className="text-2xl font-bold text-white">
                              {topicalMap.duplicatesRemoved}
                            </p>
                            <p className="text-xs text-gray-400">Duplicaten uitgesloten</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={exportToCSV}
                        variant="outline"
                        className="border-gray-700 text-white hover:bg-gray-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                      </Button>
                      <Button
                        onClick={exportToJSON}
                        variant="outline"
                        className="border-gray-700 text-white hover:bg-gray-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        JSON
                      </Button>
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        className="border-gray-700 text-white hover:bg-gray-700"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Markdown
                      </Button>
                      <Button
                        onClick={() => {
                          setTopicalMap(null);
                          setProgress(0);
                          setProgressMessage('');
                        }}
                        className="bg-[#ff6b35] hover:bg-orange-600 text-white"
                      >
                        Nieuwe Generatie
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          placeholder="Zoek onderwerpen..."
                          className="pl-10 bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>

                    <Select value={intentFilter} onValueChange={setIntentFilter}>
                      <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Search Intent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Intents</SelectItem>
                        <SelectItem value="informational">Informational</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="navigational">Navigational</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Prioriteit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Prioriteiten</SelectItem>
                        <SelectItem value="high">Hoog</SelectItem>
                        <SelectItem value="medium">Gemiddeld</SelectItem>
                        <SelectItem value="low">Laag</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <div className="space-y-4">
                {topicalMap.categories.map((category) => {
                  const isExpanded = expandedCategories.has(category.name);
                  const allItems = [
                    ...category.pillars,
                    ...category.clusters,
                    ...category.supportingContent,
                  ];
                  const visibleItems = getFilteredItems(allItems);

                  if (visibleItems.length === 0 && (searchFilter || intentFilter !== 'all' || priorityFilter !== 'all')) {
                    return null;
                  }

                  return (
                    <Card key={category.name} className="bg-gray-800/50 border-gray-700">
                      <CardHeader
                        className="cursor-pointer hover:bg-gray-800/30 transition-colors"
                        onClick={() => toggleCategory(category.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-[#ff6b35]" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-[#ff6b35]" />
                            )}
                            <CardTitle className="text-xl text-white">
                              {category.name}
                            </CardTitle>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="border-[#ff6b35] text-[#ff6b35]">
                              {category.pillars.length} Pillars
                            </Badge>
                            <Badge variant="outline" className="border-blue-500 text-blue-500">
                              {category.clusters.length} Clusters
                            </Badge>
                            <Badge variant="outline" className="border-green-500 text-green-500">
                              {category.supportingContent.length} Supporting
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="space-y-6">
                          {/* Pillars */}
                          {getFilteredItems(category.pillars).length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-[#ff6b35] mb-3">
                                📌 Pillar Pages
                              </h4>
                              <div className="space-y-2">
                                {getFilteredItems(category.pillars).map((item) => (
                                  <div
                                    key={item.id}
                                    className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-[#ff6b35] transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <h5 className="text-white font-medium">{item.title}</h5>
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                          <Badge variant="secondary" className="text-xs">
                                            {item.type}
                                          </Badge>
                                          <Badge variant="secondary" className="text-xs">
                                            {item.searchIntent}
                                          </Badge>
                                          <Badge
                                            variant="secondary"
                                            className={`text-xs ${
                                              item.priority === 'high'
                                                ? 'bg-red-900/50 text-red-300'
                                                : item.priority === 'medium'
                                                ? 'bg-yellow-900/50 text-yellow-300'
                                                : 'bg-green-900/50 text-green-300'
                                            }`}
                                          >
                                            {item.priority}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                          Keywords: {item.keywords.join(', ')}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          ~{item.estimatedWords} woorden
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Clusters */}
                          {getFilteredItems(category.clusters).length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-blue-500 mb-3">
                                🔗 Cluster Content
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {getFilteredItems(category.clusters).map((item) => (
                                  <div
                                    key={item.id}
                                    className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
                                  >
                                    <h5 className="text-white text-sm font-medium">{item.title}</h5>
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                      <Badge variant="secondary" className="text-xs">
                                        {item.type}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {item.searchIntent}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {item.keywords.slice(0, 2).join(', ')}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Supporting Content */}
                          {getFilteredItems(category.supportingContent).length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-green-500 mb-3">
                                📝 Supporting Content
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {getFilteredItems(category.supportingContent).map((item) => (
                                  <div
                                    key={item.id}
                                    className="p-2 bg-gray-900/50 rounded border border-gray-700 hover:border-green-500 transition-colors"
                                  >
                                    <h5 className="text-white text-xs font-medium line-clamp-2">
                                      {item.title}
                                    </h5>
                                    <div className="flex gap-1 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {item.type}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
