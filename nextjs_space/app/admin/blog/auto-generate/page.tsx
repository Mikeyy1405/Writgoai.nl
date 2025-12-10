'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { WRITGO_CONTEXT } from '@/lib/writgo-context';
import { toast } from 'sonner';

export default function AutoGenerateBlogPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateArticle = async (title: string) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // TODO: Implement API call to generate article with Writgo context
      toast.success('Artikel wordt gegenereerd! Dit kan enkele minuten duren...');
      
      // Placeholder for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLastGenerated(title);
      toast.success(`Artikel "${title}" succesvol gegenereerd!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er ging iets mis bij het genereren';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRandomArticle = async () => {
    const randomTitle = WRITGO_CONTEXT.pillarArticles[
      Math.floor(Math.random() * WRITGO_CONTEXT.pillarArticles.length)
    ];
    await generateArticle(randomTitle);
  };

  const generateForKeyword = async (keyword: string) => {
    const title = `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: De Complete Gids voor 2026`;
    await generateArticle(title);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="w-10 h-10 text-orange-500" />
            🚀 1-Klik Blog Generator
          </h1>
          <p className="text-zinc-400 text-lg">
            Genereer automatisch SEO-geoptimaliseerde blog posts voor writgo.nl
          </p>
        </div>

        {/* Status Message */}
        {lastGenerated && (
          <Card className="mb-6 bg-green-900/20 border-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <div>
                  <p className="font-semibold text-white">Laatst gegenereerd:</p>
                  <p className="text-green-300">{lastGenerated}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-red-900/20 border-red-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="font-semibold text-white">Fout opgetreden:</p>
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pillar Articles Section */}
        <Card className="mb-6 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📚 Pillar Articles (uit Businessplan)
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Klik op een onderwerp om direct te genereren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {WRITGO_CONTEXT.pillarArticles.map((title, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start text-left h-auto py-3 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:border-orange-500 transition-all"
                  onClick={() => generateArticle(title)}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />
                  <span className="text-white">{title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Random Generator Section */}
        <Card className="mb-6 bg-gradient-to-br from-orange-900/20 to-zinc-900 border-orange-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎲 Random Artikel
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Laat AI een relevant onderwerp kiezen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
              onClick={generateRandomArticle}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Bezig met genereren...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Genereer Random SEO Artikel
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Keyword-based Generator Section */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Keyword Focus
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Genereer artikel voor specifiek keyword
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {WRITGO_CONTEXT.targetKeywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-orange-500 hover:text-white transition-colors py-2 px-3 text-sm bg-zinc-800 text-zinc-300"
                  onClick={() => !isGenerating && generateForKeyword(keyword)}
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Context Info */}
        <Card className="mt-6 bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm">ℹ️ Auto-Context Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-500 space-y-1">
            <p>• Bedrijf: {WRITGO_CONTEXT.bedrijf}</p>
            <p>• Type: {WRITGO_CONTEXT.type}</p>
            <p>• Doelgroep: {WRITGO_CONTEXT.doelgroep}</p>
            <p>• Tone: {WRITGO_CONTEXT.tone}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
