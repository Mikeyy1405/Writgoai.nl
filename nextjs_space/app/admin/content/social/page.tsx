'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Globe, Loader2, Eye, Send, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  niche?: string;
  targetAudience?: string;
  brandVoice?: string;
  getlateProfileId?: string;
}

interface SocialPost {
  platform: string;
  content: string;
  hashtags?: string;
}

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-black' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
];

export default function SocialContentPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<SocialPost[]>([]);
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

  async function generateSocialPosts() {
    if (!selectedProjectId || !topic || selectedPlatforms.length === 0) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/content/generate-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          topic,
          platforms: selectedPlatforms,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedPosts(data.posts);
        setMode('preview');
      }
    } catch (error) {
      console.error('Error generating social posts:', error);
    } finally {
      setIsGenerating(false);
    }
  }

  async function publishToGetlate() {
    if (generatedPosts.length === 0 || !selectedProjectId) return;

    setIsPublishing(true);
    try {
      const response = await fetch('/api/admin/content/publish-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          posts: generatedPosts,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Social posts gepubliceerd via Getlate.dev!');
        // Reset form
        setGeneratedPosts([]);
        setMode('create');
        setTopic('');
      }
    } catch (error) {
      console.error('Error publishing social posts:', error);
    } finally {
      setIsPublishing(false);
    }
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  function togglePlatform(platformId: string) {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Social Media Post Generator</h1>
        <p className="text-gray-600 mt-2">Maak AI-gegenereerde social content voor al je platforms</p>
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
                  {!project.getlateProfileId && ' (⚠️ Socials niet verbonden)'}
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

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Selecteer Platforms
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`
                      flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all
                      ${isSelected 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                      }
                    `}
                  >
                    <Icon className={`w-8 h-8 ${isSelected ? 'text-orange-600' : platform.color}`} />
                    <span className={`text-sm font-medium ${isSelected ? 'text-orange-900' : 'text-gray-700'}`}>
                      {platform.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Onderwerp / Topic
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="bijv. Lancering van nieuw product, tip over SEO, motiverende quote..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateSocialPosts}
            disabled={!selectedProjectId || !topic || selectedPlatforms.length === 0 || isGenerating}
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
                <span>Genereer Social Posts ({selectedPlatforms.length} platforms)</span>
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
                Preview ({generatedPosts.length} posts)
              </h2>
              <button
                onClick={() => {
                  setMode('create');
                  setGeneratedPosts([]);
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Terug
              </button>
            </div>

            <div className="space-y-6">
              {generatedPosts.map((post, index) => {
                const platformData = PLATFORMS.find(p => p.id === post.platform);
                const Icon = platformData?.icon || Share2;
                
                return (
                  <div key={index} className="border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon className={`w-5 h-5 ${platformData?.color}`} />
                      <span className="font-semibold text-gray-900">{platformData?.name}</span>
                    </div>
                    
                    <textarea
                      value={post.content}
                      onChange={(e) => {
                        const updatedPosts = [...generatedPosts];
                        updatedPosts[index].content = e.target.value;
                        setGeneratedPosts(updatedPosts);
                      }}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
                    />
                    
                    {post.hashtags && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                        <input
                          type="text"
                          value={post.hashtags}
                          onChange={(e) => {
                            const updatedPosts = [...generatedPosts];
                            updatedPosts[index].hashtags = e.target.value;
                            setGeneratedPosts(updatedPosts);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Publish Button */}
              <div className="pt-6 border-t">
                <button
                  onClick={publishToGetlate}
                  disabled={isPublishing || !selectedProject?.getlateProfileId}
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
                      <span>Publiceer via Getlate.dev</span>
                    </>
                  )}
                </button>
                {!selectedProject?.getlateProfileId && (
                  <p className="text-sm text-red-600 mt-2 text-center">
                    ⚠️ Socials niet verbonden aan dit project
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
