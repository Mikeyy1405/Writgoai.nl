'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Loader2,
  CheckCircle2,
  Network,
  Play,
  Pause,
  LayoutGrid,
  LayoutList,
  TrendingUp,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WebsiteAnalysis {
  niche: string;
  nicheConfidence: number;
  targetAudience: string;
  audienceConfidence: number;
  tone: string;
  toneConfidence: number;
  keywords: string[];
  themes: string[];
  reasoning: string;
}

interface TopicalAuthorityMapGeneratorProps {
  websiteAnalysis?: WebsiteAnalysis | null;
  onComplete?: () => void;
}

interface MapConfig {
  name: string;
  niche: string;
  targetAudience: string;
  language: string;
  tone: string;
  keywords: string;
  totalArticles: number;
  pillarClusterRatio: string;
}

interface Article {
  id: string;
  title: string;
  description: string;
  type: 'pillar' | 'cluster';
  parentId: string | null;
  primaryKeyword: string;
  secondaryKeywords: string[];
  contentType: string;
  wordCount: number;
  difficultyLevel: string;
  status: string;
  order: number;
  priority: number;
}

interface GeneratedMap {
  id: string;
  name: string;
  niche: string;
  targetAudience: string;
  totalArticles: number;
  pillarCount: number;
  clusterCount: number;
  status: string;
  estimatedTimeWeeks: number;
  keywordCoverage: number;
}

export default function TopicalAuthorityMapGenerator({ 
  websiteAnalysis, 
  onComplete 
}: TopicalAuthorityMapGeneratorProps) {
  const [step, setStep] = useState<'config' | 'preview' | 'generating'>('config');
  const [generating, setGenerating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');

  // Configuration state
  const [config, setConfig] = useState<MapConfig>({
    name: '',
    niche: '',
    targetAudience: '',
    language: 'nl',
    tone: 'professioneel',
    keywords: '',
    totalArticles: 100,
    pillarClusterRatio: '1:10',
  });

  // Pre-fill configuration from website analysis
  useEffect(() => {
    if (websiteAnalysis) {
      setConfig(prev => ({
        ...prev,
        niche: websiteAnalysis.niche || prev.niche,
        targetAudience: websiteAnalysis.targetAudience || prev.targetAudience,
        tone: websiteAnalysis.tone?.toLowerCase() || prev.tone,
        keywords: websiteAnalysis.keywords?.join(', ') || prev.keywords,
      }));
      
      if (websiteAnalysis.niche && websiteAnalysis.targetAudience) {
        toast.success('✨ Velden automatisch ingevuld met website analyse!');
      }
    }
  }, [websiteAnalysis]);

  // Generated map
  const [map, setMap] = useState<GeneratedMap | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);

  // Progress tracking
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [articlesGenerated, setArticlesGenerated] = useState(0);
  const [articlesFailed, setArticlesFailed] = useState(0);
  const [etaMinutes, setEtaMinutes] = useState(0);

  // Poll for progress updates when generating
  useEffect(() => {
    if (step === 'generating' && map?.id) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/admin/blog/topical-map/${map.id}/progress`);
          if (res.ok) {
            const data = await res.json();
            
            setProgress(data.progress.percentage);
            setArticlesGenerated(data.progress.articlesGenerated);
            setArticlesFailed(data.progress.articlesFailed);
            setEtaMinutes(data.progress.etaMinutes);
            setIsGenerating(data.isGenerating);
            
            if (!data.isGenerating && data.progress.percentage === 100) {
              clearInterval(interval);
              toast.success('🎉 Topical Authority Map voltooid!');
              setTimeout(() => {
                onComplete?.();
              }, 2000);
            }
          }
        } catch (error) {
          console.error('Error polling progress:', error);
        }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [step, map?.id, onComplete]);

  const handleGenerateMap = async () => {
    if (!config.name || !config.niche || !config.targetAudience) {
      toast.error('Vul naam, niche en doelgroep in');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/admin/blog/topical-map/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Generatie mislukt');
      }

      const data = await res.json();
      
      if (!data.success || !data.map || !data.articles) {
        throw new Error('Ongeldige response van server');
      }

      setMap(data.map);
      setArticles(data.articles);
      setStep('preview');
      
      toast.success(`✨ ${data.map.pillarCount} pillars + ${data.map.clusterCount} clusters gegenereerd!`);
    } catch (error: any) {
      console.error('Generate error:', error);
      toast.error(error.message || 'Fout bij genereren topical map');
    } finally {
      setGenerating(false);
    }
  };

  const handleStartGeneration = async () => {
    if (!map?.id) return;

    if (!confirm(`Je gaat ${map.totalArticles} artikelen genereren. Dit kan uren duren. Doorgaan?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/blog/topical-map/${map.id}/start-generation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 20 }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Start generatie mislukt');
      }

      setStep('generating');
      setProgress(0);
      setCurrentStatus('Bezig met genereren...');
      toast.success('Batch generatie gestart!');
    } catch (error: any) {
      console.error('Start generation error:', error);
      toast.error(error.message || 'Fout bij starten generatie');
    }
  };

  const handlePauseGeneration = async () => {
    if (!map?.id) return;

    try {
      const res = await fetch(`/api/admin/blog/topical-map/${map.id}/pause`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Pause mislukt');
      }

      toast.success('Generatie gepauzeerd');
      setIsGenerating(false);
    } catch (error: any) {
      console.error('Pause error:', error);
      toast.error(error.message || 'Fout bij pauzeren');
    }
  };

  // Config Step
  if (step === 'config') {
    return (
      <Card className="bg-gradient-to-br from-orange-900/40 to-amber-900/40 border-orange-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <Network className="w-6 h-6 text-orange-400" />
            </div>
            Topical Authority Map Generator
          </CardTitle>
          <p className="text-gray-400 text-sm mt-2">
            Genereer een complete topical authority map met 100-500 artikelen in pillar/cluster structuur. 
            Perfect voor het opbouwen van domeinautoriteit en SEO ranking.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Map Name */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Map Naam *</Label>
            <Input
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="bijv. Complete Yoga Authority Map 2025"
              className="h-14 bg-gray-800/50 border-gray-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Aantal Artikelen */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Totaal Aantal Artikelen</Label>
              <Select
                value={config.totalArticles.toString()}
                onValueChange={(v) => setConfig({ ...config, totalArticles: parseInt(v) })}
              >
                <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 artikelen</SelectItem>
                  <SelectItem value="100">100 artikelen</SelectItem>
                  <SelectItem value="150">150 artikelen</SelectItem>
                  <SelectItem value="200">200 artikelen</SelectItem>
                  <SelectItem value="300">300 artikelen</SelectItem>
                  <SelectItem value="400">400 artikelen</SelectItem>
                  <SelectItem value="500">500 artikelen</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Meer artikelen = betere topical coverage
              </p>
            </div>

            {/* Pillar/Cluster Ratio */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Pillar/Cluster Ratio</Label>
              <Select
                value={config.pillarClusterRatio}
                onValueChange={(v) => setConfig({ ...config, pillarClusterRatio: v })}
              >
                <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:5">1:5 (meer pillars)</SelectItem>
                  <SelectItem value="1:8">1:8 (gebalanceerd)</SelectItem>
                  <SelectItem value="1:10">1:10 (aanbevolen)</SelectItem>
                  <SelectItem value="1:12">1:12 (meer clusters)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                1:10 = 1 pillar per 10 cluster artikelen
              </p>
            </div>

            {/* Niche */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Niche/Onderwerp *</Label>
                {websiteAnalysis?.niche && (
                  <>
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-300">
                      ✨ Auto-detected
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        websiteAnalysis.nicheConfidence >= 80 
                          ? 'bg-green-500/20 text-green-400' 
                          : websiteAnalysis.nicheConfidence >= 60 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      {websiteAnalysis.nicheConfidence}% confidence
                    </Badge>
                  </>
                )}
              </div>
              <Input
                value={config.niche}
                onChange={(e) => setConfig({ ...config, niche: e.target.value })}
                placeholder="bijv. yoga, marketing, gezondheid"
                className="h-14 bg-gray-800/50 border-gray-700"
              />
            </div>

            {/* Doelgroep */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Doelgroep *</Label>
                {websiteAnalysis?.targetAudience && (
                  <>
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-300">
                      ✨ Auto-detected
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        websiteAnalysis.audienceConfidence >= 80 
                          ? 'bg-green-500/20 text-green-400' 
                          : websiteAnalysis.audienceConfidence >= 60 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      {websiteAnalysis.audienceConfidence}% confidence
                    </Badge>
                  </>
                )}
              </div>
              <Input
                value={config.targetAudience}
                onChange={(e) => setConfig({ ...config, targetAudience: e.target.value })}
                placeholder="bijv. beginners, professionals, ondernemers"
                className="h-14 bg-gray-800/50 border-gray-700"
              />
            </div>

            {/* Taal */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Taal</Label>
              <Select
                value={config.language}
                onValueChange={(v) => setConfig({ ...config, language: v })}
              >
                <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Nederlands</SelectItem>
                  <SelectItem value="en">Engels</SelectItem>
                  <SelectItem value="de">Duits</SelectItem>
                  <SelectItem value="fr">Frans</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Tone</Label>
                {websiteAnalysis?.tone && (
                  <>
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-300">
                      ✨ Auto-detected
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        websiteAnalysis.toneConfidence >= 80 
                          ? 'bg-green-500/20 text-green-400' 
                          : websiteAnalysis.toneConfidence >= 60 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      {websiteAnalysis.toneConfidence}% confidence
                    </Badge>
                  </>
                )}
              </div>
              <Select
                value={config.tone}
                onValueChange={(v) => setConfig({ ...config, tone: v })}
              >
                <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professioneel">Professioneel</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="informatief">Informatief</SelectItem>
                  <SelectItem value="inspirerend">Inspirerend</SelectItem>
                  <SelectItem value="educatief">Educatief</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Keywords (optional) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Focus Keywords (optioneel)</Label>
              {websiteAnalysis?.keywords && websiteAnalysis.keywords.length > 0 && (
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-300">
                  ✨ Auto-detected {websiteAnalysis.keywords.length} keywords
                </Badge>
              )}
            </div>
            <Textarea
              value={config.keywords}
              onChange={(e) => setConfig({ ...config, keywords: e.target.value })}
              placeholder="Voer hoofdkeywords in, gescheiden door komma's"
              className="min-h-[80px] bg-gray-800/50 border-gray-700"
            />
            <p className="text-xs text-gray-500">
              Optioneel: voeg hoofdkeywords toe voor extra focus
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-blue-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Wat is een Topical Authority Map?
            </h4>
            <p className="text-sm text-gray-300">
              Een topical authority map is een gestructureerde content strategie met <strong>pillar pages</strong> (hoofdonderwerpen) 
              en <strong>cluster artikelen</strong> (ondersteunende content). Deze structuur helpt je:
            </p>
            <ul className="text-sm text-gray-300 space-y-1 ml-4">
              <li>• Volledige coverage van je niche</li>
              <li>• Betere SEO ranking door interne linking</li>
              <li>• Opbouwen van domeinautoriteit</li>
              <li>• Systematische content productie</li>
            </ul>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateMap}
            disabled={generating || !config.name || !config.niche || !config.targetAudience}
            className="w-full h-16 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-lg font-semibold"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Map wordt gegenereerd... (dit kan 1-2 minuten duren)
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Genereer Topical Authority Map
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Preview Step
  if (step === 'preview' && map) {
    const pillars = articles.filter(a => a.type === 'pillar');

    return (
      <div className="space-y-6">
        {/* Header with Stats */}
        <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              {map.name}
            </CardTitle>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-400">{map.totalArticles}</div>
                <div className="text-sm text-gray-400">Totaal Artikelen</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-400">{map.pillarCount}</div>
                <div className="text-sm text-gray-400">Pillar Pages</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-400">{map.clusterCount}</div>
                <div className="text-sm text-gray-400">Cluster Artikelen</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-orange-400">{map.estimatedTimeWeeks}</div>
                <div className="text-sm text-gray-400">Weken @ 3x/week</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode('tree')}
              variant={viewMode === 'tree' ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
            >
              <Network className="w-4 h-4" />
              Tree View
            </Button>
            <Button
              onClick={() => setViewMode('table')}
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
            >
              <LayoutList className="w-4 h-4" />
              Table View
            </Button>
          </div>
          <Badge variant="secondary" className="text-base px-4 py-2">
            {map.keywordCoverage} unieke keywords
          </Badge>
        </div>

        {/* Content Display */}
        {viewMode === 'tree' ? (
          <div className="space-y-4">
            {pillars.map((pillar, index) => {
              const clusters = articles.filter(a => a.type === 'cluster' && a.parentId === pillar.id);
              
              return (
                <Card key={pillar.id} className="bg-gray-800/50 border-blue-500/30">
                  <CardContent className="p-6">
                    {/* Pillar */}
                    <div className="mb-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-xl font-bold text-blue-400">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="default" className="bg-blue-600">PILLAR</Badge>
                            <Badge variant="outline">{pillar.contentType}</Badge>
                            <Badge variant="outline">{pillar.wordCount} woorden</Badge>
                            <Badge variant="outline">{pillar.difficultyLevel}</Badge>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">{pillar.title}</h3>
                          <p className="text-sm text-gray-400 mb-2">{pillar.description}</p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-xs">
                              🎯 {pillar.primaryKeyword}
                            </Badge>
                            {pillar.secondaryKeywords.slice(0, 5).map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Clusters */}
                    {clusters.length > 0 && (
                      <div className="ml-16 space-y-2 border-l-2 border-purple-500/30 pl-4">
                        {clusters.map((cluster) => (
                          <div key={cluster.id} className="bg-gray-900/50 rounded-lg p-3">
                            <div className="flex items-start gap-2 mb-1">
                              <Badge variant="outline" className="bg-purple-600/20 text-purple-300 text-xs">
                                CLUSTER
                              </Badge>
                              <Badge variant="outline" className="text-xs">{cluster.contentType}</Badge>
                              <Badge variant="outline" className="text-xs">{cluster.wordCount}w</Badge>
                            </div>
                            <h4 className="text-sm font-semibold text-white mb-1">{cluster.title}</h4>
                            <p className="text-xs text-gray-500 mb-1">{cluster.description}</p>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="secondary" className="text-xs">
                                🎯 {cluster.primaryKeyword}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        <div className="text-xs text-gray-500 pt-2">
                          {clusters.length} cluster artikelen
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-gray-800/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left p-3">#</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Titel</th>
                      <th className="text-left p-3">Keyword</th>
                      <th className="text-left p-3">Content Type</th>
                      <th className="text-right p-3">Woorden</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article, index) => (
                      <tr key={article.id} className="border-t border-gray-700">
                        <td className="p-3">{index + 1}</td>
                        <td className="p-3">
                          <Badge variant={article.type === 'pillar' ? 'default' : 'outline'} className="text-xs">
                            {article.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium">{article.title}</td>
                        <td className="p-3 text-gray-400">{article.primaryKeyword}</td>
                        <td className="p-3 text-gray-400">{article.contentType}</td>
                        <td className="p-3 text-right text-gray-400">{article.wordCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={() => setStep('config')}
            variant="outline"
            className="flex-1 h-14 border-gray-700"
          >
            Terug naar Configuratie
          </Button>
          <Button
            onClick={handleStartGeneration}
            className="flex-1 h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg font-semibold"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Batch Generatie ({map.totalArticles} artikelen)
          </Button>
        </div>

        {/* Warning */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <strong>Let op:</strong> Het genereren van {map.totalArticles} artikelen kan meerdere uren duren. 
            De generatie draait op de achtergrond en je kunt de pagina veilig sluiten. 
            Je ontvangt een notificatie wanneer het klaar is.
          </div>
        </div>
      </div>
    );
  }

  // Generating Step
  if (step === 'generating' && map) {
    return (
      <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              {isGenerating ? (
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              )}
            </div>
            {isGenerating ? 'Batch Generatie Actief' : 'Generatie Voltooid'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Voortgang</span>
              <span className="text-white font-semibold">{progress}%</span>
            </div>
            <div className="w-full h-6 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 flex items-center justify-end px-2"
                style={{ width: `${progress}%` }}
              >
                {progress > 10 && (
                  <span className="text-xs font-bold text-white">{progress}%</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{articlesGenerated}</div>
              <div className="text-sm text-gray-400">Gegenereerd</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-400">
                {map.totalArticles - articlesGenerated - articlesFailed}
              </div>
              <div className="text-sm text-gray-400">Nog te gaan</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">{articlesFailed}</div>
              <div className="text-sm text-gray-400">Mislukt</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400 flex items-center gap-1">
                <Clock className="w-5 h-5" />
                {etaMinutes}
              </div>
              <div className="text-sm text-gray-400">Minuten resterend</div>
            </div>
          </div>

          {/* Status */}
          {currentStatus && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-300">{currentStatus}</p>
            </div>
          )}

          {/* Actions */}
          {isGenerating && (
            <Button
              onClick={handlePauseGeneration}
              variant="outline"
              className="w-full h-14 border-yellow-500/50 text-yellow-400 hover:bg-yellow-900/20"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pauzeer Generatie
            </Button>
          )}

          {progress === 100 && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Topical Authority Map Voltooid! 🎉
              </h3>
              <p className="text-gray-400 mb-4">
                Alle {map.totalArticles} artikelen zijn succesvol gegenereerd!
              </p>
              <Button
                onClick={() => onComplete?.()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Bekijk Gegenereerde Blogs
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
