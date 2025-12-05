'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  RefreshCw,
  Edit,
  Sparkles,
  Eye,
  Calendar,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import WordPressPostEditor from './wordpress-post-editor';
import AIRewriteModal from './ai-rewrite-modal';

interface WordPressPost {
  id: number;
  title: string;
  slug: string;
  link: string;
  status: string;
  date: string;
  modified: string;
  excerpt: string;
  content: string;
  wordCount: number;
  featuredImage: string | null;
  author: string;
  categories: string[];
  metaDescription?: string;
}

interface WordPressPostsListProps {
  siteId: string;
}

export default function WordPressPostsList({ siteId }: WordPressPostsListProps) {
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<WordPressPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showRewriter, setShowRewriter] = useState(false);
  const [rewritingPost, setRewritingPost] = useState<WordPressPost | null>(null);

  useEffect(() => {
    loadPosts();
  }, [siteId]);

  useEffect(() => {
    // Filter posts based on search query
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = posts.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.categories.some(cat => cat.toLowerCase().includes(query))
      );
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content-hub/wordpress-posts?siteId=${siteId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kon posts niet laden');
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error: any) {
      console.error('Failed to load WordPress posts:', error);
      toast.error(error.message || 'Kon WordPress posts niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPost = (post: WordPressPost) => {
    setSelectedPost(post);
    setShowEditor(true);
  };

  const handleRewritePost = (post: WordPressPost) => {
    setRewritingPost(post);
    setShowRewriter(true);
  };

  const handlePostUpdated = () => {
    loadPosts();
    setShowEditor(false);
    setSelectedPost(null);
  };

  const handleRewriteComplete = () => {
    loadPosts();
    setShowRewriter(false);
    setRewritingPost(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      publish: { label: 'Gepubliceerd', variant: 'default' },
      draft: { label: 'Concept', variant: 'secondary' },
      pending: { label: 'In afwachting', variant: 'outline' },
      private: { label: 'Privé', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">WordPress posts laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Refresh */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek posts op titel, content of categorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadPosts}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{posts.length}</div>
            <p className="text-sm text-muted-foreground">Totaal Posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {posts.filter(p => p.status === 'publish').length}
            </div>
            <p className="text-sm text-muted-foreground">Gepubliceerd</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Math.round(posts.reduce((sum, p) => sum + p.wordCount, 0) / posts.length) || 0}
            </div>
            <p className="text-sm text-muted-foreground">Gem. Woorden</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredPosts.length}</div>
            <p className="text-sm text-muted-foreground">Resultaten</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Geen posts gevonden</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery ? 'Probeer een andere zoekopdracht.' : 'Er zijn nog geen WordPress posts om te tonen.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{post.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.date)}
                      </span>
                      <span>•</span>
                      <span>{post.wordCount} woorden</span>
                      <span>•</span>
                      <span>{post.author}</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(post.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                
                {/* Categories */}
                {post.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.categories.map((category, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditPost(post)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Bewerken
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRewritePost(post)}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    AI Herschrijven
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(post.link, '_blank')}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Bekijken
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`${post.link.replace(post.slug, '')}wp-admin/post.php?post=${post.id}&action=edit`, '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    WordPress
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && selectedPost && (
        <WordPressPostEditor
          post={selectedPost}
          siteId={siteId}
          onClose={() => {
            setShowEditor(false);
            setSelectedPost(null);
          }}
          onSave={handlePostUpdated}
        />
      )}

      {/* AI Rewrite Modal */}
      {showRewriter && rewritingPost && (
        <AIRewriteModal
          post={rewritingPost}
          siteId={siteId}
          onClose={() => {
            setShowRewriter(false);
            setRewritingPost(null);
          }}
          onComplete={handleRewriteComplete}
        />
      )}
    </div>
  );
}
