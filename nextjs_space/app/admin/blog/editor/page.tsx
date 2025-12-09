'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Save, Eye, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { BlockEditor } from '@/components/blog/block-editor';
import { SEOPanel } from '@/components/blog/seo-panel';
import { SocialPreview } from '@/components/blog/social-preview';
import { PublishingPanel } from '@/components/blog/publishing-panel';

interface BlogPostData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription: string;
  focusKeyword: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  category: string;
  tags: string[];
  status: string;
  publishedAt?: string;
  scheduledFor?: Date;
  authorName: string;
  readingTimeMinutes: number;
}

export default function BlogEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams?.get('id');
  
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);

  const [formData, setFormData] = useState<BlogPostData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    ogTitle: '',
    ogDescription: '',
    twitterTitle: '',
    twitterDescription: '',
    category: 'AI & Content Marketing',
    tags: [],
    status: 'draft',
    authorName: 'WritgoAI Team',
    readingTimeMinutes: 5,
  });

  // Load existing post if editing
  useEffect(() => {
    if (postId) {
      fetchPost(postId);
    }
  }, [postId]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!postId && formData.title && !formData.slug) {
      const { generateSlug } = require('@/lib/blog-utils');
      const slug = generateSlug(formData.title);
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title, postId]);

  // Auto-save every 60 seconds
  useEffect(() => {
    if (!postId) return; // Only autosave existing posts

    const autoSaveInterval = setInterval(async () => {
      if (formData.title && formData.content) {
        await handleAutoSave();
      }
    }, 60000); // 60 seconds

    return () => clearInterval(autoSaveInterval);
  }, [postId, formData]);

  const fetchPost = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/blog/${id}`);
      if (!res.ok) throw new Error('Post niet gevonden');
      
      const data = await res.json();
      setFormData({
        id: data.post.id,
        title: data.post.title,
        slug: data.post.slug,
        excerpt: data.post.excerpt,
        content: data.post.content,
        featuredImage: data.post.featuredImage || '',
        metaTitle: data.post.metaTitle || '',
        metaDescription: data.post.metaDescription || '',
        focusKeyword: data.post.focusKeyword || '',
        ogTitle: data.post.ogTitle || '',
        ogDescription: data.post.ogDescription || '',
        twitterTitle: data.post.twitterTitle || '',
        twitterDescription: data.post.twitterDescription || '',
        category: data.post.category,
        tags: data.post.tags || [],
        status: data.post.status,
        publishedAt: data.post.publishedAt,
        scheduledFor: data.post.scheduledFor ? new Date(data.post.scheduledFor) : undefined,
        authorName: data.post.authorName,
        readingTimeMinutes: data.post.readingTimeMinutes,
      });
    } catch (error: any) {
      toast.error(error.message || 'Fout bij laden van post');
      router.push('/admin/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!postId) return;
    
    setAutoSaving(true);
    try {
      const res = await fetch('/api/admin/blog/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
        }),
      });

      if (res.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Autosave error:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Titel, slug en content zijn verplicht');
      return;
    }

    setSaving(true);
    try {
      const url = postId ? `/api/admin/blog/${postId}` : '/api/admin/blog';
      const method = postId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Fout bij opslaan');
      }

      const data = await res.json();
      setLastSaved(new Date());
      toast.success(postId ? 'Post bijgewerkt!' : 'Post aangemaakt!');
      
      if (!postId && data.post?.id) {
        // Navigate to editor with the new post ID
        router.push(`/admin/blog/editor?id=${data.post.id}`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Titel, slug en content zijn verplicht');
      return;
    }

    setPublishing(true);
    try {
      // First save the post
      const url = postId ? `/api/admin/blog/${postId}` : '/api/admin/blog';
      const method = postId ? 'PUT' : 'POST';

      const publishData = {
        ...formData,
        status: formData.status === 'scheduled' ? 'scheduled' : 'published',
        publishedAt: formData.status !== 'scheduled' ? new Date().toISOString() : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Fout bij publiceren');
      }

      const data = await res.json();
      toast.success(formData.status === 'scheduled' ? 'Post ingepland!' : 'Post gepubliceerd!');
      
      if (!postId && data.post?.id) {
        router.push(`/admin/blog/editor?id=${data.post.id}`);
      } else {
        setFormData((prev) => ({ ...prev, status: publishData.status }));
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPublishing(false);
    }
  };

  const handlePreview = () => {
    if (formData.slug) {
      window.open(`/${formData.slug}?preview=true`, '_blank');
    } else {
      toast.error('Stel eerst een slug in');
    }
  };

  const handlePublishToWordPress = async () => {
    if (!postId) {
      toast.error('Sla de post eerst op');
      return;
    }

    const loadingToast = toast.loading('Publiceren naar WordPress...');
    try {
      const res = await fetch('/api/admin/blog/publish-wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'WordPress publicatie mislukt');
      }

      toast.success('Succesvol gepubliceerd naar WordPress!', { id: loadingToast });
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  const updateField = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/blog')}
                className="text-gray-400 hover:text-white shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
              
              <div className="flex-1 max-w-2xl">
                <Input
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Voer een titel in..."
                  className="text-xl font-bold bg-transparent border-none text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {lastSaved && (
                <span className="text-xs text-gray-500 hidden sm:block">
                  {autoSaving ? 'Opslaan...' : `Opgeslagen ${new Date(lastSaved).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              )}
              
              <Button
                onClick={handlePreview}
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hidden sm:flex"
              >
                <Eye className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Voorbeeld</span>
              </Button>

              <Button
                onClick={handleSave}
                disabled={saving}
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Save className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Opslaan</span>
                  </>
                )}
              </Button>

              <Button
                onClick={handlePublish}
                disabled={publishing}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                {publishing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <span>{formData.status === 'published' ? 'Bijwerken' : 'Publiceren'}</span>
                )}
              </Button>
            </div>
          </div>

          {/* Warning if required fields missing */}
          {(!formData.title || !formData.slug || !formData.content) && (
            <div className="mt-3 flex items-center gap-2 text-yellow-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Vul titel, slug en content in om te kunnen publiceren</span>
            </div>
          )}
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Main Editor (60%) */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-6">
            <Card className="p-6 bg-gray-800/30 border-gray-700">
              <BlockEditor
                content={formData.content}
                onChange={(content) => updateField('content', content)}
                placeholder="Schrijf je artikel hier..."
              />
            </Card>

            {/* Excerpt */}
            <Card className="p-4 bg-gray-800/30 border-gray-700">
              <h3 className="font-semibold text-white mb-3">Excerpt (Samenvatting)</h3>
              <textarea
                value={formData.excerpt}
                onChange={(e) => updateField('excerpt', e.target.value)}
                placeholder="Korte samenvatting van je artikel..."
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </Card>
          </div>

          {/* Middle Column - SEO & Social (25%) */}
          <div className="lg:col-span-3 xl:col-span-3 space-y-6">
            <SEOPanel
              data={{
                title: formData.title,
                content: formData.content,
                metaTitle: formData.metaTitle,
                metaDescription: formData.metaDescription,
                focusKeyword: formData.focusKeyword,
                slug: formData.slug,
              }}
              onChange={updateField}
            />

            <SocialPreview
              title={formData.title}
              metaDescription={formData.metaDescription}
              slug={formData.slug}
              featuredImage={formData.featuredImage}
              ogTitle={formData.ogTitle}
              ogDescription={formData.ogDescription}
              twitterTitle={formData.twitterTitle}
              twitterDescription={formData.twitterDescription}
              onOgChange={(field, value) => updateField(field, value)}
              onTwitterChange={(field, value) => updateField(field, value)}
            />
          </div>

          {/* Right Column - Publishing (15%) */}
          <div className="lg:col-span-2 xl:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              <PublishingPanel
                status={formData.status}
                category={formData.category}
                tags={formData.tags}
                featuredImage={formData.featuredImage}
                authorName={formData.authorName}
                slug={formData.slug}
                scheduledFor={formData.scheduledFor}
                onStatusChange={(status) => updateField('status', status)}
                onCategoryChange={(category) => updateField('category', category)}
                onTagsChange={(tags) => updateField('tags', tags)}
                onFeaturedImageChange={(url) => updateField('featuredImage', url)}
                onAuthorChange={(author) => updateField('authorName', author)}
                onSlugChange={(slug) => updateField('slug', slug)}
                onScheduledChange={(date) => updateField('scheduledFor', date)}
                onPreview={handlePreview}
                onSave={handleSave}
                onPublish={handlePublish}
                onPublishToWordPress={postId && formData.status === 'published' ? handlePublishToWordPress : undefined}
                saving={saving}
                publishing={publishing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
