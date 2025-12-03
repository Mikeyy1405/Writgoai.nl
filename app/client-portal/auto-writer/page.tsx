
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft,
  Wand2,
  Clock,
  FileText,
  Zap,
  Map,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import ProjectSelector, { Project } from '@/components/project-selector';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AvailableTopic {
  id: string;
  title: string;
  type: string;
  keywords: string[];
  priority: number;
  difficulty?: number;
  searchVolume?: number;
  categoryName: string;
  mapMainTopic: string;
  opportunityScore?: number;
}

export default function AutoWriter() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  
  // State
  const [topic, setTopic] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [contentId, setContentId] = useState<string | null>(null);
  
  // Topical Map State
  const [useTopicalMap, setUseTopicalMap] = useState(true);
  const [availableTopics, setAvailableTopics] = useState<AvailableTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [hasTopicalMap, setHasTopicalMap] = useState(false);
  const [autoSelectNext, setAutoSelectNext] = useState(true);

  // Load topics when project changes
  useEffect(() => {
    if (projectId && useTopicalMap) {
      loadTopics();
    }
  }, [projectId, useTopicalMap]);

  // Auto-select first topic when available
  useEffect(() => {
    if (autoSelectNext && availableTopics.length > 0 && !selectedTopicId) {
      const firstTopic = availableTopics[0];
      setSelectedTopicId(firstTopic.id);
      setTopic(firstTopic.title);
      toast.success(`Automatisch geselecteerd: "${firstTopic.title}"`);
    }
  }, [availableTopics, autoSelectNext, selectedTopicId]);

  const loadTopics = async () => {
    if (!projectId) return;
    
    setLoadingTopics(true);
    try {
      const response = await fetch(
        `/api/client/topical-mapping/topics/available?projectId=${projectId}`
      );
      
      if (!response.ok) {
        throw new Error('Kon topics niet laden');
      }
      
      const data = await response.json();
      
      if (data.hasTopicalMap) {
        setHasTopicalMap(true);
        
        // Flatten grouped topics
        const topics: AvailableTopic[] = [];
        if (data.groupedTopics) {
          data.groupedTopics.forEach((map: any) => {
            map.categories.forEach((category: any) => {
              category.topics.forEach((topic: any) => {
                topics.push({
                  ...topic,
                  categoryName: category.categoryName,
                  mapMainTopic: map.mainTopic
                });
              });
            });
          });
        }
        
        setAvailableTopics(topics);
        
        if (topics.length === 0) {
          toast.info('Alle topics zijn al voltooid! 🎉');
        }
      } else {
        setHasTopicalMap(false);
        toast.info(data.message || 'Geen topical map gevonden');
      }
    } catch (error: any) {
      console.error('Error loading topics:', error);
      toast.error(error.message || 'Kon topics niet laden');
    } finally {
      setLoadingTopics(false);
    }
  };

  // Project change handler
  const handleProjectChange = (value: string | null, project: Project | null) => {
    setProjectId(value);
    setSelectedTopicId('');
    setTopic('');
    setAvailableTopics([]);
  };
  
  // Topic selection handler
  const handleTopicSelect = (topicId: string) => {
    const selectedTopic = availableTopics.find(t => t.id === topicId);
    if (selectedTopic) {
      setSelectedTopicId(topicId);
      setTopic(selectedTopic.title);
    }
  };

  // Generate content
  const generateContent = async () => {
    if (!topic.trim()) {
      toast.error('Vul een onderwerp in');
      return;
    }

    setLoading(true);
    setProgress(0);
    setStatusMessage('🚀 Starten...');
    setContentId(null);

    try {
      const response = await fetch('/api/client/auto-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          projectId: projectId || undefined,
          topicalTopicId: useTopicalMap ? selectedTopicId : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Content generatie mislukt');
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
            
            if (data.error) {
              throw new Error(data.error);
            }
            
            if (typeof data.progress === 'number') {
              setProgress(data.progress);
            }
            
            if (data.status) {
              setStatusMessage(data.status);
            }
            
            if (data.success && data.contentId) {
              setContentId(data.contentId);
              setLoading(false);
              toast.success('🎉 Content succesvol gegenereerd!');
              
              // Redirect na 2 seconden
              setTimeout(() => {
                router.push(`/client-portal/content-library/${data.contentId}/edit`);
              }, 2000);
              
              return;
            }
          } catch (e: any) {
            if (e instanceof SyntaxError) continue;
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

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      generateContent();
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-black">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/client-portal">
            <Button variant="ghost" className="mb-4 text-gray-400 hover:text-white hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar overzicht
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-purple-500 to-purple-600">
              <Wand2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                ⚡ Auto Writer
              </h1>
              <p className="text-lg mt-1 text-gray-400">
                Één klik, perfecte content
              </p>
            </div>
          </div>
          
          {/* Benefits */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-purple-800/10 border border-purple-500/30 rounded-lg">
              <Zap className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-sm font-medium text-purple-100">Volautomatisch</p>
              <p className="text-xs text-gray-400 mt-1">Alle parameters worden automatisch gekozen</p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-800/10 border border-green-500/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-400 mb-2" />
              <p className="text-sm font-medium text-green-100">SEO Perfect</p>
              <p className="text-xs text-gray-400 mt-1">AI zorgt voor topkwaliteit</p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-800/10 border border-blue-500/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-sm font-medium text-blue-100">Snel Klaar</p>
              <p className="text-xs text-gray-400 mt-1">Direct naar Content Library</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {progress > 0 && (
          <div className="mb-6 rounded-lg p-4 shadow-md bg-zinc-900 border border-zinc-800">
            <Progress value={progress} className="h-3 bg-zinc-700">
              <div 
                className="h-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-purple-600"
                style={{ width: `${progress}%` }}
              />
            </Progress>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-200">
                {statusMessage || 'Content genereren...'}
              </p>
              <Badge variant="outline" className="border-purple-500 text-purple-400 bg-zinc-900">
                {progress}%
              </Badge>
            </div>
          </div>
        )}

        {/* Success state */}
        {contentId && !loading && (
          <Card className="mb-6 bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">🎉 Content Succesvol Gegenereerd!</h3>
                  <p className="text-sm text-gray-300">Je wordt doorgestuurd naar de editor...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main card */}
        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5 text-purple-500" />
              Wat wil je schrijven?
            </CardTitle>
            <CardDescription className="text-gray-300">
              Vul alleen een onderwerp in, de rest gaat automatisch ✨
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {/* Project selector - EERST! */}
            <div className="space-y-2">
              <Label className="text-white font-semibold text-lg">
                Project (verplicht voor Topical Map)
              </Label>
              <ProjectSelector
                value={projectId}
                onChange={handleProjectChange}
                autoSelectPrimary={true}
                showKnowledgeBase={false}
              />
              <p className="text-xs text-gray-400">
                Selecteer een project om topics uit de Topical Map te gebruiken
              </p>
            </div>

            {/* Topical Map Toggle */}
            {projectId && (
              <div className="space-y-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Map className="w-5 h-5 text-purple-400" />
                    <Label className="text-white font-semibold">
                      Gebruik Topical Map
                    </Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUseTopicalMap(!useTopicalMap)}
                    className={useTopicalMap ? 'border-purple-500 text-purple-400' : 'border-zinc-600 text-gray-400'}
                  >
                    {useTopicalMap ? 'Uit Topical Map' : 'Eigen Onderwerp'}
                  </Button>
                </div>
                
                {useTopicalMap ? (
                  <>
                    {/* Auto-select checkbox */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoSelect"
                        checked={autoSelectNext}
                        onChange={(e) => setAutoSelectNext(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500"
                      />
                      <Label htmlFor="autoSelect" className="text-sm text-gray-300 cursor-pointer">
                        Automatisch volgende topic kiezen
                      </Label>
                    </div>

                    {/* Loading state */}
                    {loadingTopics && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Topics laden...</span>
                      </div>
                    )}

                    {/* No topical map warning */}
                    {!loadingTopics && !hasTopicalMap && (
                      <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <p className="text-sm text-orange-200">
                          Geen topical map gevonden. <Link href="/client-portal/topical-mapping" className="underline">Maak eerst een topical map aan</Link>.
                        </p>
                      </div>
                    )}

                    {/* Topic selector */}
                    {!loadingTopics && hasTopicalMap && availableTopics.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-300">
                          Kies topic ({availableTopics.length} beschikbaar)
                        </Label>
                        <Select value={selectedTopicId} onValueChange={handleTopicSelect}>
                          <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 text-white">
                            <SelectValue placeholder="Selecteer een topic..." />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700 max-h-[300px]">
                            {availableTopics.map((t) => (
                              <SelectItem key={t.id} value={t.id} className="text-white hover:bg-zinc-800">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={t.type === 'commercial' ? 'border-green-500 text-green-400' : 'border-purple-500 text-purple-400'}
                                  >
                                    {t.type === 'commercial' ? '💰' : '💡'}
                                  </Badge>
                                  <span className="truncate max-w-[400px]">{t.title}</span>
                                  {t.searchVolume && (
                                    <span className="text-xs text-gray-500">
                                      {t.searchVolume}/mo
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Selected topic info */}
                        {selectedTopicId && (
                          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                            {(() => {
                              const selectedTopic = availableTopics.find(t => t.id === selectedTopicId);
                              return selectedTopic ? (
                                <div className="space-y-1 text-sm">
                                  <p className="text-purple-200">
                                    <strong>Categorie:</strong> {selectedTopic.categoryName}
                                  </p>
                                  {selectedTopic.keywords && selectedTopic.keywords.length > 0 && (
                                    <p className="text-purple-200">
                                      <strong>Keywords:</strong> {selectedTopic.keywords.slice(0, 3).join(', ')}
                                    </p>
                                  )}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadTopics}
                          disabled={loadingTopics}
                          className="w-full border-zinc-600 text-gray-300 hover:bg-zinc-800"
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${loadingTopics ? 'animate-spin' : ''}`} />
                          Ververs Topics
                        </Button>
                      </div>
                    )}

                    {/* All topics completed */}
                    {!loadingTopics && hasTopicalMap && availableTopics.length === 0 && (
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-sm text-green-200">
                          🎉 Alle topics zijn voltooid! Schakel naar "Eigen Onderwerp" of maak een nieuwe topical map.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Manual topic input */
                  <div className="space-y-2">
                    <Label htmlFor="topic" className="text-white font-semibold">
                      Onderwerp *
                    </Label>
                    <Input
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Bijvoorbeeld: De beste yoga oefeningen voor beginners"
                      className="h-12 border-zinc-700 focus:border-purple-500 bg-zinc-900 text-white"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-400">
                      💡 Tip: Wees specifiek voor de beste resultaten
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Fallback voor geen project */}
            {!projectId && (
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-sm text-orange-200">
                  Selecteer eerst een project om de Topical Map te gebruiken
                </p>
              </div>
            )}

            {/* Generate button */}
            <Button
              onClick={generateContent}
              disabled={loading || !topic.trim()}
              className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Bezig met genereren...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-2" />
                  Genereer Automatisch
                </>
              )}
            </Button>

            {/* Info box */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-200 mb-2">⚡ Wat gebeurt er automatisch?</h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>✅ Content type detectie (blog, lijst, how-to, etc.)</li>
                <li>✅ Optimaal woordaantal kiezen</li>
                <li>✅ Beste schrijfstijl selecteren</li>
                <li>✅ SEO keywords bepalen</li>
                <li>✅ Web research uitvoeren</li>
                <li>✅ Featured image genereren</li>
                <li>✅ Perfecte content schrijven met AI</li>
                <li>✅ Direct opslaan in Content Library</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Cost info */}
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Kosten: 50 credits per artikel</p>
        </div>
      </div>
    </div>
  );
}
