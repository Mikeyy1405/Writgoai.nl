'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Edit,
  Eye,
  Trash2,
  Search,
  Loader2,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: string;
  category: string;
  views: number;
  publishedAt?: string;
  createdAt: string;
  tags: string[];
  wordCount?: number;
}

interface BlogPostsManagementProps {
  filter: 'all' | 'published' | 'draft' | 'scheduled';
  onRefresh?: () => void;
}

export default function BlogPostsManagement({ filter, onRefresh }: BlogPostsManagementProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/admin/blog?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error: any) {
      console.error('Failed to fetch posts:', error);
      toast.error('Kon artikelen niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Weet je zeker dat je "${title}" wilt verwijderen?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      toast.success('Artikel verwijderd');
      fetchPosts();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Failed to delete:', error);
      toast.error('Kon artikel niet verwijderen');
    }
  };

  const handlePublish = async (id: string, title: string) => {
    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'published',
          publishedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Publish failed');
      }

      toast.success(`"${title}" gepubliceerd`);
      fetchPosts();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Failed to publish:', error);
      toast.error('Kon artikel niet publiceren');
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query) ||
      post.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      published: { variant: 'default' as const, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      scheduled: { variant: 'outline' as const, className: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' },
    };

    const statusConfig = config[status as keyof typeof config] || config.draft;

    return (
      <Badge variant={statusConfig.variant} className={statusConfig.className}>
        {status === 'draft' ? 'Concept' : status === 'published' ? 'Gepubliceerd' : 'Gepland'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Artikelen laden...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek artikelen op titel, excerpt, categorie of tags..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Geen artikelen gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{post.title}</div>
                          <div className="text-sm text-muted-foreground">/{post.slug}</div>
                          {post.wordCount && (
                            <div className="text-xs text-muted-foreground">
                              {post.wordCount} woorden
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{post.category}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{post.views}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {post.publishedAt ? (
                            <>
                              <div className="text-sm">
                                {format(new Date(post.publishedAt), 'dd MMM yyyy', { locale: nl })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(post.publishedAt), 'HH:mm', { locale: nl })}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Niet gepubliceerd
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {post.status === 'published' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                              title="Bekijk artikel"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          {post.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePublish(post.id, post.title)}
                              title="Publiceer artikel"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/dashboard/agency/blog/posts/${post.id}`)}
                            title="Bewerk artikel"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(post.id, post.title)}
                            title="Verwijder artikel"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
