'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Lightbulb, RefreshCw, Loader2, TrendingUp, Calendar, Star, Zap } from 'lucide-react';

interface IdeasTabProps {
  projectId: string;
  onCreatePost: () => void;
}

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  suggestedPlatforms: string[];
  category: 'trending' | 'seasonal' | 'evergreen' | 'engagement';
  urgency: 'high' | 'medium' | 'low';
  estimatedEngagement: number;
}

const CATEGORY_CONFIG = {
  trending: {
    icon: TrendingUp,
    className: 'bg-red-500/20 text-red-300 border-red-500/50',
  },
  seasonal: {
    icon: Calendar,
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  },
  evergreen: {
    icon: Star,
    className: 'bg-green-500/20 text-green-300 border-green-500/50',
  },
  engagement: {
    icon: Zap,
    className: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
  },
};

export default function IdeasTab({ projectId, onCreatePost }: IdeasTabProps) {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadIdeas();
  }, [projectId]);

  const loadIdeas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/social/ideas?projectId=${projectId}`);

      if (!response.ok) {
        throw new Error('Failed to load ideas');
      }

      const data = await response.json();
      setIdeas(data.ideas || []);
    } catch (error: any) {
      console.error('Error loading ideas:', error);
      toast.error('Kon ideeën niet laden');
    } finally {
      setLoading(false);
    }
  };

  const generateNewIdeas = async () => {
    try {
      setGenerating(true);
      toast.loading('AI genereert nieuwe content ideeën...', { id: 'generate-ideas' });

      const response = await fetch('/api/client/social/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, count: 10 }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ideas');
      }

      const data = await response.json();
      setIdeas(data.ideas || []);
      toast.success(`${data.ideas?.length || 0} nieuwe ideeën gegenereerd!`, { id: 'generate-ideas' });
    } catch (error: any) {
      console.error('Error generating ideas:', error);
      toast.error('Kon ideeën niet genereren', { id: 'generate-ideas' });
    } finally {
      setGenerating(false);
    }
  };

  const getCategoryBadge = (category: ContentIdea['category']) => {
    const config = CATEGORY_CONFIG[category];
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {category}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              💡 Content Ideeën
            </CardTitle>
            <CardDescription>
              AI-gegenereerde content ideeën voor je social media
            </CardDescription>
          </div>

          <Button
            onClick={generateNewIdeas}
            disabled={generating}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Genereren...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Genereer Nieuwe Ideeën
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {ideas.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-orange-500 opacity-50" />
            <p className="text-muted-foreground mb-4">
              Nog geen content ideeën. Klik op de knop om te starten!
            </p>
            <Button onClick={generateNewIdeas} variant="outline">
              Genereer Ideeën
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas.map((idea) => (
              <Card key={idea.id} className="p-4 hover:border-orange-500/50 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    {getCategoryBadge(idea.category)}
                    {idea.urgency === 'high' && (
                      <Badge className="bg-red-500/20 text-red-300">🔥 Urgent</Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-1">{idea.title}</h3>
                    <p className="text-sm text-muted-foreground">{idea.description}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {idea.suggestedPlatforms.map((platform) => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>

                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {idea.estimatedEngagement}% engagement
                    </Badge>
                  </div>

                  <Button
                    onClick={onCreatePost}
                    size="sm"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    Maak Post
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
