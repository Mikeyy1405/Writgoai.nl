'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { ProjectSelector } from '@/components/ProjectSelector';

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  title?: string | null;
  status: string;
  scheduledDate?: string | null;
  hashtags: string[];
  createdAt: string;
}

export default function SocialMediaPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadPosts();
    }
  }, [projectId]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/social?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
      facebook: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      twitter: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
      linkedin: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      tiktok: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    };
    return colors[platform] || 'bg-slate-800/50 text-slate-300 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-slate-800 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white dark:text-white">
            Social Media Posts
          </h1>
          <button
            onClick={() => setShowModal(true)}
            disabled={!projectId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nieuwe Post
          </button>
        </div>

        <div className="mb-6 bg-slate-900 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-medium mb-2 text-slate-300 dark:text-gray-300">
            Selecteer Project
          </label>
          <ProjectSelector value={projectId} onChange={setProjectId} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !projectId ? (
          <div className="text-center py-12 bg-slate-900 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">
              Selecteer een project om social media posts te bekijken
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Nog geen social media posts
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Maak je eerste social media post
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-900 dark:bg-gray-800 p-6 rounded-lg border border-slate-700 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                {post.title && (
                  <h3 className="text-lg font-semibold mb-2 text-white dark:text-white">
                    {post.title}
                  </h3>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                  {post.content}
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <span className={`px-2 py-1 text-xs rounded ${getPlatformColor(post.platform)}`}>
                    {post.platform}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      post.status === 'posted'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : post.status === 'scheduled'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-slate-800/50 text-slate-300 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {post.status}
                  </span>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      {post.hashtags.length} hashtags
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && projectId && (
          <CreateSocialModal
            projectId={projectId}
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false);
              loadPosts();
            }}
          />
        )}
      </div>
    </div>
  );
}

function CreateSocialModal({
  projectId,
  onClose,
  onSuccess,
}: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [platform, setPlatform] = useState('instagram');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const hashtagsArray = hashtags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          platform,
          content,
          title: title || null,
          hashtags: hashtagsArray,
          status: 'pending',
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Fout bij aanmaken social media post');
      }
    } catch (error) {
      setError('Fout bij aanmaken social media post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-white dark:text-white">
          Nieuwe Social Media Post
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300 dark:text-gray-300">
              Platform *
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-4 py-2 border border-slate-600 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-900 dark:bg-gray-700 text-white dark:text-white"
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300 dark:text-gray-300">
              Titel (optioneel)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-600 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-900 dark:bg-gray-700 text-white dark:text-white"
              placeholder="Post titel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300 dark:text-gray-300">
              Content *
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-slate-600 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-900 dark:bg-gray-700 text-white dark:text-white"
              placeholder="Schrijf je social media content..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300 dark:text-gray-300">
              Hashtags (gescheiden door komma's)
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full px-4 py-2 border border-slate-600 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-900 dark:bg-gray-700 text-white dark:text-white"
              placeholder="marketing, socialmedia, content"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-600 dark:border-gray-600 rounded-lg hover:bg-slate-800 dark:hover:bg-gray-700 transition-colors text-white dark:text-white"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Aanmaken...' : 'Aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
