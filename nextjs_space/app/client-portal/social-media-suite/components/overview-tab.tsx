'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  Trash2,
  Edit,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
  { id: 'twitter', name: 'X', icon: Twitter, color: '#000000' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: '#000000' },
];

interface Post {
  id: string;
  platform: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledFor?: string;
  publishedAt?: string;
  createdAt: string;
}

export default function OverviewTab() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);

      // Mock implementation - in production this would fetch from API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockPosts: Post[] = [
        {
          id: '1',
          platform: 'linkedin',
          content: '🚀 Nieuwe feature gelanceerd!\n\nWe zijn trots om te kunnen aankondigen...',
          status: 'published',
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          platform: 'facebook',
          content: '💡 Tips van de week:\n\n1. Plan vooruit\n2. Gebruik AI tools\n3. Blijf consistent',
          status: 'scheduled',
          scheduledFor: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          platform: 'instagram',
          content: '📸 Achter de schermen kijkje...\n\n#BehindTheScenes #Content',
          status: 'draft',
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          platform: 'twitter',
          content: '🔥 Hot take: AI gaat content creatie transformeren in 2024\n\n#AI #Content',
          status: 'scheduled',
          scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];

      setPosts(mockPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Fout bij laden van posts');
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Weet je zeker dat je deze post wilt verwijderen?')) {
      return;
    }

    toast.success('Post verwijderd');
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const publishPost = async (postId: string) => {
    toast.success('Post gepubliceerd!');
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, status: 'published', publishedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const getStatusBadge = (status: Post['status']) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="secondary">
            <FileText className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="default" className="bg-blue-600">
            <Clock className="h-3 w-3 mr-1" />
            Ingepland
          </Badge>
        );
      case 'published':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Gepubliceerd
          </Badge>
        );
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (filter !== 'all' && post.status !== filter) return false;
    if (platformFilter !== 'all' && post.platform !== platformFilter) return false;
    if (searchQuery && !post.content.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    return true;
  });

  const stats = {
    total: posts.length,
    draft: posts.filter((p) => p.status === 'draft').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    published: posts.filter((p) => p.status === 'published').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Totaal Posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-sm text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.scheduled}</div>
            <p className="text-sm text-muted-foreground">Ingepland</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.published}</div>
            <p className="text-sm text-muted-foreground">Gepubliceerd</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filter} onValueChange={(val: any) => setFilter(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Ingepland</SelectItem>
                  <SelectItem value="published">Gepubliceerd</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Zoeken</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek in posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alle Posts ({filteredPosts.length})</CardTitle>
              <CardDescription>Bekijk en beheer al je posts</CardDescription>
            </div>
            <Button variant="outline" onClick={loadPosts} size="sm">
              <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Vernieuwen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Geen posts gevonden</p>
              <p className="text-sm mt-1">Probeer andere filters of maak een nieuwe post</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const platform = PLATFORMS.find((p) => p.id === post.platform);
                const Icon = platform?.icon;

                return (
                  <div key={post.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {Icon && (
                          <Icon className="h-5 w-5" style={{ color: platform?.color }} />
                        )}
                        <span className="font-semibold">{platform?.name}</span>
                        {getStatusBadge(post.status)}
                      </div>
                      <div className="flex gap-2">
                        {post.status === 'draft' && (
                          <Button size="sm" onClick={() => publishPost(post.id)}>
                            <Send className="h-4 w-4 mr-1" />
                            Publiceren
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-muted rounded p-3 text-sm">
                      <p className="line-clamp-3">{post.content}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {post.scheduledFor && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Ingepland:{' '}
                          {new Date(post.scheduledFor).toLocaleString('nl-NL', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </div>
                      )}
                      {post.publishedAt && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Gepubliceerd:{' '}
                          {new Date(post.publishedAt).toLocaleString('nl-NL', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </div>
                      )}
                      {!post.scheduledFor && !post.publishedAt && (
                        <div>
                          Gemaakt:{' '}
                          {new Date(post.createdAt).toLocaleString('nl-NL', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
