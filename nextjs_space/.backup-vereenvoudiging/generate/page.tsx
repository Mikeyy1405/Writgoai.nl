'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProgressStatusBar, useProgressSteps, ProgressStep } from '@/components/simplified/ProgressStatusBar';
import { Zap, FileText, Eye, Check, Calendar, Sparkles, Edit } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  contentPlan?: any;
}

interface ContentPlan {
  id: string;
  projectId: string;
  projectName: string;
  keyword?: string;
  source?: string;
  topics: Array<{
    title: string;
    description: string;
    keywords: string[];
    priority: string;
    reason?: string;
  }>;
  createdAt: string;
}

const QUICK_GENERATE_STEPS: ProgressStep[] = [
  { id: 'writgo', label: 'Artikel met Writgo regels genereren', status: 'pending' },
  { id: 'images', label: 'Flux Pro afbeeldingen genereren', status: 'pending' },
  { id: 'links', label: 'Interne links toevoegen', status: 'pending' },
  { id: 'save', label: 'Artikel opslaan', status: 'pending' },
  { id: 'complete', label: 'Klaar! ✅', status: 'pending' },
];

const CONTENT_TYPES = [
  { 
    value: 'article', 
    label: 'Standaard Artikel', 
    icon: '📝',
    description: 'SEO-geoptimaliseerd artikel (1500 woorden)'
  },
  { 
    value: 'review', 
    label: 'Productreview', 
    icon: '⭐',
    description: 'Diepgaande review van één product'
  },
  { 
    value: 'bestlist', 
    label: 'Beste Lijstje', 
    icon: '🏆',
    description: 'Top X beste producten in categorie'
  },
  { 
    value: 'comparison', 
    label: 'Vergelijking', 
    icon: '🆚',
    description: 'Product A vs Product B vergelijking'
  }
];

export default function QuickGeneratePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState<'quick' | 'from-plan'>('quick');
  const [projects, setProjects] = useState<Project[]>([]);
  const [contentPlans, setContentPlans] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [keyword, setKeyword] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [tone, setTone] = useState<'professioneel' | 'casual' | 'informatief' | 'enthousiast'>('professioneel');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState<any>(null);
  const [publishing, setPublishing] = useState(false);
  
  // NEW: Content type selection
  const [contentType, setContentType] = useState<'article' | 'review' | 'bestlist' | 'comparison'>('article');
  const [productCount, setProductCount] = useState(5); // For bestlist
  const [productA, setProductA] = useState(''); // For comparison
  const [productB, setProductB] = useState(''); // For comparison

  const { steps, setStepStatus, resetSteps } = useProgressSteps(QUICK_GENERATE_STEPS);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject && mode === 'from-plan') {
      fetchContentPlans();
    }
  }, [selectedProject, mode]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/simplified/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        // Set first project as default
        if (data.projects && data.projects.length > 0) {
          setSelectedProject(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchContentPlans = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/simplified/projects/${selectedProject}`);
      if (res.ok) {
        const data = await res.json();
        // Content plan is stored in project.contentPlan
        if (data.project?.contentPlan?.topics) {
          setContentPlans([{
            id: data.project.id,
            projectId: data.project.id,
            projectName: data.project.name,
            topics: data.project.contentPlan.topics,
            source: data.project.contentPlan.source,
            keyword: data.project.contentPlan.keyword,
            createdAt: data.project.lastPlanGenerated || new Date().toISOString(),
          }]);
        } else {
          setContentPlans([]);
        }
      }
    } catch (error) {
      console.error('Error fetching content plans:', error);
      setContentPlans([]);
    }
  };

  const handleTopicSelect = (topic: any) => {
    setSelectedTopic(topic);
    setKeyword(topic.title); // Pre-fill keyword with topic title
  };

  const handleQuickGenerate = async () => {
    // Validation
    if (!keyword.trim()) {
      setError('Voer een keyword of titel in');
      return;
    }

    // Validation for comparison type
    if (contentType === 'comparison' && (!productA.trim() || !productB.trim())) {
      setError('Voor vergelijking zijn beide productnamen vereist');
      return;
    }

    setError('');
    setLoading(true);
    setGeneratedArticle(null);
    resetSteps();

    try {
      // Stap 1: Writgo artikel genereren
      const contentTypeLabel = CONTENT_TYPES.find(t => t.value === contentType)?.label || 'artikel';
      setStepStatus('writgo', 'in_progress', `${contentTypeLabel} schrijven met Writgo regels (1500 woorden, 100% menselijk)...`);

      const requestBody: any = {
        keyword: keyword.trim(),
        projectId: selectedProject || undefined,
        toneOfVoice: tone,
        contentType: contentType, // NEW
      };

      // Add type-specific parameters
      if (contentType === 'bestlist') {
        requestBody.productCount = productCount;
      } else if (contentType === 'comparison') {
        requestBody.productA = productA.trim();
        requestBody.productB = productB.trim();
      }

      const response = await fetch('/api/simplified/generate/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate article');
      }

      // Stap 2: Afbeeldingen
      setStepStatus('writgo', 'completed', `${data.article.wordCount} woorden geschreven`);
      setStepStatus('images', 'in_progress', `${data.article.imageCount} Flux Pro afbeeldingen worden gegenereerd...`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stap 3: Interne links
      setStepStatus('images', 'completed', `${data.article.imageCount} afbeeldingen toegevoegd`);
      setStepStatus('links', 'in_progress', 'Interne links worden toegevoegd...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stap 4: Opslaan
      setStepStatus('links', 'completed', `${data.article.internalLinksCount} interne links toegevoegd`);
      setStepStatus('save', 'in_progress', 'Artikel wordt opgeslagen...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stap 5: Klaar
      setStepStatus('save', 'completed');
      setStepStatus('complete', 'completed', '✅ Artikel klaar om te kopiëren of publiceren!');

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

  const handleCopyArticle = () => {
    if (!generatedArticle?.content) return;
    navigator.clipboard.writeText(generatedArticle.content);
    alert('✅ Artikel gekopieerd naar klembord!');
  };

  const handlePublishToWordPress = async () => {
    if (!generatedArticle?.id || !selectedProject) {
      alert('❌ Selecteer eerst een project met WordPress instellingen');
      return;
    }

    setPublishing(true);
    try {
      const response = await fetch('/api/simplified/publish/wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: generatedArticle.id,
          projectId: selectedProject,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish to WordPress');
      }

      alert(`✅ Artikel gepubliceerd op WordPress!\n\nURL: ${data.wordpressUrl}`);
    } catch (error: any) {
      alert(`❌ Fout bij publiceren: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            ✨ Content Genereren
          </h1>
          <p className="text-gray-400">
            Genereer content direct of selecteer een topic uit je content plan
          </p>
        </div>

        {/* Mode Selection */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setMode('quick');
                setSelectedTopic(null);
                setKeyword('');
              }}
              className={`p-6 rounded-lg border-2 transition-all ${
                mode === 'quick'
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
              disabled={loading}
            >
              <div className="text-4xl mb-2">⚡</div>
              <div className="text-white font-bold mb-1">Quick Generate</div>
              <div className="text-gray-400 text-sm">
                Voer een keyword in en genereer direct
              </div>
            </button>

            <button
              onClick={() => {
                setMode('from-plan');
                setSelectedTopic(null);
                setKeyword('');
              }}
              className={`p-6 rounded-lg border-2 transition-all ${
                mode === 'from-plan'
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
              disabled={loading}
            >
              <div className="text-4xl mb-2">📋</div>
              <div className="text-white font-bold mb-1">Vanuit Content Plan</div>
              <div className="text-gray-400 text-sm">
                Selecteer een topic uit je content plan
              </div>
            </button>
          </div>
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

              {/* Content Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CONTENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setContentType(type.value as any)}
                      className={`py-3 px-4 rounded-lg border-2 transition-all text-left ${
                        contentType === type.value
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                      }`}
                      disabled={loading}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xl">{type.icon}</span>
                        <div className={`font-semibold text-sm ${contentType === type.value ? 'text-orange-500' : 'text-white'}`}>
                          {type.label}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project {mode === 'quick' && '(optioneel)'}
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={loading}
                >
                  {mode === 'quick' && <option value="">-- Geen project --</option>}
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Plan Topic Selection (only in 'from-plan' mode) */}
              {mode === 'from-plan' && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span>Selecteer Topic uit Content Plan</span>
                  </h3>

                  {contentPlans.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-400 mb-3 text-sm">
                        Geen content plan gevonden voor dit project
                      </p>
                      <a
                        href="/content-plan"
                        className="text-orange-500 hover:underline text-sm"
                      >
                        Maak eerst een content plan →
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {contentPlans[0]?.topics?.map((topic: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleTopicSelect(topic)}
                          className={`w-full text-left p-3 rounded transition-all ${
                            selectedTopic?.title === topic.title
                              ? 'bg-orange-500/20 border-2 border-orange-500'
                              : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
                          }`}
                          disabled={loading}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-white font-semibold text-sm mb-1">
                                {topic.title}
                              </div>
                              <div className="text-gray-400 text-xs mb-2">
                                {topic.description}
                              </div>
                              {topic.keywords && (
                                <div className="flex flex-wrap gap-1">
                                  {topic.keywords.slice(0, 3).map((kw: string, i: number) => (
                                    <span
                                      key={i}
                                      className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded"
                                    >
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded ml-2 flex-shrink-0 ${
                                topic.priority === 'high'
                                  ? 'bg-red-500/20 text-red-400'
                                  : topic.priority === 'medium'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {topic.priority}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Keyword Input (always visible) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {contentType === 'article' && (mode === 'from-plan' ? 'Topic (geselecteerd uit plan)' : 'Keyword of Titel')}
                  {contentType === 'review' && 'Productnaam'}
                  {contentType === 'bestlist' && 'Categorie'}
                  {contentType === 'comparison' && 'Product A'}
                  {' '}<span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={
                    contentType === 'article' 
                      ? (mode === 'from-plan' ? 'Selecteer een topic hierboven' : "bijv. 'Beste fitness tips voor beginners'")
                      : contentType === 'review'
                      ? "bijv. 'iPhone 15 Pro'"
                      : contentType === 'bestlist'
                      ? "bijv. 'Draadloze Oordopjes'"
                      : "bijv. 'Samsung QLED'"
                  }
                  disabled={loading || (mode === 'from-plan' && !selectedTopic)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                />
                {mode === 'from-plan' && selectedTopic && (
                  <div className="mt-2 text-xs text-green-400 flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Topic geselecteerd: {selectedTopic.title}</span>
                  </div>
                )}
              </div>

              {/* Product Count Input (only for bestlist) */}
              {contentType === 'bestlist' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Aantal Producten <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={productCount}
                    onChange={(e) => setProductCount(parseInt(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value={3}>Top 3</option>
                    <option value={5}>Top 5</option>
                    <option value={7}>Top 7</option>
                    <option value={10}>Top 10</option>
                  </select>
                </div>
              )}

              {/* Product B Input (only for comparison) */}
              {contentType === 'comparison' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product B <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={productB}
                    onChange={(e) => setProductB(e.target.value)}
                    placeholder="bijv. 'LG OLED'"
                    disabled={loading}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              )}

              {/* Tone Selection - Writgo Tones */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tone of Voice (Writgo regels)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'professioneel', label: 'Professioneel', desc: 'Zakelijk en betrouwbaar' },
                    { value: 'casual', label: 'Casual', desc: 'Ontspannen en toegankelijk' },
                    { value: 'informatief', label: 'Informatief', desc: 'Educatief en helder' },
                    { value: 'enthousiast', label: 'Enthousiast', desc: 'Energiek en positief' },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value as any)}
                      className={`py-3 px-4 rounded-lg border-2 transition-all text-left ${
                        tone === t.value
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                      }`}
                      disabled={loading}
                    >
                      <div className={`font-semibold text-sm ${tone === t.value ? 'text-orange-500' : 'text-white'}`}>
                        {t.label}
                      </div>
                      <div className="text-xs text-gray-400">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Writgo Info */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h3 className="text-sm font-semibold text-green-400 mb-1">Writgo Regels Actief</h3>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• 1500 woorden, 100% menselijk scoren</li>
                      <li>• E-E-A-T geoptimaliseerd voor Google</li>
                      <li>• Flux Pro afbeeldingen (1 per 500 woorden)</li>
                      <li>• Automatische interne links</li>
                      <li>• Verboden woorden gefilterd</li>
                    </ul>
                  </div>
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
                    <span>Gegenereerd met Writgo</span>
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Titel:</div>
                    <div className="text-lg font-semibold text-white">{generatedArticle.title}</div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-gray-900 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400 mb-1">📝 Woorden</div>
                      <div className="text-lg font-bold text-white">{generatedArticle.wordCount}</div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400 mb-1">🖼️ Afbeeldingen</div>
                      <div className="text-lg font-bold text-white">{generatedArticle.imageCount}</div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400 mb-1">🔗 Links</div>
                      <div className="text-lg font-bold text-white">{generatedArticle.internalLinksCount || 0}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">Content Preview:</div>
                    <div
                      className="text-sm text-gray-300 max-h-96 overflow-y-auto prose prose-invert prose-sm bg-slate-900/5 p-4 rounded"
                      dangerouslySetInnerHTML={{
                        __html: generatedArticle.content.substring(0, 2000) + '...',
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3 pt-4">
                  <button
                    onClick={handleCopyArticle}
                    className="bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-600 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>📋</span>
                    <span>Kopieer HTML</span>
                  </button>
                  <button
                    onClick={handlePublishToWordPress}
                    disabled={publishing || !selectedProject}
                    className="bg-orange-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-orange-600 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>🚀</span>
                    <span>{publishing ? 'Publiceren...' : 'Publiceer naar WordPress'}</span>
                  </button>
                  {generatedArticle?.contentId && (
                    <button
                      onClick={() => router.push(`/client-portal/content-library/${generatedArticle.contentId}/edit`)}
                      className="bg-green-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-600 transition-all flex items-center justify-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Bekijk in Editor</span>
                    </button>
                  )}
                </div>

                <div className="flex space-x-2">
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
