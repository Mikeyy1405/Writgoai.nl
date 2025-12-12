'use client';

import { useState } from 'react';
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
  Calendar, 
  TrendingUp,
  Loader2,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  Play,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ContentPlanItem {
  title: string;
  description: string;
  contentType: string;
  keywords: string[];
  estimatedWords: number;
  scheduledDate: string;
  order: number;
  selected: boolean;
}

interface ContentPlanGeneratorProps {
  onComplete?: () => void;
}

export default function ContentPlanGenerator({ onComplete }: ContentPlanGeneratorProps) {
  const [step, setStep] = useState<'config' | 'preview' | 'executing'>('config');
  const [generating, setGenerating] = useState(false);
  const [executing, setExecuting] = useState(false);
  
  // Configuration state
  const [config, setConfig] = useState({
    numberOfPosts: 10,
    period: '1 maand',
    niche: '',
    targetAudience: '',
    language: 'nl',
    keywords: '',
    tone: 'professioneel',
  });

  // Generated plan
  const [plan, setPlan] = useState<ContentPlanItem[]>([]);
  const [planName, setPlanName] = useState('');
  
  // Execution progress
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState('');
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  const handleGeneratePlan = async () => {
    if (!config.niche || !config.targetAudience) {
      toast.error('Vul niche en doelgroep in');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/admin/blog/content-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Generatie mislukt');
      }

      const data = await res.json();
      
      if (!data.success || !data.plan || !data.plan.items) {
        throw new Error('Ongeldige response van server');
      }

      // Set generated plan
      const planItems = data.plan.items.map((item: any) => ({
        ...item,
        selected: true, // All selected by default
      }));
      
      setPlan(planItems);
      
      // Generate default plan name
      const timestamp = new Date().toLocaleDateString('nl-NL', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
      setPlanName(`${config.niche} Contentplan - ${timestamp}`);
      
      setStep('preview');
      toast.success(`✨ ${planItems.length} blog ideeën gegenereerd!`);
    } catch (error: any) {
      console.error('Generate error:', error);
      toast.error(error.message || 'Fout bij genereren contentplan');
    } finally {
      setGenerating(false);
    }
  };

  const handleExecutePlan = async () => {
    const selectedItems = plan.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      toast.error('Selecteer minimaal één blog post');
      return;
    }

    if (!planName.trim()) {
      toast.error('Geef het plan een naam');
      return;
    }

    if (!confirm(`Je gaat ${selectedItems.length} blogs genereren. Dit kan enkele minuten duren. Doorgaan?`)) {
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
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          planName,
          niche: config.niche,
          targetAudience: config.targetAudience,
          language: config.language,
          tone: config.tone,
          period: config.period,
          keywords: config.keywords.split(',').map(k => k.trim()).filter(Boolean),
          items: selectedItems,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Uitvoering mislukt');
      }

      // Check if streaming response
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                if (data.progress !== undefined) {
                  setProgress(data.progress);
                }
                
                if (data.message) {
                  setCurrentItem(data.message);
                  setExecutionLogs(prev => [...prev, data.message]);
                }
                
                if (data.itemComplete) {
                  setExecutionLogs(prev => [...prev, `✅ ${data.title}`]);
                }
                
                if (data.itemFailed) {
                  setExecutionLogs(prev => [...prev, `❌ ${data.title}: ${data.error}`]);
                }
                
                if (data.complete) {
                  setProgress(100);
                  toast.success('🎉 Contentplan voltooid!');
                  setTimeout(() => {
                    onComplete?.();
                  }, 2000);
                }
                
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } else {
        // Non-streaming response
        const data = await res.json();
        setProgress(100);
        toast.success('Contentplan wordt uitgevoerd op de achtergrond');
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Execute error:', error);
      toast.error(error.message || 'Fout bij uitvoeren plan');
      setStep('preview');
    } finally {
      setExecuting(false);
    }
  };

  const toggleItemSelection = (index: number) => {
    setPlan(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const removeItem = (index: number) => {
    setPlan(prev => prev.filter((_, i) => i !== index));
  };

  const selectAll = () => {
    setPlan(prev => prev.map(item => ({ ...item, selected: true })));
  };

  const deselectAll = () => {
    setPlan(prev => prev.map(item => ({ ...item, selected: false })));
  };

  // Config Step
  if (step === 'config') {
    return (
      <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            AI Contentplan Generator
          </CardTitle>
          <p className="text-gray-400 text-sm mt-2">
            Genereer een compleet contentplan met AI-gegenereerde blog onderwerpen, automatisch gescheduled over de gekozen periode.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Aantal Blogs */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Aantal Blogs</Label>
              <Select
                value={config.numberOfPosts.toString()}
                onValueChange={(v) => setConfig({ ...config, numberOfPosts: parseInt(v) })}
              >
                <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 blogs</SelectItem>
                  <SelectItem value="10">10 blogs</SelectItem>
                  <SelectItem value="15">15 blogs</SelectItem>
                  <SelectItem value="20">20 blogs</SelectItem>
                  <SelectItem value="30">30 blogs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Periode */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Periode</Label>
              <Select
                value={config.period}
                onValueChange={(v) => setConfig({ ...config, period: v })}
              >
                <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 week">1 week</SelectItem>
                  <SelectItem value="2 weken">2 weken</SelectItem>
                  <SelectItem value="1 maand">1 maand</SelectItem>
                  <SelectItem value="2 maanden">2 maanden</SelectItem>
                  <SelectItem value="3 maanden">3 maanden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Niche */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Niche/Onderwerp *</Label>
              <Input
                value={config.niche}
                onChange={(e) => setConfig({ ...config, niche: e.target.value })}
                placeholder="bijv. yoga, marketing, gezondheid"
                className="h-14 bg-gray-800/50 border-gray-700"
              />
            </div>

            {/* Doelgroep */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Doelgroep *</Label>
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
              <Label className="text-base font-semibold">Tone</Label>
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
            <Label className="text-base font-semibold">Keywords (optioneel)</Label>
            <Textarea
              value={config.keywords}
              onChange={(e) => setConfig({ ...config, keywords: e.target.value })}
              placeholder="Voer relevante keywords in, gescheiden door komma's"
              className="min-h-[80px] bg-gray-800/50 border-gray-700"
            />
            <p className="text-xs text-gray-500">
              Optioneel: voeg keywords toe gescheiden door komma's
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGeneratePlan}
            disabled={generating || !config.niche || !config.targetAudience}
            className="w-full h-16 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg font-semibold"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Contentplan genereren...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Genereer Contentplan
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Preview Step
  if (step === 'preview') {
    const selectedCount = plan.filter(item => item.selected).length;

    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-br from-green-900/40 to-blue-900/40 border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              Contentplan Gegenereerd
            </CardTitle>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1">
                <Label className="text-sm text-gray-400">Plan Naam</Label>
                <Input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="mt-1 bg-gray-800/50 border-gray-700 h-12"
                  placeholder="Geef je plan een naam"
                />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">{plan.length}</div>
                <div className="text-sm text-gray-400">Blog Posts</div>
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
            {selectedCount} van {plan.length} geselecteerd
          </Badge>
        </div>

        {/* Plan Items */}
        <div className="space-y-3">
          {plan.map((item, index) => (
            <Card
              key={index}
              className={`transition-all ${
                item.selected
                  ? 'bg-gray-800/50 border-purple-500/50'
                  : 'bg-gray-900/30 border-gray-700/50 opacity-60'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItemSelection(index)}
                    className="mt-1 w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {item.contentType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(item.scheduledDate).toLocaleDateString('nl-NL')}
                          </Badge>
                        </div>
                        <h4 className="text-lg font-semibold text-white">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.keywords.map((keyword, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => removeItem(index)}
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
          ))}
        </div>

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
            onClick={handleExecutePlan}
            disabled={selectedCount === 0 || !planName.trim()}
            className="flex-1 h-14 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg font-semibold"
          >
            <Play className="w-5 h-5 mr-2" />
            Voer Contentplan Uit ({selectedCount})
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
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
            Contentplan Wordt Uitgevoerd
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
                Contentplan Voltooid! 🎉
              </h3>
              <p className="text-gray-400">
                Alle blog posts zijn succesvol gegenereerd en klaargezet als concept.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
