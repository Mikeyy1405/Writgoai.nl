'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ProgressStatusBar, useProgressSteps, ProgressStep } from '@/components/simplified/ProgressStatusBar';
import { Zap, FileText, Eye, Check } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

const QUICK_GENERATE_STEPS: ProgressStep[] = [
  { id: 'research', label: 'Keyword research', status: 'pending' },
  { id: 'outline', label: 'Outline maken', status: 'pending' },
  { id: 'write', label: 'Artikel schrijven', status: 'pending' },
  { id: 'seo', label: 'SEO metadata toevoegen', status: 'pending' },
  { id: 'image', label: 'Featured image prompt genereren', status: 'pending' },
  { id: 'save', label: 'Artikel opslaan', status: 'pending' },
  { id: 'complete', label: 'Klaar! ✅', status: 'pending' },
];

export default function QuickGeneratePage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'friendly'>('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState<any>(null);

  const { steps, setStepStatus, resetSteps } = useProgressSteps(QUICK_GENERATE_STEPS);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/simplified/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleQuickGenerate = async () => {
    if (!keyword.trim()) {
      setError('Voer een keyword of titel in');
      return;
    }

    setError('');
    setLoading(true);
    setGeneratedArticle(null);
    resetSteps();

    try {
      // Stap 1: Keyword research
      setStepStatus('research', 'in_progress', 'Analyseren van keyword en concurrent content...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Stap 2: Outline maken
      setStepStatus('research', 'completed');
      setStepStatus('outline', 'in_progress', 'SEO-vriendelijke outline wordt gemaakt...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stap 3: Artikel schrijven
      setStepStatus('outline', 'completed');
      setStepStatus('write', 'in_progress', 'AI schrijft je artikel...');

      const response = await fetch('/api/simplified/generate/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          projectId: selectedProject || undefined,
          tone,
          length,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate article');
      }

      // Stap 4: SEO metadata
      setStepStatus('write', 'completed', `${data.article.wordCount} woorden geschreven`);
      setStepStatus('seo', 'in_progress', 'SEO metadata wordt toegevoegd...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stap 5: Featured image
      setStepStatus('seo', 'completed');
      setStepStatus('image', 'in_progress', 'Featured image prompt wordt gegenereerd...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stap 6: Opslaan
      setStepStatus('image', 'completed');
      setStepStatus('save', 'in_progress', 'Artikel wordt opgeslagen als draft...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stap 7: Klaar
      setStepStatus('save', 'completed');
      setStepStatus('complete', 'completed', 'Je artikel is klaar om te publiceren!');

      setGeneratedArticle(data.article);
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Er is iets misgegaan');
      const currentInProgress = steps.find(s => s.status === 'in_progress');
      if (currentInProgress) {
        setStepStatus(currentInProgress.id, 'error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            ⚡ Quick Generate
          </h1>
          <p className="text-gray-400">
            Genereer een volledig artikel in één keer - geen content plan nodig!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Form Card */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-orange-500" />
                <span>Artikel Details</span>
              </h2>

              {/* Keyword Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Keyword of Titel <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="bijv. 'Beste fitness tips voor beginners'"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project (optioneel)
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">-- Geen project --</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tone Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Toon van het artikel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['professional', 'casual', 'friendly'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t as any)}
                      className={`py-2 px-4 rounded-lg border-2 transition-all ${
                        tone === t
                          ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                          : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                      }`}
                      disabled={loading}
                    >
                      {t === 'professional' && 'Professioneel'}
                      {t === 'casual' && 'Casual'}
                      {t === 'friendly' && 'Vriendelijk'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lengte van het artikel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'short', label: 'Kort', words: '~500' },
                    { value: 'medium', label: 'Gemiddeld', words: '~1000' },
                    { value: 'long', label: 'Lang', words: '~1500' },
                  ].map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setLength(l.value as any)}
                      className={`py-3 px-4 rounded-lg border-2 transition-all ${
                        length === l.value
                          ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                          : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                      }`}
                      disabled={loading}
                    >
                      <div className="font-semibold">{l.label}</div>
                      <div className="text-xs opacity-75">{l.words} woorden</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleQuickGenerate}
                disabled={loading || !keyword.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>{loading ? 'Bezig met genereren...' : 'Genereer Artikel'}</span>
              </button>
            </div>

            {/* Info Box */}
            {!loading && !generatedArticle && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">💡 Hoe werkt het?</h3>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• AI doet keyword research</li>
                  <li>• Maakt een SEO-vriendelijke outline</li>
                  <li>• Schrijft een volledig artikel</li>
                  <li>• Voegt SEO metadata toe</li>
                  <li>• Genereert featured image prompt</li>
                  <li>• Slaat op als draft in je account</li>
                </ul>
              </div>
            )}
          </div>

          {/* Right: Progress & Preview */}
          <div className="space-y-6">
            {/* Progress Bar */}
            {loading && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <ProgressStatusBar steps={steps} />
              </div>
            )}

            {/* Article Preview */}
            {generatedArticle && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-green-500" />
                    <span>Artikel Preview</span>
                  </h2>
                  <span className="text-sm text-green-400 flex items-center space-x-1">
                    <Check className="w-4 h-4" />
                    <span>Gegenereerd</span>
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Titel:</div>
                    <div className="text-lg font-semibold text-white">{generatedArticle.title}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-400 mb-1">Meta Description:</div>
                    <div className="text-sm text-gray-300">{generatedArticle.excerpt}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-400 mb-1">Keywords:</div>
                    <div className="flex flex-wrap gap-2">
                      {generatedArticle.keywords?.map((kw: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-400 mb-1">Word Count:</div>
                    <div className="text-sm text-gray-300">{generatedArticle.wordCount} woorden</div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">Content Preview:</div>
                    <div
                      className="text-sm text-gray-300 max-h-96 overflow-y-auto prose prose-invert prose-sm"
                      dangerouslySetInnerHTML={{
                        __html: generatedArticle.content.substring(0, 1000) + '...',
                      }}
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => {
                      window.open(`/admin/blog/editor?id=${generatedArticle.id}`, '_blank');
                    }}
                    className="flex-1 bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all"
                  >
                    Bekijk & Bewerk
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedArticle(null);
                      setKeyword('');
                      resetSteps();
                    }}
                    className="flex-1 bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-all"
                  >
                    Nieuw Artikel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
