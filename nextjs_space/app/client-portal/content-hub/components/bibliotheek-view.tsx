'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Loader2, 
  Trash2,
  Edit2,
  Search,
  Calendar,
  Globe,
  Copy,
  Check,
  Share2,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import BlogCanvas from '@/components/blog-canvas';
import WordPressPublisherDialog from '@/components/wordpress-publisher-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ContentPiece {
  id: string;
  type: string;
  title: string;
  content: string;
  contentHtml?: string;
  category?: string;
  tags?: string[];
  description?: string;
  keywords?: string[];
  metaDesc?: string;
  slug?: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  wordCount?: number;
  characterCount?: number;
  isFavorite?: boolean;
  isArchived?: boolean;
  publishedUrl?: string;
  publishedAt?: Date | null;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: string;
    name: string;
    websiteUrl: string;
  };
}

interface SocialMediaPost {
  id: string;
  platforms: string[];
  content: string;
  contentType: string;
  status: string;
  scheduledFor?: string;
  publishedAt?: string;
  createdAt: string;
  project?: {
    id: string;
    name: string;
    websiteUrl: string;
  };
}

interface BibliotheekViewProps {
  siteId?: string;
}

export default function BibliotheekView({ siteId }: BibliotheekViewProps) {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentPiece[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentPiece[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContent, setSelectedContent] = useState<ContentPiece | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [wordpressDialogOpen, setWordpressDialogOpen] = useState(false);
  const [publishingContent, setPublishingContent] = useState<ContentPiece | null>(null);
  
  // Social Media Posts
  const [activeTab, setActiveTab] = useState('blogs');
  const [socialPosts, setSocialPosts] = useState<SocialMediaPost[]>([]);
  const [filteredSocialPosts, setFilteredSocialPosts] = useState<SocialMediaPost[]>([]);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
    loadSocialPosts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, typeFilter, statusFilter, content, socialPosts]);

  const applyFilters = () => {
    let filtered = [...content];

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Status filter
    if (statusFilter === 'concept') {
      filtered = filtered.filter(item => !item.publishedUrl);
    } else if (statusFilter === 'gepubliceerd') {
      filtered = filtered.filter(item => !!item.publishedUrl);
    }

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredContent(filtered);

    // Filter social posts
    let filteredSocial = [...socialPosts];
    if (searchQuery.trim()) {
      filteredSocial = filteredSocial.filter(item =>
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.contentType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredSocialPosts(filteredSocial);
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/saved-content');
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
        setFilteredContent(data.content);
      } else {
        toast.error('Kon content niet laden');
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Fout bij het laden van content');
    } finally {
      setLoading(false);
    }
  };

  const loadSocialPosts = async () => {
    try {
      const response = await fetch('/api/client/social-media/all-posts');
      if (response.ok) {
        const data = await response.json();
        setSocialPosts(data.posts || []);
        setFilteredSocialPosts(data.posts || []);
      } else {
        console.error('Failed to load social posts:', response.statusText);
        // Don't show error toast since this is not critical
      }
    } catch (error) {
      console.error('Error loading social posts:', error);
      // Don't show error toast since this is not critical
    }
  };

  const handleCopyPost = async (content: string, postId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedPostId(postId);
      toast.success('Post gekopieerd naar klembord!');
      
      setTimeout(() => {
        setCopiedPostId(null);
      }, 2000);
    } catch (error) {
      toast.error('Fout bij kopiëren');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };

  const deleteContent = async (id: string) => {
    try {
      const response = await fetch(`/api/client/saved-content/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Content verwijderd');
        loadContent();
      } else {
        toast.error('Kon content niet verwijderen');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Fout bij het verwijderen van content');
    }
  };

  const handleSaveEdit = async (data: {
    content: string;
    seoMetadata?: {
      seoTitle: string;
      metaDescription: string;
      focusKeyword: string;
      extraKeywords: string[];
      lsiKeywords: string[];
    } | null;
    featuredImage?: string;
    socialMediaPost?: {
      text: string;
      imageUrl: string;
      hashtags: string[];
    } | null;
  }) => {
    if (!selectedContent) return;

    try {
      const { content: updatedContent, seoMetadata, featuredImage, socialMediaPost } = data;
      const titleMatch = updatedContent.match(/<h1>(.*?)<\/h1>/);
      const title = titleMatch ? titleMatch[1] : selectedContent.title;

      // Prepare keywords array from SEO metadata
      const keywords = seoMetadata ? [
        seoMetadata.focusKeyword,
        ...(seoMetadata.extraKeywords || []),
        ...(seoMetadata.lsiKeywords || [])
      ].filter(Boolean) : selectedContent.keywords || [];

      const response = await fetch(`/api/client/saved-content/${selectedContent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: updatedContent.replace(/<[^>]*>/g, ''), // Plain text
          contentHtml: updatedContent, // HTML versie
          metaDesc: seoMetadata?.metaDescription || selectedContent.metaDesc,
          keywords,
          thumbnailUrl: featuredImage || selectedContent.thumbnailUrl,
        }),
      });

      if (response.ok) {
        toast.success('Content bijgewerkt');
        setEditMode(false);
        setSelectedContent(null);
        loadContent();
      } else {
        toast.error('Kon content niet bijwerken');
      }
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error('Fout bij het bijwerken van content');
    }
  };

  const handleRewrite = (item: ContentPiece) => {
    // TODO: Implement rewrite functionality
    // This should trigger a content rewrite process
    toast.info('Herschrijven functie wordt binnenkort toegevoegd');
  };

  if (editMode && selectedContent) {
    // Prepare SEO metadata from saved content
    const seoMetadata = {
      seoTitle: selectedContent.title || '',
      metaDescription: selectedContent.metaDesc || selectedContent.description || '',
      focusKeyword: selectedContent.keywords?.[0] || '',
      extraKeywords: selectedContent.keywords?.slice(1) || [],
      lsiKeywords: [],
    };

    return (
      <BlogCanvas
        content={selectedContent.contentHtml || selectedContent.content}
        isGenerating={false}
        topic={selectedContent.title}
        projectId={selectedContent.project?.id || null}
        seoMetadata={seoMetadata}
        featuredImage={selectedContent.thumbnailUrl || ''}
        onSave={handleSaveEdit}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Zoek in je content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle types</SelectItem>
            <SelectItem value="blog">Blog</SelectItem>
            <SelectItem value="artikel">Artikel</SelectItem>
            <SelectItem value="social_media">Social Media</SelectItem>
            <SelectItem value="other">Overig</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            <SelectItem value="concept">Concept</SelectItem>
            <SelectItem value="gepubliceerd">Gepubliceerd</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={loadContent} title="Vernieuwen">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="blogs">
            <FileText className="h-4 w-4 mr-2" />
            Blogs & Artikelen ({filteredContent.length})
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-2" />
            Social Media ({filteredSocialPosts.length})
          </TabsTrigger>
        </TabsList>

        {/* Blog Content Tab */}
        <TabsContent value="blogs" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredContent.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' 
                    ? 'Geen content gevonden' 
                    : 'Nog geen content opgeslagen'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                    ? 'Probeer andere filters' 
                    : 'Genereer content om deze hier te zien'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 mb-2">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {item.description || item.metaDesc || 'Geen beschrijving'}
                        </CardDescription>
                      </div>
                    </div>
                    
                    {/* Type & Tags */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      <Badge variant="default" className="text-xs">
                        {item.type}
                      </Badge>
                      {item.language && (
                        <Badge variant="secondary" className="text-xs">
                          {item.language.toUpperCase() === 'NL' ? '🇳🇱 NL' : 
                           item.language.toUpperCase() === 'EN' ? '🇺🇸 EN' :
                           item.language.toUpperCase() === 'FR' ? '🇫🇷 FR' :
                           item.language.toUpperCase() === 'ES' ? '🇪🇸 ES' :
                           item.language.toUpperCase() === 'DE' ? '🇩🇪 DE' :
                           item.language.toUpperCase()}
                        </Badge>
                      )}
                      {item.tags && item.tags.slice(0, 2).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags && item.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(item.createdAt).toLocaleDateString('nl-NL')}
                      </div>
                      {item.wordCount && (
                        <div className="text-xs">
                          {item.wordCount} woorden
                        </div>
                      )}
                    </div>

                    {/* Published status */}
                    {item.publishedUrl && (
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-500">
                          <Globe className="w-3 h-3 mr-1" />
                          Gepubliceerd
                        </Badge>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedContent(item);
                          setEditMode(true);
                        }}
                        title="Bewerken"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Bewerken
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPublishingContent(item);
                          setWordpressDialogOpen(true);
                        }}
                        title="Publiceren naar WordPress"
                      >
                        <Globe className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRewrite(item)}
                        title="Herschrijven"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" title="Verwijderen">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Content verwijderen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Weet je zeker dat je deze content wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteContent(item.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Verwijderen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Social Media Posts Tab */}
        <TabsContent value="social" className="mt-6">
          {filteredSocialPosts.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Share2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? 'Geen posts gevonden' : 'Nog geen social media posts'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Probeer een andere zoekopdracht' 
                    : 'Social media posts verschijnen hier automatisch'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSocialPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {post.platforms.map((platform) => (
                            <div key={platform} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                              {getPlatformIcon(platform)}
                              <span className="text-xs capitalize">{platform}</span>
                            </div>
                          ))}
                        </div>
                        <CardDescription className="text-xs capitalize">
                          {post.contentType.replace('_', ' ')}
                        </CardDescription>
                      </div>
                      <Badge variant={post.status === 'published' ? 'default' : 'outline'} className="text-xs">
                        {post.status === 'published' ? 'Gepubliceerd' : post.status === 'draft' ? 'Concept' : post.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-4">{post.content}</p>
                    
                    {/* Project info */}
                    {post.project && (
                      <div className="text-xs text-muted-foreground">
                        Project: {post.project.name}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.createdAt).toLocaleDateString('nl-NL')}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCopyPost(post.content, post.id)}
                      >
                        {copiedPostId === post.id ? (
                          <>
                            <Check className="w-4 h-4 mr-1 text-green-500" />
                            Gekopieerd
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Kopieer
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* WordPress Publisher Dialog */}
      {publishingContent && (
        <WordPressPublisherDialog
          open={wordpressDialogOpen}
          onOpenChange={setWordpressDialogOpen}
          contentId={publishingContent.id}
          title={publishingContent.title}
          content={publishingContent.contentHtml || publishingContent.content}
          excerpt={publishingContent.description || publishingContent.metaDesc}
          featuredImageUrl={publishingContent.thumbnailUrl || publishingContent.imageUrls?.[0]}
          onPublishSuccess={(url) => {
            loadContent(); // Reload to show published status
            setPublishingContent(null);
          }}
        />
      )}
    </div>
  );
}
