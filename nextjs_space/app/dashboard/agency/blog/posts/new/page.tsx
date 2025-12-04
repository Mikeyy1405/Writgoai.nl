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
import { AIBlogGenerator } from '@/components/blog/ai-blog-generator';
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

  const handleAIGenerate = (data: {
    title: string;
    excerpt: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      focusKeyword: data.focusKeyword,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/agency/blog/posts')}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Nieuwe Blog Post</h1>
                {lastSaved && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
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
                <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="draft" className="text-white hover:bg-gray-700">Concept</SelectItem>
                  <SelectItem value="published" className="text-white hover:bg-gray-700">Gepubliceerd</SelectItem>
                  <SelectItem value="scheduled" className="text-white hover:bg-gray-700">Gepland</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={saving || !formData.title}
                className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <Save className="w-4 h-4 mr-2" />
                Opslaan
              </Button>

              <Button
                onClick={(e) => handleSubmit(e, 'published')}
                disabled={saving || !formData.title || !formData.content}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20"
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
            {/* AI Generator - Prominently placed at the top */}
            <AIBlogGenerator onGenerate={handleAIGenerate} />
            {/* Title */}
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <Input
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Post titel..."
                className="text-3xl font-bold border-none focus-visible:ring-0 px-0 bg-transparent text-white placeholder:text-gray-500"
              />
            </Card>

            {/* Excerpt */}
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <Label className="text-gray-300">Excerpt (Samenvatting)</Label>
              <Input
                value={formData.excerpt}
                onChange={(e) => updateField('excerpt', e.target.value)}
                placeholder="Korte samenvatting van de post..."
                className="mt-2 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
              />
            </Card>

            {/* Rich Text Editor */}
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <Label className="mb-4 block text-gray-300">Content</Label>
              <BlogEditor
                content={formData.content}
                onChange={(content) => updateField('content', content)}
                placeholder="Schrijf je blog post..."
              />
            </Card>

            {/* Additional Settings */}
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <h3 className="font-semibold mb-4 text-white">Instellingen</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Categorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => updateField('category', value)}
                  >
                    <SelectTrigger className="mt-2 bg-gray-900 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="AI & Content Marketing" className="text-white hover:bg-gray-700">
                        AI & Content Marketing
                      </SelectItem>
                      <SelectItem value="SEO & Ranking" className="text-white hover:bg-gray-700">SEO & Ranking</SelectItem>
                      <SelectItem value="WordPress Tips" className="text-white hover:bg-gray-700">WordPress Tips</SelectItem>
                      <SelectItem value="Automatisering" className="text-white hover:bg-gray-700">Automatisering</SelectItem>
                      <SelectItem value="Nieuws & Updates" className="text-white hover:bg-gray-700">
                        Nieuws & Updates
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300">Tags (komma gescheiden)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => updateField('tags', e.target.value)}
                    placeholder="AI, content, SEO"
                    className="mt-2 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-gray-300">Featured Image URL (optioneel)</Label>
                  <Input
                    value={formData.featuredImage}
                    onChange={(e) => updateField('featuredImage', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="mt-2 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
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
