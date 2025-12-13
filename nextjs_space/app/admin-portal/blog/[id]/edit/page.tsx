'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BlogEditor } from '@/components/blog/blog-editor';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'AI & Content Marketing',
  'SEO & Ranking',
  'WordPress Tips',
  'Automatisering',
  'Nieuws & Updates',
];

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  category: string;
  tags: string[] | string;
  meta_title: string;
  meta_description: string;
  status: 'draft' | 'published';
  published_at?: string;
}

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<BlogPost>>({});

  useEffect(() => {
    if (params?.id) {
      fetchPost(params.id as string);
    }
  }, [params?.id]);

  const fetchPost = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/id/${id}`);
      if (!res.ok) {
        throw new Error('Post niet gevonden');
      }
      const { post } = await res.json();
      setFormData(post);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Fout bij ophalen blogpost');
      router.push('/admin-portal/blog');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
    }));
  };

  const handleSave = async (status?: 'draft' | 'published') => {
    // Validation
    if (!formData.title || !formData.slug) {
      toast.error('Titel en slug zijn verplicht');
      return;
    }

    if (!formData.content) {
      toast.error('Content is verplicht');
      return;
    }

    setSaving(true);
    try {
      const tags = typeof formData.tags === 'string'
        ? formData.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
        : formData.tags || [];

      const res = await fetch(`/api/blog/id/${params?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags,
          status: status || formData.status,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast.success('Blogpost bijgewerkt!');
      router.push('/admin-portal/blog');
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast.error(error.message || 'Fout bij opslaan blogpost');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const tagsString = Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags || '';

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin-portal/blog">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Blogpost Bewerken</h1>
              <p className="text-gray-400">{formData.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="border-zinc-700 text-gray-300 hover:border-orange-500 hover:text-white"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Opslaan als Concept
            </Button>
            <Button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Publiceren
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Slug */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Basis Informatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-gray-300">
                    Titel *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Vul de titel in..."
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="slug" className="text-gray-300">
                    Slug *
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="blog-post-slug"
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    URL: /blog/{formData.slug || 'slug'}
                  </p>
                </div>
                <div>
                  <Label htmlFor="excerpt" className="text-gray-300">
                    Samenvatting
                  </Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
                    }
                    placeholder="Korte samenvatting van de post..."
                    rows={3}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Content *</CardTitle>
              </CardHeader>
              <CardContent>
                <BlogEditor
                  content={formData.content || ''}
                  onChange={(content) =>
                    setFormData((prev) => ({ ...prev, content }))
                  }
                  placeholder="Begin met typen..."
                />
              </CardContent>
            </Card>

            {/* SEO */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">SEO Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meta_title" className="text-gray-300">
                    SEO Titel
                  </Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, meta_title: e.target.value }))
                    }
                    placeholder="SEO geoptimaliseerde titel..."
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="meta_description" className="text-gray-300">
                    SEO Beschrijving
                  </Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        meta_description: e.target.value,
                      }))
                    }
                    placeholder="SEO beschrijving voor zoekmachines..."
                    rows={3}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Image */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  Uitgelichte Afbeelding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={formData.featured_image || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, featured_image: e.target.value }))
                  }
                  placeholder="https://example.com/image.jpg"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
                {formData.featured_image && (
                  <div className="mt-3 relative aspect-video bg-zinc-900 rounded-lg overflow-hidden">
                    <img
                      src={formData.featured_image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Categorie</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.category || ''}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue placeholder="Selecteer categorie" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {CATEGORIES.map((cat) => (
                      <SelectItem
                        key={cat}
                        value={cat}
                        className="text-gray-300 hover:bg-zinc-700"
                      >
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={tagsString}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  placeholder="ai, content, marketing"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Scheid tags met komma's
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
