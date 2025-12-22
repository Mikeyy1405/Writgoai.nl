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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              📝 WritGo Blog Beheer
            </h1>
            <p className="text-gray-400 mt-1">Beheer de artikelen op writgo.nl/blog</p>
          </div>

          <button
            onClick={openNewPost}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center gap-2"
          >
            ➕ Nieuw Artikel
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">Alle statussen</option>
            <option value="draft">Concept</option>
            <option value="published">Gepubliceerd</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">Alle categorieën</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="ml-auto text-gray-400">
            {filteredPosts.length} artikel{filteredPosts.length !== 1 ? 'en' : ''}
          </div>
        </div>

        {/* Posts list */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-4">📝</p>
              <p>Nog geen artikelen</p>
              <p className="text-sm mt-2">Klik op "Nieuw Artikel" om te beginnen</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left px-6 py-4 font-medium">Titel</th>
                  <th className="text-left px-6 py-4 font-medium">Categorie</th>
                  <th className="text-left px-6 py-4 font-medium">Status</th>
                  <th className="text-left px-6 py-4 font-medium">Datum</th>
                  <th className="text-right px-6 py-4 font-medium">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredPosts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium">{post.title}</div>
                      <div className="text-sm text-gray-400">/blog/{post.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-600 px-2 py-1 rounded text-sm">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        post.status === 'published' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {post.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => togglePublish(post)}
                          className={`text-xs px-3 py-1.5 rounded transition ${
                            post.status === 'published'
                              ? 'bg-yellow-600 hover:bg-yellow-500'
                              : 'bg-green-600 hover:bg-green-500'
                          }`}
                        >
                          {post.status === 'published' ? '📤 Unpublish' : '📢 Publiceer'}
                        </button>
                        <button
                          onClick={() => openEditPost(post)}
                          className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded transition"
                        >
                          ✏️ Bewerk
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-xs bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit/Create Modal */}
      {(editingPost || isNewPost) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6">
              {isNewPost ? '➕ Nieuw Artikel' : '✏️ Artikel Bewerken'}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
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

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Excerpt</label>
                  <textarea
                    value={formExcerpt}
                    onChange={(e) => setFormExcerpt(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white resize-none"
                    placeholder="Korte samenvatting"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tags (komma-gescheiden)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                    placeholder="seo, content, tips"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Featured Image URL</label>
                  <input
                    type="text"
                    value={formFeaturedImage}
                    onChange={(e) => setFormFeaturedImage(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Content (HTML)</label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={12}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-sm resize-none"
                    placeholder="<p>Artikel content...</p>"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Meta Title</label>
                  <input
                    type="text"
                    value={formMetaTitle}
                    onChange={(e) => setFormMetaTitle(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                    placeholder="SEO titel"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Meta Description</label>
                  <textarea
                    value={formMetaDescription}
                    onChange={(e) => setFormMetaDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white resize-none"
                    placeholder="SEO beschrijving"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition"
              >
                Annuleren
              </button>
              <button
                onClick={savePost}
                disabled={saving}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg transition flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Opslaan...
                  </>
                ) : (
                  <>💾 Opslaan</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
