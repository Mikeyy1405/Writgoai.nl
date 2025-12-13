'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Globe, Loader2, Eye, Send } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  niche?: string;
  targetAudience?: string;
  brandVoice?: string;
  wordpressUrl?: string;
}

interface BlogPost {
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  focusKeyword: string;
}

export default function BlogContentPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<BlogPost | null>(null);
  const [mode, setMode] = useState<'create' | 'preview'>('create');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const response = await fetch('/api/admin/projects');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }

  async function generateBlogPost() {
    if (!selectedProjectId || !topic) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/content/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          topic,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedPost(data.post);
        setMode('preview');
      }
    } catch (error) {
      console.error('Error generating blog post:', error);
    } finally {
      setIsGenerating(false);
    }
  }

  async function publishToWordPress() {
    if (!generatedPost || !selectedProjectId) return;

    setIsPublishing(true);
    try {
      const response = await fetch('/api/admin/content/publish-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          post: generatedPost,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Blog post gepubliceerd naar WordPress!');
        // Reset form
        setGeneratedPost(null);
        setMode('create');
        setTopic('');
        setKeywords('');
      }
    } catch (error) {
      console.error('Error publishing blog post:', error);
    } finally {
      setIsPublishing(false);
    }
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Blog Post Generator</h1>
        <p className="text-gray-600 mt-2">Maak AI-gegenereerde blog content voor je projecten</p>
      </div>

      {mode === 'create' ? (
        <div className="bg-white rounded-lg border p-8 space-y-6">
          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Selecteer Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Kies een project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                  {!project.wordpressUrl && ' (⚠️ WordPress niet verbonden)'}
                </option>
              ))}
            </select>
            {selectedProject && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-1 text-sm">
                {selectedProject.niche && (
                  <p><strong>Niche:</strong> {selectedProject.niche}</p>
                )}
                {selectedProject.targetAudience && (
                  <p><strong>Doelgroep:</strong> {selectedProject.targetAudience}</p>
                )}
                {selectedProject.brandVoice && (
                  <p><strong>Tone:</strong> {selectedProject.brandVoice}</p>
                )}
              </div>
            )}
          </div>

          {/* Topic Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Onderwerp / Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="bijv. De voordelen van AI in marketing"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Keywords Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Keywords (optioneel, komma gescheiden)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="bijv. AI, marketing, automatisering"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateBlogPost}
            disabled={!selectedProjectId || !topic || isGenerating}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Genereren...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Genereer Blog Post</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Preview */}
          <div className="bg-white rounded-lg border p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                <Eye className="w-6 h-6 inline mr-2" />
                Preview
              </h2>
              <button
                onClick={() => {
                  setMode('create');
                  setGeneratedPost(null);
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Terug
              </button>
            </div>

            {generatedPost && (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
                  <input
                    type="text"
                    value={generatedPost.title}
                    onChange={(e) => setGeneratedPost({ ...generatedPost, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Samenvatting</label>
                  <textarea
                    value={generatedPost.excerpt}
                    onChange={(e) => setGeneratedPost({ ...generatedPost, excerpt: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={generatedPost.content}
                    onChange={(e) => setGeneratedPost({ ...generatedPost, content: e.target.value })}
                    rows={20}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>

                {/* SEO Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                    <textarea
                      value={generatedPost.metaDescription}
                      onChange={(e) => setGeneratedPost({ ...generatedPost, metaDescription: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Focus Keyword</label>
                    <input
                      type="text"
                      value={generatedPost.focusKeyword}
                      onChange={(e) => setGeneratedPost({ ...generatedPost, focusKeyword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Publish Button */}
                <div className="pt-6 border-t">
                  <button
                    onClick={publishToWordPress}
                    disabled={isPublishing || !selectedProject?.wordpressUrl}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Publiceren...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Publiceer naar WordPress</span>
                      </>
                    )}
                  </button>
                  {!selectedProject?.wordpressUrl && (
                    <p className="text-sm text-red-600 mt-2 text-center">
                      ⚠️ WordPress niet verbonden aan dit project
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
