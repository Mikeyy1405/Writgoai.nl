'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  getUserFriendlyErrorMessage, 
  getErrorTip, 
  handleApiError,
  copyToClipboard as safelyCopyToClipboard,
  DEFAULT_POST_CONFIG
} from '../lib/error-helpers';
import {
  Loader2,
  Sparkles,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music2,
  TrendingUp,
  Calendar,
  Star,
  Zap,
  RefreshCw,
  Copy,
  Check,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  suggestedPlatforms: string[];
  category: 'trending' | 'seasonal' | 'evergreen' | 'engagement';
  urgency: 'high' | 'medium' | 'low';
  estimatedEngagement: number;
}

interface ContentIdeasTabProps {
  projectId: string | null;
  projectLoading?: boolean;
  onCreateFromIdea?: (idea: ContentIdea) => void;
}

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
  { id: 'twitter', name: 'X', icon: Twitter, color: '#000000' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: '#000000' },
];

export default function ContentIdeasTab({ projectId, projectLoading = false, onCreateFromIdea }: ContentIdeasTabProps) {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [generatingPosts, setGeneratingPosts] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<Record<string, string>>({});
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  // Debug logging for projectId changes
  useEffect(() => {
    console.log('[ContentIdeasTab] projectId changed:', projectId);
    console.log('[ContentIdeasTab] projectLoading:', projectLoading);
  }, [projectId, projectLoading]);

  const generateIdeas = async () => {
    if (!projectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    try {
      setLoading(true);
      toast.loading('AI genereert content ideeën...', { id: 'ideas' });

      const response = await fetch('/api/client/social/generate-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          count: 10,
        }),
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      const data = await response.json();
      
      if (data.success && data.ideas) {
        setIdeas(data.ideas);
        toast.success(`${data.ideas.length} content ideeën gegenereerd!`, { id: 'ideas' });
      } else {
        throw new Error('Onverwacht response formaat van de server');
      }
    } catch (error: any) {
      console.error('Error generating ideas:', error);
      const errorMessage = getUserFriendlyErrorMessage(error, 'Fout bij genereren van ideeën');
      toast.error(errorMessage, { id: 'ideas' });
    } finally {
      setLoading(false);
    }
  };

  const handleIdeaClick = (idea: ContentIdea) => {
    setSelectedIdea(idea);
    setShowModal(true);
  };

  const handleGeneratePosts = async () => {
    if (!selectedIdea || !projectId) return;

    setGeneratingPosts(true);
    toast.loading('AI genereert posts voor alle platforms...', { id: 'generate-posts' });

    try {
      // If parent component provided a callback, use it to navigate to create tab
      if (onCreateFromIdea) {
        onCreateFromIdea(selectedIdea);
        setShowModal(false);
        toast.success('Navigeren naar post maker...', { id: 'generate-posts' });
        return;
      }

      // Otherwise, generate posts directly for all platforms concurrently
      const platforms = selectedIdea.suggestedPlatforms;
      const newPosts: Record<string, string> = {};
      
      // Generate posts for all platforms concurrently
      const generatePromises = platforms.map(async (platform) => {
        try {
          const response = await fetch('/api/client/social/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topic: `${selectedIdea.title}\n\n${selectedIdea.description}`,
              platforms: [platform],
              ...DEFAULT_POST_CONFIG,
            }),
          });

          if (!response.ok) {
            await handleApiError(response);
          }

          const data = await response.json();
          
          if (data.success && data.post) {
            return { platform, post: data.post, success: true };
          } else {
            throw new Error('Onverwacht response formaat');
          }
        } catch (platformError: any) {
          console.error(`Error generating content for ${platform}:`, platformError);
          const platformName = PLATFORMS.find((p) => p.id === platform)?.name || platform;
          const errorMsg = platformError.message || 'Onbekende fout';
          const tip = getErrorTip(errorMsg);
          
          return { 
            platform, 
            post: `⚠️ Kon geen content genereren voor ${platformName}\n\nFout: ${errorMsg}${tip}`,
            success: false 
          };
        }
      });

      // Wait for all promises to settle
      const results = await Promise.allSettled(generatePromises);
      let successCount = 0;
      let failCount = 0;

      // Process results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { platform, post, success } = result.value;
          newPosts[platform] = post;
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
        } else {
          // This should rarely happen as we handle errors within each promise
          // but we still want to inform the user
          const platform = platforms[index];
          const platformName = PLATFORMS.find((p) => p.id === platform)?.name || platform;
          console.error('Unexpected promise rejection:', result.reason);
          newPosts[platform] = `⚠️ Kon geen content genereren voor ${platformName}\n\nFout: Onverwachte fout bij verwerken\n\nTip: Probeer het opnieuw of neem contact op met support.`;
          failCount++;
        }
      });

      setGeneratedPosts(newPosts);
      setShowModal(false);
      setShowResultsModal(true);

      // Show appropriate success message
      if (successCount === platforms.length) {
        toast.success(`${successCount} posts succesvol gegenereerd!`, { id: 'generate-posts' });
      } else if (successCount > 0) {
        toast.success(`${successCount} posts gegenereerd, ${failCount} mislukt`, { id: 'generate-posts' });
      } else {
        toast.error('Geen posts konden worden gegenereerd', { id: 'generate-posts' });
      }
    } catch (error: any) {
      console.error('Error generating posts:', error);
      toast.error(error.message || 'Fout bij genereren van posts', { id: 'generate-posts' });
    } finally {
      setGeneratingPosts(false);
    }
  };

  const copyToClipboard = async (platform: string, content: string) => {
    const success = await safelyCopyToClipboard(content);
    
    if (success) {
      setCopiedPlatform(platform);
      toast.success('Content gekopieerd naar klembord!');
      
      setTimeout(() => {
        setCopiedPlatform(null);
      }, 2000);
    } else {
      toast.error('Kon content niet kopiëren. Probeer het handmatig te selecteren en kopiëren.');
    }
  };

  const getCategoryBadge = (category: ContentIdea['category']) => {
    const styles = {
      trending: 'bg-red-500/20 text-red-300 border-red-500/50',
      seasonal: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      evergreen: 'bg-green-500/20 text-green-300 border-green-500/50',
      engagement: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    };

    const icons = {
      trending: TrendingUp,
      seasonal: Calendar,
      evergreen: Star,
      engagement: Zap,
    };

    const Icon = icons[category];

    return (
      <Badge className={`${styles[category]} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: ContentIdea['urgency']) => {
    if (urgency === 'high') {
      return <Badge className="bg-red-500/20 text-red-300">🔥 Urgent</Badge>;
    }
    return null;
  };

  const PlatformIcon = ({ platformId }: { platformId: string }) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return null;
    
    const Icon = platform.icon;
    return (
      <div 
        className="p-2 rounded-full bg-gray-700/50 border border-gray-600"
        title={platform.name}
      >
        <Icon 
          className="w-4 h-4" 
          style={{ color: platform.color }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section with Action Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">💡 Content Ideeën</h2>
          <p className="text-muted-foreground">
            AI-gegenereerde content ideeën voor al je social media platforms
          </p>
        </div>
        <Button
          onClick={generateIdeas}
          disabled={loading || !projectId || projectLoading}
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
          title={!projectId && !projectLoading ? 'Selecteer eerst een project' : ''}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Genereren...
            </>
          ) : projectLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Project laden...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Genereer 10 Nieuwe Ideeën
            </>
          )}
        </Button>
      </div>

      {/* Empty State */}
      {ideas.length === 0 && !loading && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="text-center py-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-orange-500 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Klaar om te beginnen?
            </h3>
            <p className="text-muted-foreground mb-6">
              Klik op de knop hierboven om AI content ideeën te laten genereren
            </p>
            {!projectId && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                ⚠️ Selecteer eerst een project
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ideas Grid */}
      {ideas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <Card
              key={idea.id}
              className="bg-gray-800/50 border-gray-700 hover:border-orange-500/50 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
              onClick={() => handleIdeaClick(idea)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  {getCategoryBadge(idea.category)}
                  {getUrgencyBadge(idea.urgency)}
                </div>
                <CardTitle className="text-white text-lg line-clamp-2">
                  {idea.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {idea.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Platform Icons */}
                <div className="flex items-center gap-2 mb-4">
                  {idea.suggestedPlatforms.map((platform) => (
                    <PlatformIcon key={platform} platformId={platform} />
                  ))}
                </div>

                {/* Engagement Score */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    Verwachte engagement
                  </span>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {idea.estimatedEngagement}%
                  </Badge>
                </div>

                {/* Generate Button */}
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleIdeaClick(idea);
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Genereer Posts
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal for Idea Details */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedIdea?.title}</DialogTitle>
            <DialogDescription>
              {selectedIdea?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedIdea && (
            <div className="space-y-6">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {getCategoryBadge(selectedIdea.category)}
                {getUrgencyBadge(selectedIdea.urgency)}
                <Badge variant="outline" className="text-green-400 border-green-400">
                  {selectedIdea.estimatedEngagement}% engagement
                </Badge>
              </div>

              {/* Platforms */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Aanbevolen platforms:</h3>
                <div className="flex items-center gap-3">
                  {selectedIdea.suggestedPlatforms.map((platformId) => {
                    const platform = PLATFORMS.find(p => p.id === platformId);
                    if (!platform) return null;
                    const Icon = platform.icon;
                    return (
                      <div key={platformId} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
                        <Icon className="w-5 h-5" style={{ color: platform.color }} />
                        <span className="text-sm">{platform.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-muted-foreground">
                  AI zal specifieke posts genereren voor elk platform, geoptimaliseerd voor de juiste toon, 
                  lengte en stijl. Elk platform krijgt unieke content afgestemd op het publiek.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleGeneratePosts}
                  disabled={generatingPosts}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  size="lg"
                >
                  {generatingPosts ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Genereer voor Alle Platforms
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  className="border-gray-700"
                >
                  Annuleren
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Results Modal for Generated Posts */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-400" />
              Gegenereerde Posts
            </DialogTitle>
            <DialogDescription>
              Je posts zijn gegenereerd voor {Object.keys(generatedPosts).length} platform(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {Object.entries(generatedPosts).map(([platformId, content]) => {
              const platform = PLATFORMS.find((p) => p.id === platformId);
              if (!platform) return null;
              
              const Icon = platform.icon;
              const isError = content.startsWith('⚠️');

              return (
                <div 
                  key={platformId} 
                  className={`border rounded-lg p-4 space-y-3 ${
                    isError ? 'border-red-500/30 bg-red-500/5' : 'border-gray-700 bg-gray-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" style={{ color: platform.color }} />
                      <span className="font-semibold">{platform.name}</span>
                      {!isError && (
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          {content.length} tekens
                        </Badge>
                      )}
                    </div>
                    {!isError && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(platformId, content)}
                        className="gap-2"
                      >
                        {copiedPlatform === platformId ? (
                          <>
                            <Check className="h-4 w-4" />
                            Gekopieerd
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Kopiëren
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className={`rounded p-3 text-sm whitespace-pre-wrap ${
                    isError ? 'bg-red-900/20 text-red-200' : 'bg-gray-900/50'
                  }`}>
                    {content}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
            <Button
              onClick={() => setShowResultsModal(false)}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Sluiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
