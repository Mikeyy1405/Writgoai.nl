'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import ConfigPanel, { AIWriterConfig } from './components/config-panel';
import ContentPreview from './components/content-preview';
import AIChat from './components/ai-chat';

export default function AIWriterPage() {
  const { data: session } = useSession() || {};
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [contentStats, setContentStats] = useState({
    wordCount: 0,
    internalLinksAdded: 0,
    bolProductsAdded: 0,
  });

  const [config, setConfig] = useState<AIWriterConfig>({
    contentType: 'blog-artikel',
    topic: '',
    tone: 'professioneel',
    wordCount: 1500,
    language: 'nl',
    keywords: '',
    secondaryKeywords: '',
    generateMetaDescription: true,
    targetAudience: '',
    customInstructions: '',
    projectId: null,
    includeInternalLinks: false,
    internalLinksCount: 3,
    includeBolProducts: false,
    bolProductsCount: 2,
  });

  const handleGenerate = async () => {
    // Validate required fields
    if (!config.topic.trim()) {
      toast.error('Vul een onderwerp in');
      return;
    }
    if (!config.keywords.trim()) {
      toast.error('Vul een primaire keyword in');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent('');
    setMetaDescription('');

    try {
      const response = await fetch('/api/client/ai-writer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate content');
      }

      const data = await response.json();

      setGeneratedContent(data.content);
      setMetaDescription(data.metaDescription || '');
      setContentStats({
        wordCount: data.wordCount || 0,
        internalLinksAdded: data.internalLinksAdded || 0,
        bolProductsAdded: data.bolProductsAdded || 0,
      });

      toast.success('Content succesvol gegenereerd!');
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Fout bij genereren van content');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF9933] to-orange-600 flex items-center justify-center">
              <PenLine className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Content Writer Studio</h1>
              <p className="text-zinc-400">
                Creëer professionele website content met volledige controle
              </p>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-4">
            <ConfigPanel
              config={config}
              onChange={setConfig}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          </div>

          {/* Center - Content Preview */}
          <div className="lg:col-span-5">
            <ContentPreview
              content={generatedContent}
              metaDescription={metaDescription}
              wordCount={contentStats.wordCount}
              internalLinksAdded={contentStats.internalLinksAdded}
              bolProductsAdded={contentStats.bolProductsAdded}
            />
          </div>

          {/* Right Panel - AI Chat */}
          <div className="lg:col-span-3">
            <AIChat currentContent={generatedContent} />
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF9933]" />
                Content Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-400">
                Kies uit verschillende content types zoals blog artikelen, landingspagina's,
                product beschrijvingen en meer.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF9933]" />
                Project Integratie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-400">
                Selecteer een project voor tone-of-voice, interne links en Bol.com affiliate
                integratie.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF9933]" />
                AI Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-400">
                Chat met AI om je content aan te passen, te verbeteren of specifieke secties te
                herschrijven.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
