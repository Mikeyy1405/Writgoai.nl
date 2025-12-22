'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  category: string;
  tags: string[];
  status: string;
  meta_title: string;
  meta_description: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  'SEO',
  'Content Marketing',
  'AI Writing',
  'Social Media',
  'Copywriting',
  'WordPress',
  'Tutorials',
  'Nieuws',
  'Algemeen',
];

export default function WritGoBlogPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Edit modal state
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isNewPost, setIsNewPost] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formCategory, setFormCategory] = useState('Algemeen');
  const [formTags, setFormTags] = useState('');
  const [formFeaturedImage, setFormFeaturedImage] = useState('');
  const [formMetaTitle, setFormMetaTitle] = useState('');
  const [formMetaDescription, setFormMetaDescription] = useState('');
  const [formStatus, setFormStatus] = useState('draft');

  useEffect(() => {
    checkAuth();
    loadPosts();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  }

  async function loadPosts() {
    try {
      const response = await fetch('/api/writgo-blog');
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }

  function openNewPost() {
    setIsNewPost(true);
    setEditingPost(null);
    setFormTitle('');
    setFormContent('');
    setFormExcerpt('');
    setFormCategory('Algemeen');
    setFormTags('');
    setFormFeaturedImage('');
    setFormMetaTitle('');
    setFormMetaDescription('');
    setFormStatus('draft');
  }

  function openEditPost(post: BlogPost) {
    setIsNewPost(false);
    setEditingPost(post);
    setFormTitle(post.title);
    setFormContent(post.content);
    setFormExcerpt(post.excerpt || '');
    setFormCategory(post.category || 'Algemeen');
    setFormTags(post.tags?.join(', ') || '');
    setFormFeaturedImage(post.featured_image || '');
    setFormMetaTitle(post.meta_title || '');
    setFormMetaDescription(post.meta_description || '');
    setFormStatus(post.status);
  }

  function closeModal() {
    setEditingPost(null);
    setIsNewPost(false);
  }

  async function savePost() {
    if (!formTitle.trim()) {
      alert('Titel is verplicht');
      return;
    }

    setSaving(true);
    try {
      const postData = {
        title: formTitle,
        content: formContent,
        excerpt: formExcerpt,
        category: formCategory,
        tags: formTags.split(',').map(t => t.trim()).filter(t => t),
        featured_image: formFeaturedImage || null,
        meta_title: formMetaTitle || formTitle,
        meta_description: formMetaDescription || formExcerpt,
        status: formStatus,
      };

      if (isNewPost) {
        const response = await fetch('/api/writgo-blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });
        const data = await response.json();
        if (data.success) {
          setPosts([data.post, ...posts]);
          closeModal();
        } else {
          alert(data.error || 'Er ging iets mis');
        }
      } else if (editingPost) {
        const response = await fetch('/api/writgo-blog', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPost.id, ...postData }),
        });
        const data = await response.json();
        if (data.success) {
          setPosts(posts.map(p => p.id === editingPost.id ? data.post : p));
          closeModal();
        } else {
          alert(data.error || 'Er ging iets mis');
        }
      }
    } catch (error) {
      console.error('Failed to save post:', error);
      alert('Er ging iets mis bij het opslaan');
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm('Weet je zeker dat je dit artikel wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/writgo-blog?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setPosts(posts.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  }

  async function togglePublish(post: BlogPost) {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    
    try {
      const response = await fetch('/api/writgo-blog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(p => p.id === post.id ? data.post : p));
      }
    } catch (error) {
      console.error('Failed to toggle publish:', error);
    }
  }

  const filteredPosts = posts.filter(post => {
    if (filterStatus !== 'all' && post.status !== filterStatus) return false;
    if (filterCategory !== 'all' && post.category !== filterCategory) return false;
    return true;
  });

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              📝 WritGo Blog Beheer
            </h1>
            <p className="text-gray-400 mt-1 text-sm md:text-base">Beheer de artikelen op writgo.nl/blog</p>
          </div>

          <button
            onClick={openNewPost}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-4 md:px-6 py-2 md:py-3 rounded-lg transition flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            ➕ Nieuw Artikel
          </button>
        </div>

        {/* Filters - Responsive */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white flex-1 sm:flex-none"
          >
            <option value="all">Alle statussen</option>
            <option value="draft">Concept</option>
            <option value="published">Gepubliceerd</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white flex-1 sm:flex-none"
          >
            <option value="all">Alle categorieën</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="text-gray-400 text-sm sm:ml-auto self-center">
            {filteredPosts.length} artikel{filteredPosts.length !== 1 ? 'en' : ''}
          </div>
        </div>

        {/* Posts list - Card layout for mobile */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="bg-gray-800 rounded-xl text-center py-12 text-gray-400">
              <p className="text-4xl mb-4">📝</p>
              <p>Nog geen artikelen</p>
              <p className="text-sm mt-2">Klik op "Nieuw Artikel" om te beginnen</p>
            </div>
          ) : (
            filteredPosts.map(post => (
              <div key={post.id} className="bg-gray-800 rounded-xl p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Post info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 break-words">{post.title}</h3>
                    <p className="text-sm text-gray-400 mb-3 break-all">/blog/{post.slug}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                        {post.category}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        post.status === 'published' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {post.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openEditPost(post)}
                      className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg text-sm transition flex-1 sm:flex-none"
                    >
                      ✏️ Bewerken
                    </button>
                    <button
                      onClick={() => togglePublish(post)}
                      className={`px-3 py-2 rounded-lg text-sm transition flex-1 sm:flex-none ${
                        post.status === 'published'
                          ? 'bg-yellow-600 hover:bg-yellow-500'
                          : 'bg-green-600 hover:bg-green-500'
                      }`}
                    >
                      {post.status === 'published' ? '📝 Unpublish' : '🚀 Publiceer'}
                    </button>
                    <button
                      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                      className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg text-sm transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit/New Modal */}
      {(editingPost || isNewPost) && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl p-4 md:p-6 w-full max-w-4xl my-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {isNewPost ? '➕ Nieuw Artikel' : '✏️ Artikel Bewerken'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Titel *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  placeholder="Artikel titel"
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Categorie</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  >
                    <option value="draft">Concept</option>
                    <option value="published">Gepubliceerd</option>
                  </select>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Excerpt / Samenvatting</label>
                <textarea
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white resize-none"
                  placeholder="Korte samenvatting van het artikel"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Content (HTML)</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={10}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-sm resize-y"
                  placeholder="<h2>Heading</h2><p>Content...</p>"
                />
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Featured Image URL</label>
                <input
                  type="url"
                  value={formFeaturedImage}
                  onChange={(e) => setFormFeaturedImage(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  placeholder="https://..."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tags (komma gescheiden)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  placeholder="seo, content, tips"
                />
              </div>

              {/* SEO */}
              <div className="border-t border-gray-700 pt-4 mt-4">
                <h3 className="font-medium mb-4">🔍 SEO</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Meta Title</label>
                    <input
                      type="text"
                      value={formMetaTitle}
                      onChange={(e) => setFormMetaTitle(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      placeholder="SEO titel (max 60 karakters)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Meta Description</label>
                    <textarea
                      value={formMetaDescription}
                      onChange={(e) => setFormMetaDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white resize-none"
                      placeholder="SEO beschrijving (max 160 karakters)"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={closeModal}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg transition order-2 sm:order-1"
                >
                  Annuleren
                </button>
                <button
                  onClick={savePost}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 rounded-lg transition flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Opslaan...
                    </>
                  ) : (
                    <>💾 Opslaan</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
