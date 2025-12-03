
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Info,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface OriginalityScore {
  ai: number;
  original: number;
  score: number;
}

interface OriginalityCheckerProps {
  content: string;
  contentId?: string;
  projectId?: string;
  onContentUpdated?: (newContent: string) => void;
  compact?: boolean;
}

export function OriginalityChecker({
  content,
  contentId,
  projectId,
  onContentUpdated,
  compact = false,
}: OriginalityCheckerProps) {
  const [scanning, setScanning] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [score, setScore] = useState<OriginalityScore | null>(null);
  const [level, setLevel] = useState<'safe' | 'warning' | 'danger' | null>(null);
  const [message, setMessage] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [humanizedContent, setHumanizedContent] = useState<string>('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [beforeScore, setBeforeScore] = useState<OriginalityScore | null>(null);
  const [afterScore, setAfterScore] = useState<OriginalityScore | null>(null);
  const [provider, setProvider] = useState<'originality' | 'zerogpt'>('originality');
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [fullReport, setFullReport] = useState<any>(null);

  const scanContent = async () => {
    if (!content || content.length < 50) {
      toast.error('Content te kort voor scanning (minimaal 50 karakters)');
      return;
    }

    setScanning(true);
    try {
      const response = await fetch('/api/client/originality/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, provider, projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scan mislukt');
      }

      setScore(data.score);
      setLevel(data.level);
      setMessage(data.message);
      setCurrentProvider(data.provider || provider);
      setFullReport(data); // Store full report for download
      setShowDetails(true);

      // Show toast based on level
      if (data.level === 'safe') {
        toast.success('✅ Content lijkt menselijk geschreven!');
      } else if (data.level === 'warning') {
        toast.warning('⚠️ Matige AI-detectie - overweeg humanization');
      } else {
        toast.error('🚨 Hoge AI-detectie - humanization aanbevolen');
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error(error.message || 'Fout bij scannen');
    } finally {
      setScanning(false);
    }
  };

  const downloadReport = () => {
    if (!fullReport || !score) {
      toast.error('Geen rapport beschikbaar om te downloaden');
      return;
    }

    const reportContent = `AI DETECTIE RAPPORT
Gegenereerd: ${new Date().toLocaleString('nl-NL')}
Provider: ${currentProvider === 'originality' ? 'Originality.AI' : 'ZeroGPT'}

====================================

AI SCORE: ${Math.round(score.ai)}%
ORIGINALITY SCORE: ${Math.round(score.original)}%
STATUS: ${level === 'safe' ? 'Veilig' : level === 'warning' ? 'Waarschuwing' : 'Gevaar'}

BEOORDELING:
${message}

====================================

CONTENT ANALYSE:
Lengte: ${content.length} karakters
Woorden: ~${Math.round(content.split(/\s+/).length)} woorden

${fullReport.sentences && fullReport.sentences.length > 0 ? `
ZINS-NIVEAU ANALYSE:
${fullReport.sentences.map((s: any, idx: number) => 
  `${idx + 1}. [${Math.round(s.ai_score)}% AI] ${s.text}`
).join('\n')}
` : ''}

====================================

AANBEVELINGEN:
${level === 'safe' 
  ? '✓ Content lijkt natuurlijk en menselijk geschreven. Geen actie vereist.' 
  : level === 'warning'
  ? '⚠ Overweeg humanization om de natuurlijkheid te verbeteren.'
  : '⚠⚠⚠ Humanization sterk aanbevolen om AI-detectie te verlagen.'}

Credits gebruikt: ${fullReport.credits_used || 'N/A'}
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-detectie-rapport-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Rapport gedownload!');
  };

  const humanizeContent = async () => {
    if (!content || content.length < 100) {
      toast.error('Content te kort voor humanization (minimaal 100 karakters)');
      return;
    }

    setHumanizing(true);
    try {
      const response = await fetch('/api/client/originality/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          language: 'nl',
          preserveTone: true,
          skipScan: false,
          provider,
          projectId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Humanization mislukt');
      }

      setHumanizedContent(data.humanized);
      setImprovements(data.improvements || []);
      setBeforeScore(data.beforeScore);
      setAfterScore(data.afterScore);
      setCurrentProvider(data.provider || provider);
      setShowDetails(true);

      // Show improvement message
      if (data.improvement > 0) {
        toast.success(`🎉 AI-detectie verlaagd met ${data.improvement}%!`);
      } else {
        toast.success('✨ Content succesvol gehumaniseerd!');
      }

      // Update content if callback provided
      if (onContentUpdated) {
        onContentUpdated(data.humanized);
      }
    } catch (error: any) {
      console.error('Humanization error:', error);
      toast.error(error.message || 'Fout bij humaniseren');
    } finally {
      setHumanizing(false);
    }
  };

  const applyHumanizedContent = () => {
    if (humanizedContent && onContentUpdated) {
      onContentUpdated(humanizedContent);
      toast.success('Content bijgewerkt met gehumaniseerde versie');
      setShowDetails(false);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-2 items-center flex-wrap">
        <Select value={provider} onValueChange={(value: any) => setProvider(value)}>
          <SelectTrigger className="w-[140px] h-9 bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[9999] bg-gray-800 border-gray-700">
            <SelectItem value="originality" className="text-white">Originality.AI</SelectItem>
            <SelectItem value="zerogpt" className="text-white">ZeroGPT</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={scanContent}
          disabled={scanning || !content}
          size="sm"
          variant="outline"
          className="border-gray-700 text-white hover:bg-gray-800"
        >
          {scanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scannen...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Scan AI
            </>
          )}
        </Button>

        <Button
          onClick={humanizeContent}
          disabled={humanizing || !content}
          size="sm"
          variant="default"
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
        >
          {humanizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verbeteren...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Verbeter
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-orange-500" />
            AI Detection & Humanizer
          </CardTitle>
          <CardDescription className="text-white">
            Check je content met AI-detectoren en verbeter de natuurlijkheid. Perfect voor wanneer je content dat professionele extratje wil geven zonder robottaal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info Alert */}
          <Alert className="bg-orange-500/10 border-orange-500/30">
            <Info className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-gray-200 text-sm">
              <strong className="text-white">Let op:</strong> Deze tool is bedoeld om je content natuurlijker te maken, niet om AI-detectie te "omzeilen". Gebruik het om je teksten dat professionele menselijke tintje te geven.
            </AlertDescription>
          </Alert>

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">AI Detection Provider</label>
            <Select value={provider} onValueChange={(value: any) => setProvider(value)}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-gray-800 border-gray-700">
                <SelectItem value="originality" className="text-white">Originality.AI</SelectItem>
                <SelectItem value="zerogpt" className="text-white">ZeroGPT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {score && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">AI Detection Score</span>
                <div className="flex items-center gap-2">
                  {currentProvider && (
                    <Badge variant="outline" className="text-xs text-white border-gray-600">
                      {currentProvider === 'originality' ? 'Originality.AI' : 'ZeroGPT'}
                    </Badge>
                  )}
                  <Badge
                    variant={level === 'safe' ? 'default' : level === 'warning' ? 'secondary' : 'destructive'}
                    className="text-lg font-bold"
                  >
                    {Math.round(score.ai)}%
                  </Badge>
                </div>
              </div>

              <div className="w-full bg-gray-800 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    level === 'safe'
                      ? 'bg-green-500'
                      : level === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${score.ai}%` }}
                />
              </div>

              <Alert className="bg-gray-800/50 border-gray-700">
                <Info className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-white font-medium">{message}</AlertDescription>
              </Alert>

              <Button
                onClick={downloadReport}
                variant="outline"
                size="sm"
                className="w-full border-gray-700 text-white hover:bg-gray-800"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Rapport
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={scanContent}
              disabled={scanning || !content}
              variant="outline"
              className="flex-1 border-gray-700 text-white hover:bg-gray-800"
            >
              {scanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scannen...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Scan AI-detectie
                </>
              )}
            </Button>

            <Button
              onClick={humanizeContent}
              disabled={humanizing || !content}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
            >
              {humanizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verbeteren...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Verbeter Content
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {humanizedContent ? (
                <>
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  Content Verbeterd
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 text-orange-500" />
                  AI Detectie Resultaat
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {humanizedContent
                ? 'Je content is verfijnd om natuurlijker en menselijker te klinken'
                : 'AI-detectie analyse van je content'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {beforeScore && afterScore && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white font-semibold">Voor Verbetering</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-400">
                      {Math.round(beforeScore.ai)}%
                    </div>
                    <p className="text-xs text-gray-400 mt-1">AI Score</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white font-semibold">Na Verbetering</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-400">
                      {Math.round(afterScore.ai)}%
                    </div>
                    <p className="text-xs text-gray-400 mt-1">AI Score</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {improvements.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    Toegepaste Verbeteringen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {improvements.map((improvement, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-200">{improvement}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {humanizedContent && (
              <div className="space-y-2">
                <Button
                  onClick={applyHumanizedContent}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Gebruik Verbeterde Content
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
