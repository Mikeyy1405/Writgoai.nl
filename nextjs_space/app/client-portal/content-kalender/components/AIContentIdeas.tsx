'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Loader2, Calendar, PenTool, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface ContentIdea {
  title: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  description: string;
  contentType: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  estimatedDifficulty: number;
  searchIntent: string;
  outline: string[];
  competitorGap: boolean;
  trending: boolean;
  sources: string[];
}

interface AIContentIdeasProps {
  projectId: string | null;
  onWriteNow: (idea: ContentIdea) => void;
  onPlanIdea: (idea: ContentIdea) => void;
}

export default function AIContentIdeas({ projectId, onWriteNow, onPlanIdea }: AIContentIdeasProps) {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateIdeas = async () => {
    if (!projectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/client/content-ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate ideas');
      }

      if (data.success && data.ideas) {
        setIdeas(data.ideas);
        toast.success(`${data.ideas.length} content ideeën gegenereerd!`);
      } else {
        throw new Error('No ideas returned');
      }
    } catch (error: any) {
      console.error('Error generating ideas:', error);
      setError(error.message);
      toast.error('Kon geen content ideeën genereren');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50';
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      guide: '📚 Gids',
      listicle: '📝 Lijst',
      howto: '🔧 How-to',
      review: '⭐ Review',
      comparison: '⚖️ Vergelijking',
      news: '📰 Nieuws',
      opinion: '💭 Mening',
      tutorial: '🎓 Tutorial',
      'case-study': '📊 Case Study',
      infographic: '📈 Infographic',
      interview: '🎤 Interview',
      checklist: '✅ Checklist',
      definition: '📖 Definitie',
      tools: '🛠️ Tools',
      trends: '🔥 Trends',
    };
    return labels[type] || type;
  };

  if (!projectId) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="py-12">
          <div className="text-center text-zinc-400">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Selecteer een project om AI content ideeën te genereren</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          🤖 AI Content Ideeën
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Genereer verse content ideeën voor je project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={generateIdeas}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Ideeën Genereren...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 w-4 h-4" />
              Genereer Nieuwe Ideeën
            </>
          )}
        </Button>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-2" />
            <p className="text-sm text-zinc-400">
              AI analyseert je project en genereert content ideeën...
            </p>
          </div>
        )}

        {!loading && ideas.length > 0 && (
          <div className="space-y-3">
            {ideas.map((idea, index) => (
              <Card key={index} className="bg-zinc-800 border-zinc-700">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {idea.title}
                      </h3>
                      <p className="text-sm text-zinc-400 mb-3">
                        {idea.description}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getPriorityColor(idea.priority)}>
                      {idea.priority.toUpperCase()}
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                      {getContentTypeLabel(idea.contentType)}
                    </Badge>
                    {idea.competitorGap && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                        🎯 Concurrent Gap
                      </Badge>
                    )}
                    {idea.trending && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                        🔥 Trending
                      </Badge>
                    )}
                  </div>

                  {/* Keywords */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-orange-500" />
                      <span className="text-zinc-400">Focus Keyword:</span>
                      <span className="text-white font-medium">{idea.focusKeyword}</span>
                    </div>
                    {idea.estimatedDifficulty && (
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-zinc-400" />
                        <span className="text-zinc-400">Moeilijkheid:</span>
                        <span className="text-white">{idea.estimatedDifficulty}/100</span>
                      </div>
                    )}
                  </div>

                  {/* Reasoning */}
                  <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                    <p className="text-sm text-zinc-300">
                      <span className="text-orange-500 font-medium">Waarom waardevol: </span>
                      {idea.reasoning}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => onWriteNow(idea)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <PenTool className="w-4 h-4 mr-2" />
                      ✍️ Nu Schrijven
                    </Button>
                    <Button
                      onClick={() => onPlanIdea(idea)}
                      variant="outline"
                      className="flex-1 border-zinc-700 hover:bg-zinc-800"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      📅 Plan In
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && ideas.length === 0 && !error && (
          <div className="text-center py-8 text-zinc-400">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Klik op "Genereer Nieuwe Ideeën" om te beginnen</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
