'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';

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
}

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, [statusFilter, categoryFilter]);

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const res = await fetch(`/api/admin/blog?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      toast.error('Fout bij ophalen posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze post wilt verwijderen?')) return;

    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Post verwijderd');
      fetchPosts();
    } catch (error) {
      toast.error('Fout bij verwijderen');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedPosts.size === 0) {
      toast.error('Selecteer eerst posts');
      return;
    }

    const confirmMsg =
      action === 'delete'
        ? 'Weet je zeker dat je deze posts wilt verwijderen?'
        : `${selectedPosts.size} posts ${action}en?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/blog/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          postIds: Array.from(selectedPosts),
        }),
      });

      if (!res.ok) throw new Error('Bulk action failed');
      const data = await res.json();
      toast.success(data.message);
      setSelectedPosts(new Set());
      fetchPosts();
    } catch (error) {
      toast.error('Fout bij bulk actie');
    }
  };

  const togglePostSelection = (postId: string) => {
    const newSelection = new Set(selectedPosts);
    if (newSelection.has(postId)) {
      newSelection.delete(postId);
    } else {
      newSelection.add(postId);
    }
    setSelectedPosts(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map((p) => p.id)));
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      published: 'default',
      scheduled: 'outline',
    };
    const colors: Record<string, string> = {
      draft: 'text-yellow-600',
      published: 'text-green-600',
      scheduled: 'text-blue-600',
    };
    return (
      <Badge variant={variants[status] || 'secondary'} className={colors[status]}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Alle Posts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {filteredPosts.length} posts gevonden
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/agency/blog/posts/new')}
          className="bg-gradient-to-r from-[#FF9933] to-[#FFAD33]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Post
        </Button>
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek posts..."
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Statussen</SelectItem>
              <SelectItem value="published">Gepubliceerd</SelectItem>
              <SelectItem value="draft">Concept</SelectItem>
              <SelectItem value="scheduled">Gepland</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Categorieën</SelectItem>
              <SelectItem value="AI & Content Marketing">AI & Content Marketing</SelectItem>
              <SelectItem value="SEO & Ranking">SEO & Ranking</SelectItem>
              <SelectItem value="WordPress Tips">WordPress Tips</SelectItem>
              <SelectItem value="Automatisering">Automatisering</SelectItem>
              <SelectItem value="Nieuws & Updates">Nieuws & Updates</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedPosts.size > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <p className="font-medium">
              {selectedPosts.size} post(s) geselecteerd
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('publish')}
              >
                Publiceren
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('draft')}
              >
                Naar Concept
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Verwijderen
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Posts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={
                      filteredPosts.length > 0 &&
                      selectedPosts.size === filteredPosts.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold">Titel</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Categorie</th>
                <th className="px-4 py-3 text-left font-semibold">Views</th>
                <th className="px-4 py-3 text-left font-semibold">Datum</th>
                <th className="px-4 py-3 text-right font-semibold">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
              {filteredPosts.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedPosts.has(post.id)}
                      onCheckedChange={() => togglePostSelection(post.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/agency/blog/posts/${post.id}`}
                      className="font-medium hover:text-[#FF9933] transition-colors"
                    >
                      {post.title}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      /{post.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(post.status)}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{post.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{post.views}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString('nl-NL')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {post.status === 'published' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          router.push(`/dashboard/agency/blog/posts/${post.id}`)
                        }
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPosts.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Geen posts gevonden
          </div>
        )}
      </Card>
    </div>
  );
}
