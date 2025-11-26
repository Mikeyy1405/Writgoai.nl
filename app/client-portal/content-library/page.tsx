
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Loader2, 
  Sparkles,
  ArrowLeft,
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
  Youtube
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
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

export default function ContentLibrary() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentPiece[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentPiece[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
    if (!session) {
      router.push('/client-login');
    } else {
      loadContent();
      loadSocialPosts();
    }
  }, [session, router]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = content.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredContent(filtered);
      
      const filteredSocial = socialPosts.filter(item =>
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.contentType.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSocialPosts(filteredSocial);
    } else {
      setFilteredContent(content);
      setFilteredSocialPosts(socialPosts);
    }
  }, [searchQuery, content, socialPosts]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/content-library');
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
        console.error('Kon social media posts niet laden');
      }
    } catch (error) {
      console.error('Error loading social posts:', error);
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
      const response = await fetch(`/api/client/content-library/${id}`, {
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

      const response = await fetch(`/api/client/content-library/${selectedContent.id}`, {
        method: 'PATCH',
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
    <div className="min-h-screen bg-black p-2 md:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto overflow-x-hidden">
        {/* Header */}
        <div className="mb-8">
          <Link href="/client-portal">
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar overzicht
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-[#ff6b35] to-[#ff8c42] rounded-xl shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Content Bibliotheek
              </h1>
              <p className="text-gray-300 text-lg mt-1">
                Al je opgeslagen blogs op één plek
              </p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Zoek in je content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-zinc-700 bg-zinc-900 text-white focus:border-[#ff6b35] focus:ring-[#ff6b35]"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
            <TabsTrigger value="blogs" className="data-[state=active]:bg-[#ff6b35]">
              <FileText className="h-4 w-4 mr-2" />
              Blog Artikelen ({filteredContent.length})
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-[#ff6b35]">
              <Share2 className="h-4 w-4 mr-2" />
              Social Media Posts ({filteredSocialPosts.length})
            </TabsTrigger>
          </TabsList>

          {/* Blog Content Tab */}
          <TabsContent value="blogs">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
              </div>
            ) : filteredContent.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
            <CardContent className="py-20 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? 'Geen blogs gevonden' : 'Nog geen blogs opgeslagen'}
              </h3>
              <p className="text-gray-300 mb-6">
                {searchQuery 
                  ? 'Probeer een andere zoekopdracht' 
                  : 'Genereer je eerste blog met de Blog Generator'}
              </p>
              {!searchQuery && (
                <Link href="/client-portal/content-generator">
                  <Button className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Nieuwe Blog Genereren
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item) => (
              <Card key={item.id} className="bg-zinc-900 border-zinc-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2 text-white">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-gray-300">
                        {item.description || item.metaDesc || 'Geen beschrijving'}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Type & Tags */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    <Badge variant="default" className="text-xs bg-[#ff6b35] text-white">
                      {item.type}
                    </Badge>
                    {item.language && (
                      <Badge variant="secondary" className="text-xs bg-blue-900 text-blue-200">
                        {item.language.toUpperCase() === 'NL' ? '🇳🇱 NL' : 
                         item.language.toUpperCase() === 'EN' ? '🇺🇸 EN' :
                         item.language.toUpperCase() === 'FR' ? '🇫🇷 FR' :
                         item.language.toUpperCase() === 'ES' ? '🇪🇸 ES' :
                         item.language.toUpperCase() === 'DE' ? '🇩🇪 DE' :
                         item.language.toUpperCase()}
                      </Badge>
                    )}
                    {item.tags && item.tags.slice(0, 2).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs bg-zinc-800 text-gray-200">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags && item.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs bg-zinc-800 text-gray-200">
                        +{item.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-300">
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
                      <Badge variant="default" className="bg-zinc-9000 text-white">
                        <Globe className="w-3 h-3 mr-1" />
                        Gepubliceerd
                      </Badge>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-zinc-800">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                      onClick={() => {
                        setSelectedContent(item);
                        setEditMode(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Bewerken
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-700 text-[#ff6b35] hover:text-[#ff8c42] hover:bg-zinc-800"
                      onClick={() => {
                        setPublishingContent(item);
                        setWordpressDialogOpen(true);
                      }}
                      title="Publiceren naar WordPress"
                    >
                      <Globe className="w-4 h-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-400 hover:text-red-700 hover:bg-zinc-900 border-zinc-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-zinc-900">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Blog verwijderen?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-300">
                            Weet je zeker dat je deze blog wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-zinc-700 text-white hover:bg-zinc-800">Annuleren</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteContent(item.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
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
          <TabsContent value="social">
            {filteredSocialPosts.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                <CardContent className="py-20 text-center">
                  <Share2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {searchQuery ? 'Geen posts gevonden' : 'Nog geen social media posts'}
                  </h3>
                  <p className="text-gray-300 mb-6">
                    {searchQuery 
                      ? 'Probeer een andere zoekopdracht' 
                      : 'Genereer je eerste social media posts met de Social Media Autopilot'}
                  </p>
                  {!searchQuery && (
                    <Link href="/client-portal/social-media">
                      <Button className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white">
                        <Share2 className="w-4 h-4 mr-2" />
                        Social Media Autopilot
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSocialPosts.map((post) => (
                  <Card key={post.id} className="bg-zinc-900 border-zinc-800 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {post.platforms.map((platform) => (
                              <div key={platform} className="flex items-center gap-1 bg-gray-700/50 px-2 py-1 rounded">
                                {getPlatformIcon(platform)}
                                <span className="text-xs capitalize text-white">{platform}</span>
                              </div>
                            ))}
                          </div>
                          <CardDescription className="text-xs text-gray-300 capitalize">
                            {post.contentType.replace('_', ' ')}
                          </CardDescription>
                        </div>
                        <Badge variant={post.status === 'published' ? 'default' : 'outline'} className="text-xs">
                          {post.status === 'published' ? 'Gepubliceerd' : post.status === 'draft' ? 'Concept' : post.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-300 line-clamp-4">{post.content}</p>
                      
                      {/* Project info */}
                      {post.project && (
                        <div className="text-xs text-gray-400">
                          Project: {post.project.name}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.createdAt).toLocaleDateString('nl-NL')}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-zinc-800">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                          onClick={() => handleCopyPost(post.content, post.id)}
                        >
                          {copiedPostId === post.id ? (
                            <>
                              <Check className="w-4 w-4 mr-1 text-green-500" />
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
      </div>

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
