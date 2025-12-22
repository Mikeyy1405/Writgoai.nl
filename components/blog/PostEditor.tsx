'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface PostEditorProps {
  postId?: string;
}

export default function PostEditor({ postId }: PostEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSEO, setShowSEO] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    status: 'draft',
    published_at: '',
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
    seo_keywords: [] as string[],
    categories: [] as string[],
    tags: [] as string[]
  });

  useEffect(() => {
    fetchCategoriesAndTags();
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!postId && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, postId]);

  const fetchCategoriesAndTags = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        fetch('/api/blog/categories'),
        fetch('/api/blog/tags')
      ]);
      const categoriesData = await categoriesRes.json();
      const tagsData = await tagsRes.json();
      setCategories(categoriesData.categories || []);
      setTags(tagsData.tags || []);
    } catch (error) {
      console.error('Error fetching categories and tags:', error);
    }
  };

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/blog/posts/${postId}`);
      if (!response.ok) throw new Error('Failed to fetch post');
      
      const { post } = await response.json();
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        featured_image: post.featured_image || '',
        status: post.status || 'draft',
        published_at: post.published_at || '',
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        focus_keyword: post.focus_keyword || '',
        seo_keywords: post.seo_keywords || [],
        categories: post.categories?.map((c: any) => c.category.id) || [],
        tags: post.tags?.map((t: any) => t.tag.id) || []
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publishNow = false) => {
    if (!formData.title || !formData.content) {
      alert('Titel en content zijn verplicht');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status: publishNow ? 'published' : formData.status,
        published_at: publishNow ? new Date().toISOString() : formData.published_at
      };

      const url = postId ? `/api/blog/posts/${postId}` : '/api/blog/posts';
      const method = postId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) throw new Error('Failed to save post');

      const { post } = await response.json();
      alert(publishNow ? 'Post gepubliceerd!' : 'Post opgeslagen!');
      router.push('/dashboard/blog');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Er is een fout opgetreden bij het opslaan');
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {postId ? 'Post Bewerken' : 'Nieuwe Post'}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={saving}
            >
              Annuleren
            </button>
            <button
              onClick={() => handleSave(false)}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Bezig...' : 'Opslaan als Draft'}
            </button>
            <button
              onClick={() => handleSave(true)}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Bezig...' : 'Publiceren'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titel *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Voer een titel in..."
              />
            </div>

            {/* Slug */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">/blog/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="post-slug"
                />
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content * (HTML supported)
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                placeholder="Schrijf je content hier... HTML tags zijn toegestaan."
              />
              <p className="text-xs text-gray-500 mt-2">
                Gebruik HTML tags zoals &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, etc.
              </p>
            </div>

            {/* Excerpt */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt (Korte samenvatting)
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Korte samenvatting voor overzichtspagina's..."
              />
            </div>

            {/* SEO Section */}
            <div className="bg-white rounded-lg shadow-sm">
              <button
                onClick={() => setShowSEO(!showSEO)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">SEO Instellingen</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${showSEO ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showSEO && (
                <div className="px-6 pb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Title ({formData.meta_title.length}/60)
                    </label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      maxLength={60}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="SEO title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description ({formData.meta_description.length}/160)
                    </label>
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      maxLength={160}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="SEO description..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Focus Keyword
                    </label>
                    <input
                      type="text"
                      value={formData.focus_keyword}
                      onChange={(e) => setFormData({ ...formData, focus_keyword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Hoofd keyword..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="published">Gepubliceerd</option>
                <option value="scheduled">Gepland</option>
              </select>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Image URL
              </label>
              <input
                type="text"
                value={formData.featured_image}
                onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="https://..."
              />
              {formData.featured_image && (
                <img
                  src={formData.featured_image}
                  alt="Preview"
                  className="mt-4 w-full rounded-lg"
                />
              )}
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Categorieën
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tags
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
