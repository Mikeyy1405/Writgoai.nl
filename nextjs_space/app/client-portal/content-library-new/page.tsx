
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Search,
  Filter,
  Star,
  Archive,
  Trash2,
  Edit,
  Download,
  ExternalLink,
  Calendar,
  Tag,
  Copy,
  Check,
  Loader2,
  Globe,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SavedContent {
  id: string;
  type: string;
  title: string;
  content: string;
  contentHtml?: string;
  category?: string;
  tags: string[];
  description?: string;
  keywords: string[];
  metaDesc?: string;
  slug?: string;
  thumbnailUrl?: string;
  imageUrls: string[];
  isFavorite: boolean;
  isArchived: boolean;
  publishedUrl?: string;
  publishedAt?: string;
  wordCount?: number;
  characterCount?: number;
  projectId?: string;
  project?: {
    id: string;
    name: string;
    websiteUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ContentLibraryPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();

  const [contents, setContents] = useState<SavedContent[]>([]);
  const [filteredContents, setFilteredContents] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Edit dialog
  const [editDialog, setEditDialog] = useState(false);
  const [editingContent, setEditingContent] = useState<SavedContent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContentText, setEditContentText] = useState('');
  const [editMetaDesc, setEditMetaDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // View dialog
  const [viewDialog, setViewDialog] = useState(false);
  const [viewingContent, setViewingContent] = useState<SavedContent | null>(null);

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingContent, setDeletingContent] = useState<SavedContent | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!session) {
      router.push('/client-login');
    } else {
      loadContent();
    }
  }, [session, router, showArchived]);

  // Filter content
  useEffect(() => {
    filterContent();
  }, [contents, searchQuery, typeFilter, categoryFilter, showFavorites]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (showArchived) params.append('archived', 'true');
      if (showFavorites) params.append('favorite', 'true');

      const response = await fetch(`/api/client/saved-content?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContents(data.content || []);
      } else {
        toast.error('Kon content niet laden');
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Fout bij laden van content');
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    let filtered = [...contents];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.content.toLowerCase().includes(query) ||
          c.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((c) => c.type === typeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    setFilteredContents(filtered);
  };

  const toggleFavorite = async (content: SavedContent) => {
    try {
      const response = await fetch(`/api/client/saved-content/${content.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !content.isFavorite }),
      });

      if (response.ok) {
        toast.success(content.isFavorite ? 'Verwijderd uit favorieten' : 'Toegevoegd aan favorieten');
        loadContent();
      }
    } catch (error) {
      toast.error('Fout bij bijwerken');
    }
  };

  const toggleArchive = async (content: SavedContent) => {
    try {
      const response = await fetch(`/api/client/saved-content/${content.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !content.isArchived }),
      });

      if (response.ok) {
        toast.success(content.isArchived ? 'Uit archief gehaald' : 'Gearchiveerd');
        loadContent();
      }
    } catch (error) {
      toast.error('Fout bij archiveren');
    }
  };

  const openEditDialog = (content: SavedContent) => {
    setEditingContent(content);
    setEditTitle(content.title);
    setEditContentText(content.content);
    setEditMetaDesc(content.metaDesc || '');
    setEditDialog(true);
  };

  const saveEdit = async () => {
    if (!editingContent) return;

    try {
      setSavingEdit(true);
      const response = await fetch(`/api/client/saved-content/${editingContent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContentText,
          metaDesc: editMetaDesc,
        }),
      });

      if (response.ok) {
        toast.success('Content bijgewerkt!');
        setEditDialog(false);
        loadContent();
      } else {
        toast.error('Fout bij opslaan');
      }
    } catch (error) {
      toast.error('Fout bij opslaan');
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteContent = async () => {
    if (!deletingContent) return;

    try {
      const response = await fetch(`/api/client/saved-content/${deletingContent.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Content verwijderd!');
        setDeleteDialog(false);
        loadContent();
      } else {
        toast.error('Fout bij verwijderen');
      }
    } catch (error) {
      toast.error('Fout bij verwijderen');
    }
  };

  const copyToClipboard = async (content: SavedContent) => {
    try {
      await navigator.clipboard.writeText(content.content);
      setCopiedId(content.id);
      toast.success('Gekopieerd naar klembord!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Kon niet kopiëren');
    }
  };

  const exportContent = (content: SavedContent, format: 'txt' | 'html' | 'md') => {
    let exportText = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'html') {
      exportText = content.contentHtml || content.content;
      mimeType = 'text/html';
      extension = 'html';
    } else if (format === 'md') {
      exportText = content.content;
      mimeType = 'text/markdown';
      extension = 'md';
    } else {
      // Plain text - strip markdown/html
      exportText = content.content.replace(/<[^>]*>/g, '').replace(/[#*_]/g, '');
      mimeType = 'text/plain';
      extension = 'txt';
    }

    const blob = new Blob([exportText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Geëxporteerd als ${extension.toUpperCase()}`);
  };

  const publishToWordPress = async (content: SavedContent) => {
    if (!content.project?.websiteUrl) {
      toast.error('Geen WordPress website geconfigureerd voor dit project');
      return;
    }

    try {
      toast.loading('Publiceren naar WordPress...', { id: 'wp-publish' });

      const response = await fetch('/api/client/publish-to-wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: content.id,
          projectId: content.projectId,
          title: content.title,
          content: content.contentHtml || content.content,
          status: 'publish',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Gepubliceerd naar WordPress!', { id: 'wp-publish' });
        
        // Update content with WordPress URL
        await fetch(`/api/client/saved-content/${content.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publishedUrl: data.url,
            publishedAt: new Date().toISOString(),
          }),
        });
        
        loadContent();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fout bij publiceren', { id: 'wp-publish' });
      }
    } catch (error) {
      toast.error('Fout bij publiceren', { id: 'wp-publish' });
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      blog: 'Blog',
      social: 'Social Media',
      video: 'Video Script',
      code: 'Code',
      other: 'Overig',
    };
    return types[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      blog: 'bg-zinc-9000',
      social: 'bg-zinc-9000',
      video: 'bg-zinc-9000',
      code: 'bg-zinc-9000',
      other: 'bg-gray-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Bibliotheek</h1>
        <p className="text-muted-foreground">
          Beheer al je gegenereerde content op één plek
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Zoek in content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="other">Overig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <Button
                variant={showFavorites ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFavorites(!showFavorites)}
              >
                <Star className="w-4 h-4 mr-1" />
                Favorieten
              </Button>
              <Button
                variant={showArchived ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowArchived(!showArchived);
                  loadContent();
                }}
              >
                <Archive className="w-4 h-4 mr-1" />
                Archief
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totaal</p>
                <p className="text-2xl font-bold">{contents.length}</p>
              </div>
              <FileText className="w-8 h-8 text-[#ff6b35]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blogs</p>
                <p className="text-2xl font-bold">
                  {contents.filter((c) => c.type === 'blog').length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Favorieten</p>
                <p className="text-2xl font-bold">
                  {contents.filter((c) => c.isFavorite).length}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gepubliceerd</p>
                <p className="text-2xl font-bold">
                  {contents.filter((c) => c.publishedUrl).length}
                </p>
              </div>
              <Globe className="w-8 h-8 text-[#ff6b35]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      {filteredContents.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Geen content gevonden</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || typeFilter !== 'all' || categoryFilter !== 'all'
                ? 'Probeer een andere zoekopdracht of filter'
                : 'Genereer je eerste blog of content om hier te verschijnen'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContents.map((content) => (
            <Card key={content.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={`${getTypeColor(content.type)} text-white`}>
                    {getTypeLabel(content.type)}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleFavorite(content)}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          content.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''
                        }`}
                      />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setViewingContent(content);
                          setViewDialog(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Bekijken
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(content)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyToClipboard(content)}>
                          {copiedId === content.id ? (
                            <Check className="w-4 h-4 mr-2 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Kopiëren
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => exportContent(content, 'txt')}>
                          <Download className="w-4 h-4 mr-2" />
                          Exporteer als TXT
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportContent(content, 'html')}>
                          <Download className="w-4 h-4 mr-2" />
                          Exporteer als HTML
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportContent(content, 'md')}>
                          <Download className="w-4 h-4 mr-2" />
                          Exporteer als Markdown
                        </DropdownMenuItem>
                        {content.project?.websiteUrl && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => publishToWordPress(content)}>
                              <Globe className="w-4 h-4 mr-2" />
                              Publiceer naar WordPress
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleArchive(content)}>
                          <Archive className="w-4 h-4 mr-2" />
                          {content.isArchived ? 'Uit archief halen' : 'Archiveren'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400"
                          onClick={() => {
                            setDeletingContent(content);
                            setDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2">{content.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {content.description || content.metaDesc || 'Geen beschrijving'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{content.wordCount || 0} woorden</span>
                    {content.publishedUrl && (
                      <Badge variant="outline" className="text-green-400">
                        <Globe className="w-3 h-3 mr-1" />
                        Gepubliceerd
                      </Badge>
                    )}
                  </div>

                  {/* Project */}
                  {content.project && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{content.project.name}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {content.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {content.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {content.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{content.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(content.createdAt), 'd MMM yyyy', { locale: nl })}
                  </div>

                  {/* Published URL */}
                  {content.publishedUrl && (
                    <a
                      href={content.publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#ff6b35] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Bekijk live
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Content bewerken</DialogTitle>
            <DialogDescription>
              Pas de titel, content en meta beschrijving aan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">Titel</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editContentText}
                onChange={(e) => setEditContentText(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="edit-meta">Meta Beschrijving</Label>
              <Textarea
                id="edit-meta"
                value={editMetaDesc}
                onChange={(e) => setEditMetaDesc(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Annuleren
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                'Opslaan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingContent?.title}</DialogTitle>
            <DialogDescription>
              {viewingContent?.wordCount || 0} woorden • {' '}
              {format(new Date(viewingContent?.createdAt || new Date()), 'd MMMM yyyy', { locale: nl })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {viewingContent?.contentHtml ? (
                <div dangerouslySetInnerHTML={{ __html: viewingContent.contentHtml }} />
              ) : (
                <pre className="whitespace-pre-wrap font-sans">{viewingContent?.content}</pre>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(false)}>
              Sluiten
            </Button>
            <Button onClick={() => viewingContent && copyToClipboard(viewingContent)}>
              <Copy className="w-4 h-4 mr-2" />
              Kopiëren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Content verwijderen?</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je "{deletingContent?.title}" wilt verwijderen? Deze actie kan niet
              ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={deleteContent}>
              <Trash2 className="w-4 h-4 mr-2" />
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
