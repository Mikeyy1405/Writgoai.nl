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
}

interface Project {
  id: string;
  name: string;
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
        // Enhanced error handling with detailed information
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
      
      // Clear any previous errors on success
      setError(null);
      setErrorDetails(null);
    } catch (error: any) {
      console.error('Error fetching WordPress posts:', error);
      
      // Check if this is a network error (user is offline)
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
        // Only set generic error if we don't already have detailed error from API
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
        console.log('Connection test result:', data);
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

      alert(data.message || 'Post succesvol geïmporteerd!');
    } catch (error: any) {
      console.error('Error syncing post:', error);
      alert(error.message);
    } finally {
      setSyncing(false);
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

      alert(data.message || `${data.synced_count} posts gesynchroniseerd!`);
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
    alert(`${successCount} posts gesynchroniseerd${errorCount > 0 ? ` (${errorCount} fouten)` : ''}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">WordPress Posts Beheer</h1>
          <p className="text-gray-300 mt-1">
            Haal je bestaande WordPress posts op en beheer ze in Writgo.ai
          </p>
        </div>

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
            <div className="md:col-span-2 flex items-end justify-end gap-4">
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
              {/* Site Reachability */}
              <div className="flex items-start p-3 bg-gray-800/50 rounded-lg">
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  {connectionTestResult.checks.siteReachable.passed ? (
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
                  <p className="text-sm font-medium text-white">Site Bereikbaarheid</p>
                  <p className="text-sm text-gray-300 mt-1">{connectionTestResult.checks.siteReachable.message}</p>
                  {connectionTestResult.checks.siteReachable.details && (
                    <p className="text-xs text-gray-400 mt-1">{connectionTestResult.checks.siteReachable.details}</p>
                  )}
                </div>
              </div>

              {/* REST API */}
              <div className="flex items-start p-3 bg-gray-800/50 rounded-lg">
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  {connectionTestResult.checks.restApiEnabled.passed ? (
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
                  <p className="text-sm font-medium text-white">REST API Status</p>
                  <p className="text-sm text-gray-300 mt-1">{connectionTestResult.checks.restApiEnabled.message}</p>
                  {connectionTestResult.checks.restApiEnabled.details && (
                    <p className="text-xs text-gray-400 mt-1">{connectionTestResult.checks.restApiEnabled.details}</p>
                  )}
                </div>
              </div>

              {/* Authentication */}
              <div className="flex items-start p-3 bg-gray-800/50 rounded-lg">
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  {connectionTestResult.checks.authenticationValid.passed ? (
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
                  <p className="text-sm font-medium text-white">Authenticatie</p>
                  <p className="text-sm text-gray-300 mt-1">{connectionTestResult.checks.authenticationValid.message}</p>
                  {connectionTestResult.checks.authenticationValid.details && (
                    <p className="text-xs text-gray-400 mt-1">{connectionTestResult.checks.authenticationValid.details}</p>
                  )}
                </div>
              </div>
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
                
                {errorDetails && (
                  <>
                    {errorDetails.wpUrl && (
                      <p className="text-xs text-red-300 mt-2">
                        <strong>WordPress URL:</strong> {errorDetails.wpUrl}
                      </p>
                    )}
                    
                    {errorDetails.troubleshooting && errorDetails.troubleshooting.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => setShowErrorDetails(!showErrorDetails)}
                          className="text-sm text-red-300 hover:text-red-200 underline flex items-center"
                        >
                          {showErrorDetails ? 'Verberg' : 'Toon'} probleemoplossing
                          <svg 
                            className={`w-4 h-4 ml-1 transform transition-transform ${showErrorDetails ? 'rotate-180' : ''}`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
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
                            
                            <button
                              onClick={testConnection}
                              disabled={testingConnection}
                              className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                            >
                              {testingConnection ? 'Testen...' : 'Test Connectie'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {errorDetails.technicalDetails && (
                      <details className="mt-3">
                        <summary className="text-xs text-red-400 cursor-pointer hover:text-red-300">
                          Technische details (voor developers)
                        </summary>
                        <pre className="text-xs text-red-300 mt-2 p-2 bg-red-900/30 rounded overflow-x-auto">
                          {errorDetails.technicalDetails}
                        </pre>
                      </details>
                    )}
                  </>
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
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedPosts.length === posts.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Titel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Afbeelding
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {posts.map((post) => (
                    <tr key={post.wordpress_id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(post.wordpress_id)}
                          onChange={() => togglePostSelection(post.wordpress_id)}
                          className="rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{post.title}</div>
                        <div className="text-sm text-gray-400">/{post.slug}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          post.status === 'publish' ? 'bg-green-100 text-green-800' :
                          post.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {post.status === 'publish' ? 'Gepubliceerd' :
                           post.status === 'draft' ? 'Draft' : post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(post.published_at).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                        <button
                          onClick={() => syncSinglePost(post.wordpress_id)}
                          disabled={syncing}
                          className="text-orange-500 hover:text-orange-400 disabled:opacity-50"
                        >
                          Importeren
                        </button>
                        <a
                          href={post.wordpress_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:text-orange-300"
                        >
                          Bekijken
                        </a>
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

        {/* Help Text */}
        <div className="mt-8 bg-orange-900/20 border border-orange-500/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-400 mb-2">
            Hoe werkt WordPress post synchronisatie?
          </h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• <strong className="text-white">Posts Ophalen:</strong> Haalt posts op van je WordPress website (alleen om te bekijken)</li>
            <li>• <strong className="text-white">Importeren:</strong> Importeert een enkele post naar Writgo.ai waar je hem kunt bewerken</li>
            <li>• <strong className="text-white">Alles Synchroniseren:</strong> Importeert alle WordPress posts in één keer</li>
            <li>• Na import kun je posts bewerken in Writgo.ai en wijzigingen terugpushen naar WordPress</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
