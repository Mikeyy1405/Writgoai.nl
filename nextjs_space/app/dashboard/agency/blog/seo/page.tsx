'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Search,
  Hash,
} from 'lucide-react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  seoScore?: number;
  focusKeyword?: string;
  wordCount?: number;
  status: string;
}

export default function BlogSEOPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/blog?status=published');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const avgScore = posts.length > 0
    ? Math.round(
        posts.reduce((sum, post) => sum + (post.seoScore || 0), 0) / posts.length
      )
    : 0;

  const excellentPosts = posts.filter((p) => (p.seoScore || 0) >= 80).length;
  const needsWork = posts.filter((p) => (p.seoScore || 0) < 60).length;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Uitstekend', class: 'bg-green-500' };
    if (score >= 60) return { label: 'Goed', class: 'bg-yellow-500' };
    return { label: 'Zwak', class: 'bg-red-500' };
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
      <div>
        <h1 className="text-3xl font-bold">SEO Overzicht</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          SEO prestaties van je blog content
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gemiddelde Score</p>
              <p className={`text-3xl font-bold mt-1 ${getScoreColor(avgScore)}`}>
                {avgScore}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-[#FF9933]" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Uitstekend (80+)</p>
              <p className="text-3xl font-bold mt-1 text-green-600">{excellentPosts}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Te Verbeteren (&lt;60)</p>
              <p className="text-3xl font-bold mt-1 text-red-600">{needsWork}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Posts by SEO Score */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Posts per SEO Score</h2>
        <div className="space-y-3">
          {posts
            .sort((a, b) => (b.seoScore || 0) - (a.seoScore || 0))
            .map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 bg-slate-800 dark:bg-zinc-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <Link
                    href={`/dashboard/agency/blog/posts/${post.id}`}
                    className="font-medium hover:text-[#FF9933] transition-colors"
                  >
                    {post.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /{post.slug}
                    </span>
                    {post.focusKeyword && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Hash className="w-3 h-3" />
                        {post.focusKeyword}
                      </div>
                    )}
                    {post.wordCount && (
                      <span className="text-sm text-gray-500">
                        {post.wordCount} woorden
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4">
                  <div className="w-32">
                    <Progress value={post.seoScore || 0} className="h-2" />
                  </div>
                  <div className="text-right min-w-[60px]">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        post.seoScore || 0
                      )}`}
                    >
                      {post.seoScore || 0}
                    </div>
                    <Badge className={getScoreBadge(post.seoScore || 0).class}>
                      {getScoreBadge(post.seoScore || 0).label}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {posts.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nog geen posts om te analyseren
          </p>
        )}
      </Card>

      {/* SEO Tips */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          SEO Best Practices
        </h3>
        <ul className="space-y-2 text-sm text-slate-300 dark:text-gray-300">
          <li className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Gebruik relevante keywords in je titel en eerste paragraaf</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Schrijf minstens 300 woorden voor betere ranking</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Voeg interne links toe naar gerelateerde content</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Optimaliseer meta descriptions (120-160 karakters)</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Gebruik H2 en H3 headings voor structuur</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
