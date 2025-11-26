
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Link2, FileText, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Anchor {
  text: string;
  url: string;
}

export default function LinkbuildingPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [targetWebsite, setTargetWebsite] = useState('');
  const [anchors, setAnchors] = useState<Anchor[]>([{ text: '', url: '' }]);
  const [wordCount, setWordCount] = useState(400);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('');
  const [focusAspects, setFocusAspects] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [article, setArticle] = useState('');
  const [error, setError] = useState('');

  // Check if user is admin
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF9933]" />
      </div>
    );
  }

  if (!session?.user?.email || session.user.email !== 'info@WritgoAI.nl') {
    router.push('/dashboard');
    return null;
  }

  const addAnchor = () => {
    setAnchors([...anchors, { text: '', url: '' }]);
  };

  const removeAnchor = (index: number) => {
    setAnchors(anchors.filter((_, i) => i !== index));
  };

  const updateAnchor = (index: number, field: 'text' | 'url', value: string) => {
    const newAnchors = [...anchors];
    newAnchors[index][field] = value;
    setAnchors(newAnchors);
  };

  const generateArticle = async () => {
    if (!targetWebsite || anchors.some(a => !a.text || !a.url)) {
      setError('Vul alle velden in (website en alle anchors)');
      return;
    }

    setIsLoading(true);
    setError('');
    setArticle('');

    try {
      const response = await fetch('/api/admin/linkbuilding/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWebsite,
          anchors,
          wordCount,
          topic,
          tone,
          focusAspects,
        }),
      });

      if (!response.ok) {
        throw new Error('Fout bij het genereren van het artikel');
      }

      const data = await response.json();
      setArticle(data.article);
    } catch (err: any) {
      setError(err.message || 'Er ging iets mis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link2 className="w-8 h-8 text-[#FF9933]" />
            <h1 className="text-3xl font-bold">Linkbuilding Schrijver</h1>
          </div>
          <p className="text-gray-400">
            Genereer SEO-geoptimaliseerde linkbuilding artikelen met natuurlijk geïntegreerde anchors
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF9933]" />
              Artikel Configuratie
            </h2>

            {/* Target Website */}
            <div className="mb-4">
              <Label htmlFor="targetWebsite">Te plaatsen website *</Label>
              <Input
                id="targetWebsite"
                type="url"
                placeholder="https://www.clubgreen.nl/"
                value={targetWebsite}
                onChange={(e) => setTargetWebsite(e.target.value)}
                className="mt-2 bg-gray-700 border-gray-600"
              />
            </div>

            {/* Anchors */}
            <div className="mb-4">
              <Label>Anchors met URLs *</Label>
              {anchors.map((anchor, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    placeholder="Anchor tekst"
                    value={anchor.text}
                    onChange={(e) => updateAnchor(index, 'text', e.target.value)}
                    className="bg-gray-700 border-gray-600"
                  />
                  <Input
                    placeholder="URL"
                    value={anchor.url}
                    onChange={(e) => updateAnchor(index, 'url', e.target.value)}
                    className="bg-gray-700 border-gray-600"
                  />
                  {anchors.length > 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeAnchor(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addAnchor}
                className="mt-2"
              >
                + Anchor toevoegen
              </Button>
            </div>

            {/* Word Count */}
            <div className="mb-4">
              <Label htmlFor="wordCount">Aantal woorden</Label>
              <Input
                id="wordCount"
                type="number"
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value))}
                className="mt-2 bg-gray-700 border-gray-600"
              />
            </div>

            {/* Optional: Topic */}
            <div className="mb-4">
              <Label htmlFor="topic">Hoofdonderwerp (optioneel)</Label>
              <Input
                id="topic"
                placeholder="bijv. duurzame mobiliteit, elektrische fietsen"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-2 bg-gray-700 border-gray-600"
              />
              <p className="text-xs text-gray-400 mt-1">
                Laat leeg om automatisch te bepalen op basis van de website
              </p>
            </div>

            {/* Optional: Tone */}
            <div className="mb-4">
              <Label htmlFor="tone">Tone of voice (optioneel)</Label>
              <Input
                id="tone"
                placeholder="bijv. informeel, professioneel, enthousiast"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="mt-2 bg-gray-700 border-gray-600"
              />
            </div>

            {/* Optional: Focus Aspects */}
            <div className="mb-6">
              <Label htmlFor="focusAspects">Belangrijke aspecten (optioneel)</Label>
              <Textarea
                id="focusAspects"
                placeholder="bijv. duurzaamheid, gemak, gezondheid"
                value={focusAspects}
                onChange={(e) => setFocusAspects(e.target.value)}
                className="mt-2 bg-gray-700 border-gray-600"
                rows={3}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateArticle}
              disabled={isLoading}
              className="w-full bg-[#FF9933] hover:bg-[#FF9933]/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Artikel wordt gegenereerd...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Genereer Linkbuilding Artikel
                </>
              )}
            </Button>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
                {error}
              </div>
            )}
          </Card>

          {/* Article Output */}
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF9933]" />
              Gegenereerd Artikel
            </h2>

            {article ? (
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded border border-gray-700 max-h-[600px] overflow-y-auto">
                  <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: article }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        article.replace(/<[^>]*>/g, '')
                      );
                      alert('Artikel gekopieerd naar klembord!');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    📋 Kopieer als tekst
                  </Button>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(article);
                      alert('HTML gekopieerd naar klembord!');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    📄 Kopieer HTML
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                <FileText className="w-16 h-16 mb-4 opacity-30" />
                <p>Vul de gegevens in en klik op "Genereer Artikel"</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
