'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  website_url: string;
  niche: string;
}

interface ArticleProgress {
  title: string;
  status: 'waiting' | 'generating' | 'done' | 'error';
  word_count?: number;
}

export default function AutomaticModePage() {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [articleCount, setArticleCount] = useState(5);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<ArticleProgress[]>([]);
  const [currentStep, setCurrentStep] = useState('');

  useEffect(() => {
    const savedProject = localStorage.getItem('selectedProject');
    if (!savedProject) {
      alert('Geen project geselecteerd!');
      router.push('/dashboard/simple-content');
      return;
    }
    setProject(JSON.parse(savedProject));
  }, [router]);

  async function startAutomatic() {
    if (!project) return;

    setRunning(true);
    setProgress([]);
    
    try {
      // Stap 1: Genereer content plan
      setCurrentStep('🤖 AI genereert content plan...');
      const planResponse = await fetch('/api/simple/generate-content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: project.niche })
      });

      if (!planResponse.ok) throw new Error('Failed to generate plan');
      
      const planData = await planResponse.json();
      const ideas = planData.plan.slice(0, articleCount);

      // Initialize progress
      const initialProgress = ideas.map((idea: any) => ({
        title: idea.title,
        status: 'waiting' as const
      }));
      setProgress(initialProgress);

      // Stap 2: Genereer elk artikel
      for (let i = 0; i < ideas.length; i++) {
        const idea = ideas[i];
        
        setCurrentStep(`✍️ AI schrijft artikel ${i + 1}/${ideas.length}...`);
        setProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'generating' } : p
        ));

        try {
          // Genereer artikel
          const articleResponse = await fetch('/api/generate/article', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: idea.title,
              keywords: idea.keywords,
              description: idea.description
            })
          });

          if (!articleResponse.ok) throw new Error('Failed to generate article');

          const articleData = await articleResponse.json();
          
          // Sla op in bibliotheek
          await fetch('/api/articles/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: idea.title,
              content: articleData.content || articleData.article || '',
              word_count: articleData.word_count || 1500,
              project_id: project.id,
              status: 'draft'
            })
          });

          setProgress(prev => prev.map((p, idx) => 
            idx === i ? { 
              ...p, 
              status: 'done',
              word_count: articleData.word_count || 1500
            } : p
          ));

        } catch (error) {
          console.error(`Error generating article ${i + 1}:`, error);
          setProgress(prev => prev.map((p, idx) => 
            idx === i ? { ...p, status: 'error' } : p
          ));
        }
      }

      setCurrentStep('✅ Klaar! Alle artikelen opgeslagen in bibliotheek');
      alert(`🎉 ${ideas.length} artikelen gegenereerd en opgeslagen!`);

    } catch (error) {
      console.error('Auto error:', error);
      alert('❌ Fout bij automatisch genereren');
      setCurrentStep('❌ Fout opgetreden');
    } finally {
      setRunning(false);
    }
  }

  function goBack() {
    router.push('/dashboard/simple-content');
  }

  function viewLibrary() {
    router.push('/dashboard/articles');
  }

  if (!project) {
    return <div className="p-8">⏳ Laden...</div>;
  }

  const completedCount = progress.filter(p => p.status === 'done').length;
  const totalWordCount = progress
    .filter(p => p.status === 'done')
    .reduce((sum, p) => sum + (p.word_count || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={goBack}
            className="mb-4 text-blue-600 hover:underline"
            disabled={running}
          >
            ← Terug
          </button>
          <h1 className="text-4xl font-bold mb-2">🤖 Automatische Modus</h1>
          <p className="text-gray-600">AI doet alles automatisch voor: <strong>{project.name}</strong></p>
        </div>

        {/* Project Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold mb-2">{project.name}</h3>
          <p className="text-gray-600 mb-1">🌐 {project.website_url}</p>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {project.niche}
          </span>
        </div>

        {/* Settings */}
        {!running && progress.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Instellingen</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aantal artikelen om te genereren
              </label>
              <select
                value={articleCount}
                onChange={(e) => setArticleCount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 artikel</option>
                <option value={3}>3 artikelen</option>
                <option value={5}>5 artikelen</option>
                <option value={10}>10 artikelen</option>
                <option value={20}>20 artikelen</option>
                <option value={30}>30 artikelen</option>
              </select>
            </div>

            <button
              onClick={startAutomatic}
              className="w-full px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg font-semibold"
            >
              🚀 Start Automatisch ({articleCount} artikelen)
            </button>
          </div>
        )}

        {/* Progress */}
        {running && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
            <div className="text-xl font-bold mb-2">{currentStep}</div>
            <div className="text-gray-600">
              {completedCount} van {progress.length} artikelen klaar
            </div>
            <div className="mt-4 bg-blue-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${(completedCount / progress.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {progress.length > 0 && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-blue-600">{progress.length}</div>
                <div className="text-gray-600">Totaal</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-green-600">{completedCount}</div>
                <div className="text-gray-600">Klaar</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-purple-600">{totalWordCount}</div>
                <div className="text-gray-600">Woorden</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Artikelen</h2>
            <div className="space-y-3 mb-8">
              {progress.map((article, index) => (
                <div 
                  key={index}
                  className={`rounded-lg shadow p-6 ${
                    article.status === 'done' ? 'bg-green-50 border-2 border-green-200' :
                    article.status === 'generating' ? 'bg-blue-50 border-2 border-blue-200' :
                    article.status === 'error' ? 'bg-red-50 border-2 border-red-200' :
                    'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{article.title}</h3>
                      {article.word_count && (
                        <div className="text-sm text-gray-600">
                          📝 {article.word_count} woorden
                        </div>
                      )}
                    </div>
                    <div className="text-2xl">
                      {article.status === 'done' && '✅'}
                      {article.status === 'generating' && '⏳'}
                      {article.status === 'error' && '❌'}
                      {article.status === 'waiting' && '○'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!running && completedCount > 0 && (
              <div className="space-y-4">
                <button
                  onClick={viewLibrary}
                  className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold"
                >
                  📚 Bekijk Bibliotheek
                </button>
                <button
                  onClick={goBack}
                  className="w-full px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  🔄 Nieuw Project
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
