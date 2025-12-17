'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
}

export default function AutoGeneratePage({ params }: { params: { articleId: string } }) {
  const router = useRouter();
  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: 'fetch', label: 'Artikel gegevens ophalen', status: 'pending' },
    { id: 'generate', label: 'Content genereren met AI', status: 'pending' },
    { id: 'save', label: 'Artikel opslaan', status: 'pending' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [mapId, setMapId] = useState<string | null>(null);

  useEffect(() => {
    generateArticle();
  }, []);

  const updateStep = (stepId: string, status: GenerationStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ));
  };

  async function generateArticle() {
    try {
      // Step 1: Haal artikel data op
      updateStep('fetch', 'loading');
      console.log('[AutoGenerate] Fetching article:', params.articleId);
      
      const articleResponse = await fetch(
        `/api/client/topical-authority/generate-article?articleId=${params.articleId}`
      );
      
      if (!articleResponse.ok) {
        throw new Error('Artikel niet gevonden of geen toegang');
      }
      
      const articleData = await articleResponse.json();
      console.log('[AutoGenerate] Article data:', articleData);
      
      if (!articleData.success) {
        throw new Error(articleData.error || 'Kon artikel niet ophalen');
      }
      
      const article = articleData.data;
      setMapId(article.mapId);
      updateStep('fetch', 'success', `Artikel "${article.title}" gevonden`);
      
      // Wacht 500ms voor betere UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Genereer content met AI
      updateStep('generate', 'loading');
      console.log('[AutoGenerate] Generating content...');
      
      const contentResponse = await fetch('/api/client/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          keywords: article.focusKeyword || article.title,
          projectId: article.map.projectId,
          targetAudience: article.targetAudience || 'algemeen publiek',
          contentType: 'blog',
        })
      });
      
      if (!contentResponse.ok) {
        const errorText = await contentResponse.text();
        console.error('[AutoGenerate] Content generation failed:', errorText);
        throw new Error('Content generatie mislukt');
      }
      
      const contentData = await contentResponse.json();
      console.log('[AutoGenerate] Content generated:', contentData);
      
      if (!contentData.success) {
        throw new Error(contentData.error || 'Content generatie mislukt');
      }
      
      updateStep('generate', 'success', 'AI content gegenereerd');
      
      // Wacht 500ms voor betere UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Update artikel status
      updateStep('save', 'loading');
      console.log('[AutoGenerate] Updating article status...');
      
      const updateResponse = await fetch(
        `/api/client/topical-authority/articles/${params.articleId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'generated',
            contentId: contentData.contentId || contentData.id,
            generatedAt: new Date().toISOString(),
          })
        }
      );
      
      if (!updateResponse.ok) {
        console.warn('[AutoGenerate] Could not update article status, but content was generated');
        // Continue anyway since content was generated successfully
      }
      
      updateStep('save', 'success', 'Artikel opgeslagen');
      
      // Success! Redirect na 2 seconden
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('[AutoGenerate] Redirecting to map:', article.mapId);
      router.push(`/topical-authority/${article.mapId}/lijst`);
      
    } catch (error: any) {
      console.error('[AutoGenerate] Error:', error);
      setError(error.message);
      
      // Mark current loading step as error
      setSteps(prev => prev.map(step => 
        step.status === 'loading' ? { ...step, status: 'error', message: error.message } : step
      ));
    }
  }

  const getStepIcon = (step: GenerationStep) => {
    switch (step.status) {
      case 'loading':
        return <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-full mb-4">
            {error ? (
              <XCircle className="w-8 h-8 text-red-500" />
            ) : steps.every(s => s.status === 'success') ? (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : (
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            )}
          </div>
          
          <h2 className="text-white text-2xl font-bold mb-2">
            {error ? 'Generatie Mislukt' : steps.every(s => s.status === 'success') ? 'Artikel Gegenereerd!' : 'Artikel Genereren'}
          </h2>
          
          <p className="text-slate-400 text-sm">
            {error 
              ? 'Er is een fout opgetreden tijdens het genereren'
              : steps.every(s => s.status === 'success')
              ? 'Je wordt doorgestuurd naar de artikel lijst'
              : 'Dit kan 30-60 seconden duren'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4 mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  step.status === 'success' ? 'text-green-400' :
                  step.status === 'error' ? 'text-red-400' :
                  step.status === 'loading' ? 'text-orange-400' :
                  'text-slate-400'
                }`}>
                  {step.label}
                </p>
                {step.message && (
                  <p className="text-xs text-slate-500 mt-1">
                    {step.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm font-medium mb-2">
              ❌ Foutmelding:
            </p>
            <p className="text-red-300 text-xs">
              {error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {error ? (
            <>
              <button
                onClick={() => router.push('/topical-authority')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Terug
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setSteps([
                    { id: 'fetch', label: 'Artikel gegevens ophalen', status: 'pending' },
                    { id: 'generate', label: 'Content genereren met AI', status: 'pending' },
                    { id: 'save', label: 'Artikel opslaan', status: 'pending' },
                  ]);
                  generateArticle();
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Opnieuw proberen
              </button>
            </>
          ) : steps.every(s => s.status === 'success') ? (
            <button
              onClick={() => router.push(mapId ? `/topical-authority/${mapId}/lijst` : '/topical-authority')}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Ga naar artikel lijst
            </button>
          ) : null}
        </div>

        {/* Dev Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 font-mono">
              Article ID: {params.articleId}
            </p>
            {mapId && (
              <p className="text-xs text-slate-500 font-mono">
                Map ID: {mapId}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
