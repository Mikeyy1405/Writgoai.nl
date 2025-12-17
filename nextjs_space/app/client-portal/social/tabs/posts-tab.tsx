'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { FileText, Search, Trash2, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface PostsTabProps {
  projectId: string;
  refreshTrigger: number;
}

interface Post {
  id: string;
  content: string;
  platform: string;
  status: string;
  scheduledFor: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-8000',
  scheduled: 'bg-blue-500',
  published: 'bg-green-500',
  failed: 'bg-red-500',
};

export default function PostsTab({ projectId, refreshTrigger }: PostsTabProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPosts();
  }, [projectId, refreshTrigger]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ projectId });
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPlatform !== 'all') params.append('platform', filterPlatform);

      const response = await fetch(`/api/client/social?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load posts');
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast.error('Kon posts niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Weet je zeker dat je deze post wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/client/social/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      toast.success('Post verwijderd');
      loadPosts();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error('Kon post niet verwijderen');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.size === 0) {
      toast.error('Selecteer minimaal één post');
      return;
    }

    if (!confirm(`Weet je zeker dat je ${selectedPosts.size} post(s) wilt verwijderen?`)) return;

    try {
      const results = await Promise.allSettled(
        Array.from(selectedPosts).map((postId) =>
          fetch(`/api/client/social/${postId}`, { method: 'DELETE' })
        )
      );

      const successful = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.length - successful;

      if (failed === 0) {
        toast.success(`${successful} post(s) verwijderd`);
      } else {
        toast.warning(`${successful} post(s) verwijderd, ${failed} mislukt`);
      }

      setSelectedPosts(new Set());
      loadPosts();
    } catch (error: any) {
      console.error('Error bulk deleting posts:', error);
      toast.error('Kon posts niet verwijderen');
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              📝 Posts
            </CardTitle>
            <CardDescription>Alle social media posts</CardDescription>
          </div>

          {selectedPosts.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Verwijder ({selectedPosts.size})
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm"
          >
            <option value="all">Alle statussen</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Gepland</option>
            <option value="published">Gepubliceerd</option>
          </select>

          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm"
          >
            <option value="all">Alle platforms</option>
            <option value="linkedin">LinkedIn</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">X (Twitter)</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Geen posts gevonden
            </div>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id} className="p-4">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedPosts.has(post.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedPosts);
                      if (e.target.checked) {
                        newSet.add(post.id);
                      } else {
                        newSet.delete(post.id);
                      }
                      setSelectedPosts(newSet);
                    }}
                    className="mt-1"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={STATUS_COLORS[post.status]}>
                        {post.status}
                      </Badge>
                      <Badge variant="outline">{post.platform}</Badge>
                      {post.scheduledFor && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(post.scheduledFor), 'PPp', { locale: nl })}
                        </span>
                      )}
                    </div>

                    <p className="text-sm line-clamp-2">{post.content}</p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
