'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Article {
  title: string;
  content: string;
  word_count: number;
  project_id?: string;
}

interface Project {
  id: string;
  name: string;
  website_url: string;
  niche: string;
}

export default function EditorPage() {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedArticle = localStorage.getItem('generatedArticle');
    const savedProject = localStorage.getItem('selectedProject');
    
    if (!savedArticle) {
      alert('Geen artikel gevonden! Ga eerst naar Writer.');
      router.push('/dashboard/writer');
      return;
    }
    
    const articleData = JSON.parse(savedArticle);
    setArticle(articleData);
    setEditedContent(articleData.content);
    
    if (savedProject) {
      setProject(JSON.parse(savedProject));
    }
  }, [router]);

  async function saveToLibrary() {
    if (!article || !project) {
      alert('Geen project geselecteerd!');
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/api/articles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: editedContent,
          word_count: editedContent.split(/\s+/).length,
          project_id: project.id,
          status: 'draft'
        })
      });

      if (!response.ok) throw new Error('Failed to save');

      alert('✅ Artikel opgeslagen in bibliotheek!');
      
      // Cleanup
      localStorage.removeItem('selectedIdea');
      localStorage.removeItem('generatedArticle');
      
      router.push('/dashboard/library');
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    router.push('/dashboard/writer');
  }

  if (!article) {
    return (
      <div className="p-6 lg:p-12 flex items-center justify-center">
        <div className="text-white text-xl">⏳ Laden...</div>
      </div>
    );
  }

  const currentWordCount = editedContent.split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="p-6 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={goBack}
            className="mb-4 text-orange-400 hover:text-orange-300 transition-colors"
          >
            ← Terug naar Writer
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">📝 Editor</h1>
          <p className="text-gray-400 text-lg">
            Bewerk en check je content
          </p>
        </div>

        {/* Project Info */}
        {project && (
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-2">{project.name}</h3>
            <p className="text-gray-400 text-sm">🌐 {project.website_url}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-orange-500 mb-2">{currentWordCount}</div>
            <div className="text-gray-400">Woorden</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-white mb-2">
              {article.title.split(' ').length}
            </div>
            <div className="text-gray-400">Woorden in Titel</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-green-500 mb-2">✓</div>
            <div className="text-gray-400">Klaar voor Opslaan</div>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">{article.title}</h2>
          
          <div className="mb-6">
            <label className="block text-white font-medium mb-3">Content</label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={20}
              className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm leading-relaxed"
              placeholder="Artikel content..."
            />
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
            <p className="text-orange-400 text-sm">
              💡 <strong>Tip:</strong> Bewerk de content naar wens. Klik op "Opslaan in Bibliotheek" om het artikel op te slaan.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={saveToLibrary}
            disabled={saving}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50"
          >
            {saving ? '⏳ Opslaan...' : '💾 Opslaan in Bibliotheek'}
          </button>

          <button
            onClick={goBack}
            className="w-full bg-gray-800 border border-gray-700 text-gray-300 px-8 py-3 rounded-xl font-medium hover:bg-gray-700 transition-all"
          >
            Annuleren
          </button>
        </div>
    </div>
  );
}
