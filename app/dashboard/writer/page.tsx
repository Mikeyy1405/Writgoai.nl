'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ContentIdea {
  title: string;
  category: string;
  description: string;
  keywords: string[];
  project_id?: string;
}

interface Article {
  title: string;
  content: string;
  word_count: number;
  project_id?: string;
  featured_image?: string;
}

interface Project {
  id: string;
  name: string;
  website_url: string;
}

export default function WriterPage() {
  const router = useRouter();
  const [idea, setIdea] = useState<ContentIdea | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generateWithImage, setGenerateWithImage] = useState(true);

  useEffect(() => {
    const savedIdea = localStorage.getItem('selectedIdea');
    const savedProject = localStorage.getItem('selectedProject');
    
    if (!savedIdea) {
      alert('Geen idee geselecteerd! Ga eerst naar Content Plan.');
      router.push('/dashboard/content-plan');
      return;
    }
    setIdea(JSON.parse(savedIdea));
    
    if (savedProject) {
      setProject(JSON.parse(savedProject));
    }
  }, [router]);

  async function generateFeaturedImage(title: string): Promise<string | null> {
    try {
      setProgressMessage('🖼️ Featured image genereren met Flux Pro...');
      
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Professional blog header image for article about: ${title}, modern design, tech industry, high quality, professional photography`,
          style: 'photorealistic',
          aspectRatio: '16:9'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Image generation failed:', data.error);
        return null;
      }

      return data.url;
    } catch (err) {
      console.error('Error generating image:', err);
      return null;
    }
  }

  async function generateArticle() {
    if (!idea) return;
    
    setGenerating(true);
    setError(null);
    setProgress(0);
    setProgressMessage('🚀 Artikel generatie starten...');
    
    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 2000);

      setProgress(10);
      setProgressMessage('📝 Onderwerp analyseren...');
      
      await new Promise(r => setTimeout(r, 500));
      setProgress(20);
      setProgressMessage('🔍 SEO keywords bepalen...');
      
      // Generate article
      const response = await fetch('/api/generate/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: idea.project_id,
          topic: idea.title,
          keywords: idea.keywords.join(', '),
          tone: 'professional',
          length: 'long'
        })
      });

      setProgress(60);
      setProgressMessage('✍️ Content schrijven...');

      const data = await response.json();
      
      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate article');
      }

      setProgress(75);
      setProgressMessage('📊 Content optimaliseren...');

      // Handle different response formats
      const generatedArticle: Article = {
        title: data.title || idea.title,
        content: data.content || data.article || '',
        word_count: data.word_count || (data.content || data.article || '').split(/\s+/).length,
        project_id: idea.project_id,
        featured_image: ''
      };
      
      if (!generatedArticle.content) {
        throw new Error('Geen content ontvangen van AI');
      }

      // Generate featured image if enabled
      if (generateWithImage) {
        setProgress(85);
        const imageUrl = await generateFeaturedImage(generatedArticle.title);
        if (imageUrl) {
          generatedArticle.featured_image = imageUrl;
        }
      }

      setProgress(100);
      setProgressMessage('✅ Artikel klaar!');
      
      setArticle(generatedArticle);
      localStorage.setItem('generatedArticle', JSON.stringify(generatedArticle));
      
    } catch (err: any) {
      console.error('Generate error:', err);
      setError(err.message || 'Fout bij genereren artikel');
    } finally {
      setGenerating(false);
    }
  }

  function goToEditor() {
    if (!article) return;
    router.push('/dashboard/editor');
  }

  function goBack() {
    router.push('/dashboard/content-plan');
  }

  function retryGeneration() {
    setError(null);
    setArticle(null);
    setProgress(0);
    generateArticle();
  }

  if (!idea) {
    return (
      <div className="p-6 lg:p-12 flex items-center justify-center">
        <div className="text-white text-xl">⏳ Laden...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={goBack}
            className="mb-4 text-orange-400 hover:text-orange-300 transition-colors"
          >
            ← Terug naar Content Plan
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">✍️ AI Writer</h1>
          <p className="text-gray-400 text-lg">
            AI schrijft je artikel automatisch met SEO optimalisatie
          </p>
        </div>

        {/* Project Info */}
        {project && (
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-blue-400">📁</span>
              <div>
                <span className="text-white font-medium">{project.name}</span>
                <span className="text-gray-400 text-sm ml-2">• {project.website_url}</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Idea */}
        <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-sm font-medium text-orange-400 mb-3">GESELECTEERD IDEE</h2>
          <h3 className="text-2xl font-bold text-white mb-3">{idea.title}</h3>
          <p className="text-gray-400 mb-4">{idea.description}</p>
          <div className="flex gap-2 flex-wrap">
            {idea.keywords.map((kw, i) => (
              <span key={i} className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-medium">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-3xl">❌</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-400 mb-2">Fout bij genereren</h3>
                <p className="text-gray-400 mb-4">{error}</p>
                <button
                  onClick={retryGeneration}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
                >
                  🔄 Opnieuw proberen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generation Options */}
        {!article && !generating && !error && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">⚙️ Generatie Opties</h3>
            
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700/50 transition-colors">
              <input
                type="checkbox"
                checked={generateWithImage}
                onChange={(e) => setGenerateWithImage(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-orange-500 focus:ring-orange-500 bg-gray-800"
              />
              <div>
                <span className="text-white font-medium">🖼️ Featured Image genereren met AI</span>
                <p className="text-gray-400 text-sm">Automatisch een professionele afbeelding genereren met Flux Pro</p>
              </div>
            </label>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-orange-500 mb-1">
              {article ? article.word_count.toLocaleString() : '~2000'}
            </div>
            <div className="text-gray-400 text-sm">Verwacht Woorden</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {article ? '✓' : generating ? '⏳' : '○'}
            </div>
            <div className="text-gray-400 text-sm">Artikel Status</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {article?.featured_image ? '✓' : generateWithImage ? '○' : '—'}
            </div>
            <div className="text-gray-400 text-sm">Featured Image</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-500 mb-1">SEO</div>
            <div className="text-gray-400 text-sm">Geoptimaliseerd</div>
          </div>
        </div>

        {/* Generate Button or Progress */}
        {!article && !error && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center mb-8">
            {generating ? (
              <div>
                <div className="text-6xl mb-4 animate-pulse">🤖</div>
                <h2 className="text-2xl font-bold text-white mb-4">AI aan het schrijven...</h2>
                
                {/* Progress Bar */}
                <div className="max-w-md mx-auto mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>{progressMessage}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-gray-500 text-sm">
                  Dit kan 30-60 seconden duren...
                </p>
              </div>
            ) : (
              <div>
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-2xl font-bold text-white mb-4">AI Schrijft Artikel</h2>
                <p className="text-gray-400 mb-6">
                  AI schrijft automatisch een volledig SEO-geoptimaliseerd artikel
                  {generateWithImage && ' met AI-gegenereerde featured image'}
                </p>
                <button
                  onClick={generateArticle}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all"
                >
                  🚀 Schrijf Artikel met AI
                </button>
              </div>
            )}
          </div>
        )}

        {/* Article Preview */}
        {article && (
          <div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden mb-6">
              {/* Featured Image */}
              {article.featured_image && (
                <div className="relative">
                  <img 
                    src={article.featured_image} 
                    alt={article.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <span className="text-green-400 text-sm flex items-center gap-2">
                      <span>✓</span> AI-gegenereerde featured image (Flux Pro)
                    </span>
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">✅ Artikel Geschreven</h2>
                  <div className="text-orange-400 font-medium">
                    📝 {article.word_count.toLocaleString()} woorden
                  </div>
                </div>
                
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-6 max-h-96 overflow-y-auto">
                  <h3 className="text-xl font-bold text-white mb-4">{article.title}</h3>
                  <div 
                    className="text-gray-300 leading-relaxed prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: article.content.substring(0, 2000) + (article.content.length > 2000 ? '...' : '')
                    }}
                  />
                </div>

                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
                  <p className="text-orange-400 text-sm">
                    💡 <strong>Tip:</strong> Ga naar de Editor om het volledige artikel te bekijken, bewerken en publiceren naar WritGo Blog of WordPress
                  </p>
                </div>

                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={goToEditor}
                    className="flex-1 min-w-[200px] bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all"
                  >
                    ✏️ Bewerken & Publiceren →
                  </button>
                  <button
                    onClick={retryGeneration}
                    className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all"
                  >
                    🔄 Opnieuw
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
