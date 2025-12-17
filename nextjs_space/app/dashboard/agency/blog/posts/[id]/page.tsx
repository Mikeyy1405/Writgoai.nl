'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BlogEditor } from '@/components/blog/blog-editor';
import { SEOSidebar } from '@/components/blog/seo-sidebar';
import { Save, ArrowLeft, Eye, Clock, History } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [post, setPost] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    category: 'AI & Content Marketing',
    tags: '',
    status: 'draft',
    readingTimeMinutes: 5,
  });

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!post || !formData.title || !formData.content) return;

    const timer = setInterval(() => {
      autoSave();
    }, 30000);

    return () => clearInterval(timer);
  }, [formData, post]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/admin/blog/${postId}`);
      if (!res.ok) throw new Error('Post not found');
      const data = await res.json();
      setPost(data.post);
      setFormData({
        title: data.post.title,
        slug: data.post.slug,
        excerpt: data.post.excerpt,
        content: data.post.content,
        featuredImage: data.post.featuredImage || '',
        metaTitle: data.post.metaTitle || '',
        metaDescription: data.post.metaDescription || '',
        focusKeyword: data.post.focusKeyword || '',
        category: data.post.category,
        tags: data.post.tags.join(', '),
        status: data.post.status,
        readingTimeMinutes: data.post.readingTimeMinutes,
      });
    } catch (error) {
      toast.error('Post niet gevonden');
      router.push('/dashboard/agency/blog/posts');
    } finally {
      setLoading(false);
    }
  };

  const autoSave = async () => {
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
      console.error('Auto-save failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status?: string) => {
    e.preventDefault();
    setSaving(true);

    const postData = {
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      status: status || formData.status,
    };

    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast.success(
        status === 'published' ? 'Post gepubliceerd!' : 'Post opgeslagen!'
      );
      fetchPost(); // Refresh the post data
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933]"></div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-slate-900 dark:bg-zinc-900 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/agency/blog/posts')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Post Bewerken</h1>
                {lastSaved && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Laatst opgeslagen: {lastSaved.toLocaleTimeString('nl-NL')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {post.status === 'published' && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Bekijken
                </Button>
              )}

              <Select
                value={formData.status}
                onValueChange={(value) => updateField('status', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Concept</SelectItem>
                  <SelectItem value="published">Gepubliceerd</SelectItem>
                  <SelectItem value="scheduled">Gepland</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                Opslaan
              </Button>

              <Button
                onClick={(e) => handleSubmit(e, 'published')}
                disabled={saving}
                className="bg-gradient-to-r from-[#FF9933] to-[#FFAD33]"
              >
                {post.status === 'published' ? 'Bijwerken' : 'Publiceren'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Card className="p-6">
              <Input
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Post titel..."
                className="text-3xl font-bold border-none focus-visible:ring-0 px-0"
              />
            </Card>

            {/* Excerpt */}
            <Card className="p-6">
              <Label>Excerpt (Samenvatting)</Label>
              <Input
                value={formData.excerpt}
                onChange={(e) => updateField('excerpt', e.target.value)}
                placeholder="Korte samenvatting van de post..."
                className="mt-2"
              />
            </Card>

            {/* Rich Text Editor */}
            <Card className="p-6">
              <Label className="mb-4 block">Content</Label>
              <BlogEditor
                content={formData.content}
                onChange={(content) => updateField('content', content)}
                placeholder="Schrijf je blog post..."
              />
            </Card>

            {/* Additional Settings */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Instellingen</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => updateField('category', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AI & Content Marketing">
                        AI & Content Marketing
                      </SelectItem>
                      <SelectItem value="SEO & Ranking">SEO & Ranking</SelectItem>
                      <SelectItem value="WordPress Tips">WordPress Tips</SelectItem>
                      <SelectItem value="Automatisering">Automatisering</SelectItem>
                      <SelectItem value="Nieuws & Updates">
                        Nieuws & Updates
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tags (komma gescheiden)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => updateField('tags', e.target.value)}
                    placeholder="AI, content, SEO"
                    className="mt-2"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Featured Image URL (optioneel)</Label>
                  <Input
                    value={formData.featuredImage}
                    onChange={(e) => updateField('featuredImage', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>

            {/* Version History */}
            <Card className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <History className="w-5 h-5" />
                Versie Geschiedenis
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatische versie opslag bij elke auto-save
              </p>
            </Card>
          </div>

          {/* SEO Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <SEOSidebar
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
