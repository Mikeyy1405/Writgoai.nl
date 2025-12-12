'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  Edit2,
  Sparkles,
  Target,
  MessageSquare,
  Hash,
  TrendingUp,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WebsiteAnalysis {
  niche: string;
  nicheConfidence: number;
  targetAudience: string;
  audienceConfidence: number;
  tone: string;
  toneConfidence: number;
  keywords: string[];
  themes: string[];
  reasoning: string;
}

interface WebsiteAnalyzerProps {
  clientId: string;
  onAnalysisComplete?: (analysis: WebsiteAnalysis) => void;
  existingAnalysis?: WebsiteAnalysis | null;
}

interface ResultFieldProps {
  label: string;
  value: string | string[];
  confidence?: number;
  icon: React.ReactNode;
  type?: 'text' | 'tags' | 'list';
  editable?: boolean;
  onEdit?: (value: any) => void;
}

function ResultField({ 
  label, 
  value, 
  confidence, 
  icon, 
  type = 'text', 
  editable = true,
  onEdit 
}: ResultFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(
    Array.isArray(value) ? value.join(', ') : value
  );

  const handleSave = () => {
    if (onEdit) {
      const finalValue = type === 'tags' || type === 'list'
        ? editValue.split(',').map(v => v.trim()).filter(Boolean)
        : editValue;
      onEdit(finalValue);
    }
    setIsEditing(false);
  };

  const getConfidenceColor = (conf?: number) => {
    if (!conf) return 'text-gray-400';
    if (conf >= 80) return 'text-green-400';
    if (conf >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getConfidenceBg = (conf?: number) => {
    if (!conf) return 'bg-gray-500/20';
    if (conf >= 80) return 'bg-green-500/20';
    if (conf >= 60) return 'bg-yellow-500/20';
    return 'bg-orange-500/20';
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <Label className="text-sm font-semibold text-white">{label}</Label>
          {confidence !== undefined && (
            <Badge 
              variant="outline" 
              className={`text-xs ${getConfidenceBg(confidence)} ${getConfidenceColor(confidence)}`}
            >
              {confidence}% confidence
            </Badge>
          )}
          {!isEditing && (
            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-300">
              ✨ AI-detected
            </Badge>
          )}
        </div>
        {editable && !isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="bg-gray-900 border-gray-600"
            placeholder={
              type === 'tags' 
                ? 'Comma-separated tags' 
                : type === 'list'
                ? 'Comma-separated items'
                : 'Enter value'
            }
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Opslaan
            </Button>
            <Button
              onClick={() => {
                setIsEditing(false);
                setEditValue(Array.isArray(value) ? value.join(', ') : value);
              }}
              size="sm"
              variant="outline"
              className="border-gray-600"
            >
              <X className="w-3 h-3 mr-1" />
              Annuleer
            </Button>
          </div>
        </div>
      ) : (
        <>
          {type === 'tags' && Array.isArray(value) ? (
            <div className="flex flex-wrap gap-2">
              {value.map((tag, i) => (
                <Badge 
                  key={i} 
                  variant="secondary"
                  className="bg-gray-700/50 text-gray-300"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          ) : type === 'list' && Array.isArray(value) ? (
            <ul className="space-y-1">
              {value.map((item, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-white leading-relaxed">
              {Array.isArray(value) ? value.join(', ') : value}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function WebsiteAnalyzer({ 
  clientId, 
  onAnalysisComplete,
  existingAnalysis 
}: WebsiteAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(existingAnalysis || null);

  // Check if clientId is valid
  const isValidClientId = clientId && 
    clientId !== 'default-client-id' && 
    clientId.trim().length > 0;

  const handleAnalyze = async () => {
    // Validate clientId before making API call
    if (!isValidClientId) {
      toast.error('Selecteer eerst een client om te analyseren', { id: 'analyze' });
      return;
    }

    setAnalyzing(true);
    toast.loading('Website analyseren...', { id: 'analyze' });

    try {
      const response = await fetch('/api/admin/analyzer/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analyse mislukt');
      }

      const data = await response.json();
      setAnalysis(data);
      
      toast.success('✨ Website analyse compleet!', { id: 'analyze' });
      
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Fout bij website analyse', { id: 'analyze' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEdit = (field: string, value: any) => {
    if (!analysis) return;
    
    setAnalysis({
      ...analysis,
      [field]: value,
    });

    // Notify parent of update
    if (onAnalysisComplete) {
      onAnalysisComplete({
        ...analysis,
        [field]: value,
      });
    }

    toast.success('✅ Bijgewerkt');
  };

  const handleApply = () => {
    if (!analysis) return;
    
    if (onAnalysisComplete) {
      onAnalysisComplete(analysis);
    }
    
    toast.success('✅ Instellingen toegepast!');
  };

  return (
    <Card className="bg-gradient-to-br from-orange-900/20 via-purple-900/10 to-orange-900/20 border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-3 bg-orange-500/20 rounded-xl">
            <Search className="w-6 h-6 text-orange-400" />
          </div>
          🔍 AI Website Analyzer
        </CardTitle>
        <p className="text-gray-400 text-sm mt-2">
          Laat AI je website, content en social media analyseren om automatisch je niche, doelgroep en tone te detecteren
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {!analysis ? (
          // Analyze Button State
          <div className="space-y-4">
            {!isValidClientId && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-300 mb-2">
                      Selecteer eerst een client
                    </p>
                    <p className="text-sm text-gray-400">
                      Je moet eerst een client selecteren voordat je een website analyse kunt uitvoeren.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-300 mb-2">
                    Wat wordt geanalyseerd?
                  </p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>✓ Website content en structuur</li>
                    <li>✓ Recent gepubliceerde blog posts (laatste 20)</li>
                    <li>✓ Social media posts geschiedenis (laatste 50)</li>
                    <li>✓ Content thema's en keywords</li>
                    <li>✓ Schrijfstijl en tone of voice</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !isValidClientId}
              className="w-full h-16 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyseren... Dit kan 30-60 seconden duren
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  🤖 Analyseer Mijn Website
                </>
              )}
            </Button>
          </div>
        ) : (
          // Analysis Results State
          <div className="space-y-5">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-green-300">
                  Analyse compleet!
                </p>
                <p className="text-xs text-gray-400">
                  Je kunt de onderstaande velden nog aanpassen indien nodig
                </p>
              </div>
            </div>

            {/* Niche */}
            <ResultField
              label="Niche / Onderwerp"
              value={analysis.niche}
              confidence={analysis.nicheConfidence}
              icon={<Target className="w-4 h-4 text-orange-400" />}
              onEdit={(value) => handleEdit('niche', value)}
            />

            {/* Target Audience */}
            <ResultField
              label="Doelgroep"
              value={analysis.targetAudience}
              confidence={analysis.audienceConfidence}
              icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
              onEdit={(value) => handleEdit('targetAudience', value)}
            />

            {/* Tone of Voice */}
            <ResultField
              label="Tone of Voice"
              value={analysis.tone}
              confidence={analysis.toneConfidence}
              icon={<MessageSquare className="w-4 h-4 text-purple-400" />}
              onEdit={(value) => handleEdit('tone', value)}
            />

            {/* Keywords */}
            <ResultField
              label="Top Keywords"
              value={analysis.keywords}
              icon={<Hash className="w-4 h-4 text-green-400" />}
              type="tags"
              onEdit={(value) => handleEdit('keywords', value)}
            />

            {/* Content Themes */}
            <ResultField
              label="Content Thema's"
              value={analysis.themes}
              icon={<Sparkles className="w-4 h-4 text-pink-400" />}
              type="list"
              editable={false}
            />

            {/* Reasoning */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <Label className="text-sm font-semibold text-white mb-2 block">
                AI Redenering
              </Label>
              <p className="text-sm text-gray-400 leading-relaxed">
                {analysis.reasoning}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleApply}
                className="flex-1 h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-base font-semibold"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                ✅ Gebruik Deze Instellingen
              </Button>
              <Button
                onClick={() => {
                  setAnalysis(null);
                  handleAnalyze();
                }}
                variant="outline"
                className="h-14 border-gray-600"
              >
                <Search className="w-4 h-4 mr-2" />
                Opnieuw Analyseren
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
