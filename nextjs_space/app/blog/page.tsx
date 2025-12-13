
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PublicNav from '@/components/public-nav';
import { Calendar, Clock, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  category: string;
  tags: string[];
  published_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    'all',
    'AI & Content Marketing',
    'SEO & Ranking',
    'WordPress Tips',
    'Automatisering',
    'Nieuws & Updates',
  ];

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const res = await fetch(`/api/blog?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Navigation */}
      <PublicNav />

      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-orange-500/20 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            WritgoAI Blog
          </h1>
          <p className="text-lg text-gray-300">
            Tips, trends en best practices voor AI-gedreven content marketing
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={
                selectedCategory === cat
                  ? 'bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg shadow-orange-500/20'
                  : 'border-gray-700 text-gray-300 hover:border-orange-500 hover:text-orange-400 bg-gray-900/50'
              }
            >
              {cat === 'all' ? 'Alle artikelen' : cat}
            </Button>
          ))}
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse bg-gray-900/50 border-gray-800">
                <div className="bg-gray-800 h-48 rounded-lg mb-4" />
                <div className="bg-gray-800 h-6 rounded mb-2" />
                <div className="bg-gray-800 h-4 rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center bg-gray-900/50 border-gray-800">
            <p className="text-gray-400 text-lg">
              Geen artikelen gevonden in deze categorie.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="h-full hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 overflow-hidden group cursor-pointer bg-gray-900/50 border-gray-800 hover:border-orange-500/50">
                  {/* Featured Image */}
                  {post.featured_image ? (
                    <div className="relative aspect-video bg-gray-800">
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center">
                      <span className="text-white text-6xl font-bold opacity-70">
                        W
                      </span>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Category Badge */}
                    <Badge className="mb-3 bg-orange-900/50 text-orange-300 border-orange-700">
                      {post.category}
                    </Badge>

                    {/* Title */}
                    <h2 className="text-xl font-bold mb-3 text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-400 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.published_at)}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-gray-700 hover:border-orange-500 hover:text-orange-400 text-gray-300 bg-gray-900/50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Vorige
            </Button>
            
            <span className="text-gray-400">
              Pagina {currentPage} van {totalPages}
            </span>

            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-gray-700 hover:border-orange-500 hover:text-orange-400 text-gray-300 bg-gray-900/50"
            >
              Volgende
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* CTA Section */}
        <Card className="mt-16 p-10 bg-gradient-to-br from-orange-600 to-orange-700 text-white text-center border-0 shadow-2xl shadow-orange-500/30">
          <h2 className="text-3xl font-bold mb-4">
            Klaar om je content te automatiseren?
          </h2>
          <p className="text-xl text-orange-100 mb-6 max-w-2xl mx-auto">
            Probeer WritgoAI gratis en genereer SEO-geoptimaliseerde blog posts in
            minuten!
          </p>
          <Link href="/inloggen">
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 shadow-lg"
            >
              Start Gratis Trial
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
