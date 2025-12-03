
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, Sparkles, Save, X, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  category: string;
  tags: string[];
  status: string;
  publishedAt?: string;
  createdAt: string;
  views: number;
  readingTimeMinutes: number;
  language?: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [generating, setGenerating] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const router = useRouter();

  // Form state
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

  // AI Generator state
  const [aiConfig, setAiConfig] = useState({
    topic: '',
    keywords: '',
    tone: 'professioneel',
    targetAudience: 'content marketeers en bloggers',
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/blog');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      toast.error('Fout bij ophalen posts');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiConfig.topic) {
      toast.error('Voer een onderwerp in');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiConfig),
      });

      if (!res.ok) throw new Error('Generatie mislukt');

      const data = await res.json();
      setFormData({
        ...formData,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        focusKeyword: data.focusKeyword,
        readingTimeMinutes: data.readingTimeMinutes,
      });

      toast.success('✨ Blog post gegenereerd met WritgoAI!');
      setShowForm(true);
    } catch (error) {
      toast.error('Fout bij genereren');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const postData = {
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    try {
      const url = editingPost
        ? `/api/admin/blog/${editingPost.id}`
        : '/api/admin/blog';
      const method = editingPost ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Fout bij opslaan');
      }

      toast.success(editingPost ? 'Post bijgewerkt!' : 'Post aangemaakt!');
      setShowForm(false);
      setEditingPost(null);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featuredImage: post.featuredImage || '',
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      focusKeyword: post.focusKeyword || '',
      category: post.category,
      tags: post.tags.join(', '),
      status: post.status,
      readingTimeMinutes: post.readingTimeMinutes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze post wilt verwijderen?')) return;

    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Verwijderen mislukt');
      toast.success('Post verwijderd');
      fetchPosts();
    } catch (error) {
      toast.error('Fout bij verwijderen');
    }
  };

  const handleTranslate = async (postId: string) => {
    if (!confirm('Deze post wordt automatisch vertaald naar alle andere talen (Nederlands, Engels, Duits). Dit kost ongeveer 1-2 minuten. Doorgaan?')) {
      return;
    }

    setTranslating(postId);
    const loadingToast = toast.loading('Vertalen naar 3 talen... Dit kan even duren.');

    try {
      const res = await fetch('/api/admin/blog/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Vertaling mislukt');
      }

      toast.success(data.message || 'Post succesvol vertaald!', { id: loadingToast });
      fetchPosts(); // Refresh de lijst om de nieuwe vertalingen te tonen
    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error(error.message || 'Fout bij vertalen van post', { id: loadingToast });
    } finally {
      setTranslating(null);
    }
  };

  const resetForm = () => {
    setFormData({
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
    setAiConfig({
      topic: '',
      keywords: '',
      tone: 'professioneel',
      targetAudience: 'content marketeers en bloggers',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      draft: 'bg-gray-500',
      published: 'bg-green-500',
      scheduled: 'bg-blue-500',
    };
    return <Badge className={colors[status] || 'bg-gray-500'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Blog Management
            </h1>
            <p className="text-gray-300 mt-2">
              Beheer Writgo.nl blog posts voor SEO ranking
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingPost(null);
                resetForm();
              }}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Post
            </Button>
          )}
        </div>

        {/* AI Generator Sectie */}
        {!showForm && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-purple-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-4">
                  ✨ Genereer met WritgoAI
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Onderwerp *</Label>
                    <Input
                      value={aiConfig.topic}
                      onChange={(e) =>
                        setAiConfig({ ...aiConfig, topic: e.target.value })
                      }
                      placeholder="Bijv: AI voor content marketing"
                    />
                  </div>
                  <div>
                    <Label>Keywords (optioneel)</Label>
                    <Input
                      value={aiConfig.keywords}
                      onChange={(e) =>
                        setAiConfig({ ...aiConfig, keywords: e.target.value })
                      }
                      placeholder="Bijv: AI, content, automatisering"
                    />
                  </div>
                  <div>
                    <Label>Tone</Label>
                    <Select
                      value={aiConfig.tone}
                      onValueChange={(value) =>
                        setAiConfig({ ...aiConfig, tone: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professioneel">Professioneel</SelectItem>
                        <SelectItem value="vriendelijk">Vriendelijk</SelectItem>
                        <SelectItem value="educatief">Educatief</SelectItem>
                        <SelectItem value="enthousiast">Enthousiast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Doelgroep</Label>
                    <Input
                      value={aiConfig.targetAudience}
                      onChange={(e) =>
                        setAiConfig({
                          ...aiConfig,
                          targetAudience: e.target.value,
                        })
                      }
                      placeholder="Bijv: content marketeers"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleGenerateWithAI}
                  disabled={generating || !aiConfig.topic}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Genereer Complete Blog Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Form */}
        {showForm && (
          <Card className="p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {editingPost ? 'Post Bewerken' : 'Nieuwe Post'}
              </h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setEditingPost(null);
                  resetForm();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basis Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Titel *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Slug *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <Label>Excerpt (samenvatting) *</Label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>

              {/* Content */}
              <div>
                <Label>Content (HTML) *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
              </div>

              {/* SEO Velden */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, metaTitle: e.target.value })
                    }
                    placeholder="Max 60 karakters"
                    maxLength={60}
                  />
                </div>
                <div>
                  <Label>Focus Keyword</Label>
                  <Input
                    value={formData.focusKeyword}
                    onChange={(e) =>
                      setFormData({ ...formData, focusKeyword: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Meta Description</Label>
                <Textarea
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metaDescription: e.target.value,
                    })
                  }
                  placeholder="Max 155 karakters"
                  maxLength={155}
                  rows={2}
                />
              </div>

              {/* Categorisatie */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Categorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
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
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="AI, content, SEO"
                  />
                </div>
                <div>
                  <Label>Leestijd (minuten)</Label>
                  <Input
                    type="number"
                    value={formData.readingTimeMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        readingTimeMinutes: parseInt(e.target.value) || 5,
                      })
                    }
                    min={1}
                  />
                </div>
              </div>

              {/* Featured Image */}
              <div>
                <Label>Featured Image URL (optioneel)</Label>
                <Input
                  value={formData.featuredImage}
                  onChange={(e) =>
                    setFormData({ ...formData, featuredImage: e.target.value })
                  }
                  placeholder="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjDU93PgBRwTKtXZ6shwj-kgADgmOurCjfGc4GL0NzqoTnE6sbFsLV7USkQGLJSSgjWCfwvP9byitLLxb93th4Pz4kDaWJud49LhbUsu1dkTZuUqk_avDeAy1MTzCo5JKisIvIP-BIj154e/s1600/opera11ValidatesNumericForNumberTooHigh.png"
                />
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingPost ? 'Bijwerken' : 'Opslaan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPost(null);
                    resetForm();
                  }}
                >
                  Annuleren
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Posts Lijst */}
        {!showForm && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Nog geen blog posts. Start met AI generatie of maak handmatig een post!
                </p>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{post.title}</h3>
                        {getStatusBadge(post.status)}
                        {post.language && (
                          <Badge variant="outline" className="text-xs">
                            {post.language === 'NL' && '🇳🇱 NL'}
                            {post.language === 'EN' && '🇬🇧 EN'}
                            {post.language === 'DE' && '🇩🇪 DE'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        /{post.slug}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {post.excerpt}
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>📂 {post.category}</span>
                        <span>•</span>
                        <span>⏱️ {post.readingTimeMinutes} min</span>
                        <span>•</span>
                        <span>👁️ {post.views} views</span>
                        {post.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <span>🏷️ {post.tags.join(', ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {post.status === 'published' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(`/${post.slug}`, '_blank')
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTranslate(post.id)}
                        disabled={translating === post.id}
                        className="text-blue-600 hover:text-blue-700"
                        title="Vertaal naar alle 3 talen"
                      >
                        {translating === post.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
