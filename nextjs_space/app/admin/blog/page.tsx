'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Sparkles, 
  Save, 
  X, 
  Globe, 
  FileEdit, 
  TrendingUp,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  Calendar,
  Clock,
  ListTree
} from 'lucide-react';
import toast from 'react-hot-toast';
import ContentPlanGenerator from '@/components/blog/ContentPlanGenerator';
import WebsiteBasedTopicalMapGenerator from '@/components/blog/WebsiteBasedTopicalMapGenerator';

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
  const [view, setView] = useState<'list' | 'new' | 'ai-generate' | 'content-plan' | 'website-topical-map'>('list');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [generating, setGenerating] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
      setView('new');
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
      setView('list');
      setEditingPost(null);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (post: BlogPost) => {
    // Navigate to new editor
    router.push(`/admin/blog/editor?id=${post.id}`);
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
      fetchPosts();
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

  const getStatusColor = (status: string) => {
    const colors: any = {
      draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      published: 'bg-green-500/20 text-green-300 border-green-500/30',
      scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
    return colors[status] || colors.draft;
  };

  // Filter posts based on search and status
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-orange-500/20 border border-orange-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-500 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <FileEdit className="w-5 h-5 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Blog Management
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Blog Management
            </h1>
            <p className="text-gray-300 text-base sm:text-lg">
              Beheer Writgo.nl blog posts voor SEO ranking
            </p>
          </div>
        </div>

        {/* View: List */}
        {view === 'list' && (
          <>
            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 px-2">Snelle Acties</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Website-Based Topical Map (NIEUW!) */}
                <button
                  onClick={() => setView('website-topical-map')}
                  className="group relative bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border-2 border-cyan-500/50 hover:border-cyan-400/70 rounded-xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[120px] flex items-center gap-4 text-left"
                >
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-cyan-500/30 text-cyan-300 border-cyan-500/50 text-xs">
                      ✨ NIEUW
                    </Badge>
                  </div>
                  <div className="p-3 bg-cyan-500/20 rounded-xl group-hover:bg-cyan-500/30 transition-colors">
                    <Globe className="w-7 h-7 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-lg mb-1">Website Topical Map</h3>
                    <p className="text-sm text-gray-400">Analyseer website + genereer topical map</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                </button>
                
                {/* AI Contentplan Generator */}
                <button
                  onClick={() => setView('content-plan')}
                  className="group relative bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 hover:border-blue-400/50 rounded-xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[120px] flex items-center gap-4 text-left"
                >
                  <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                    <ListTree className="w-7 h-7 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-lg mb-1">AI Contentplan</h3>
                    <p className="text-sm text-gray-400">Genereer compleet contentplan + blogs</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </button>
                
                {/* AI Genereren */}
                <button
                  onClick={() => setView('ai-generate')}
                  className="group relative bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 hover:border-purple-400/50 rounded-xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[120px] flex items-center gap-4 text-left"
                >
                  <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                    <Sparkles className="w-7 h-7 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-lg mb-1">AI Genereren</h3>
                    <p className="text-sm text-gray-400">Genereer complete blog post met AI</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
                </button>

                {/* Nieuw Artikel (Geavanceerd) */}
                <button
                  onClick={() => router.push('/admin/blog/editor')}
                  className="group relative bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 hover:border-orange-400/50 rounded-xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[120px] flex items-center gap-4 text-left"
                >
                  <div className="p-3 bg-orange-500/20 rounded-xl group-hover:bg-orange-500/30 transition-colors">
                    <FileEdit className="w-7 h-7 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-lg mb-1">Nieuw Artikel</h3>
                    <p className="text-sm text-gray-400">Geavanceerde editor met SEO tools</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-orange-400 transition-colors" />
                </button>

              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Zoek posts..."
                    className="pl-10 bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <SelectValue placeholder="Filter status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statussen</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span>📝 {posts.length} totaal</span>
                <span>•</span>
                <span>✅ {posts.filter(p => p.status === 'published').length} gepubliceerd</span>
                <span>•</span>
                <span>📄 {posts.filter(p => p.status === 'draft').length} drafts</span>
              </div>
            </div>

            {/* Posts Grid */}
            {filteredPosts.length === 0 ? (
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-12 text-center">
                  <FileEdit className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Geen posts gevonden met deze filters' 
                      : 'Nog geen blog posts'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Probeer een andere zoekterm of filter'
                      : 'Start met AI generatie of maak handmatig een post!'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 transition-colors">
                    <CardContent className="p-6">
                      {/* Mobile: Stack everything vertically */}
                      <div className="space-y-4">
                        {/* Title & Status */}
                        <div>
                          <div className="flex items-start gap-3 mb-2 flex-wrap">
                            <h3 className="text-xl font-semibold text-white flex-1 min-w-0">
                              {post.title}
                            </h3>
                            <Badge className={`${getStatusColor(post.status)} border text-xs whitespace-nowrap`}>
                              {post.status}
                            </Badge>
                            {post.language && (
                              <Badge variant="outline" className="text-xs border-zinc-600 whitespace-nowrap">
                                {post.language === 'NL' && '🇳🇱 NL'}
                                {post.language === 'EN' && '🇬🇧 EN'}
                                {post.language === 'DE' && '🇩🇪 DE'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-500 text-sm mb-2">
                            /{post.slug}
                          </p>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>

                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {post.category}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {post.readingTimeMinutes} min
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.views} views
                          </span>
                          {post.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="truncate">
                                🏷️ {post.tags.join(', ')}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Actions - Large Touch Targets */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {post.status === 'published' && (
                            <Button
                              size="lg"
                              variant="outline"
                              onClick={() => window.open(`/${post.slug}`, '_blank')}
                              className="border-zinc-700 hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-400 h-12"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Bekijken
                            </Button>
                          )}
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => handleTranslate(post.id)}
                            disabled={translating === post.id}
                            className="border-zinc-700 hover:border-green-500/50 hover:bg-green-500/10 text-green-400 h-12"
                          >
                            {translating === post.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Globe className="w-4 h-4 mr-2" />
                            )}
                            Vertaal
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => handleEdit(post)}
                            className="border-zinc-700 hover:border-orange-500/50 hover:bg-orange-500/10 text-orange-400 h-12"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Bewerken
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => handleDelete(post.id)}
                            className="border-zinc-700 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 h-12"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Verwijder
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* View: AI Generate */}
        {view === 'ai-generate' && (
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="border-b border-zinc-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-white flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  AI Blog Generator
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setView('list');
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Info Banner */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-300 mb-1">
                    Genereer volledige blog post met AI
                  </p>
                  <p className="text-sm text-gray-400">
                    Vul onderstaande velden in en laat WritgoAI een complete, SEO-geoptimaliseerde blog post voor je schrijven.
                  </p>
                </div>
              </div>

              {/* AI Configuration Form */}
              <div className="space-y-6">
                <div>
                  <Label htmlFor="topic" className="text-white text-base mb-2 block">
                    Onderwerp *
                  </Label>
                  <Input
                    id="topic"
                    value={aiConfig.topic}
                    onChange={(e) => setAiConfig({ ...aiConfig, topic: e.target.value })}
                    placeholder="Bijv: AI voor content marketing"
                    className="bg-zinc-900 border-zinc-700 text-white h-14 text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="keywords" className="text-white text-base mb-2 block">
                    Keywords (optioneel)
                  </Label>
                  <Input
                    id="keywords"
                    value={aiConfig.keywords}
                    onChange={(e) => setAiConfig({ ...aiConfig, keywords: e.target.value })}
                    placeholder="Bijv: AI, content, automatisering"
                    className="bg-zinc-900 border-zinc-700 text-white h-14 text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="tone" className="text-white text-base mb-2 block">
                    Tone
                  </Label>
                  <Select
                    value={aiConfig.tone}
                    onValueChange={(value) => setAiConfig({ ...aiConfig, tone: value })}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-14 text-base">
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
                  <Label htmlFor="audience" className="text-white text-base mb-2 block">
                    Doelgroep
                  </Label>
                  <Input
                    id="audience"
                    value={aiConfig.targetAudience}
                    onChange={(e) => setAiConfig({ ...aiConfig, targetAudience: e.target.value })}
                    placeholder="Bijv: content marketeers en bloggers"
                    className="bg-zinc-900 border-zinc-700 text-white h-14 text-base"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleGenerateWithAI}
                  disabled={generating || !aiConfig.topic}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-14 text-base flex-1"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Genereer Complete Blog Post
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setView('list')}
                  className="border-zinc-700 text-gray-300 hover:bg-zinc-700 h-14 text-base sm:w-32"
                >
                  Annuleren
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View: Website-Based Topical Map */}
        {view === 'website-topical-map' && (
          <div className="space-y-6">
            {/* Header with back button */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <Globe className="w-6 h-6 text-cyan-400" />
                    Website-Based Topical Map Generator
                  </CardTitle>
                  <Button
                    variant="ghost"
                    onClick={() => setView('list')}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Website-Based Topical Map Generator Component */}
            <WebsiteBasedTopicalMapGenerator
              onComplete={() => {
                setView('list');
                fetchPosts();
              }}
            />
          </div>
        )}

        {/* View: Content Plan Generator */}
        {view === 'content-plan' && (
          <div className="space-y-6">
            {/* Header with back button */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <ListTree className="w-6 h-6 text-blue-400" />
                    AI Contentplan Generator
                  </CardTitle>
                  <Button
                    variant="ghost"
                    onClick={() => setView('list')}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Content Plan Generator Component */}
            <ContentPlanGenerator
              onComplete={() => {
                setView('list');
                fetchPosts();
              }}
            />
          </div>
        )}

        {/* View: New/Edit Post */}
        {view === 'new' && (
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="border-b border-zinc-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-white">
                  {editingPost ? 'Post Bewerken' : 'Nieuwe Post'}
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setView('list');
                    setEditingPost(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-white text-base mb-2 block">
                      Titel *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="bg-zinc-900 border-zinc-700 text-white h-14 text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug" className="text-white text-base mb-2 block">
                      Slug *
                    </Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      className="bg-zinc-900 border-zinc-700 text-white h-14 text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="excerpt" className="text-white text-base mb-2 block">
                      Excerpt (samenvatting) *
                    </Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={4}
                      required
                      className="bg-zinc-900 border-zinc-700 text-white text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content" className="text-white text-base mb-2 block">
                      Content (HTML) *
                    </Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={15}
                      className="bg-zinc-900 border-zinc-700 text-white font-mono text-sm"
                      required
                    />
                  </div>
                </div>

                {/* SEO Section */}
                <div className="space-y-4 pt-6 border-t border-zinc-700">
                  <h3 className="text-lg font-semibold text-white">SEO Instellingen</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="metaTitle" className="text-white text-sm mb-2 block">
                        Meta Title
                      </Label>
                      <Input
                        id="metaTitle"
                        value={formData.metaTitle}
                        onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                        placeholder="Max 60 karakters"
                        maxLength={60}
                        className="bg-zinc-900 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="focusKeyword" className="text-white text-sm mb-2 block">
                        Focus Keyword
                      </Label>
                      <Input
                        id="focusKeyword"
                        value={formData.focusKeyword}
                        onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                        className="bg-zinc-900 border-zinc-700 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="metaDescription" className="text-white text-sm mb-2 block">
                      Meta Description
                    </Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      placeholder="Max 155 karakters"
                      maxLength={155}
                      rows={2}
                      className="bg-zinc-900 border-zinc-700 text-white text-sm"
                    />
                  </div>
                </div>

                {/* Categorization */}
                <div className="space-y-4 pt-6 border-t border-zinc-700">
                  <h3 className="text-lg font-semibold text-white">Categorisatie</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="category" className="text-white text-sm mb-2 block">
                        Categorie
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AI & Content Marketing">AI & Content Marketing</SelectItem>
                          <SelectItem value="SEO & Ranking">SEO & Ranking</SelectItem>
                          <SelectItem value="WordPress Tips">WordPress Tips</SelectItem>
                          <SelectItem value="Automatisering">Automatisering</SelectItem>
                          <SelectItem value="Nieuws & Updates">Nieuws & Updates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tags" className="text-white text-sm mb-2 block">
                        Tags (komma gescheiden)
                      </Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="AI, content, SEO"
                        className="bg-zinc-900 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="readingTime" className="text-white text-sm mb-2 block">
                        Leestijd (minuten)
                      </Label>
                      <Input
                        id="readingTime"
                        type="number"
                        value={formData.readingTimeMinutes}
                        onChange={(e) => setFormData({ ...formData, readingTimeMinutes: parseInt(e.target.value) || 5 })}
                        min={1}
                        className="bg-zinc-900 border-zinc-700 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="featuredImage" className="text-white text-sm mb-2 block">
                      Featured Image URL (optioneel)
                    </Label>
                    <Input
                      id="featuredImage"
                      value={formData.featuredImage}
                      onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                      placeholder="https://www.wufoo.com/wp-content/uploads/2017/05/placeholder_setting.png"
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-white text-sm mb-2 block">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-14 text-base flex-1"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {editingPost ? 'Bijwerken' : 'Opslaan'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setView('list');
                      setEditingPost(null);
                      resetForm();
                    }}
                    className="border-zinc-700 text-gray-300 hover:bg-zinc-700 h-14 text-base sm:w-32"
                  >
                    Annuleren
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
