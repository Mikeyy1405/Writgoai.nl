'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Save, ArrowLeft, Eye, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!formData.title || !formData.content) return;

    const timer = setInterval(() => {
      autoSave();
    }, 30000); // 30 seconds

    return () => clearInterval(timer);
  }, [formData]);

  const autoSave = async () => {
    // For new posts, we'll save as draft first
    if (!formData.title || !formData.content) return;

    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
          status: 'draft',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastSaved(new Date());
        // Redirect to edit page after first save
        if (data.post?.id) {
          router.replace(`/dashboard/agency/blog/posts/${data.post.id}`);
        }
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
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }

      const data = await res.json();
      toast.success(
        status === 'published' ? 'Post gepubliceerd!' : 'Post opgeslagen!'
      );
      router.push('/dashboard/agency/blog/posts');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b sticky top-0 z-10">
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
                <h1 className="text-2xl font-bold">Nieuwe Blog Post</h1>
                {lastSaved && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Laatst opgeslagen: {lastSaved.toLocaleTimeString('nl-NL')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
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
                disabled={saving || !formData.title}
              >
                <Save className="w-4 h-4 mr-2" />
                Opslaan
              </Button>

              <Button
                onClick={(e) => handleSubmit(e, 'published')}
                disabled={saving || !formData.title || !formData.content}
                className="bg-gradient-to-r from-[#FF9933] to-[#FFAD33]"
              >
                Publiceren
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
          </div>

          {/* SEO Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <SEOSidebar
                data={{
                  title: formData.title,
                  content: formData.content,
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
