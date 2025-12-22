'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
});

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
  const [generatingImage, setGeneratingImage] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  
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

  // Generate AI image
  const generateAIImage = useCallback(async (prompt: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          style: 'photorealistic',
          aspectRatio: '16:9'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      return data.url;
    } catch (err: any) {
      console.error('Image generation error:', err);
      alert(`Fout bij genereren afbeelding: ${err.message}`);
      return null;
    }
  }, []);

  // Generate featured image
  const generateFeaturedImage = async () => {
    if (!formData.title) {
      alert('Voer eerst een titel in');
      return;
    }
    
    setGeneratingImage(true);
    try {
      const prompt = `Professional blog header image for article about: ${formData.title}, modern design, high quality`;
      const imageUrl = await generateAIImage(prompt);
      if (imageUrl) {
        setFormData(prev => ({ ...prev, featured_image: imageUrl }));
      }
    } finally {
      setGeneratingImage(false);
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
      
      // Open the published post in new tab
      if (publishNow && post?.slug) {
        window.open(`/blog/${post.slug}`, '_blank');
      }
      
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
      <div className="max-w-6xl mx-auto">
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

            {/* Content with Editor Mode Toggle */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Content *
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditorMode('visual')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      editorMode === 'visual' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ✨ Visueel
                  </button>
                  <button
                    onClick={() => setEditorMode('html')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      editorMode === 'html' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    &lt;/&gt; HTML
                  </button>
                </div>
              </div>
              
              {editorMode === 'visual' ? (
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  onGenerateImage={generateAIImage}
                  placeholder="Begin met schrijven..."
                />
              ) : (
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                  placeholder="Schrijf je content hier... HTML tags zijn toegestaan."
                />
              )}
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
                      rows={2}
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
                      placeholder="Primaire keyword..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Image */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Featured Image
              </label>
              {formData.featured_image ? (
                <div className="relative mb-3">
                  <img
                    src={formData.featured_image}
                    alt="Featured"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setFormData({ ...formData, featured_image: '' })}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-3">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">Geen afbeelding</p>
                </div>
              )}
              <div className="space-y-2">
                <button
                  onClick={generateFeaturedImage}
                  disabled={generatingImage || !formData.title}
                  className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {generatingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Genereren...
                    </>
                  ) : (
                    <>🤖 Genereer met AI</>
                  )}
                </button>
                <input
                  type="url"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Of plak een URL..."
                />
              </div>
            </div>

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

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Categorieën
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500">Geen categorieën beschikbaar</p>
                ) : (
                  categories.map(category => (
                    <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{category.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-gray-500">Geen tags beschikbaar</p>
                ) : (
                  tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        formData.tags.includes(tag.id)
                          ? 'bg-orange-100 text-orange-700 border border-orange-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
