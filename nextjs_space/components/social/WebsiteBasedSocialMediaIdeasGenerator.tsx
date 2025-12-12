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
  Lightbulb,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Copy,
  Download,
  ArrowLeft,
  Hash,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WebsiteAnalysis {
  url: string;
  title?: string;
  description?: string;
  niche?: string;
  targetAudience?: string;
  tone?: string;
  products?: string[];
  services?: string[];
}

interface SocialMediaIdea {
  concept: string;
  description: string;
  platforms: string[];
  contentType: string;
  hashtags: string[];
  callToAction: string;
  postExample: string;
}

interface WebsiteBasedSocialMediaIdeasGeneratorProps {
  onComplete?: () => void;
}

export default function WebsiteBasedSocialMediaIdeasGenerator({ 
  onComplete 
}: WebsiteBasedSocialMediaIdeasGeneratorProps) {
  const [step, setStep] = useState<'input' | 'analyzing' | 'preview'>('input');
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Input state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [numberOfIdeas, setNumberOfIdeas] = useState(20);
  const [platforms, setPlatforms] = useState<string[]>(['linkedin', 'instagram', 'facebook']);
  
  // Analysis results
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null);
  
  // Generated ideas
  const [ideas, setIdeas] = useState<SocialMediaIdea[]>([]);

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
      
      const analyzeRes = await fetch('/api/admin/social-media/analyze-website', {
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

      // Step 2: Generate social media ideas
      toast.loading('Content ideeën genereren...', { id: 'generate' });
      setGenerating(true);

      const generateRes = await fetch('/api/admin/social-media/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl,
          websiteAnalysis: analysisData,
          numberOfIdeas,
          platforms,
        }),
      });

      if (!generateRes.ok) {
        const error = await generateRes.json();
        throw new Error(error.error || 'Ideeën generatie mislukt');
      }

      const ideasData = await generateRes.json();
      setIdeas(ideasData.ideas);
      
      toast.success(`✨ ${ideasData.ideas.length} content ideeën gegenereerd!`, { id: 'generate' });
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

  const togglePlatform = (platform: string) => {
    setPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Gekopieerd naar klembord!');
  };

  const exportAsCSV = () => {
    const csvContent = [
      ['Concept', 'Beschrijving', 'Platforms', 'Content Type', 'Hashtags', 'CTA', 'Voorbeeld Post'],
      ...ideas.map(idea => [
        idea.concept,
        idea.description,
        idea.platforms.join(', '),
        idea.contentType,
        idea.hashtags.join(' '),
        idea.callToAction,
        idea.postExample,
      ])
    ].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-media-ideas-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV geëxporteerd!');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'instagram': return 'bg-pink-500/20 text-pink-400 border-pink-500/50';
      case 'facebook': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
      case 'twitter': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Input Step
  if (step === 'input') {
    return (
      <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Lightbulb className="w-6 h-6 text-purple-400" />
            </div>
            Website-Based Social Media Content Ideeën Generator
          </CardTitle>
          <p className="text-gray-400 text-sm mt-2">
            Voer de website URL van je klant in. De AI analyseert de website automatisch en genereert social media post ideeën op maat.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Banner */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-purple-300 mb-1">
                Hoe het werkt
              </p>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>AI analyseert de website (producten, diensten, doelgroep, tone)</li>
                <li>Genereert diverse social media post concepten</li>
                <li>Per platform geoptimaliseerd (LinkedIn, Instagram, Facebook, etc.)</li>
                <li>Inclusief hashtags, CTA's en voorbeeldteksten</li>
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
                De AI analyseert deze website om relevante social media content voor te stellen
              </p>
            </div>

            {/* Aantal Ideas */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Aantal Content Ideeën</Label>
              <Select
                value={numberOfIdeas.toString()}
                onValueChange={(v) => setNumberOfIdeas(parseInt(v))}
              >
                <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 ideeën</SelectItem>
                  <SelectItem value="20">20 ideeën (aanbevolen)</SelectItem>
                  <SelectItem value="30">30 ideeën</SelectItem>
                  <SelectItem value="50">50 ideeën</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Platforms Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Platforms</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button
                  type="button"
                  variant={platforms.includes('linkedin') ? 'default' : 'outline'}
                  onClick={() => togglePlatform('linkedin')}
                  className={`h-20 ${
                    platforms.includes('linkedin')
                      ? 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30'
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Linkedin className="w-6 h-6" />
                    <span className="text-sm">LinkedIn</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={platforms.includes('instagram') ? 'default' : 'outline'}
                  onClick={() => togglePlatform('instagram')}
                  className={`h-20 ${
                    platforms.includes('instagram')
                      ? 'bg-pink-500/20 border-pink-500/50 hover:bg-pink-500/30'
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Instagram className="w-6 h-6" />
                    <span className="text-sm">Instagram</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={platforms.includes('facebook') ? 'default' : 'outline'}
                  onClick={() => togglePlatform('facebook')}
                  className={`h-20 ${
                    platforms.includes('facebook')
                      ? 'bg-indigo-500/20 border-indigo-500/50 hover:bg-indigo-500/30'
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Facebook className="w-6 h-6" />
                    <span className="text-sm">Facebook</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={platforms.includes('twitter') ? 'default' : 'outline'}
                  onClick={() => togglePlatform('twitter')}
                  className={`h-20 ${
                    platforms.includes('twitter')
                      ? 'bg-cyan-500/20 border-cyan-500/50 hover:bg-cyan-500/30'
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Twitter className="w-6 h-6" />
                    <span className="text-sm">Twitter</span>
                  </div>
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Selecteer platforms waarvoor je content ideeën wilt genereren
              </p>
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyzeWebsite}
            disabled={analyzing || !websiteUrl || platforms.length === 0}
            className="w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg font-semibold"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Website analyseren...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Analyseer Website & Genereer Content Ideeën
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
      <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">
            Website Wordt Geanalyseerd
          </h3>
          <p className="text-gray-400 mb-6">
            De AI analyseert {websiteUrl} en genereert social media content ideeën...
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
              Producten/diensten detecteren
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              {generating ? (
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-600 rounded-full" />
              )}
              Content ideeën genereren
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview Step
  if (step === 'preview') {
    return (
      <div className="space-y-6">
        {/* Analysis Summary */}
        {websiteAnalysis && (
          <Card className="bg-gradient-to-br from-green-900/40 to-purple-900/40 border-green-500/30">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  {ideas.length} Content Ideeën Gegenereerd
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={exportAsCSV}
                    variant="outline"
                    size="sm"
                    className="border-gray-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exporteer CSV
                  </Button>
                  <Button
                    onClick={() => {
                      setStep('input');
                      setIdeas([]);
                      setWebsiteAnalysis(null);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-gray-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Nieuwe Analyse
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Website</div>
                  <div className="font-semibold text-white truncate">{websiteAnalysis.url}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Niche</div>
                  <div className="font-semibold text-white">{websiteAnalysis.niche || 'Onbekend'}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Doelgroep</div>
                  <div className="font-semibold text-white">{websiteAnalysis.targetAudience || 'Onbekend'}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Platforms</div>
                  <div className="flex gap-1 flex-wrap">
                    {platforms.map(platform => (
                      <Badge key={platform} className={`text-xs border ${getPlatformColor(platform)}`}>
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ideas List */}
        <div className="space-y-4">
          {ideas.map((idea, index) => (
            <Card
              key={index}
              className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors"
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {idea.contentType}
                        </Badge>
                        {idea.platforms.map(platform => (
                          <Badge key={platform} className={`text-xs border ${getPlatformColor(platform)}`}>
                            <span className="mr-1">{getPlatformIcon(platform)}</span>
                            {platform}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {idea.concept}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {idea.description}
                      </p>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(idea.postExample)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Example Post */}
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <Label className="text-xs text-gray-400 mb-2 block">Voorbeeld Post</Label>
                    <p className="text-sm text-white whitespace-pre-wrap">
                      {idea.postExample}
                    </p>
                  </div>

                  {/* Hashtags */}
                  {idea.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {idea.hashtags.map((hashtag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <Hash className="w-3 h-3 mr-1" />
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  {idea.callToAction && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                      <Label className="text-xs text-purple-300 mb-1 block">Call-to-Action</Label>
                      <p className="text-sm text-white">{idea.callToAction}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
