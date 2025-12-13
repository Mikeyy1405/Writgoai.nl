'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: 'draft' | 'published';
  category?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminBlogListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');

  useEffect(() => {
    fetchPosts();
  }, [filterStatus]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const res = await fetch(`/api/blog?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Fout bij ophalen blogposts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze blogpost wilt verwijderen?')) {
      return;
    }

    try {
      const res = await fetch(`/api/blog/id/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete');
      }

      toast.success('Blogpost verwijderd');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Fout bij verwijderen blogpost');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: nl,
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Blog Beheer
            </h1>
            <p className="text-gray-400">
              Beheer de interne WritgoAI blog posts
            </p>
          </div>
          <Link href="/admin-portal/blog/new">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Post
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className={
                  filterStatus === 'all'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'border-zinc-700 text-gray-300 hover:border-orange-500'
                }
              >
                Alle
              </Button>
              <Button
                variant={filterStatus === 'draft' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('draft')}
                className={
                  filterStatus === 'draft'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'border-zinc-700 text-gray-300 hover:border-orange-500'
                }
              >
                Concepten
              </Button>
              <Button
                variant={filterStatus === 'published' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('published')}
                className={
                  filterStatus === 'published'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'border-zinc-700 text-gray-300 hover:border-orange-500'
                }
              >
                Gepubliceerd
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Table */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Blogposts ({posts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Geen blogposts gevonden</p>
                <Link href="/admin-portal/blog/new">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Eerste Post Maken
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-700">
                      <TableHead className="text-gray-300">Titel</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Categorie</TableHead>
                      <TableHead className="text-gray-300">Laatst Bijgewerkt</TableHead>
                      <TableHead className="text-gray-300">Gepubliceerd</TableHead>
                      <TableHead className="text-gray-300 text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id} className="border-zinc-700">
                        <TableCell className="text-white font-medium">
                          <div>
                            <div className="font-semibold">{post.title}</div>
                            <div className="text-sm text-gray-400 truncate max-w-md">
                              {post.excerpt}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              post.status === 'published'
                                ? 'bg-green-900/50 text-green-300 border-green-700'
                                : 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
                            }
                          >
                            {post.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {post.category || '-'}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {formatDate(post.updated_at)}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {post.published_at ? formatDate(post.published_at) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-zinc-800 border-zinc-700"
                            >
                              <DropdownMenuItem
                                onClick={() => router.push(`/admin-portal/blog/${post.id}/edit`)}
                                className="text-gray-300 hover:text-white hover:bg-zinc-700"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Bewerken
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                                className="text-gray-300 hover:text-white hover:bg-zinc-700"
                                disabled={post.status !== 'published'}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Bekijken
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(post.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Verwijderen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </div>
  );
}
