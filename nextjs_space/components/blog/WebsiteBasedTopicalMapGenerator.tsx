'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Globe,
  Search,
  Loader2,
  CheckCircle2,
  MapPin,
  TrendingUp,
  Play,
  ArrowLeft,
  Calendar,
  Edit3,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WebsiteAnalysis {
  url: string;
  title?: string;
  description?: string;
  niche?: string;
  existingTopics: string[];
  categories: string[];
  totalPages: number;
}

interface TopicIdea {
  title: string;
  description: string;
  type: 'pillar' | 'cluster' | 'supporting';
  keywords: string[];
  estimatedWords: number;
  priority: number;
  scheduledDate: string;
  selected: boolean;
}

interface WebsiteBasedTopicalMapGeneratorProps {
  onComplete?: () => void;
}

export default function WebsiteBasedTopicalMapGenerator({ 
  onComplete 
}: WebsiteBasedTopicalMapGeneratorProps) {
  const [step, setStep] = useState<'input' | 'analyzing' | 'preview' | 'executing'>('input');
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [executing, setExecuting] = useState(false);
  
  // Input state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [numberOfTopics, setNumberOfTopics] = useState(20);
  const [period, setPeriod] = useState('2 maanden');
  const [language, setLanguage] = useState('nl');
  const [tone, setTone] = useState('professioneel');
  
  // Analysis results
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null);
  
  // Generated topical map
  const [topics, setTopics] = useState<TopicIdea[]>([]);
  const [planName, setPlanName] = useState('');
  
  // Execution progress
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState('');
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) {
      toast.error('Voer een website URL in');
      return;
    }

    // Validate URL format
    try {
      const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
    } catch (error) {
      toast.error('Ongeldige URL. Gebruik formaat: https://example.com');
      return;
    }

    setAnalyzing(true);
    setStep('analyzing');
    
    try {
      // Step 1: Analyze website
      toast.loading('Website analyseren...', { id: 'analyze' });
      
      const analyzeRes = await fetch('/api/admin/blog/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl }),
      });

      if (!analyzeRes.ok) {
        const error = await analyzeRes.json();
        throw new Error(error.error || 'Website analyse mislukt');
      }

      const analysisData = await analyzeRes.json();
      setWebsiteAnalysis(analysisData);
      
      toast.success('Website geanalyseerd!', { id: 'analyze' });

      // Step 2: Generate topical map
      toast.loading('Topical map genereren...', { id: 'generate' });
      setGenerating(true);

      const generateRes = await fetch('/api/admin/blog/generate-topical-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl,
          websiteAnalysis: analysisData,
          numberOfTopics,
          language,
          tone,
          period,
        }),
      });

      if (!generateRes.ok) {
        const error = await generateRes.json();
        throw new Error(error.error || 'Topical map generatie mislukt');
      }

      const topicsData = await generateRes.json();
      
      // Set generated topics with selection enabled
      const topicIdeas = topicsData.topics.map((topic: any) => ({
        ...topic,
        selected: true,
      }));
      
      setTopics(topicIdeas);
      
      // Generate default plan name
      const domain = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`).hostname;
      const timestamp = new Date().toLocaleDateString('nl-NL', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
      setPlanName(`${analysisData.niche || domain} Topical Map - ${timestamp}`);
      
      toast.success(`✨ ${topicIdeas.length} topics gegenereerd!`, { id: 'generate' });
      setStep('preview');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Fout bij website analyse', { id: 'analyze' });
      toast.dismiss('generate');
      setStep('input');
    } finally {
      setAnalyzing(false);
      setGenerating(false);
    }
  };

  const handleExecutePlan = async () => {
    const selectedTopics = topics.filter(topic => topic.selected);
    
    if (selectedTopics.length === 0) {
      toast.error('Selecteer minimaal één topic');
      return;
    }

    if (!planName.trim()) {
      toast.error('Geef het plan een naam');
      return;
    }

    if (!confirm(`Je gaat ${selectedTopics.length} blogs genereren. Dit kan 10-30 minuten duren. Doorgaan?`)) {
      return;
    }

    setExecuting(true);
    setStep('executing');
    setProgress(0);
    setExecutionLogs([]);

    try {
      const res = await fetch('/api/admin/blog/content-plan/execute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planName,
          niche: websiteAnalysis?.niche || 'Algemeen',
          targetAudience: 'Websitebezoekers',
          language,
          tone,
          period,
          keywords: [],
          items: selectedTopics,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Uitvoering mislukt');
      }

      // Simulate progress (as execution happens in background)
      const totalSteps = selectedTopics.length;
      for (let i = 0; i <= totalSteps; i++) {
        setProgress(Math.round((i / totalSteps) * 100));
        setCurrentItem(
          i < totalSteps 
            ? `Genereren: ${selectedTopics[i].title}` 
            : 'Voltooid!'
        );
        setExecutionLogs(prev => [
          ...prev, 
          i < totalSteps 
            ? `✅ ${selectedTopics[i].title}` 
            : '🎉 Alle blogs zijn gegenereerd!'
        ]);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      toast.success('🎉 Topical map voltooid!');
      setTimeout(() => {
        onComplete?.();
      }, 2000);
    } catch (error: any) {
      console.error('Execute error:', error);
      toast.error(error.message || 'Fout bij uitvoeren plan');
      setStep('preview');
    } finally {
      setExecuting(false);
    }
  };

  const toggleTopicSelection = (index: number) => {
    setTopics(prev => prev.map((topic, i) => 
      i === index ? { ...topic, selected: !topic.selected } : topic
    ));
  };

  const removeTopic = (index: number) => {
    setTopics(prev => prev.filter((_, i) => i !== index));
  };

  const selectAll = () => {
    setTopics(prev => prev.map(topic => ({ ...topic, selected: true })));
  };

  const deselectAll = () => {
    setTopics(prev => prev.map(topic => ({ ...topic, selected: false })));
  };

  // Input Step
  if (step === 'input') {
    return (
      <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Globe className="w-6 h-6 text-blue-400" />
            </div>
            Website-Based Topical Map Generator
          </CardTitle>
          <p className="text-gray-400 text-sm mt-2">
            Voer de website URL van je klant in. De AI analyseert de website automatisch en genereert een complete topical map met SEO-geoptimaliseerde blog onderwerpen.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-300 mb-1">
                Hoe het werkt
              </p>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>AI analyseert de website (niche, bestaande content, tone)</li>
                <li>Genereert een complete topical map met pillar, cluster en supporting content</li>
                <li>Jij selecteert welke topics je wilt genereren</li>
                <li>AI schrijft automatisch alle blogs met SEO optimalisatie</li>
              </ol>
            </div>
          </div>

          <div className="space-y-6">
            {/* Website URL */}
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website URL *
              </Label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-14 bg-gray-800/50 border-gray-700 text-lg"
              />
              <p className="text-xs text-gray-500">
                De AI analyseert deze website om de niche, tone en bestaande content te begrijpen
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aantal Topics */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Aantal Topics</Label>
                <Select
                  value={numberOfTopics.toString()}
                  onValueChange={(v) => setNumberOfTopics(parseInt(v))}
                >
                  <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 topics</SelectItem>
                    <SelectItem value="20">20 topics (aanbevolen)</SelectItem>
                    <SelectItem value="30">30 topics</SelectItem>
                    <SelectItem value="50">50 topics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Periode */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Publicatie Periode</Label>
                <Select
                  value={period}
                  onValueChange={(v) => setPeriod(v)}
                >
                  <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 maand">1 maand</SelectItem>
                    <SelectItem value="2 maanden">2 maanden</SelectItem>
                    <SelectItem value="3 maanden">3 maanden</SelectItem>
                    <SelectItem value="6 maanden">6 maanden</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Taal */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Taal</Label>
                <Select
                  value={language}
                  onValueChange={(v) => setLanguage(v)}
                >
                  <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
                    <SelectItem value="en">🇬🇧 Engels</SelectItem>
                    <SelectItem value="de">🇩🇪 Duits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Writing Tone</Label>
                <Select
                  value={tone}
                  onValueChange={(v) => setTone(v)}
                >
                  <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professioneel">Professioneel</SelectItem>
                    <SelectItem value="vriendelijk">Vriendelijk</SelectItem>
                    <SelectItem value="educatief">Educatief</SelectItem>
                    <SelectItem value="inspirerend">Inspirerend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyzeWebsite}
            disabled={analyzing || !websiteUrl}
            className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Website analyseren...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Analyseer Website & Genereer Topical Map
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Analyzing Step
  if (step === 'analyzing') {
    return (
      <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">
            Website Wordt Geanalyseerd
          </h3>
          <p className="text-gray-400 mb-6">
            De AI analyseert {websiteUrl} en genereert een complete topical map...
          </p>
          <div className="space-y-3 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Website content scrapen
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              {analyzing ? (
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              )}
              Niche en tone detecteren
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              {generating ? (
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-600 rounded-full" />
              )}
              Topical map genereren
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview Step
  if (step === 'preview') {
    const selectedCount = topics.filter(t => t.selected).length;
    const pillarTopics = topics.filter(t => t.type === 'pillar');
    const clusterTopics = topics.filter(t => t.type === 'cluster');
    const supportingTopics = topics.filter(t => t.type === 'supporting');

    return (
      <div className="space-y-6">
        {/* Analysis Summary */}
        {websiteAnalysis && (
          <Card className="bg-gradient-to-br from-green-900/40 to-blue-900/40 border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                Website Analyse Resultaat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Website</div>
                  <div className="font-semibold text-white truncate">{websiteAnalysis.url}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Gedetecteerde Niche</div>
                  <div className="font-semibold text-white">{websiteAnalysis.niche || 'Onbekend'}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Bestaande Content</div>
                  <div className="font-semibold text-white">{websiteAnalysis.existingTopics.length} topics</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <MapPin className="w-6 h-6 text-purple-400" />
              </div>
              Topical Map Gegenereerd
            </CardTitle>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1">
                <Label className="text-sm text-gray-400">Plan Naam</Label>
                <Input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="mt-1 bg-gray-800/50 border-gray-700 h-12"
                  placeholder="Geef je topical map een naam"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">{pillarTopics.length}</div>
                  <div className="text-xs text-gray-400">Pillar</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{clusterTopics.length}</div>
                  <div className="text-xs text-gray-400">Cluster</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{supportingTopics.length}</div>
                  <div className="text-xs text-gray-400">Supporting</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Selection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={selectAll}
              variant="outline"
              size="sm"
              className="border-gray-700"
            >
              Selecteer Alles
            </Button>
            <Button
              onClick={deselectAll}
              variant="outline"
              size="sm"
              className="border-gray-700"
            >
              Deselecteer Alles
            </Button>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {selectedCount} van {topics.length} geselecteerd
          </Badge>
        </div>

        {/* Topics List */}
        <div className="space-y-3">
          {topics.map((topic, index) => {
            const typeColors = {
              pillar: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
              cluster: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
              supporting: 'bg-green-500/20 text-green-400 border-green-500/50',
            };

            return (
              <Card
                key={index}
                className={`transition-all ${
                  topic.selected
                    ? 'bg-gray-800/50 border-purple-500/50'
                    : 'bg-gray-900/30 border-gray-700/50 opacity-60'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={topic.selected}
                      onChange={() => toggleTopicSelection(index)}
                      className="mt-1 w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <Badge className={`text-xs border ${typeColors[topic.type]}`}>
                              {topic.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              P{topic.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(topic.scheduledDate).toLocaleDateString('nl-NL', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </Badge>
                          </div>
                          <h4 className="text-lg font-semibold text-white">
                            {topic.title}
                          </h4>
                          <p className="text-sm text-gray-400 mt-1">
                            {topic.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {topic.keywords.slice(0, 5).map((keyword, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => removeTopic(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={() => {
              setStep('input');
              setTopics([]);
              setWebsiteAnalysis(null);
            }}
            variant="outline"
            className="h-14 border-gray-700"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Nieuwe Analyse
          </Button>
          <Button
            onClick={handleExecutePlan}
            disabled={selectedCount === 0 || !planName.trim() || executing}
            className="flex-1 h-14 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg font-semibold"
          >
            <Play className="w-5 h-5 mr-2" />
            Genereer Geselecteerde Blogs ({selectedCount})
          </Button>
        </div>
      </div>
    );
  }

  // Executing Step
  if (step === 'executing') {
    return (
      <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              {progress < 100 ? (
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              )}
            </div>
            {progress < 100 ? 'Blogs Worden Gegenereerd' : 'Topical Map Voltooid!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Voortgang</span>
              <span className="text-white font-semibold">{progress}%</span>
            </div>
            <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {currentItem && (
              <p className="text-sm text-gray-400 mt-2">{currentItem}</p>
            )}
          </div>

          {/* Execution Logs */}
          {executionLogs.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Activiteiten Log</Label>
              <div className="max-h-60 overflow-y-auto bg-gray-900/50 rounded-lg p-4 space-y-1 font-mono text-xs">
                {executionLogs.map((log, i) => (
                  <div key={i} className="text-gray-300">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {progress === 100 && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Topical Map Voltooid! 🎉
              </h3>
              <p className="text-gray-400">
                Alle blog posts zijn succesvol gegenereerd op basis van de website analyse.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
