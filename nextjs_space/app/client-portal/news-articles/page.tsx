
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { Progress } from '@/components/ui/progress';
import { Newspaper, Search, Sparkles, Globe, FileText, Trash2, Eye, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface Suggestion {
  title: string;
  description: string;
  angle: string;
  relevance: string;
}

interface Research {
  id: string;
  sourceType: string;
  sourceInput: string;
  status: string;
  suggestions: Suggestion[];
  researchData?: {
    content?: string;
    sources?: Array<{ url: string; title: string }>;
    extractedTopic?: string;
  };
  createdAt: string;
  _count?: {
    articles: number;
  };
}

interface Article {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  language: string;
  status: string;
  createdAt: string;
  research?: {
    sourceType: string;
    sourceInput: string;
  };
}

export default function NewsArticlesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);

  // State
  const [activeProject, setActiveProject] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  
  // Research state
  const [sourceType, setSourceType] = useState<'website' | 'topic'>('topic');
  const [sourceInput, setSourceInput] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [currentResearch, setCurrentResearch] = useState<Research | null>(null);
  const [researches, setResearches] = useState<Research[]>([]);
  
  // Progress tracking
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  // Article generation state
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [wordCount, setWordCount] = useState(600);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Articles state
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showArticlePreview, setShowArticlePreview] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      loadProjects();
    }
  }, [session]);

  useEffect(() => {
    if (activeProject) {
      loadResearches();
      loadArticles();
    }
  }, [activeProject]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/client/projects');
      const data = await response.json();
      if (data.projects && data.projects.length > 0) {
        setProjects(data.projects);
        setActiveProject(data.projects[0]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadResearches = async () => {
    if (!activeProject) return;
    
    try {
      const response = await fetch(`/api/client/news-articles/research?projectId=${activeProject.id}`);
      const data = await response.json();
      if (data.success) {
        setResearches(data.researches || []);
      }
    } catch (error) {
      console.error('Error loading researches:', error);
    }
  };

  const loadArticles = async () => {
    if (!activeProject) return;
    
    try {
      const response = await fetch(`/api/client/news-articles/generate?projectId=${activeProject.id}`);
      const data = await response.json();
      if (data.success) {
        setArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const handleResearch = async () => {
    if (!sourceInput.trim() || !activeProject) return;
    
    setIsResearching(true);
    setCurrentResearch(null);
    setProgress(0);
    setCurrentStep('Research starten...');
    setShowProgressDialog(true);
    
    try {
      const response = await fetch('/api/client/news-articles/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          sourceType,
          sourceInput,
          language,
        }),
      });
      
      if (!response.ok) {
        throw new Error('API request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      const totalSteps = 8; // Aantal verwachte stappen
      let currentStepCount = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'complete') {
              if (data.success && data.research) {
                setProgress(100);
                setCurrentStep('Voltooid! ✅');
                setCurrentResearch(data.research);
                loadResearches();
                // Auto-close after 2 seconds
                setTimeout(() => {
                  setShowProgressDialog(false);
                }, 2000);
              } else {
                setProgress(100);
                setCurrentStep(`Fout: ${data.error || 'Er is een fout opgetreden'}`);
              }
            } else if (data.type === 'progress') {
              currentStepCount++;
              const progressPercentage = Math.min((currentStepCount / totalSteps) * 100, 95);
              setProgress(progressPercentage);
              
              // Extract clean step name
              let stepName = data.message || 'Bezig...';
              if (stepName.includes('✅')) {
                stepName = stepName.replace('✅', '').trim();
              }
              setCurrentStep(stepName);
            } else if (data.type === 'error') {
              setProgress(100);
              setCurrentStep(`Fout: ${data.message}`);
            }
          } catch (e) {
            console.error('Failed to parse line:', line, e);
          }
        }
      }
    } catch (error) {
      console.error('Research error:', error);
      setProgress(100);
      setCurrentStep('Fout bij uitvoeren research');
    } finally {
      setIsResearching(false);
    }
  };

  const handleGenerateArticle = async () => {
    if (!activeProject) return;
    
    const title = customTitle || selectedSuggestion?.title;
    const description = customDescription || selectedSuggestion?.description;
    
    if (!title) {
      alert('Geef een titel op voor het artikel');
      return;
    }
    
    setIsGenerating(true);
    setShowProgressDialog(true);
    setProgress(0);
    setCurrentStep('Artikel genereren...');
    
    try {
      const response = await fetch('/api/client/news-articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          researchId: currentResearch?.id,
          title,
          description,
          wordCount,
          language,
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const totalSteps = 6; // Aantal verwachte stappen
      let currentStepCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'complete') {
              if (data.success) {
                setProgress(100);
                setCurrentStep(`Voltooid! ✅ (${data.creditsUsed} credits gebruikt)`);
                
                // Wait 2 seconds then close and reload
                setTimeout(() => {
                  setShowProgressDialog(false);
                  setProgress(0);
                  setCurrentStep('');
                  loadArticles();
                  setCustomTitle('');
                  setCustomDescription('');
                  setSelectedSuggestion(null);
                }, 2000);
              } else {
                setProgress(100);
                setCurrentStep(`Fout: ${data.error || 'Er is een fout opgetreden'}`);
              }
            } else if (data.type === 'progress') {
              currentStepCount++;
              const progressPercentage = Math.min((currentStepCount / totalSteps) * 100, 95);
              setProgress(progressPercentage);
              
              // Extract clean step name
              let stepName = data.message || 'Bezig...';
              if (stepName.includes('✅')) {
                stepName = stepName.replace('✅', '').trim();
              }
              setCurrentStep(stepName);
            } else if (data.type === 'error') {
              setProgress(100);
              setCurrentStep(`Fout: ${data.message}`);
            }
          } catch (e) {
            console.error('Failed to parse line:', line, e);
          }
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      setProgress(100);
      setCurrentStep('Fout bij genereren artikel');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Weet je zeker dat je dit artikel wilt verwijderen?')) return;
    
    try {
      const response = await fetch(`/api/client/news-articles/generate?articleId=${articleId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadArticles();
        if (selectedArticle?.id === articleId) {
          setSelectedArticle(null);
          setShowArticlePreview(false);
        }
      } else {
        alert(data.error || 'Er is een fout opgetreden');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Er is een fout opgetreden bij het verwijderen');
    }
  };

  const handleSelectResearch = (research: Research) => {
    setCurrentResearch(research);
    setSourceType(research.sourceType as 'website' | 'topic');
    setSourceInput(research.sourceInput);
  };

  if (status === 'loading' || !isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">{isMounted && t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Newspaper className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-white">
              {language === 'nl' ? 'Nieuwsartikelen' : 'News Articles'}
            </h1>
          </div>
          <p className="text-gray-400">
            {language === 'nl' 
              ? 'Schrijf actuele nieuwsartikelen op basis van web research'
              : 'Write current news articles based on web research'}
          </p>
        </div>

        {/* Project selector */}
        {projects.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {language === 'nl' ? 'Actief Project' : 'Active Project'}
            </label>
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value);
                setActiveProject(project);
              }}
              className="w-full max-w-md px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Research & Generation */}
          <div className="space-y-6">
            {/* Research Section */}
            <div className="bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-semibold text-white">
                  {language === 'nl' ? 'Stap 1: Research' : 'Step 1: Research'}
                </h2>
              </div>

              {/* Source Type Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSourceType('topic')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    sourceType === 'topic'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  {language === 'nl' ? 'Onderwerp' : 'Topic'}
                </button>
                <button
                  onClick={() => setSourceType('website')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    sourceType === 'website'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Globe className="w-4 h-4 inline mr-2" />
                  Website
                </button>
              </div>

              {/* Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {sourceType === 'website'
                    ? (language === 'nl' ? 'Website URL' : 'Website URL')
                    : (language === 'nl' ? 'Onderwerp' : 'Topic')}
                </label>
                <input
                  type="text"
                  value={sourceInput}
                  onChange={(e) => setSourceInput(e.target.value)}
                  placeholder={
                    sourceType === 'website'
                      ? 'https://example.com'
                      : (language === 'nl' ? 'Bijv. "Elektrische auto\'s in 2024"' : 'E.g. "Electric cars in 2024"')
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isResearching}
                />
              </div>

              <button
                onClick={handleResearch}
                disabled={isResearching || !sourceInput.trim()}
                className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isResearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                    {language === 'nl' ? 'Bezig met research...' : 'Researching...'}
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 inline mr-2" />
                    {language === 'nl' ? 'Start Research' : 'Start Research'}
                  </>
                )}
              </button>

              {/* Recent Researches */}
              {researches.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    {language === 'nl' ? 'Recente Research' : 'Recent Research'}
                  </h3>
                  <div className="space-y-2">
                    {researches.slice(0, 5).map((research) => (
                      <button
                        key={research.id}
                        onClick={() => handleSelectResearch(research)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          currentResearch?.id === research.id
                            ? 'border-orange-500 bg-orange-900/20'
                            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {research.sourceType === 'website' ? (
                                <Globe className="w-3 h-3 text-gray-400" />
                              ) : (
                                <FileText className="w-3 h-3 text-gray-400" />
                              )}
                              <span className="text-xs text-gray-400">
                                {new Date(research.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-white truncate">
                              {research.sourceInput}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">
                                {research.suggestions?.length || 0} suggesties
                              </span>
                              {(research._count?.articles || 0) > 0 && (
                                <span className="text-xs text-green-400">
                                  • {research._count?.articles} artikelen
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions Section */}
            {currentResearch && currentResearch.suggestions && currentResearch.suggestions.length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-semibold text-white">
                    {language === 'nl' ? 'Artikel Suggesties' : 'Article Suggestions'}
                  </h2>
                </div>

                <div className="space-y-3">
                  {currentResearch.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedSuggestion(suggestion);
                        setCustomTitle(suggestion.title);
                        setCustomDescription(suggestion.description);
                      }}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        selectedSuggestion === suggestion
                          ? 'border-orange-500 bg-orange-900/20'
                          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                      }`}
                    >
                      <h3 className="font-semibold text-white mb-2">
                        {suggestion.title}
                      </h3>
                      <p className="text-sm text-gray-300 mb-2">
                        {suggestion.description}
                      </p>
                      <div className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="font-medium">Hoek:</span>
                        <span>{suggestion.angle}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Sources Section for Verification */}
                {currentResearch.researchData?.sources && currentResearch.researchData.sources.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <h3 className="text-sm font-semibold text-white">
                        {language === 'nl' ? 'Bronnen (voor verificatie)' : 'Sources (for verification)'}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {currentResearch.researchData.sources.map((source: any, index: number) => (
                        <a
                          key={index}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <span className="flex-shrink-0 font-mono text-gray-500">{index + 1}.</span>
                          <span className="flex-1 break-all underline">{source.title || source.url}</span>
                          <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Article Generation Section */}
            <div className="bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-semibold text-white">
                  {language === 'nl' ? 'Stap 2: Genereer Artikel' : 'Step 2: Generate Article'}
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {language === 'nl' ? 'Artikel Titel' : 'Article Title'}
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={language === 'nl' ? 'Voer een titel in...' : 'Enter a title...'}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {language === 'nl' ? 'Beschrijving/Invalshoek (optioneel)' : 'Description/Angle (optional)'}
                  </label>
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder={language === 'nl' ? 'Extra context of invalshoek...' : 'Extra context or angle...'}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {language === 'nl' ? 'Aantal Woorden' : 'Word Count'}
                  </label>
                  <select
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value={400}>400 woorden</option>
                    <option value={600}>600 woorden</option>
                    <option value={800}>800 woorden</option>
                    <option value={1000}>1000 woorden</option>
                    <option value={1500}>1500 woorden</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateArticle}
                  disabled={isGenerating || !customTitle.trim()}
                  className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      {language === 'nl' ? 'Artikel wordt gegenereerd...' : 'Generating article...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 inline mr-2" />
                      {language === 'nl' ? 'Genereer Artikel' : 'Generate Article'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Articles List & Preview */}
          <div className="space-y-6">
            {/* Articles List */}
            <div className="bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {language === 'nl' ? 'Gegenereerde Artikelen' : 'Generated Articles'}
                </h2>
                <span className="text-sm text-gray-400">
                  {articles.length} {language === 'nl' ? 'artikelen' : 'articles'}
                </span>
              </div>

              {articles.length === 0 ? (
                <div className="text-center py-12">
                  <Newspaper className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">
                    {language === 'nl' 
                      ? 'Nog geen artikelen gegenereerd'
                      : 'No articles generated yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        selectedArticle?.id === article.id
                          ? 'border-orange-500 bg-orange-900/20'
                          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white flex-1 pr-2">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedArticle(article);
                              setShowArticlePreview(true);
                            }}
                            className="p-1 text-blue-400 hover:bg-blue-900/30 rounded"
                            title={language === 'nl' ? 'Bekijken' : 'View'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(article.id)}
                            className="p-1 text-red-400 hover:bg-red-900/30 rounded"
                            title={language === 'nl' ? 'Verwijderen' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{article.wordCount} woorden</span>
                        <span>•</span>
                        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        {article.status === 'completed' && (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            Voltooid
                          </span>
                        )}
                        {article.status === 'generating' && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <Clock className="w-3 h-3 animate-spin" />
                            Bezig...
                          </span>
                        )}
                      </div>

                      {article.research && (
                        <div className="mt-2 text-xs text-gray-500">
                          Gebaseerd op: {article.research.sourceInput}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Article Preview */}
            {showArticlePreview && selectedArticle && (
              <div className="bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    {language === 'nl' ? 'Voorbeeld' : 'Preview'}
                  </h2>
                  <button
                    onClick={() => setShowArticlePreview(false)}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>

                <div className="prose prose-invert max-w-none">
                  <h1 className="text-2xl font-bold text-white mb-4">
                    {selectedArticle.title}
                  </h1>
                  <div
                    className="text-gray-300 leading-relaxed prose-headings:text-white prose-a:text-orange-400 prose-strong:text-white"
                    dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                  />
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{selectedArticle.wordCount} woorden</span>
                    <span>{new Date(selectedArticle.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Dialog with Progress Bar */}
      {showProgressDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6 max-w-xl w-full mx-4">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
              <h2 className="text-2xl font-bold text-white">
                {language === 'nl' ? 'Nieuwsartikel Research' : 'News Article Research'}
              </h2>
            </div>
            
            <div className="space-y-6 py-4">
              {/* Progress Bar */}
              <div className="space-y-3">
                <Progress value={progress} className="h-3" />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{Math.round(progress)}%</span>
                  <span className="text-gray-300">{currentStep}</span>
                </div>
              </div>

              {/* Status indicator */}
              {isResearching && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
                  <span className="text-gray-300">
                    {language === 'nl' ? 'Bezig met verwerken...' : 'Processing...'}
                  </span>
                </div>
              )}
            </div>
            
            {!isResearching && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowProgressDialog(false);
                    setProgress(0);
                    setCurrentStep('');
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  {language === 'nl' ? 'Sluiten' : 'Close'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
