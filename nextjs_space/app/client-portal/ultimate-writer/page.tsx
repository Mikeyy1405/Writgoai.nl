'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Rocket } from 'lucide-react';
import { toast } from 'sonner';
import ConfigPanel from './components/config-panel';
import ContentPreview from './components/content-preview';
import ProgressTracker from './components/progress-tracker';
import ExportOptions from './components/export-options';

export interface UltimateWriterConfig {
  // Basic Settings
  contentType: string;
  topic: string;
  language: 'nl' | 'en';
  tone: string;
  wordCount: number;
  
  // SEO & Keywords
  primaryKeyword: string;
  secondaryKeywords: string;
  generateLSI: boolean;
  generateMetaDescription: boolean;
  
  // Project Integration
  projectId: string | null;
  
  // Research & Content
  webResearch: boolean;
  serpAnalysis: boolean;
  includeTableOfContents: boolean;
  includeFAQ: boolean;
  
  // Media
  includeImages: boolean;
  imageCount: number;
  
  // Bol.com
  includeBolProducts: boolean;
  bolProductCount: number;
  
  // Internal Links
  includeInternalLinks: boolean;
  internalLinksCount: number;
}

interface GenerationProgress {
  phase: 'research' | 'outline' | 'writing' | 'optimization' | 'complete';
  progress: number;
  message: string;
  currentStep: string;
}

export default function UltimateWriterPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [contentStats, setContentStats] = useState({
    wordCount: 0,
    characterCount: 0,
    readingTime: 0,
    internalLinksAdded: 0,
    externalLinksAdded: 0,
    imagesAdded: 0,
    bolProductsAdded: 0,
    headingCount: 0,
  });
  
  const [progress, setProgress] = useState<GenerationProgress>({
    phase: 'research',
    progress: 0,
    message: 'Initialiseren...',
    currentStep: '',
  });

  const [config, setConfig] = useState<UltimateWriterConfig>({
    contentType: 'blog-artikel',
    topic: '',
    language: 'nl',
    tone: 'professioneel',
    wordCount: 1500,
    primaryKeyword: '',
    secondaryKeywords: '',
    generateLSI: true,
    generateMetaDescription: true,
    projectId: null,
    webResearch: true,
    serpAnalysis: false,
    includeTableOfContents: true,
    includeFAQ: true,
    includeImages: true,
    imageCount: 3,
    includeBolProducts: false,
    bolProductCount: 2,
    includeInternalLinks: true,
    internalLinksCount: 3,
  });

  // Validate required fields
  const isValid = () => {
    if (!config.topic.trim()) {
      toast.error('Vul een onderwerp in');
      return false;
    }
    if (!config.primaryKeyword.trim()) {
      toast.error('Vul een primaire keyword in');
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!isValid()) return;

    setIsGenerating(true);
    setGeneratedContent('');
    setMetaDescription('');
    setProgress({
      phase: 'research',
      progress: 0,
      message: 'Voorbereiden...',
      currentStep: 'Initialiseren',
    });

    // Setup timeout (5 minutes)
    const timeoutId = setTimeout(() => {
      toast.error('Generatie duurt te lang. Probeer het opnieuw met een korter artikel.');
      setIsGenerating(false);
    }, 300000);

    try {
      const response = await fetch('/api/client/ultimate-writer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate content');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setProgress(data.data);
              } else if (data.type === 'content') {
                setGeneratedContent(prev => prev + data.data);
              } else if (data.type === 'complete') {
                setMetaDescription(data.data?.metaDescription || '');
                setContentStats(data.data?.stats || contentStats);
                setProgress({
                  phase: 'complete',
                  progress: 100,
                  message: 'Klaar!',
                  currentStep: 'Content gegenereerd',
                });
                toast.success('Content succesvol gegenereerd!');
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }

      clearTimeout(timeoutId);
    } catch (error: any) {
      console.error('Generation error:', error);
      
      // More specific error messages
      let errorMessage = 'Fout bij genereren van content';
      if (error.message.includes('credits')) {
        errorMessage = 'Onvoldoende credits. Koop extra credits om door te gaan.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Generatie duurde te lang. Probeer een korter artikel.';
      } else if (error.message.includes('Not authenticated')) {
        errorMessage = 'Je sessie is verlopen. Log opnieuw in.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setProgress({
        phase: 'research',
        progress: 0,
        message: 'Fout opgetreden',
        currentStep: errorMessage,
      });
      
      clearTimeout(timeoutId);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-6">
      {/* Header */}
      <div className="max-w-[1920px] mx-auto mb-6">
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b35] to-[#ff8c5a] rounded-lg flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Ultimate Content Writer</h1>
              <p className="text-zinc-400 text-sm">
                Alles-in-één content generatie met SEO, research, media en meer
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Config Panel */}
        <div className="lg:col-span-4 xl:col-span-3">
          <ConfigPanel
            config={config}
            onChange={setConfig}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {/* Right: Preview & Progress */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Progress Tracker */}
          {isGenerating && (
            <ProgressTracker progress={progress} />
          )}

          {/* Content Preview */}
          <ContentPreview
            content={generatedContent}
            metaDescription={metaDescription}
            stats={contentStats}
            isGenerating={isGenerating}
          />

          {/* Export Options */}
          {generatedContent && !isGenerating && (
            <ExportOptions
              content={generatedContent}
              metaDescription={metaDescription}
              config={config}
              stats={contentStats}
            />
          )}
        </div>
      </div>
    </div>
  );
}
