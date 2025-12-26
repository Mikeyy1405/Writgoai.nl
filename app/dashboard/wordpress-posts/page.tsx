'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WordPressErrorDetails, ConnectionTestResult, WordPressErrorType } from '@/lib/wordpress-errors';

interface WordPressPost {
  wordpress_id: number;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  status: string;
  featured_image: string | null;
  wordpress_url: string;
  published_at: string;
  modified_at: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  seo_plugin: string;
  seo_score: number | null;
}

interface Project {
  id: string;
  name: string;
}

interface SEOModalData {
  wordpress_id: number;
  title: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
}

export default function WordPressPostsManagement() {
  const router = useRouter();
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<WordPressErrorDetails | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<ConnectionTestResult | null>(null);
  const [showConnectionTest, setShowConnectionTest] = useState(false);
  const [seoPlugin, setSeoPlugin] = useState<string>('none');

  // Modal states
  const [showSEOModal, setShowSEOModal] = useState(false);
  const [seoModalData, setSeoModalData] = useState<SEOModalData | null>(null);
  const [savingSEO, setSavingSEO] = useState(false);

  // Action states
  const [processingAction, setProcessingAction] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string>('');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchWordPressPosts();
    }
  }, [selectedProject, currentPage]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/list');
      const data = await response.json();
      if (data.projects && data.projects.length > 0) {
        setProjects(data.projects);
        setSelectedProject(data.projects[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Fout bij ophalen van projecten');
    }
  };

  const fetchWordPressPosts = async () => {
    if (!selectedProject) return;

    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setShowErrorDetails(false);

    try {
      const response = await fetch(
        `/api/wordpress/fetch?project_id=${selectedProject}&page=${currentPage}&per_page=20`
      );
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Fout bij ophalen van WordPress posts';
        setError(errorMsg);

        if (data.errorDetails) {
          setErrorDetails(data.errorDetails);
          console.error('WordPress fetch error details:', data.errorDetails);
        }

        throw new Error(errorMsg);
      }

      setPosts(data.posts || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalPosts(data.pagination?.total_posts || 0);
      setSeoPlugin(data.seo_plugin || 'none');

      setError(null);
      setErrorDetails(null);
    } catch (error: any) {
      console.error('Error fetching WordPress posts:', error);

      if (!navigator.onLine) {
        setError('Geen internetverbinding. Controleer je netwerk en probeer opnieuw.');
        setErrorDetails({
          type: WordPressErrorType.NETWORK,
          message: 'Geen internetverbinding',
          troubleshooting: [
            'Controleer je internetverbinding',
            'Probeer de pagina te vernieuwen',
          ],
          timestamp: new Date().toISOString(),
        });
      } else if (!errorDetails) {
        setError(error.message);
      }

      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!selectedProject) return;

    setTestingConnection(true);
    setConnectionTestResult(null);
    setShowConnectionTest(true);

    try {
      const response = await fetch('/api/wordpress/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: selectedProject }),
      });

      const data = await response.json();

      if (response.ok) {
        setConnectionTestResult(data);
      } else {
        setConnectionTestResult({
          success: false,
          checks: {
            siteReachable: { passed: false, message: data.error || 'Test mislukt' },
            restApiEnabled: { passed: false, message: 'Niet getest' },
            authenticationValid: { passed: false, message: 'Niet getest' },
          },
          wpUrl: '',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      setConnectionTestResult({
        success: false,
        checks: {
          siteReachable: { passed: false, message: 'Test fout: ' + error.message },
          restApiEnabled: { passed: false, message: 'Niet getest' },
          authenticationValid: { passed: false, message: 'Niet getest' },
        },
        wpUrl: '',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const syncSinglePost = async (wordpressId: number) => {
    setSyncing(true);
    setProcessingAction(wordpressId);
    try {
      const response = await fetch('/api/wordpress/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          wordpress_id: wordpressId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fout bij synchroniseren');
      }

      setActionMessage('Post succesvol geïmporteerd!');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (error: any) {
      console.error('Error syncing post:', error);
      alert(error.message);
    } finally {
      setSyncing(false);
      setProcessingAction(null);
    }
  };

  const updatePostToWordPress = async (wordpressId: number) => {
    const post = posts.find(p => p.wordpress_id === wordpressId);
    if (!post) return;

    if (!confirm(`Weet je zeker dat je "${post.title}" wilt bijwerken op WordPress?`)) {
      return;
    }

    setProcessingAction(wordpressId);
    try {
      const response = await fetch('/api/wordpress/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          wordpress_id: wordpressId,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          meta_title: post.meta_title,
          meta_description: post.meta_description,
          focus_keyword: post.focus_keyword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fout bij bijwerken');
      }

      setActionMessage('Post succesvol bijgewerkt op WordPress!');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (error: any) {
      console.error('Error updating post:', error);
      alert(error.message);
    } finally {
      setProcessingAction(null);
    }
  };

  const rewritePost = async (wordpressId: number) => {
    const post = posts.find(p => p.wordpress_id === wordpressId);
    if (!post) return;

    if (!confirm(`Post "${post.title}" wordt geïmporteerd zodat je hem kunt bewerken en optimaliseren in de editor. Doorgaan?`)) {
      return;
    }

    setProcessingAction(wordpressId);
    setActionMessage('Post wordt geïmporteerd...');

    try {
      // Sync the post to get it in our database
      const syncResponse = await fetch('/api/wordpress/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          wordpress_id: wordpressId,
        }),
      });

      const syncData = await syncResponse.json();
      if (!syncResponse.ok) {
        throw new Error(syncData.error || 'Fout bij importeren van post');
      }

      const articleId = syncData.article_id;

      setActionMessage('Post succesvol geïmporteerd! Doorsturen naar editor...');
      setTimeout(() => {
        router.push(`/dashboard/wordpress-editor/${articleId}`);
      }, 1000);
    } catch (error: any) {
      console.error('Error importing post for editing:', error);
      alert(error.message);
      setProcessingAction(null);
    }
  };

  const regenerateFeaturedImage = async (wordpressId: number) => {
    const post = posts.find(p => p.wordpress_id === wordpressId);
    if (!post) return;

    if (!confirm(`Weet je zeker dat je een nieuwe uitgelichte afbeelding wilt genereren voor "${post.title}"?`)) {
      return;
    }

    setProcessingAction(wordpressId);
    setActionMessage('Nieuwe afbeelding wordt gegenereerd...');

    try {
      const response = await fetch('/api/media/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Featured image for article: ${post.title}. Professional, high-quality, relevant to the topic.`,
          project_id: selectedProject,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Fout bij genereren afbeelding');
      }

      // Update the post with the new image
      const updateResponse = await fetch('/api/wordpress/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          wordpress_id: wordpressId,
          featured_image: data.image_url,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Afbeelding gegenereerd maar niet geüpload naar WordPress');
      }

      // Update local state
      setPosts(posts.map(p =>
        p.wordpress_id === wordpressId
          ? { ...p, featured_image: data.image_url }
          : p
      ));

      setActionMessage('Nieuwe afbeelding succesvol gegenereerd en geüpload!');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (error: any) {
      console.error('Error regenerating image:', error);
      alert(error.message);
    } finally {
      setProcessingAction(null);
    }
  };

  const openSEOModal = (post: WordPressPost) => {
    setSeoModalData({
      wordpress_id: post.wordpress_id,
      title: post.title,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      focus_keyword: post.focus_keyword,
    });
    setShowSEOModal(true);
  };

  const saveSEOMetadata = async () => {
    if (!seoModalData) return;

    setSavingSEO(true);
    try {
      const response = await fetch('/api/wordpress/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          wordpress_id: seoModalData.wordpress_id,
          meta_title: seoModalData.meta_title,
          meta_description: seoModalData.meta_description,
          focus_keyword: seoModalData.focus_keyword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Fout bij opslaan SEO metadata');
      }

      // Update local state
      setPosts(posts.map(p =>
        p.wordpress_id === seoModalData.wordpress_id
          ? {
              ...p,
              meta_title: seoModalData.meta_title,
              meta_description: seoModalData.meta_description,
              focus_keyword: seoModalData.focus_keyword,
            }
          : p
      ));

      setShowSEOModal(false);
      setActionMessage('SEO metadata succesvol opgeslagen!');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving SEO metadata:', error);
      alert(error.message);
    } finally {
      setSavingSEO(false);
    }
  };

  const syncAllPosts = async () => {
    if (!confirm('Weet je zeker dat je alle WordPress posts wilt synchroniseren? Dit kan even duren.')) {
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch('/api/wordpress/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          sync_all: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fout bij synchroniseren');
      }

      setActionMessage(data.message || `${data.synced_count} posts gesynchroniseerd!`);
      setTimeout(() => setActionMessage(''), 5000);
    } catch (error: any) {
      console.error('Error syncing all posts:', error);
      alert(error.message);
    } finally {
      setSyncing(false);
    }
  };

  const togglePostSelection = (wordpressId: number) => {
    setSelectedPosts(prev =>
      prev.includes(wordpressId)
        ? prev.filter(id => id !== wordpressId)
        : [...prev, wordpressId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map(p => p.wordpress_id));
    }
  };

  const syncSelectedPosts = async () => {
    if (selectedPosts.length === 0) {
      alert('Selecteer eerst posts');
      return;
    }

    if (!confirm(`Weet je zeker dat je ${selectedPosts.length} posts wilt synchroniseren?`)) {
      return;
    }

    setSyncing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const wordpressId of selectedPosts) {
      try {
        const response = await fetch('/api/wordpress/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: selectedProject,
            wordpress_id: wordpressId,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setSyncing(false);
    setSelectedPosts([]);
    setActionMessage(`${successCount} posts gesynchroniseerd${errorCount > 0 ? ` (${errorCount} fouten)` : ''}`);
    setTimeout(() => setActionMessage(''), 5000);
  };

  const getSEOScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-500';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSEOScoreLabel = (score: number | null) => {
    if (score === null) return 'N/A';
    if (score >= 80) return 'Goed';
    if (score >= 60) return 'OK';
    if (score >= 40) return 'Matig';
    return 'Slecht';
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">WordPress Posts Dashboard</h1>
          <p className="text-gray-300 mt-1">
            Beheer je WordPress posts met volledige SEO controle
          </p>
          {seoPlugin !== 'none' && (
            <p className="text-sm text-orange-400 mt-1">
              SEO Plugin gedetecteerd: {seoPlugin === 'yoast' ? 'Yoast SEO' : seoPlugin === 'rankmath' ? 'RankMath' : seoPlugin}
            </p>
          )}
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-500/50 rounded-lg p-4">
            <div className="flex items-center text-green-300">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {actionMessage}
            </div>
          </div>
        )}

        {/* Project Selection & Actions */}
        <div className="bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Selecteer Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-end justify-end gap-3">
              <button
                onClick={testConnection}
                disabled={testingConnection || !selectedProject}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {testingConnection ? 'Testen...' : 'Test Connectie'}
              </button>
              <button
                onClick={fetchWordPressPosts}
                disabled={loading || !selectedProject}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Laden...' : 'Posts Ophalen'}
              </button>
              <button
                onClick={syncAllPosts}
                disabled={syncing || !selectedProject || posts.length === 0}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
              >
                {syncing ? 'Synchroniseren...' : 'Alles Synchroniseren'}
              </button>
            </div>
          </div>
        </div>

        {/* Connection Test Results */}
        {showConnectionTest && connectionTestResult && (
          <div className={`rounded-lg border p-6 mb-6 ${
            connectionTestResult.success
              ? 'bg-green-900/20 border-green-500/50'
              : 'bg-orange-900/20 border-orange-500/50'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start">
                {connectionTestResult.success ? (
                  <svg className="w-6 h-6 text-green-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-orange-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${
                    connectionTestResult.success ? 'text-green-300' : 'text-orange-300'
                  }`}>
                    Connectie Test {connectionTestResult.success ? 'Geslaagd' : 'Resultaten'}
                  </h3>
                  {connectionTestResult.wpUrl && (
                    <p className="text-sm text-gray-400 mt-1">WordPress URL: {connectionTestResult.wpUrl}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowConnectionTest(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(connectionTestResult.checks).map(([key, check]) => (
                <div key={key} className="flex items-start p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    {check.passed ? (
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{key}</p>
                    <p className="text-sm text-gray-300 mt-1">{check.message}</p>
                    {check.details && (
                      <p className="text-xs text-gray-400 mt-1">{check.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-300">Fout bij ophalen van WordPress posts</h3>
                <p className="text-sm text-red-400 mt-1">{error}</p>

                {errorDetails && errorDetails.troubleshooting && errorDetails.troubleshooting.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowErrorDetails(!showErrorDetails)}
                      className="text-sm text-red-300 hover:text-red-200 underline flex items-center"
                    >
                      {showErrorDetails ? 'Verberg' : 'Toon'} probleemoplossing
                    </button>

                    {showErrorDetails && (
                      <div className="mt-3 p-3 bg-red-900/30 rounded-lg">
                        <p className="text-sm font-medium text-red-200 mb-2">Probeer het volgende:</p>
                        <ul className="text-sm text-red-300 space-y-1">
                          {errorDetails.troubleshooting.map((tip, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedPosts.length > 0 && (
          <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-200">
                {selectedPosts.length} post(s) geselecteerd
              </span>
              <button
                onClick={syncSelectedPosts}
                disabled={syncing}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {syncing ? 'Synchroniseren...' : 'Geselecteerde Synchroniseren'}
              </button>
            </div>
          </div>
        )}

        {/* Posts Table */}
        <div className="bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4">WordPress posts laden...</p>
            </div>
          ) : !selectedProject ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-lg font-medium text-white">Geen project geselecteerd</p>
              <p className="mt-2">Selecteer eerst een project om WordPress posts te bekijken</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium text-white">Geen WordPress posts gevonden</p>
              <p className="mt-2">Klik op "Posts Ophalen" om posts van je WordPress website te laden</p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedPosts.length === posts.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Titel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Meta Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      SEO Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Afbeelding
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {posts.map((post) => (
                    <tr key={post.wordpress_id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(post.wordpress_id)}
                          onChange={() => togglePostSelection(post.wordpress_id)}
                          className="rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-white max-w-xs truncate">{post.title}</div>
                        <div className="text-xs text-gray-400 truncate">/{post.slug}</div>
                        {post.focus_keyword && (
                          <div className="text-xs text-orange-400 mt-1">
                            Keyword: {post.focus_keyword}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-300 max-w-md">
                          {post.meta_description ? (
                            <div className="line-clamp-2" title={post.meta_description}>
                              {post.meta_description}
                            </div>
                          ) : (
                            <span className="text-gray-500 italic">Geen meta description</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-12 h-12 rounded-full ${getSEOScoreColor(post.seo_score)} flex items-center justify-center text-white font-bold text-sm`}>
                            {post.seo_score ?? 'N/A'}
                          </div>
                          <span className="text-xs text-gray-400">
                            {getSEOScoreLabel(post.seo_score)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          post.status === 'publish' ? 'bg-green-100 text-green-800' :
                          post.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {post.status === 'publish' ? 'Gepubliceerd' :
                           post.status === 'draft' ? 'Draft' : post.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="h-16 w-16 rounded object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded bg-gray-700 flex items-center justify-center">
                            <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {processingAction === post.wordpress_id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                          ) : (
                            <>
                              <button
                                onClick={() => syncSinglePost(post.wordpress_id)}
                                disabled={syncing}
                                className="text-xs px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                                title="Importeren naar Writgo"
                              >
                                Import
                              </button>
                              <button
                                onClick={() => openSEOModal(post)}
                                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                title="SEO metadata bewerken"
                              >
                                SEO
                              </button>
                              <button
                                onClick={() => updatePostToWordPress(post.wordpress_id)}
                                className="text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                                title="Bijwerken op WordPress"
                              >
                                Update
                              </button>
                              <button
                                onClick={() => rewritePost(post.wordpress_id)}
                                className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700"
                                title="Openen in editor voor bewerking"
                              >
                                Bewerk
                              </button>
                              <button
                                onClick={() => regenerateFeaturedImage(post.wordpress_id)}
                                className="text-xs px-3 py-1.5 bg-pink-600 text-white rounded hover:bg-pink-700"
                                title="Nieuwe afbeelding genereren"
                              >
                                Afbeelding
                              </button>
                              <a
                                href={post.wordpress_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700"
                                title="Bekijken op WordPress"
                              >
                                Bekijk
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-700">
                  <div className="text-sm text-gray-300">
                    Pagina {currentPage} van {totalPages} ({totalPosts} posts totaal)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                      className="px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                    >
                      Vorige
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || loading}
                      className="px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                    >
                      Volgende
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>

        {/* SEO Modal */}
        {showSEOModal && seoModalData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">SEO Metadata Bewerken</h2>
                  <button
                    onClick={() => setShowSEOModal(false)}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-300">
                    <strong className="text-white">Post:</strong> {seoModalData.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Updates worden direct naar WordPress gestuurd ({seoPlugin === 'yoast' ? 'Yoast SEO' : seoPlugin === 'rankmath' ? 'RankMath' : 'WordPress'})
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SEO Titel (Meta Title)
                    </label>
                    <input
                      type="text"
                      value={seoModalData.meta_title}
                      onChange={(e) => setSeoModalData({ ...seoModalData, meta_title: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Voer SEO titel in..."
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {seoModalData.meta_title.length}/60 karakters - Optimaal: 50-60
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={seoModalData.meta_description}
                      onChange={(e) => setSeoModalData({ ...seoModalData, meta_description: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Voer meta description in..."
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {seoModalData.meta_description.length}/160 karakters - Optimaal: 150-160
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Focus Keyword
                    </label>
                    <input
                      type="text"
                      value={seoModalData.focus_keyword}
                      onChange={(e) => setSeoModalData({ ...seoModalData, focus_keyword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Voer focus keyword in..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Het belangrijkste zoekwoord voor deze post
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowSEOModal(false)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={saveSEOMetadata}
                    disabled={savingSEO}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {savingSEO ? 'Opslaan...' : 'Opslaan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 bg-orange-900/20 border border-orange-500/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-400 mb-2">
            Functionaliteit Overzicht
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <p className="font-semibold text-white mb-1">Post Acties:</p>
              <ul className="space-y-1">
                <li>• <strong className="text-orange-300">Import:</strong> Importeer post naar Writgo voor bewerking</li>
                <li>• <strong className="text-orange-300">SEO:</strong> Bewerk SEO metadata (Yoast/RankMath)</li>
                <li>• <strong className="text-orange-300">Update:</strong> Werk post direct bij op WordPress</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Geavanceerde Acties:</p>
              <ul className="space-y-1">
                <li>• <strong className="text-orange-300">Bewerk:</strong> Open post in editor voor bewerking en optimalisatie</li>
                <li>• <strong className="text-orange-300">Afbeelding:</strong> Genereer nieuwe uitgelichte afbeelding met AI</li>
                <li>• <strong className="text-orange-300">Bekijk:</strong> Open post op je WordPress website</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
