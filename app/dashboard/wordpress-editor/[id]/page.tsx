'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
});

interface Article {
  id: string;
  project_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  status: string;
  wordpress_id: number | null;
  wordpress_url: string | null;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
}

interface InternalLink {
  id: string;
  title: string;
  slug: string;
  url: string;
}

interface AffiliateLink {
  platform: string;
  affiliate_id: string;
  site_code?: string;
}

interface WordPressEditorProps {
  params: {
    id: string;
  };
}

export default function WordPressEditor({ params }: WordPressEditorProps) {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showSEO, setShowSEO] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [showAffiliate, setShowAffiliate] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');

  const [internalLinks, setInternalLinks] = useState<InternalLink[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    status: 'draft',
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
  });

  useEffect(() => {
    fetchArticle();
    fetchInternalLinks();
    fetchAffiliateLinks();
  }, [params.id]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/articles/get?id=${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch article');

      const { article } = await response.json();
      setArticle(article);
      setFormData({
        title: article.title || '',
        slug: article.slug || '',
        content: article.content || '',
        excerpt: article.excerpt || '',
        featured_image: article.featured_image || '',
        status: article.status || 'draft',
        meta_title: article.meta_title || '',
        meta_description: article.meta_description || '',
        focus_keyword: article.focus_keyword || '',
      });
    } catch (error) {
      console.error('Error fetching article:', error);
      alert('Fout bij laden van artikel');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchInternalLinks = async () => {
    try {
      const response = await fetch(`/api/articles/list?limit=50`);
      const data = await response.json();
      const links: InternalLink[] = data.articles?.map((a: any) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        url: `/blog/${a.slug}`,
      })) || [];
      setInternalLinks(links);
    } catch (error) {
      console.error('Error fetching internal links:', error);
    }
  };

  const fetchAffiliateLinks = async () => {
    if (!article?.project_id) return;

    try {
      const response = await fetch(`/api/project/affiliates?project_id=${article.project_id}`);
      const data = await response.json();
      setAffiliateLinks(data.affiliates || []);
    } catch (error) {
      console.error('Error fetching affiliate links:', error);
    }
  };

  // Generate AI image
  const generateAIImage = useCallback(async (prompt: string): Promise<string | null> => {
    if (!article?.project_id) {
      alert('Project ID ontbreekt');
      return null;
    }

    try {
      const response = await fetch('/api/media/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: article.project_id,
          article_id: article.id,
          prompt,
          type: 'featured',
          style: 'professional',
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
  }, [article]);

  // Generate featured image
  const generateFeaturedImage = async () => {
    if (!formData.title && !formData.focus_keyword) {
      alert('Voer eerst een titel of focus keyword in');
      return;
    }

    setGeneratingImage(true);
    try {
      const prompt = `Professional blog header image for article about: ${formData.focus_keyword || formData.title}, modern design, high quality, photorealistic`;
      const imageUrl = await generateAIImage(prompt);
      if (imageUrl) {
        setFormData(prev => ({ ...prev, featured_image: imageUrl }));
      }
    } finally {
      setGeneratingImage(false);
    }
  };

  // AI-powered SEO optimization
  const optimizeForSEO = async () => {
    if (!formData.content) {
      alert('Voeg eerst content toe');
      return;
    }

    setOptimizing(true);
    try {
      // This would call an AI endpoint to optimize the content
      // For now, we'll show a placeholder
      alert('SEO optimalisatie functionaliteit komt binnenkort! Dit zal je content analyseren en optimaliseren voor betere rankings.');
    } finally {
      setOptimizing(false);
    }
  };

  // Insert internal link into content
  const insertInternalLink = (link: InternalLink, text?: string) => {
    const linkText = text || link.title;
    const linkHtml = `<a href="${link.url}" title="${link.title}">${linkText}</a>`;

    if (editorMode === 'html') {
      // Insert at cursor position or append
      setFormData(prev => ({
        ...prev,
        content: prev.content + ' ' + linkHtml
      }));
    } else {
      // For visual editor, we'll need to handle this differently
      alert('Schakel naar HTML mode om links direct in te voegen, of gebruik de editor toolbar');
    }
  };

  // Generate affiliate link
  const generateAffiliateLink = (platform: string, productUrl: string, productName: string): string => {
    const affiliate = affiliateLinks.find(a => a.platform === platform);
    if (!affiliate) return productUrl;

    if (platform === 'bol.com' && affiliate.site_code) {
      const encoded = encodeURIComponent(productUrl);
      return `https://partner.bol.com/click/click?p=2&t=url&s=${affiliate.site_code}&f=TXL&url=${encoded}&name=${encodeURIComponent(productName)}`;
    }

    return productUrl;
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      alert('Titel en content zijn verplicht');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/articles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.id,
          ...formData,
        })
      });

      if (!response.ok) throw new Error('Failed to save article');

      alert('Artikel opgeslagen!');
      fetchArticle(); // Reload to get updated data
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Er is een fout opgetreden bij het opslaan');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncToWordPress = async () => {
    if (!article?.wordpress_id) {
      alert('Dit artikel is nog niet gepubliceerd naar WordPress');
      return;
    }

    if (!confirm('Weet je zeker dat je de wijzigingen wilt doorvoeren in WordPress?')) {
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch('/api/wordpress/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: params.id,
          update_fields: formData,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update WordPress');
      }

      alert('Succesvol bijgewerkt in WordPress!');

      if (data.wordpress_url) {
        window.open(data.wordpress_url, '_blank');
      }
    } catch (error: any) {
      console.error('Error syncing to WordPress:', error);
      alert(error.message || 'Er is een fout opgetreden bij het synchroniseren');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">WordPress Post Bewerken</h1>
            {article?.wordpress_url && (
              <a
                href={article.wordpress_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-orange-400 hover:text-orange-300 mt-1 inline-block"
              >
                Bekijk op WordPress →
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 md:px-6 py-2 md:py-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors font-medium text-white text-sm md:text-base"
              disabled={saving || syncing}
            >
              Terug
            </button>
            <button
              onClick={handleSave}
              className="px-4 md:px-6 py-2 md:py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 text-sm md:text-base"
              disabled={saving || syncing}
            >
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
            {article?.wordpress_id && (
              <button
                onClick={handleSyncToWordPress}
                className="px-4 md:px-6 py-2 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 text-sm md:text-base"
                disabled={saving || syncing}
              >
                {syncing ? 'Synchroniseren...' : 'Sync naar WordPress'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Title */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 md:p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Titel *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 text-xl md:text-2xl font-bold bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Voer een titel in..."
              />
            </div>

            {/* Slug */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 md:p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Slug (URL)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="url-slug"
                />
              </div>
            </div>

            {/* Content with Editor Mode Toggle */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <label className="block text-sm font-medium text-gray-300">
                  Content *
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditorMode('visual')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      editorMode === 'visual'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    ✨ Visueel
                  </button>
                  <button
                    onClick={() => setEditorMode('html')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      editorMode === 'html'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
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
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                  placeholder="Schrijf je content hier... HTML tags zijn toegestaan."
                />
              )}
            </div>

            {/* Excerpt */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 md:p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Excerpt (Korte samenvatting)
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Korte samenvatting..."
              />
            </div>

            {/* SEO Optimization Section */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowSEO(!showSEO)}
                className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
              >
                <span className="font-medium text-white">🎯 SEO Optimalisatie</span>
                <svg
                  className={`w-5 h-5 transform transition-transform text-gray-400 ${showSEO ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showSEO && (
                <div className="px-4 md:px-6 pb-6 space-y-4">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={optimizeForSEO}
                      disabled={optimizing}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                    >
                      {optimizing ? 'Optimaliseren...' : '🤖 AI SEO Optimalisatie'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Focus Keyword
                    </label>
                    <input
                      type="text"
                      value={formData.focus_keyword}
                      onChange={(e) => setFormData({ ...formData, focus_keyword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Hoofd zoekwoord..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Meta Title ({formData.meta_title.length}/60)
                    </label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      maxLength={60}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="SEO title..."
                    />
                    <div className="mt-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          formData.meta_title.length > 60 ? 'bg-red-500' :
                          formData.meta_title.length > 50 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((formData.meta_title.length / 60) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Meta Description ({formData.meta_description.length}/160)
                    </label>
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      maxLength={160}
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="SEO description..."
                    />
                    <div className="mt-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          formData.meta_description.length > 160 ? 'bg-red-500' :
                          formData.meta_description.length > 140 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((formData.meta_description.length / 160) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Internal Links Section */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowLinks(!showLinks)}
                className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
              >
                <span className="font-medium text-white">🔗 Interne Links</span>
                <svg
                  className={`w-5 h-5 transform transition-transform text-gray-400 ${showLinks ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showLinks && (
                <div className="px-4 md:px-6 pb-6">
                  <p className="text-sm text-gray-400 mb-3">
                    Klik op een link om deze in je content in te voegen
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {internalLinks.map(link => (
                      <button
                        key={link.id}
                        onClick={() => insertInternalLink(link)}
                        className="w-full text-left px-3 py-2 rounded-lg border border-gray-700 hover:border-orange-500 hover:bg-orange-500/10 transition-colors text-sm"
                      >
                        <div className="font-medium text-white">{link.title}</div>
                        <div className="text-xs text-gray-400">{link.url}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Affiliate Links Section */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowAffiliate(!showAffiliate)}
                className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
              >
                <span className="font-medium text-white">💰 Affiliate Links</span>
                <svg
                  className={`w-5 h-5 transform transition-transform text-gray-400 ${showAffiliate ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showAffiliate && (
                <div className="px-4 md:px-6 pb-6">
                  <p className="text-sm text-gray-400 mb-3">
                    Geconfigureerde affiliate programma's voor dit project
                  </p>
                  {affiliateLinks.length === 0 ? (
                    <p className="text-sm text-gray-400">Geen affiliate links geconfigureerd</p>
                  ) : (
                    <div className="space-y-2">
                      {affiliateLinks.map((affiliate, i) => (
                        <div key={i} className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-800/50">
                          <div className="font-medium text-white capitalize">{affiliate.platform}</div>
                          {affiliate.site_code && (
                            <div className="text-xs text-gray-400">Site Code: {affiliate.site_code}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Featured Image */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 md:p-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
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
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center mb-3">
                  <svg className="w-12 h-12 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-400">Geen afbeelding</p>
                </div>
              )}
              <div className="space-y-2">
                <button
                  onClick={generateFeaturedImage}
                  disabled={generatingImage}
                  className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 font-medium text-sm"
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
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Of plak een URL..."
                />
              </div>
            </div>

            {/* Status */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 md:p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Gepubliceerd</option>
              </select>
            </div>

            {/* WordPress Info */}
            {article?.wordpress_id && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-orange-400 mb-2">WordPress Info</h3>
                <div className="text-xs text-gray-300 space-y-1">
                  <div>ID: {article.wordpress_id}</div>
                  {article.wordpress_url && (
                    <a
                      href={article.wordpress_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:text-orange-300 underline block truncate"
                    >
                      Bekijk post →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
