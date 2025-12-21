'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project');

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    keywords: '',
    tone: 'professional',
    length: 'medium',
  });
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects/list');
      const data = await response.json();
      if (response.ok) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      setError('Selecteer eerst een project');
      return;
    }

    setError('');
    setGenerating(true);
    setGeneratedContent(null);

    try {
      const response = await fetch('/api/generate/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      setGeneratedContent(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedContent) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          article_id: generatedContent.article_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish');
      }

      alert('✅ Artikel succesvol gepubliceerd naar WordPress!');
      router.push('/dashboard/articles');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="p-6 lg:p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Content Generator</h1>
          <p className="text-gray-400 text-lg">
            Genereer SEO-geoptimaliseerde content met AI
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Generator Form */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Artikel Genereren</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Selecteer Project *
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  required
                  disabled={generating}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50"
                >
                  <option value="">-- Kies een project --</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Onderwerp *
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  required
                  disabled={generating}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50"
                  placeholder="Bijv: De beste SEO tips voor 2024"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Keywords (optioneel)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  disabled={generating}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50"
                  placeholder="SEO, tips, 2024"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Toon
                </label>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  disabled={generating}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50"
                >
                  <option value="professional">Professioneel</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Vriendelijk</option>
                  <option value="authoritative">Gezaghebbend</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Lengte
                </label>
                <select
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  disabled={generating}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50"
                >
                  <option value="short">Kort (~500 woorden)</option>
                  <option value="medium">Middel (~1000 woorden)</option>
                  <option value="long">Lang (~2000 woorden)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50"
              >
                {generating ? '🤖 AI aan het werk...' : '✨ Genereer Artikel'}
              </button>
            </form>
          </div>

          {/* Preview */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Preview</h2>

            {!generatedContent ? (
              <div className="text-center py-12 text-gray-400">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📄</span>
                </div>
                <p>Genereer een artikel om de preview te zien</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {generatedContent.title}
                  </h3>
                  <div className="text-sm text-gray-400 mb-4">
                    {generatedContent.word_count} woorden
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <div
                    className="text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: generatedContent.content.substring(0, 500) + '...' }}
                  />
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={handlePublish}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Publiceren...' : '✅ Publiceer naar WordPress'}
                  </button>
                  <button
                    onClick={() => setGeneratedContent(null)}
                    className="w-full bg-gray-800 text-white py-3 rounded-lg font-medium hover:bg-gray-700"
                  >
                    Opnieuw Genereren
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

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <GeneratePageContent />
    </Suspense>
  );
}
