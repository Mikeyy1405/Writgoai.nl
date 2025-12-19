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
  Map,
  Loader2,
  Download,
  Copy,
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  X,
  Save,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import ProjectSelector from '@/components/project-selector';

// Types
interface TopicalMapItem {
  id: string;
  title: string;
  type: 'pillar' | 'cluster' | 'article';
  parentId: string | null;
  searchIntent: 'informational' | 'transactional' | 'navigational';
  priority: number; // 1-10
  keywords: string[];
  estimatedVolume: 'high' | 'medium' | 'low';
  internalLinks: string[];
}

interface SavedMap {
  id: string;
  name: string;
  items: TopicalMapItem[];
  createdAt: string;
  niche: string;
}

export default function TopicalMapGeneratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Form state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [niche, setNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [topicCount, setTopicCount] = useState([450]);
  const [language, setLanguage] = useState('nl');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [canCancel, setCanCancel] = useState(false);

  // Results state
  const [generatedMap, setGeneratedMap] = useState<TopicalMapItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIntent, setFilterIntent] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterPillar, setFilterPillar] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'title' | 'volume'>('priority');

  // Saved maps
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]);
  const [showSavedMaps, setShowSavedMaps] = useState(false);

  // Credits
  const [userCredits, setUserCredits] = useState<number>(0);
  const creditCost = 500;

  // Load user credits
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserCredits();
    }
  }, [session]);

  // Load saved maps when project changes
  useEffect(() => {
    if (projectId) {
      loadSavedMaps();
    }
  }, [projectId]);

  const fetchUserCredits = async () => {
    try {
      const res = await fetch('/api/client/credits');
      const data = await res.json();
      if (data.success) {
        setUserCredits(data.subscriptionCredits + data.topUpCredits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const loadSavedMaps = async () => {
    if (!projectId) return;

    try {
      const res = await fetch(`/api/client/topical-maps?projectId=${projectId}`);
      const data = await res.json();
      if (data.success) {
        setSavedMaps(data.maps || []);
      }
    } catch (error) {
      console.error('Error loading saved maps:', error);
    }
  };

  const handleGenerate = async () => {
    if (!niche.trim()) {
      toast.error('Voer een hoofdonderwerp/niche in');
      return;
    }

    // Credit check - but according to credits.ts, this always returns true now
    if (userCredits < creditCost) {
      toast.error(`Niet genoeg credits. Je hebt ${userCredits} credits, maar er zijn ${creditCost} nodig.`);
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressMessage('Voorbereiden...');
    setCanCancel(true);

    try {
      // Build the prompt
      const prompt = `Genereer een complete SEO topical map voor het onderwerp: ${niche}
${targetAudience ? `Target audience: ${targetAudience}` : ''}

Structuur:
- 12-15 Pillar Pages (hoofdonderwerpen, hoofd keywords)
- 50-75 Cluster Topics (subtopics, per pillar ~5 clusters)  
- ${topicCount[0] - 65}-${topicCount[0] - 62} Supporting Articles (long-tail keywords, per cluster ~5-7 articles)

Voor ELK onderwerp, return als JSON met:
{
  "title": "Onderwerp titel",
  "type": "pillar" | "cluster" | "article",
  "parentId": "id van parent (null voor pillars)",
  "searchIntent": "informational" | "transactional" | "navigational",
  "priority": 1-10 (10 = hoogste prioriteit),
  "keywords": ["keyword1", "keyword2"],
  "estimatedVolume": "high" | "medium" | "low",
  "internalLinks": ["id1", "id2"]
}

Output pure JSON array, geen markdown. Genereer ongeveer ${topicCount[0]} onderwerpen in totaal.`;

      setProgressMessage('Genereren van topical map...');
      setProgress(10);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          clientId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Generatie mislukt');
      }

      const data = await response.json();
      setProgress(80);
      setProgressMessage('Verwerken van resultaten...');

      // Parse the response
      let items: TopicalMapItem[] = [];
      try {
        // Try to extract JSON from the response
        const content = data.response || data.message || '';
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          items = JSON.parse(jsonMatch[0]);
          
          // Add IDs if not present
          items = items.map((item, index) => ({
            ...item,
            id: item.id || `item-${index}`,
          }));
        } else {
          throw new Error('Geen geldige JSON gevonden in response');
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        toast.error('Fout bij verwerken van AI response. Probeer opnieuw.');
        setIsGenerating(false);
        return;
      }

      setGeneratedMap(items);
      setProgress(100);
      setProgressMessage('Voltooid!');
      
      toast.success(`${items.length} onderwerpen gegenereerd!`);
      
      // Note: Credits are tracked but not deducted (pay-as-you-go model)
      await fetch('/api/client/credits/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: creditCost,
          description: `Topical Map Generator - ${topicCount[0]} onderwerpen`,
        }),
      });

    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Fout bij genereren. Probeer opnieuw.');
    } finally {
      setIsGenerating(false);
      setCanCancel(false);
    }
  };

  const handleCancel = () => {
    setIsGenerating(false);
    setCanCancel(false);
    toast.info('Generatie geannuleerd');
  };

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getFilteredAndSortedItems = () => {
    let filtered = [...generatedMap];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Intent filter
    if (filterIntent !== 'all') {
      filtered = filtered.filter(item => item.searchIntent === filterIntent);
    }

    // Priority filter
    if (filterPriority === 'high') {
      filtered = filtered.filter(item => item.priority >= 8);
    } else if (filterPriority === 'medium') {
      filtered = filtered.filter(item => item.priority >= 5 && item.priority < 8);
    } else if (filterPriority === 'low') {
      filtered = filtered.filter(item => item.priority < 5);
    }

    // Pillar filter
    if (filterPillar !== 'all') {
      const pillarItems = filtered.filter(item => item.type === 'pillar');
      const selectedPillar = pillarItems.find(p => p.id === filterPillar);
      if (selectedPillar) {
        filtered = filtered.filter(item => 
          item.id === filterPillar || 
          item.parentId === filterPillar ||
          (item.type === 'article' && filtered.some(cluster => 
            cluster.id === item.parentId && cluster.parentId === filterPillar
          ))
        );
      }
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        return b.priority - a.priority;
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'volume') {
        const volumeOrder = { high: 3, medium: 2, low: 1 };
        return volumeOrder[b.estimatedVolume] - volumeOrder[a.estimatedVolume];
      }
      return 0;
    });

    return filtered;
  };

  const exportAsCSV = () => {
    const csv = ['Type,Title,Parent,Priority,Search Intent,Keywords,Volume'];
    
    generatedMap.forEach(item => {
      const parent = item.parentId 
        ? generatedMap.find(i => i.id === item.parentId)?.title || ''
        : '';
      csv.push(
        `${item.type},"${item.title}","${parent}",${item.priority},${item.searchIntent},"${item.keywords.join(', ')}",${item.estimatedVolume}`
      );
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topical-map-${niche.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.csv`;
    a.click();
    toast.success('CSV geëxporteerd!');
  };

  const exportAsJSON = () => {
    const blob = new Blob([JSON.stringify(generatedMap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topical-map-${niche.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    a.click();
    toast.success('JSON geëxporteerd!');
  };

  const copyAsMarkdown = () => {
    let markdown = `# Topical Map: ${niche}\n\n`;
    
    const pillars = generatedMap.filter(i => i.type === 'pillar');
    pillars.forEach(pillar => {
      markdown += `## ${pillar.title}\n`;
      markdown += `- **Priority**: ${pillar.priority}/10\n`;
      markdown += `- **Intent**: ${pillar.searchIntent}\n`;
      markdown += `- **Keywords**: ${pillar.keywords.join(', ')}\n\n`;
      
      const clusters = generatedMap.filter(i => i.type === 'cluster' && i.parentId === pillar.id);
      clusters.forEach(cluster => {
        markdown += `### ${cluster.title}\n`;
        markdown += `- **Priority**: ${cluster.priority}/10\n`;
        markdown += `- **Keywords**: ${cluster.keywords.join(', ')}\n\n`;
        
        const articles = generatedMap.filter(i => i.type === 'article' && i.parentId === cluster.id);
        articles.forEach(article => {
          markdown += `#### ${article.title}\n`;
          markdown += `- Priority: ${article.priority}/10, Intent: ${article.searchIntent}\n`;
          markdown += `- Keywords: ${article.keywords.join(', ')}\n\n`;
        });
      });
    });

    navigator.clipboard.writeText(markdown);
    toast.success('Markdown gekopieerd naar clipboard!');
  };

  const saveToProject = async () => {
    if (!projectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    if (generatedMap.length === 0) {
      toast.error('Geen topical map om op te slaan');
      return;
    }

    try {
      const res = await fetch('/api/client/topical-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: niche,
          niche,
          items: generatedMap,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Topical map opgeslagen!');
        loadSavedMaps();
      } else {
        toast.error('Fout bij opslaan');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Fout bij opslaan');
    }
  };

  const loadMap = (map: SavedMap) => {
    setGeneratedMap(map.items);
    setNiche(map.niche);
    toast.success('Map geladen!');
    setShowSavedMaps(false);
  };

  const deleteMap = async (mapId: string) => {
    if (!confirm('Weet je zeker dat je deze map wilt verwijderen?')) return;

    try {
      const res = await fetch(`/api/client/topical-maps/${mapId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Map verwijderd!');
        loadSavedMaps();
      } else {
        toast.error('Fout bij verwijderen');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fout bij verwijderen');
    }
  };

  const renderTreeItem = (item: TopicalMapItem, depth: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const children = generatedMap.filter(i => i.parentId === item.id);
    const hasChildren = children.length > 0;

    return (
      <div key={item.id} className="mb-2">
        <div
          className={`flex items-start gap-2 p-3 rounded-lg border border-gray-700 bg-gray-800/30 hover:bg-gray-800/50 transition-colors ${
            depth > 0 ? 'ml-6' : ''
          }`}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpand(item.id)}
              className="mt-1 text-gray-400 hover:text-white"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge
                variant="outline"
                className={`
                  ${item.type === 'pillar' ? 'bg-[#ff6b35] text-white border-[#ff6b35]' : ''}
                  ${item.type === 'cluster' ? 'bg-blue-600 text-white border-blue-600' : ''}
                  ${item.type === 'article' ? 'bg-green-600 text-white border-green-600' : ''}
                `}
              >
                {item.type}
              </Badge>
              <Badge variant="outline" className="bg-gray-700 text-white border-gray-600">
                {item.searchIntent}
              </Badge>
              <Badge variant="outline" className="bg-gray-700 text-white border-gray-600">
                Priority: {item.priority}/10
              </Badge>
              <Badge
                variant="outline"
                className={`
                  ${item.estimatedVolume === 'high' ? 'bg-green-700 text-white border-green-600' : ''}
                  ${item.estimatedVolume === 'medium' ? 'bg-yellow-700 text-white border-yellow-600' : ''}
                  ${item.estimatedVolume === 'low' ? 'bg-red-700 text-white border-red-600' : ''}
                `}
              >
                {item.estimatedVolume} volume
              </Badge>
            </div>
            
            <h3 className="font-semibold text-white mb-1">{item.title}</h3>
            
            {item.keywords.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {item.keywords.slice(0, 3).map((keyword, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                    {keyword}
                  </span>
                ))}
                {item.keywords.length > 3 && (
                  <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                    +{item.keywords.length - 3} meer
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-2">
            {children.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  const filteredItems = getFilteredAndSortedItems();
  const pillars = filteredItems.filter(i => i.type === 'pillar');
  const hasEnoughCredits = userCredits >= creditCost;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#ff6b35] to-[#ff8c61] rounded-xl">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Topical Map Generator</h1>
              <p className="text-gray-400">Genereer 400-500 SEO onderwerpen in een hiërarchische structuur</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Credits</div>
            <div className="text-xl font-bold text-[#ff6b35]">{userCredits}</div>
          </div>
        </div>

        {/* Input Section */}
        <Card className="bg-gray-950 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Map Configuratie</CardTitle>
            <CardDescription className="text-gray-400">
              Configureer je topical map generatie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Selector */}
            <div>
              <ProjectSelector
                value={projectId}
                onChange={(id) => setProjectId(id)}
                label="Project (optioneel)"
              />
            </div>

            {/* Niche */}
            <div>
              <Label htmlFor="niche" className="text-white">Hoofdonderwerp/Niche *</Label>
              <Input
                id="niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Bijv. Digital Marketing, Fitness, Webdesign..."
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Target Audience */}
            <div>
              <Label htmlFor="audience" className="text-white">Target Audience (optioneel)</Label>
              <Textarea
                id="audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Bijv. MKB ondernemers, fitness enthousiastelingen, web developers..."
                className="bg-gray-900 border-gray-700 text-white"
                rows={3}
              />
            </div>

            {/* Topic Count */}
            <div>
              <Label className="text-white">Aantal onderwerpen: {topicCount[0]}</Label>
              <Slider
                value={topicCount}
                onValueChange={setTopicCount}
                min={400}
                max={500}
                step={10}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>400</span>
                <span>500</span>
              </div>
            </div>

            {/* Language */}
            <div>
              <Label className="text-white">Taal</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Nederlands</SelectItem>
                  <SelectItem value="en">Engels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <div className="pt-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !hasEnoughCredits || !niche.trim()}
                className="w-full bg-[#ff6b35] hover:bg-[#ff5722] text-white"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Genereren...
                  </>
                ) : (
                  <>
                    <Map className="w-5 h-5 mr-2" />
                    Genereer Topical Map (Kost ~{creditCost} credits)
                  </>
                )}
              </Button>
              {!hasEnoughCredits && (
                <p className="text-red-400 text-sm mt-2 text-center">
                  Niet genoeg credits. Je hebt {userCredits} credits, maar er zijn {creditCost} nodig.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        {isGenerating && (
          <Card className="bg-gray-950 border-gray-800">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{progressMessage}</span>
                  <span className="text-gray-400">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                {canCancel && (
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    Annuleren
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {generatedMap.length > 0 && (
          <>
            {/* Export & Save Actions */}
            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={exportAsCSV}
                    variant="outline"
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSV Export
                  </Button>
                  <Button
                    onClick={exportAsJSON}
                    variant="outline"
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    JSON Export
                  </Button>
                  <Button
                    onClick={copyAsMarkdown}
                    variant="outline"
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy as Markdown
                  </Button>
                  {projectId && (
                    <Button
                      onClick={saveToProject}
                      className="bg-[#ff6b35] hover:bg-[#ff5722] text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save to Project
                    </Button>
                  )}
                  {projectId && savedMaps.length > 0 && (
                    <Button
                      onClick={() => setShowSavedMaps(!showSavedMaps)}
                      variant="outline"
                      className="border-gray-700 text-white hover:bg-gray-800"
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Saved Maps ({savedMaps.length})
                    </Button>
                  )}
                </div>

                {/* Saved Maps List */}
                {showSavedMaps && savedMaps.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {savedMaps.map((map) => (
                      <div
                        key={map.id}
                        className="flex items-center justify-between p-3 bg-gray-900 rounded-lg"
                      >
                        <div>
                          <div className="text-white font-medium">{map.name}</div>
                          <div className="text-sm text-gray-400">
                            {map.items.length} items • {new Date(map.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => loadMap(map)}
                            size="sm"
                            className="bg-[#ff6b35] hover:bg-[#ff5722] text-white"
                          >
                            Load
                          </Button>
                          <Button
                            onClick={() => deleteMap(map.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filters & Search */}
            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Search */}
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Zoek onderwerpen..."
                        className="pl-10 bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                  </div>

                  {/* Intent Filter */}
                  <Select value={filterIntent} onValueChange={setFilterIntent}>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Search Intent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Intents</SelectItem>
                      <SelectItem value="informational">Informational</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="navigational">Navigational</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Priority Filter */}
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High (8-10)</SelectItem>
                      <SelectItem value="medium">Medium (5-7)</SelectItem>
                      <SelectItem value="low">Low (1-4)</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">By Priority</SelectItem>
                      <SelectItem value="title">By Title</SelectItem>
                      <SelectItem value="volume">By Volume</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Active Filters */}
                {(searchTerm || filterIntent !== 'all' || filterPriority !== 'all' || filterPillar !== 'all') && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {searchTerm && (
                      <Badge variant="outline" className="bg-gray-800 text-white border-gray-700">
                        Search: {searchTerm}
                        <X
                          className="w-3 h-3 ml-2 cursor-pointer"
                          onClick={() => setSearchTerm('')}
                        />
                      </Badge>
                    )}
                    {filterIntent !== 'all' && (
                      <Badge variant="outline" className="bg-gray-800 text-white border-gray-700">
                        Intent: {filterIntent}
                        <X
                          className="w-3 h-3 ml-2 cursor-pointer"
                          onClick={() => setFilterIntent('all')}
                        />
                      </Badge>
                    )}
                    {filterPriority !== 'all' && (
                      <Badge variant="outline" className="bg-gray-800 text-white border-gray-700">
                        Priority: {filterPriority}
                        <X
                          className="w-3 h-3 ml-2 cursor-pointer"
                          onClick={() => setFilterPriority('all')}
                        />
                      </Badge>
                    )}
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterIntent('all');
                        setFilterPriority('all');
                        setFilterPillar('all');
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results Display */}
            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">
                  Topical Map Results ({filteredItems.length} items)
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {pillars.length} Pillars • {filteredItems.filter(i => i.type === 'cluster').length} Clusters • {filteredItems.filter(i => i.type === 'article').length} Articles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pillars.map(pillar => renderTreeItem(pillar))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {generatedMap.length === 0 && !isGenerating && (
          <Card className="bg-gray-950 border-gray-800">
            <CardContent className="py-12 text-center">
              <Map className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">Geen topical map gegenereerd</h3>
              <p className="text-gray-400">
                Vul de configuratie hierboven in en klik op &quot;Genereer Topical Map&quot; om te beginnen
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
