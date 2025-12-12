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
  Loader2,
  CheckCircle2,
  Target,
  Users,
  MessageSquare,
  Hash,
  Calendar,
  TrendingUp,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WebsiteAnalysis {
  niche: string;
  targetAudience: string;
  tone: string;
  keywords: string[];
  themes: string[];
}

interface SocialMediaStrategyGeneratorProps {
  clientId: string;
  websiteAnalysis?: WebsiteAnalysis | null;
  onComplete?: () => void;
}

interface StrategyConfig {
  niche: string;
  targetAudience: string;
  tone: string;
  keywords: string[];
  totalPosts: number;
  period: string;
  platforms: string[];
  postsPerWeek: {
    [key: string]: number;
  };
  contentTypes: string[];
}

export default function SocialMediaStrategyGenerator({ 
  clientId,
  websiteAnalysis, 
  onComplete 
}: SocialMediaStrategyGeneratorProps) {
  const [step, setStep] = useState<number>(1);
  const [generating, setGenerating] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null);
  
  // Configuration state with pre-fill from website analysis
  const [config, setConfig] = useState<StrategyConfig>({
    niche: websiteAnalysis?.niche || '',
    targetAudience: websiteAnalysis?.targetAudience || '',
    tone: websiteAnalysis?.tone || 'Professional',
    keywords: websiteAnalysis?.keywords || [],
    totalPosts: 200,
    period: '3_months',
    platforms: ['linkedin', 'instagram', 'facebook'],
    postsPerWeek: {
      linkedin: 5,
      instagram: 7,
      facebook: 5,
    },
    contentTypes: ['educational', 'promotional', 'engagement'],
  });

  const togglePlatform = (platform: string) => {
    setConfig(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const toggleContentType = (type: string) => {
    setConfig(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter(t => t !== type)
        : [...prev.contentTypes, type],
    }));
  };

  const handleGenerate = async () => {
    // Validation
    if (!config.niche || !config.targetAudience || config.platforms.length === 0) {
      toast.error('Vul alle verplichte velden in');
      return;
    }

    setGenerating(true);
    setStep(2);
    toast.loading('Strategie genereren...', { id: 'generate' });

    try {
      const response = await fetch('/api/admin/social/strategy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          ...config,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generatie mislukt');
      }

      const data = await response.json();
      setGeneratedStrategy(data);
      
      toast.success(`✨ ${data.totalPosts} posts strategie gegenereerd!`, { id: 'generate' });
      setStep(3);
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Fout bij genereren strategie', { id: 'generate' });
      setStep(1);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'facebook': return <Facebook className="w-5 h-5" />;
      case 'twitter': return <Twitter className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  // Step 1: Configuration
  if (step === 1) {
    return (
      <div className="space-y-6">
        {/* Website Analysis Pre-fill Banner */}
        {websiteAnalysis && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-300 mb-2">
                  ✨ Velden automatisch ingevuld met AI website analyse
                </p>
                <p className="text-xs text-gray-400">
                  Je kunt alle velden nog aanpassen indien gewenst
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Niche */}
        <div className="space-y-2">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            Niche / Onderwerp *
            {websiteAnalysis && (
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-300">
                ✨ Auto-detected
              </Badge>
            )}
          </Label>
          <Input
            value={config.niche}
            onChange={(e) => setConfig({ ...config, niche: e.target.value })}
            placeholder="bijv. B2B LinkedIn Marketing voor Tech Startups"
            className="h-14 bg-gray-800/50 border-gray-700"
          />
          <p className="text-xs text-gray-500">
            Wees specifiek - dit bepaalt de focus van alle content
          </p>
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Doelgroep *
            {websiteAnalysis && (
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-300">
                ✨ Auto-detected
              </Badge>
            )}
          </Label>
          <Input
            value={config.targetAudience}
            onChange={(e) => setConfig({ ...config, targetAudience: e.target.value })}
            placeholder="bijv. Marketing Managers bij Tech Startups (50-500 medewerkers)"
            className="h-14 bg-gray-800/50 border-gray-700"
          />
        </div>

        {/* Tone */}
        <div className="space-y-2">
          <Label className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Tone of Voice
            {websiteAnalysis && (
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-300">
                ✨ Auto-detected
              </Badge>
            )}
          </Label>
          <Select
            value={config.tone}
            onValueChange={(value) => setConfig({ ...config, tone: value })}
          >
            <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Professional">Professioneel</SelectItem>
              <SelectItem value="Casual">Casual & Vriendelijk</SelectItem>
              <SelectItem value="Informative">Informatief</SelectItem>
              <SelectItem value="Inspiring">Inspirerend</SelectItem>
              <SelectItem value="Funny">Grappig</SelectItem>
              <SelectItem value="Serious">Serieus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Keywords (comma-separated)
            {websiteAnalysis && (
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-300">
                ✨ Auto-detected
              </Badge>
            )}
          </Label>
          <Input
            value={config.keywords.join(', ')}
            onChange={(e) => 
              setConfig({ 
                ...config, 
                keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) 
              })
            }
            placeholder="bijv. social media, marketing, content strategy"
            className="h-14 bg-gray-800/50 border-gray-700"
          />
        </div>

        {/* Total Posts */}
        <div className="space-y-2">
          <Label className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Totaal Aantal Posts
          </Label>
          <Select
            value={config.totalPosts.toString()}
            onValueChange={(value) => setConfig({ ...config, totalPosts: parseInt(value) })}
          >
            <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100 posts (ongeveer 1 maand)</SelectItem>
              <SelectItem value="200">200 posts (ongeveer 3 maanden) - Aanbevolen</SelectItem>
              <SelectItem value="300">300 posts (ongeveer 6 maanden)</SelectItem>
              <SelectItem value="500">500 posts (ongeveer 1 jaar)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Platforms */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Platforms *</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              type="button"
              variant={config.platforms.includes('linkedin') ? 'default' : 'outline'}
              onClick={() => togglePlatform('linkedin')}
              className={`h-24 ${
                config.platforms.includes('linkedin')
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'border-gray-700'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Linkedin className="w-6 h-6" />
                <span className="text-sm font-semibold">LinkedIn</span>
              </div>
            </Button>
            <Button
              type="button"
              variant={config.platforms.includes('instagram') ? 'default' : 'outline'}
              onClick={() => togglePlatform('instagram')}
              className={`h-24 ${
                config.platforms.includes('instagram')
                  ? 'bg-pink-500/20 border-pink-500/50'
                  : 'border-gray-700'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Instagram className="w-6 h-6" />
                <span className="text-sm font-semibold">Instagram</span>
              </div>
            </Button>
            <Button
              type="button"
              variant={config.platforms.includes('facebook') ? 'default' : 'outline'}
              onClick={() => togglePlatform('facebook')}
              className={`h-24 ${
                config.platforms.includes('facebook')
                  ? 'bg-indigo-500/20 border-indigo-500/50'
                  : 'border-gray-700'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Facebook className="w-6 h-6" />
                <span className="text-sm font-semibold">Facebook</span>
              </div>
            </Button>
            <Button
              type="button"
              variant={config.platforms.includes('twitter') ? 'default' : 'outline'}
              onClick={() => togglePlatform('twitter')}
              className={`h-24 ${
                config.platforms.includes('twitter')
                  ? 'bg-cyan-500/20 border-cyan-500/50'
                  : 'border-gray-700'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Twitter className="w-6 h-6" />
                <span className="text-sm font-semibold">Twitter</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Content Types */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Content Types *</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {['educational', 'promotional', 'engagement', 'storytelling', 'news', 'behind_scenes'].map(type => (
              <Button
                key={type}
                type="button"
                variant={config.contentTypes.includes(type) ? 'default' : 'outline'}
                onClick={() => toggleContentType(type)}
                className={`h-14 ${
                  config.contentTypes.includes(type)
                    ? 'bg-purple-500/20 border-purple-500/50'
                    : 'border-gray-700'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!config.niche || !config.targetAudience || config.platforms.length === 0}
          className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Genereer Social Media Strategie
        </Button>
      </div>
    );
  }

  // Step 2: Generating
  if (step === 2) {
    return (
      <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">
            Social Media Strategie Wordt Gegenereerd
          </h3>
          <p className="text-gray-400 mb-6">
            AI genereert {config.totalPosts} posts voor {config.platforms.length} platform(s)...
          </p>
          <div className="space-y-3 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Content thema's bepalen
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              Post ideeën genereren
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-600 rounded-full" />
              Content calendar opstellen
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Preview & Approve
  if (step === 3 && generatedStrategy) {
    return (
      <div className="space-y-6">
        {/* Success Banner */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-base font-semibold text-green-300">
                ✅ Strategie Gegenereerd!
              </p>
              <p className="text-sm text-gray-400">
                {generatedStrategy.totalPosts} posts klaar voor batch generatie
              </p>
            </div>
          </div>
        </div>

        {/* Strategy Summary */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">Strategie Overzicht</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-900/50 rounded-lg">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {generatedStrategy.totalPosts}
              </div>
              <div className="text-sm text-gray-400">Totaal Posts</div>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-lg">
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {config.platforms.length}
              </div>
              <div className="text-sm text-gray-400">Platforms</div>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-lg">
              <div className="text-3xl font-bold text-green-400 mb-1">
                ~{Math.round(generatedStrategy.totalPosts / config.platforms.length / 4)}
              </div>
              <div className="text-sm text-gray-400">Posts/Week</div>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-lg">
              <div className="text-3xl font-bold text-orange-400 mb-1">
                ~{Math.round(generatedStrategy.totalPosts / config.platforms.length / 16)}
              </div>
              <div className="text-sm text-gray-400">Maanden</div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleApprove}
            className="flex-1 h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg font-semibold"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            ✅ Goedkeuren & Start Generatie
          </Button>
          <Button
            onClick={() => setStep(1)}
            variant="outline"
            className="h-16 border-gray-600"
          >
            Aanpassen
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
