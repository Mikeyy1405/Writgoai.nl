'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ContentIdea {
  title: string;
  category: string;
  description: string;
  keywords: string[];
  contentType?: string;
  cluster?: string;
  searchVolume?: number | null;
  competition?: string | null;
}

interface Project {
  id: string;
  name: string;
  website_url: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function StreamWriterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState<ContentIdea | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    wordCount: 2000,
    language: 'nl',
  });

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [searchParams]);

  useEffect(() => {
    // Auto-scroll content as it streams
    if (contentRef.current && streaming) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamedContent, streaming]);

  useEffect(() => {
    // Auto-scroll chat
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  async function loadData() {
    setLoading(true);

    const projectId = searchParams.get('project');
    const articleIndex = searchParams.get('article');

    if (projectId) {
      try {
        const projectResponse = await fetch(`/api/projects/list`);
        const projectData = await projectResponse.json();
        const foundProject = projectData.projects?.find((p: Project) => p.id === projectId);
        if (foundProject) {
          setProject(foundProject);
        }
      } catch (e) {
        console.error('Failed to load project:', e);
      }
    }

    if (projectId && articleIndex !== null) {
      try {
        const response = await fetch(`/api/content-plan/article?project_id=${projectId}&index=${articleIndex}`);
        const data = await response.json();

        if (data.article) {
          setIdea({
            title: data.article.title,
            category: data.article.category || '',
            description: data.article.description || '',
            keywords: data.article.keywords || [],
            contentType: data.article.contentType || 'article',
            cluster: data.article.cluster,
            searchVolume: data.article.searchVolume,
            competition: data.article.competition,
          });
          setSettings(prev => ({ ...prev, language: data.language || 'nl' }));
        }
      } catch (e) {
        console.error('Failed to load article:', e);
      }
    }

    setLoading(false);
  }

  async function startStreaming() {
    if (!idea || !project) {
      alert('Geen artikel of project geselecteerd');
      return;
    }

    setStreaming(true);
    setStreamedContent('');
    setFullContent('');
    setWordCount(0);

    try {
      const response = await fetch('/api/generate/article-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          title: idea.title,
          keyword: idea.keywords[0] || idea.title,
          description: idea.description,
          word_count: settings.wordCount,
          language: settings.language,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'start') {
                console.log('Starting generation:', data.title);
              } else if (data.type === 'chunk') {
                setStreamedContent(prev => prev + data.content);
              } else if (data.type === 'complete') {
                setFullContent(data.content);
                setWordCount(data.wordCount);
                setArticleId(data.articleId);
                setStreaming(false);
              } else if (data.type === 'error') {
                alert('Fout: ' + data.error);
                setStreaming(false);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Streaming error:', error);
      alert('Fout bij streamen: ' + error.message);
      setStreaming(false);
    }
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || !fullContent) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      // TODO: Implement chat API for content edits
      // For now, just show a placeholder response
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: 'Chat functionaliteit komt binnenkort! Je kunt straks bijvoorbeeld vragen: "Voeg een paragraaf toe over..." of "Wijzig de tone naar professioneel"',
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
        setChatLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Chat error:', error);
      setChatLoading(false);
    }
  }

  function copyToClipboard() {
    if (fullContent) {
      navigator.clipboard.writeText(fullContent);
      alert('Artikel gekopieerd naar klembord!');
    }
  }

  function downloadAsHTML() {
    if (fullContent) {
      const blob = new Blob([fullContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${idea?.title.toLowerCase().replace(/\s+/g, '-') || 'artikel'}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  const displayContent = streaming ? streamedContent : fullContent;
  const currentWordCount = streaming
    ? streamedContent.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length
    : wordCount;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {streaming ? '✍️ Aan het schrijven...' : '✍️ Stream Writer'}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {idea?.title || 'Geen artikel geselecteerd'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {(streaming || fullContent) && (
                <div className="text-orange-400 font-semibold">
                  {currentWordCount} woorden
                  {streaming && <span className="ml-2 animate-pulse">...</span>}
                </div>
              )}
              <button
                onClick={() => router.push('/dashboard/content-plan')}
                className="text-gray-400 hover:text-white transition"
              >
                ← Terug
              </button>
            </div>
          </div>
        </div>

        {/* Content Display */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!streaming && !fullContent && idea && (
            // Ready State
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="max-w-2xl w-full space-y-6">
                <div className="bg-gray-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">⚙️ Instellingen</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Aantal woorden</label>
                      <select
                        value={settings.wordCount}
                        onChange={(e) => setSettings({ ...settings, wordCount: Number(e.target.value) })}
                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-orange-500 focus:outline-none"
                      >
                        <option value={1000}>~1000 woorden</option>
                        <option value={1500}>~1500 woorden</option>
                        <option value={2000}>~2000 woorden</option>
                        <option value={2500}>~2500 woorden</option>
                        <option value={3000}>~3000 woorden</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Taal</label>
                      <select
                        value={settings.language}
                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-orange-500 focus:outline-none"
                      >
                        <option value="nl">Nederlands</option>
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={startStreaming}
                    disabled={streaming || !project}
                    className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition disabled:opacity-50"
                  >
                    🚀 Start Live Generatie
                  </button>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-blue-400 text-sm">
                    💡 <strong>Tip:</strong> Zie de tekst real-time verschijnen terwijl de AI schrijft!
                    Gebruik daarna de chat om snel aanpassingen te maken.
                  </p>
                </div>
              </div>
            </div>
          )}

          {(streaming || fullContent) && (
            // Streaming/Complete State
            <>
              <div
                ref={contentRef}
                className="flex-1 overflow-y-auto p-8 bg-gray-900"
              >
                <div className="max-w-4xl mx-auto">
                  <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: displayContent }}
                  />
                  {streaming && (
                    <div className="inline-block w-2 h-5 bg-orange-500 animate-pulse ml-1"></div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              {!streaming && fullContent && (
                <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        📋 Kopiëren
                      </button>
                      <button
                        onClick={downloadAsHTML}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        ⬇️ Download
                      </button>
                      {articleId && (
                        <button
                          onClick={() => router.push(`/dashboard/wordpress-editor/${articleId}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          ✏️ Bewerken
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setChatOpen(!chatOpen)}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg"
                    >
                      💬 {chatOpen ? 'Verberg' : 'Open'} Chat
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      {chatOpen && fullContent && (
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">💬 Quick Edits Chat</h3>
            <p className="text-gray-400 text-sm mt-1">
              Vraag om aanpassingen in het artikel
            </p>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">Geen berichten nog.</p>
                <p className="text-xs mt-2">
                  Probeer: "Voeg een paragraaf toe over...", "Maak het formeler", etc.
                </p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {msg.timestamp.toLocaleTimeString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="px-6 py-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !chatLoading && sendChatMessage()}
                placeholder="Vraag om een aanpassing..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-orange-500 focus:outline-none text-sm"
                disabled={chatLoading}
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
