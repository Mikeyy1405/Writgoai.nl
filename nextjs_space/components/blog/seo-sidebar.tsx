'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  Link as LinkIcon,
  Hash,
} from 'lucide-react';

interface SEOData {
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription: string;
  focusKeyword: string;
  slug: string;
}

interface SEOAnalysis {
  seoScore: number;
  issues: string[];
  suggestions: string[];
  wordCount: number;
  readingTimeMinutes: number;
  internalLinks: string[];
  externalLinks: string[];
}

interface SEOSidebarProps {
  data: SEOData;
  onChange: (field: string, value: string) => void;
}

export function SEOSidebar({ data, onChange }: SEOSidebarProps) {
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    // Debounce the analysis
    const timer = setTimeout(() => {
      if (data.title && data.content) {
        analyzeContent();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [data.title, data.content, data.metaDescription, data.focusKeyword, data.slug]);

  const analyzeContent = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/admin/blog/seo-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        setAnalysis(result);
      }
    } catch (error) {
      console.error('Error analyzing content:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Uitstekend', variant: 'default' as const };
    if (score >= 60) return { label: 'Goed', variant: 'secondary' as const };
    if (score >= 40) return { label: 'Gemiddeld', variant: 'outline' as const };
    return { label: 'Zwak', variant: 'destructive' as const };
  };

  return (
    <div className="space-y-6">
      {/* SEO Score */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            SEO Score
          </h3>
          {analyzing && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent" />
          )}
        </div>

        {analysis && (
          <>
            <div className="text-center mb-4">
              <div className={`text-5xl font-bold ${getScoreColor(analysis.seoScore)}`}>
                {analysis.seoScore}
              </div>
              <Badge variant={getScoreBadge(analysis.seoScore).variant} className="mt-2">
                {getScoreBadge(analysis.seoScore).label}
              </Badge>
            </div>

            <Progress value={analysis.seoScore} className="h-2" />

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Woorden:</span>
                <span className="font-medium text-white">{analysis.wordCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Leestijd:</span>
                <span className="font-medium text-white">{analysis.readingTimeMinutes} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Interne links:</span>
                <span className="font-medium text-white">{analysis.internalLinks.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Externe links:</span>
                <span className="font-medium text-white">{analysis.externalLinks.length}</span>
              </div>
            </div>
          </>
        )}

        {!analysis && !analyzing && (
          <p className="text-sm text-gray-400 text-center py-4">
            Voer titel en content in voor SEO analyse
          </p>
        )}
      </Card>

      {/* SEO Issues */}
      {analysis && analysis.issues.length > 0 && (
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="font-semibold flex items-center gap-2 mb-4 text-white">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Te Verbeteren
          </h3>
          <ul className="space-y-2">
            {analysis.issues.map((issue, index) => (
              <li key={index} className="flex gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">{issue}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* SEO Suggestions */}
      {analysis && analysis.suggestions.length > 0 && (
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="font-semibold flex items-center gap-2 mb-4 text-white">
            <Info className="w-5 h-5 text-blue-500" />
            Suggesties
          </h3>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index} className="flex gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">{suggestion}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Meta Fields */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h3 className="font-semibold mb-4 text-white">SEO Meta Data</h3>
        <div className="space-y-4">
          <div>
            <Label className="flex items-center justify-between text-gray-300">
              <span>Meta Title</span>
              <span className="text-xs text-gray-500">
                {(data.metaTitle || data.title)?.length || 0}/60
              </span>
            </Label>
            <Input
              value={data.metaTitle || data.title}
              onChange={(e) => onChange('metaTitle', e.target.value)}
              placeholder={data.title || "SEO vriendelijke titel"}
              maxLength={60}
              className="mt-2 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <Label className="flex items-center justify-between text-gray-300">
              <span>Meta Description</span>
              <span className="text-xs text-gray-500">
                {data.metaDescription?.length || 0}/160
              </span>
            </Label>
            <Textarea
              value={data.metaDescription}
              onChange={(e) => onChange('metaDescription', e.target.value)}
              placeholder="Korte beschrijving voor zoekmachines"
              rows={3}
              maxLength={160}
              className="mt-2 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 text-gray-300">
              <Hash className="w-4 h-4 text-orange-500" />
              Focus Keyword
            </Label>
            <Input
              value={data.focusKeyword}
              onChange={(e) => onChange('focusKeyword', e.target.value)}
              placeholder="Primair zoekwoord"
              className="mt-2 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 text-gray-300">
              <LinkIcon className="w-4 h-4 text-orange-500" />
              Slug
            </Label>
            <Input
              value={data.slug}
              onChange={(e) =>
                onChange(
                  'slug',
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                )
              }
              placeholder="url-vriendelijke-slug"
              className="mt-2 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL: /blog/{data.slug || 'your-slug'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
