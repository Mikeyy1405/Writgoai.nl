'use client';

import { useState, useEffect } from 'react';
import { FileText, Calendar, Eye, Trash2, Edit } from 'lucide-react';
import { useProject } from '@/lib/contexts/ProjectContext';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: 'draft' | 'published' | 'scheduled';
  createdAt: string;
  publishedAt?: string;
}

export default function BlogContentLibrary() {
  const { currentProject } = useProject();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentProject) {
      fetchPosts();
    }
  }, [currentProject]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/blog?projectId=${currentProject?.id}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-800 rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-xl">
        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Nog geen blog artikelen gegenereerd</p>
        <p className="text-sm text-gray-500 mt-1">
          Gebruik de Content Plan Generator om artikelen te maken
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    post.status === 'published'
                      ? 'bg-green-500/10 text-green-400'
                      : post.status === 'scheduled'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {post.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">{post.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.createdAt).toLocaleDateString('nl-NL')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/blog/${post.id}`}
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <Edit className="w-4 h-4" />
              </Link>
              <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
